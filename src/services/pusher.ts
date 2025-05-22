import Pusher from 'pusher';

export class PusherService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || '',
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      secret: process.env.NEXT_PUBLIC_PUSHER_SECRET || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
      useTLS: true
    });
  }

  async triggerMessageEvent(channel: string, event: string, data: any) {
    try {
      await this.pusher.trigger(channel, event, data);
    } catch (error) {
      console.error('Error triggering Pusher event:', error);
    }
  }

  async triggerNewMessage(message: any) {
    await this.triggerMessageEvent('whatsapp-messages', 'new-message', message);
  }

  async triggerMessageStatus(messageId: string, status: string) {
    await this.triggerMessageEvent('whatsapp-messages', 'message-status', {
      messageId,
      status
    });
  }
}

export const pusherService = new PusherService(); 