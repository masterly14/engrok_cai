import { WhatsAppMessage } from "@/types/whatsapp";
import { whatsappService } from "./whatsapp";
import { pusherService } from "./pusher";

interface QueueItem {
  message: WhatsAppMessage;
  retries: number;
  maxRetries: number;
}

export class QueueService {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; 

  constructor() {
    this.startProcessing();
  }

  async addToQueue(message: WhatsAppMessage) {
    this.queue.push({
      message,
      retries: 0,
      maxRetries: this.MAX_RETRIES
    });

    await pusherService.triggerMessageStatus(message.id, 'queued');
  }


  private async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      if (this.queue.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const item = this.queue[0];
      try {
        await this.processMessage(item);
        this.queue.shift(); // Remove processed item
      } catch (error) {
        console.error('Error processing message:', error);
        
        if (item.retries < item.maxRetries) {
          item.retries++;
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        } else {
          this.queue.shift(); // Remove failed item after max retries
          await pusherService.triggerMessageStatus(item.message.id, 'failed');
        }
      }
    }
  }

  private async processMessage(item: QueueItem) {
    const { message } = item;
    await whatsappService.sendTextMessage(message.from, message.text?.body || '');
    await pusherService.triggerMessageStatus(message.id, 'processed');
  }
}

export const queueService = new QueueService(); 