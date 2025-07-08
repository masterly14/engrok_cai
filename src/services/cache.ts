interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_EXPIRATION = 3600000; // 1 hour in milliseconds

  set<T>(
    key: string,
    data: T,
    expiresIn: number = this.DEFAULT_EXPIRATION,
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Método para limpiar elementos expirados
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  // Iniciar limpieza periódica
  constructor() {
    setInterval(() => this.cleanup(), 60000); // Limpiar cada minuto
  }
}

export const cacheService = new CacheService();
