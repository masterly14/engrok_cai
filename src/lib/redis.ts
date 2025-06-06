import Redis from 'ioredis';

class RedisConnection {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!RedisConnection.instance) {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('[Redis] No REDIS_URL provided, using local Redis');
        RedisConnection.instance = new Redis('redis://localhost:6379');
      } else {
        RedisConnection.instance = new Redis(redisUrl, {
          // Optimized for serverless
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
        });
      }

      // Error handling
      RedisConnection.instance.on('error', (error) => {
        console.error('[Redis] Connection error:', error);
      });

      RedisConnection.instance.on('connect', () => {
        console.log('[Redis] Connected successfully');
      });
    }

    return RedisConnection.instance;
  }

  static async closeConnection(): Promise<void> {
    if (RedisConnection.instance) {
      await RedisConnection.instance.quit();
      RedisConnection.instance = null;
    }
  }
}

export const redisConnection = RedisConnection.getInstance();
export default redisConnection;