import { WhatsAppMessage } from "@/types/whatsapp";
import { errorHandler } from "./errorHandler";

interface QueuedMessage {
  id: string;
  userId: string;
  message: WhatsAppMessage;
  agentNumber: string;
  timestamp: Date;
  retryCount: number;
  priority: number;
}

export class MessageQueue {
  private static instance: MessageQueue;
  private userQueues: Map<string, QueuedMessage[]> = new Map();
  private processingUsers: Set<string> = new Set();
  private readonly maxRetries = 3;
  private readonly processingTimeout = 30000; // 30 seconds

  static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  async enqueue(
    message: WhatsAppMessage, 
    agentNumber: string,
    priority: number = 1
  ): Promise<void> {
    const queuedMessage: QueuedMessage = {
      id: `${message.id}_${Date.now()}`,
      userId: message.from,
      message,
      agentNumber,
      timestamp: new Date(),
      retryCount: 0,
      priority
    };

    if (!this.userQueues.has(message.from)) {
      this.userQueues.set(message.from, []);
    }

    const userQueue = this.userQueues.get(message.from)!;
    
    // Insert by priority (higher priority first)
    const insertIndex = userQueue.findIndex(item => item.priority < priority);
    if (insertIndex === -1) {
      userQueue.push(queuedMessage);
    } else {
      userQueue.splice(insertIndex, 0, queuedMessage);
    }

    console.log(`[MessageQueue] Enqueued message for user ${message.from}, queue length: ${userQueue.length}`);

    // Start processing if not already processing
    if (!this.processingUsers.has(message.from)) {
      this.processUserQueue(message.from);
    }
  }

  private async processUserQueue(userId: string): Promise<void> {
    if (this.processingUsers.has(userId)) {
      return;
    }

    this.processingUsers.add(userId);
    console.log(`[MessageQueue] Started processing queue for user ${userId}`);

    try {
      const userQueue = this.userQueues.get(userId);
      if (!userQueue) {
        return;
      }

      while (userQueue.length > 0) {
        const queuedMessage = userQueue.shift()!;
        
        try {
          await this.processMessage(queuedMessage);
          console.log(`[MessageQueue] Successfully processed message ${queuedMessage.id}`);
        } catch (error) {
          console.error(`[MessageQueue] Failed to process message ${queuedMessage.id}:`, error);
          
          // Retry logic
          queuedMessage.retryCount++;
          if (queuedMessage.retryCount <= this.maxRetries) {
            console.log(`[MessageQueue] Retrying message ${queuedMessage.id} (attempt ${queuedMessage.retryCount})`);
            
            // Add back to queue with exponential backoff
            setTimeout(() => {
              userQueue.unshift(queuedMessage);
            }, Math.pow(2, queuedMessage.retryCount) * 1000);
          } else {
            console.error(`[MessageQueue] Max retries exceeded for message ${queuedMessage.id}`);
            await this.handleFailedMessage(queuedMessage, error as Error);
          }
        }
      }
    } finally {
      this.processingUsers.delete(userId);
      console.log(`[MessageQueue] Finished processing queue for user ${userId}`);
    }
  }

  private async processMessage(queuedMessage: QueuedMessage): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { messageHandler } = await import("@/handlers/messageHandler");
    
    await errorHandler.handleWithRetry(
      async () => {
        await messageHandler.handleIncomingMessage(
          queuedMessage.message, 
          queuedMessage.agentNumber
        );
      },
      {
        userId: queuedMessage.userId,
        messageId: queuedMessage.message.id,
        operation: 'processMessage',
        metadata: {
          retryCount: queuedMessage.retryCount,
          queuedAt: queuedMessage.timestamp
        }
      }
    );
  }

  private async handleFailedMessage(queuedMessage: QueuedMessage, error: Error): Promise<void> {
    console.error(`[MessageQueue] Permanently failed message:`, {
      messageId: queuedMessage.id,
      userId: queuedMessage.userId,
      error: error.message,
      retryCount: queuedMessage.retryCount
    });

    // Store failed message for later analysis
    // await db.failedMessage.create({ data: { ... } });
    
    // Send error notification to user
    try {
      const { whatsappService } = await import("@/services/whatsapp");
      await whatsappService.sendTextMessage(
        queuedMessage.userId,
        "Lo siento, hubo un problema procesando tu mensaje. Un agente se pondrá en contacto contigo pronto."
      );
    } catch (fallbackError) {
      console.error('[MessageQueue] Failed to send error message to user:', fallbackError);
    }
  }

  getQueueStatus(userId: string): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.userQueues.get(userId)?.length || 0,
      isProcessing: this.processingUsers.has(userId)
    };
  }

  getOverallStatus(): { totalQueues: number; totalMessages: number; processingUsers: number } {
    let totalMessages = 0;
    for (const queue of this.userQueues.values()) {
      totalMessages += queue.length;
    }

    return {
      totalQueues: this.userQueues.size,
      totalMessages,
      processingUsers: this.processingUsers.size
    };
  }
}

export const messageQueue = MessageQueue.getInstance(); 