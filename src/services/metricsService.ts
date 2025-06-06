import { db } from "@/utils";
import { cacheService } from "./cache";

export interface SystemMetrics {
  timestamp: Date;
  messagesPerMinute: number;
  averageResponseTime: number;
  activeChats: number;
  queueLength: number;
  errorRate: number;
  agentPerformance: AgentMetrics[];
}

interface AgentMetrics {
  agentId: string;
  agentName: string;
  messagesHandled: number;
  averageResponseTime: number;
  errorCount: number;
  activeChats: number;
  conversationCompletionRate: number;
}

interface ConversationMetrics {
  totalConversations: number;
  completedSales: number;
  conversionRate: number;
  averageSessionDuration: number;
  dropOffStages: { stage: string; count: number }[];
}

export class MetricsService {
  private static instance: MetricsService;
  private metrics: SystemMetrics[] = [];
  private readonly MAX_METRICS_HISTORY = 1440; // 24 hours (1 per minute)

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private startMetricsCollection() {
    // Collect metrics every minute
    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('[MetricsService] Error collecting metrics:', error);
      }
    }, 60000); // 1 minute

    console.log('[MetricsService] Started metrics collection');
  }

  private async collectMetrics(): Promise<void> {
    const currentTime = new Date();
    const lastMinute = new Date(currentTime.getTime() - 60000);

    try {
      // Get message count from last minute
      const recentMessages = await db.message.count({
        where: {
          createdAt: {
            gte: lastMinute,
            lte: currentTime
          }
        }
      });

      // Get active conversations
      const activeChats = await db.conversation.count({
        where: {
          isActive: true,
          lastMessageAt: {
            gte: new Date(currentTime.getTime() - 300000) // Last 5 minutes
          }
        }
      });

      // Get agent performance
      const agentPerformance = await this.getAgentPerformance();

      // Get queue status (would need to integrate with messageQueue)
      const queueLength = this.getQueueLength();

      // Calculate error rate (placeholder - would need error tracking)
      const errorRate = this.calculateErrorRate(lastMinute, currentTime);

      const metrics: SystemMetrics = {
        timestamp: currentTime,
        messagesPerMinute: recentMessages,
        averageResponseTime: await this.calculateAverageResponseTime(),
        activeChats,
        queueLength,
        errorRate,
        agentPerformance
      };

      this.metrics.push(metrics);

      // Keep only last 24 hours
      if (this.metrics.length > this.MAX_METRICS_HISTORY) {
        this.metrics = this.metrics.slice(-this.MAX_METRICS_HISTORY);
      }

      // Cache latest metrics
      cacheService.set('latest_metrics', metrics, 120); // 2 minutes

      console.log(`[MetricsService] Collected metrics: ${recentMessages} messages, ${activeChats} active chats`);
    } catch (error) {
      console.error('[MetricsService] Error in collectMetrics:', error);
    }
  }

  private async getAgentPerformance(): Promise<AgentMetrics[]> {
    const agents = await db.chatAgent.findMany({
      select: {
        id: true,
        name: true,
        totalMessages: true,
        activeChats: true,
        averageResponseTime: true
      }
    });

    const agentMetrics: AgentMetrics[] = [];
    const lastHour = new Date(Date.now() - 3600000);

    for (const agent of agents) {
      // Get messages handled in last hour
      const messagesHandled = await db.message.count({
        where: {
          chatAgentId: agent.id,
          createdAt: { gte: lastHour }
        }
      });

      // Get error count (placeholder)
      const errorCount = 0; // Would need error tracking

      // Calculate conversion rate
      const conversationCompletionRate = await this.calculateConversionRate(agent.id);

      agentMetrics.push({
        agentId: agent.id,
        agentName: agent.name,
        messagesHandled,
        averageResponseTime: agent.averageResponseTime,
        errorCount,
        activeChats: agent.activeChats,
        conversationCompletionRate
      });
    }

    return agentMetrics;
  }

  private async calculateConversionRate(agentId: string): Promise<number> {
    const totalConversations = await db.conversation.count({
      where: {
        contact: {
          chatAgentId: agentId
        },
        createdAt: {
          gte: new Date(Date.now() - 86400000) // Last 24 hours
        }
      }
    });

    const completedSales = await db.order.count({
      where: {
        chatAgentId: agentId,
        status: 'APPROVED',
        createdAt: {
          gte: new Date(Date.now() - 86400000)
        }
      }
    });

    return totalConversations > 0 ? (completedSales / totalConversations) * 100 : 0;
  }

  private async calculateAverageResponseTime(): Promise<number> {
    // This would need more sophisticated tracking
    // For now, return a placeholder
    return 2500; // 2.5 seconds
  }

  private getQueueLength(): number {
    // Would integrate with messageQueue.getOverallStatus()
    return 0; // Placeholder
  }

  private calculateErrorRate(startTime: Date, endTime: Date): number {
    // Would need error tracking integration
    return 0; // Placeholder
  }

  async getConversationMetrics(agentId?: string): Promise<ConversationMetrics> {
    const whereClause = agentId ? { chatAgentId: agentId } : {};
    const last24Hours = new Date(Date.now() - 86400000);

    const totalConversations = await db.conversation.count({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours }
      }
    });

    const completedSales = await db.order.count({
      where: {
        ...whereClause,
        status: 'APPROVED',
        createdAt: { gte: last24Hours }
      }
    });

    const conversionRate = totalConversations > 0 ? (completedSales / totalConversations) * 100 : 0;

    // Calculate average session duration
    const conversations = await db.conversation.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: last24Hours },
        isActive: false
      },
      select: {
        createdAt: true,
        lastMessageAt: true
      }
    });

    const totalDuration = conversations.reduce((sum, conv) => {
      return sum + (conv.lastMessageAt.getTime() - conv.createdAt.getTime());
    }, 0);

    const averageSessionDuration = conversations.length > 0 ? totalDuration / conversations.length : 0;

    // Placeholder for drop-off stages analysis
    const dropOffStages = [
      { stage: 'greeting', count: 5 },
      { stage: 'product_discovery', count: 12 },
      { stage: 'objection_handling', count: 8 },
      { stage: 'closing', count: 3 }
    ];

    return {
      totalConversations,
      completedSales,
      conversionRate,
      averageSessionDuration: averageSessionDuration / 1000 / 60, // Convert to minutes
      dropOffStages
    };
  }

  getLatestMetrics(): SystemMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(hours: number = 1): SystemMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 3600000);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  async getHealthStatus(): Promise<{ status: 'healthy' | 'warning' | 'critical'; issues: string[] }> {
    const latest = this.getLatestMetrics();
    if (!latest) {
      return { status: 'warning', issues: ['No metrics available'] };
    }

    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check response time
    if (latest.averageResponseTime > 10000) {
      issues.push('High response time');
      status = 'warning';
    }

    // Check error rate
    if (latest.errorRate > 5) {
      issues.push('High error rate');
      status = 'critical';
    }

    // Check queue length
    if (latest.queueLength > 100) {
      issues.push('High queue length');
      status = 'warning';
    }

    // Check agent performance
    const poorPerformingAgents = latest.agentPerformance.filter(
      agent => agent.errorCount > 5 || agent.averageResponseTime > 15000
    );

    if (poorPerformingAgents.length > 0) {
      issues.push(`${poorPerformingAgents.length} agents underperforming`);
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return { status, issues };
  }

  // Real-time dashboard data
  async getDashboardData(): Promise<{
    realTime: SystemMetrics | null;
    trends: { hour: number; messages: number; conversions: number }[];
    agents: AgentMetrics[];
    health: { status: string; issues: string[] };
  }> {
    const realTime = this.getLatestMetrics();
    const last24Hours = this.getMetricsHistory(24);
    const health = await this.getHealthStatus();

    // Group by hour for trends
    const trends = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(Date.now() - i * 3600000);
      const hourEnd = new Date(hourStart.getTime() + 3600000);
      
      const hourMetrics = last24Hours.filter(m => 
        m.timestamp >= hourStart && m.timestamp < hourEnd
      );
      
      const messages = hourMetrics.reduce((sum, m) => sum + m.messagesPerMinute, 0);
      trends.push({
        hour: hourStart.getHours(),
        messages,
        conversions: 0 // Placeholder
      });
    }

    return {
      realTime,
      trends,
      agents: realTime?.agentPerformance || [],
      health
    };
  }


}

export const metricsService = MetricsService.getInstance(); 