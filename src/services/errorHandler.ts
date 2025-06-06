interface ErrorContext {
  userId?: string;
  messageId?: string;
  agentId?: string;
  operation: string;
  metadata?: any;
}

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handleWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig: RetryConfig = {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2
    }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        this.logError(error as Error, context, attempt);
        
        if (attempt === retryConfig.maxRetries) {
          await this.handleFinalFailure(error as Error, context);
          throw error;
        }
        
        const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  private logError(error: Error, context: ErrorContext, attempt: number) {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      attempt,
      severity: this.categorizeError(error)
    };
    
    console.error(`[ErrorHandler] ${context.operation} failed:`, JSON.stringify(logData, null, 2));
    
    // Aquí se podría integrar con servicios como Sentry, DataDog, etc.
  }

  private async handleFinalFailure(error: Error, context: ErrorContext) {
    // Guardar en base de datos para análisis posterior
    try {
      // await db.errorLog.create({ data: { ... } });
      
      // Notificar al usuario si es crítico
      if (context.userId && this.isCriticalError(error)) {
        await this.sendFallbackMessage(context.userId);
      }
    } catch (fallbackError) {
      console.error('[ErrorHandler] Failed to handle final failure:', fallbackError);
    }
  }

  private categorizeError(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      return 'high';
    }
    if (error.message.includes('database') || error.message.includes('prisma')) {
      return 'critical';
    }
    if (error.message.includes('WhatsApp API Error')) {
      return 'medium';
    }
    return 'low';
  }

  private isCriticalError(error: Error): boolean {
    return this.categorizeError(error) === 'critical';
  }

  private async sendFallbackMessage(userId: string) {
    // Implementar envío de mensaje de fallback
    console.log(`[ErrorHandler] Sending fallback message to user: ${userId}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const errorHandler = ErrorHandler.getInstance(); 