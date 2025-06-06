import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { WhatsAppMessage } from "@/types/whatsapp";
import { errorHandler } from "./errorHandler";

interface MessageJobData {
  message: WhatsAppMessage;
  agentNumber: string;
  priority: number;
  retryCount: number;
}

export class PersistentMessageQueue {
  private static instance: PersistentMessageQueue;
  private connection: Redis;
  private messageQueue: Queue;
  private worker: Worker | null = null;
  private isInitialized = false;

  private constructor() {
    // Initialize Redis connection
    this.connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    

    // Initialize queue
    this.messageQueue = new Queue('whatsapp-messages', { 
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    });
  }

  static getInstance(): PersistentMessageQueue {
    if (!PersistentMessageQueue.instance) {
      PersistentMessageQueue.instance = new PersistentMessageQueue();
    }
    return PersistentMessageQueue.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.connection.ping();
      console.log('[PersistentQueue] Connected to Redis');
      this.isInitialized = true;
    } catch (error) {
      console.error('[PersistentQueue] Redis connection failed:', error);
      throw new Error('Failed to connect to Redis');
    }
  }

  async enqueue(
    message: WhatsAppMessage,
    agentNumber: string,
    priority: number = 1
  ): Promise<void> {
    await this.initialize();

    const jobData: MessageJobData = {
      message,
      agentNumber,
      priority,
      retryCount: 0
    };

    try {
      const job = await this.messageQueue.add(
        'process-message',
        jobData,
        {
          priority: priority * -1, // BullMQ uses negative priority (lower number = higher priority)
          delay: this.calculateDelay(message.from),
          jobId: `${message.from}_${Date.now()}`, // Prevent duplicate processing
        }
      );

      console.log(`[PersistentQueue] Enqueued message ${message.id} with job ID ${job.id}`);
    } catch (error) {
      console.error('[PersistentQueue] Error enqueuing message:', error);
      throw error;
    }
  }

  private calculateDelay(userId: string): number {
    // Add small delay to allow for message ordering
    // In a real implementation, you might check for active jobs for this user
    return 100; // 100ms delay
  }

  async processMessages(): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker(
      'whatsapp-messages',
      async (job: Job<MessageJobData>) => {
        const { message, agentNumber } = job.data;
        console.log(`[PersistentQueue] Processing message ${message.id}`);

        try {
          const { messageHandler } = await import("@/handlers/messageHandler");
          await messageHandler.handleIncomingMessage(message, agentNumber);
        } catch (error) {
          console.error(`[PersistentQueue] Error processing message:`, error);
          throw error;
        }
      },
      { 
        connection: this.connection,
        concurrency: 3,
      }
    );

    this.worker.on('completed', (job: Job) => {
      console.log(`[PersistentQueue] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`[PersistentQueue] Job failed:`, err);
    });
  }

  async getQueueStatus(): Promise<any> {
    await this.initialize();
    
    const waiting = await this.messageQueue.getWaiting();
    const active = await this.messageQueue.getActive();
    
    return {
      waiting: waiting.length,
      active: active.length,
    };
  }

  async getUserQueueStatus(userId: string): Promise<{
    waiting: number;
    active: number;
  }> {
    await this.initialize();

    const waiting = await this.messageQueue.getJobs(['waiting'], 0, -1);
    const active = await this.messageQueue.getJobs(['active'], 0, -1);

    const userWaiting = waiting.filter(job => job.data.message.from === userId);
    const userActive = active.filter(job => job.data.message.from === userId);

    return {
      waiting: userWaiting.length,
      active: userActive.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.messageQueue.pause();
    console.log('[PersistentQueue] Queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.messageQueue.resume();
    console.log('[PersistentQueue] Queue resumed');
  }

  async cleanQueue(): Promise<void> {
    await this.messageQueue.clean(0, 1000, 'completed');
    await this.messageQueue.clean(0, 1000, 'failed');
    console.log('[PersistentQueue] Queue cleaned');
  }

  async getFailedJobs(): Promise<Job[]> {
    return await this.messageQueue.getFailed();
  }

  async retryFailedJobs(): Promise<void> {
    const failed = await this.getFailedJobs();
    for (const job of failed) {
      await job.retry();
    }
    console.log(`[PersistentQueue] Retried ${failed.length} failed jobs`);
  }

  async closeConnections(): Promise<void> {
    await this.worker?.close();
    await this.messageQueue.close();
    await this.connection.quit();
    console.log('[PersistentQueue] All connections closed');
  }

  // Utility method for health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      await this.connection.ping();
      const queueStatus = await this.getQueueStatus();
      
      return {
        status: 'healthy',
        details: {
          redis: 'connected',
          queue: queueStatus,
          worker: this.worker?.isRunning() ? 'running' : 'stopped'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export singleton instance
export const persistentQueue = PersistentMessageQueue.getInstance(); 