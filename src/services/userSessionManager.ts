import redisClient from "@/lib/redis";

export class UserSessionManager {
  private Redis: typeof redisClient;
  private sessionTTL: number = 24 * 60 * 60;
  constructor() {
    this.Redis = redisClient;
  }

  async inNewSession(userId: string): Promise<boolean> {
    const sessionExist = await this.Redis.exists(`session:${userId}`);
    return sessionExist === 0;
  }

  async updateSession(userId: string): Promise<void> {
    await this.Redis.set(`session:${userId}`, Date.now().toString(), {
      ex: this.sessionTTL,
    });
  }

  async getSessionData(userId: string): Promise<any> {
    try {
      const data = (await this.Redis.get(`sessionData:${userId}`)) as string | null;
      if (!data) return {};

      if (typeof data === "object" && data !== null) {
        return data;
      }
      if (data === "[object Object]") {
        console.log(
          "Found '[object Object]' string in Redis for user:",
          userId
        );
        return {};
      }

      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing session from Redis:", e);
      return {};
    }
  }

  async saveSessionData(userId: string, data: any): Promise<void> {
    try {
      // Make sure data is serializable
      const sanitizedData = this.ensureSerializable(data);

      // Properly stringify the object before saving
      const jsonString = JSON.stringify(sanitizedData);

      await this.Redis.set(`sessionData:${userId}`, jsonString, {
        ex: this.sessionTTL,
      });
    } catch (error) {
      console.error("Error saving session data to Redis:", error);
    }
  }

  // Helper method to ensure data is serializable
  private ensureSerializable(data: any): any {
    // Handle circular references
    const seen = new WeakSet();

    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        // Check for circular references
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);
        }
        return value;
      })
    );
  }

  async endSession(userId: string): Promise<void> {
    await this.Redis.del(`session:${userId}`);
    await this.Redis.del(`sessionData:${userId}`);
  }
}
