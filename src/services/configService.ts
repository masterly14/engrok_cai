import { db } from "@/utils";
import { cacheService } from "./cache";

interface AgentConfig {
  id: string;
  name: string;
  apiKey: string;
  phoneNumber: string;
  phoneNumberId: string;
  whatsappBusinessId: string;
  businessInfo: {
    name: string;
    description: string;
    website?: string;
    email?: string;
  };
  settings: {
    autoReply: boolean;
    businessHours: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
    responseTime: number;
    maxConcurrentChats: number;
  };
}

export class ConfigService {
  private static instance: ConfigService;
  private configCache: Map<string, AgentConfig> = new Map();
  private readonly CACHE_TTL = 300; // 5 minutes

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async getAgentConfig(agentId: string): Promise<AgentConfig> {
    console.log(`[ConfigService] Getting config for agent: ${agentId}`);

    // Check memory cache first
    if (this.configCache.has(agentId)) {
      console.log(`[ConfigService] Config found in memory cache`);
      return this.configCache.get(agentId)!;
    }

    // Check Redis cache
    const cachedConfig = cacheService.get<AgentConfig>(`agent_config:${agentId}`);
    if (cachedConfig) {
      console.log(`[ConfigService] Config found in Redis cache`);
      this.configCache.set(agentId, cachedConfig);
      return cachedConfig;
    }

    // Load from database
    console.log(`[ConfigService] Loading config from database`);
    const config = await this.loadConfigFromDB(agentId);
    
    // Cache the result
    this.configCache.set(agentId, config);
    cacheService.set(`agent_config:${agentId}`, config, this.CACHE_TTL);

    return config;
  }

  async getAgentConfigByPhone(phoneNumber: string): Promise<AgentConfig> {
    console.log(`[ConfigService] Getting config by phone: ${phoneNumber}`);

    // Check if we have it cached by phone
    const cachedAgentId = cacheService.get<string>(`phone_to_agent:${phoneNumber}`);
    if (cachedAgentId) {
      return await this.getAgentConfig(cachedAgentId);
    }

    // Load from database
    const agent = await db.chatAgent.findFirst({
      where: { phoneNumber },
      select: { id: true }
    });

    if (!agent) {
      throw new Error(`No agent found for phone number: ${phoneNumber}`);
    }

    // Cache the mapping
    cacheService.set(`phone_to_agent:${phoneNumber}`, agent.id, this.CACHE_TTL);

    return await this.getAgentConfig(agent.id);
  }

  private async loadConfigFromDB(agentId: string): Promise<AgentConfig> {
    const agent = await db.chatAgent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Parse business info from JSON
    const businessInfo = agent.businessInfo as any || {};

    return {
      id: agent.id,
      name: agent.name,
      apiKey: agent.apiKey,
      phoneNumber: agent.phoneNumber,
      phoneNumberId: agent.phoneNumberId,
      whatsappBusinessId: agent.whatsappBusinessId,
      businessInfo: {
        name: businessInfo.name || agent.name,
        description: businessInfo.description || `Atención al cliente de ${agent.name}`,
        website: businessInfo.website,
        email: businessInfo.email || agent.user?.email
      },
      settings: {
        autoReply: businessInfo.autoReply ?? true,
        businessHours: {
          enabled: businessInfo.businessHours?.enabled ?? false,
          start: businessInfo.businessHours?.start ?? "09:00",
          end: businessInfo.businessHours?.end ?? "18:00",
          timezone: businessInfo.businessHours?.timezone ?? "America/Bogota"
        },
        responseTime: businessInfo.responseTime ?? 2000,
        maxConcurrentChats: businessInfo.maxConcurrentChats ?? 10
      }
    };
  }

  async updateAgentConfig(agentId: string, updates: Partial<AgentConfig>): Promise<AgentConfig> {
    console.log(`[ConfigService] Updating config for agent: ${agentId}`);

    const currentConfig = await this.getAgentConfig(agentId);
    const updatedConfig = { ...currentConfig, ...updates };

    // Update database
    await db.chatAgent.update({
      where: { id: agentId },
      data: {
        name: updatedConfig.name,
        businessInfo: {
          ...updatedConfig.businessInfo,
          ...updatedConfig.settings
        }
      }
    });

    // Update caches
    this.configCache.set(agentId, updatedConfig);
    cacheService.set(`agent_config:${agentId}`, updatedConfig, this.CACHE_TTL);

    console.log(`[ConfigService] Config updated successfully`);
    return updatedConfig;
  }

  async invalidateCache(agentId: string): Promise<void> {
    console.log(`[ConfigService] Invalidating cache for agent: ${agentId}`);
    
    this.configCache.delete(agentId);
    cacheService.delete(`agent_config:${agentId}`);
    
    // Also invalidate phone mapping if we can find it
    const config = await this.loadConfigFromDB(agentId);
    cacheService.delete(`phone_to_agent:${config.phoneNumber}`);
  }

  isBusinessHours(agentId: string): boolean {
    const config = this.configCache.get(agentId);
    if (!config || !config.settings.businessHours.enabled) {
      return true; // Default to always available
    }

    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(config.settings.businessHours.start.split(':')[0]);
    const endHour = parseInt(config.settings.businessHours.end.split(':')[0]);

    return currentHour >= startHour && currentHour < endHour;
  }

  getResponseDelay(agentId: string): number {
    const config = this.configCache.get(agentId);
    return config?.settings.responseTime || 2000;
  }

  // Get all agent configs (for dashboard/admin)
  async getAllConfigs(): Promise<AgentConfig[]> {
    const agents = await db.chatAgent.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return Promise.all(
      agents.map(agent => this.loadConfigFromDB(agent.id))
    );
  }
}

export const configService = ConfigService.getInstance(); 