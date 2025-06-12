import Redis from 'ioredis';

class RedisConnection {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!RedisConnection.instance) {
      const redisUrl = "redis://default:AUjLAAIjcDE0OTc1Yzg0YTQwMjE0ODQ4Yjg2MzlhMmNlZDQ0YWM4YXAxMA@top-mullet-18635.upstash.io:6379";
      
      if (!redisUrl) {
        console.warn('[Redis] No REDIS_URL provided. Redis functionality will be disabled.');
        // Return a mock Redis instance for development without Redis
        throw new Error('Redis configuration required. Please set REDIS_URL environment variable.');
      }

      try {
        RedisConnection.instance = new Redis(redisUrl, {
          // Optimized for serverless
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          lazyConnect: true,
          connectTimeout: 10000,
        });

        // Error handling
        RedisConnection.instance.on('error', (error) => {
          console.error('[Redis] Connection error:', error);
        });

        RedisConnection.instance.on('connect', () => {
          console.log('[Redis] Connected successfully');
        });

        RedisConnection.instance.on('ready', () => {
          console.log('[Redis] Ready to accept commands');
        });
      } catch (error) {
        console.error('[Redis] Failed to initialize Redis:', error);
        throw error;
      }
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