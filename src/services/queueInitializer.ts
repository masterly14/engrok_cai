import { persistentQueue } from "./persistentQueue";

class QueueInitializer {
  private static instance: QueueInitializer;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  static getInstance(): QueueInitializer {
    if (!QueueInitializer.instance) {
      QueueInitializer.instance = new QueueInitializer();
    }
    return QueueInitializer.instance;
  }

  async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initialize();
    await this.initPromise;
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[QueueInitializer] Starting queue initialization...');
      
      // Initialize the persistent queue
      await persistentQueue.initialize();
      
      // Start processing messages
      await persistentQueue.processMessages();
      
      // Verify health
      const health = await persistentQueue.healthCheck();
      
      if (health.status === 'healthy') {
        console.log('[QueueInitializer] Queue initialized successfully');
        this.isInitialized = true;
      } else {
        throw new Error(`Queue health check failed: ${JSON.stringify(health.details)}`);
      }
      
    } catch (error) {
      console.error('[QueueInitializer] Failed to initialize queue:', error);
      this.initPromise = null; // Allow retry
      throw error;
    }
  }

  async getStatus(): Promise<{
    initialized: boolean;
    health: any;
    queue: any;
  }> {
    try {
      const health = await persistentQueue.healthCheck();
      const queueStatus = await persistentQueue.getQueueStatus();
      
      return {
        initialized: this.isInitialized,
        health,
        queue: queueStatus
      };
    } catch (error) {
      return {
        initialized: false,
        health: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown' },
        queue: null
      };
    }
  }

  // Auto-initialize when imported (for Vercel)
  static async autoInitialize(): Promise<void> {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      const initializer = QueueInitializer.getInstance();
      
      // Don't wait for initialization to complete to avoid blocking
      initializer.ensureInitialized().catch(error => {
        console.error('[QueueInitializer] Auto-initialization failed:', error);
      });
    }
  }
}

// Auto-initialize when this module is imported in production
if (process.env.NODE_ENV === 'production') {
  QueueInitializer.autoInitialize();
}

export const queueInitializer = QueueInitializer.getInstance(); 