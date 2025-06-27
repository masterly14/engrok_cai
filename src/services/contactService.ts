import { db } from "@/utils";

export class ContactService {
  private static instance: ContactService;
  
  static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  async getOrCreateContact(
    agentPhoneNumber: string, 
    clientPhoneNumber: string, 
    messageData?: any
  ) {
    console.log(`[ContactService] Processing contact for agent: ${agentPhoneNumber}, client: ${clientPhoneNumber}`);
    
    // 1. Get or find the chat agent
    const chatAgent = await this.getChatAgent(agentPhoneNumber);
    if (!chatAgent) {
      throw new Error(`Agent not found for phone number: ${agentPhoneNumber}`);
    }

    // 2. Try to find existing contact
    let contact = await this.findExistingContact(clientPhoneNumber, chatAgent.id);
    
    // 3. Create contact if not exists
    if (!contact) {
      contact = await this.createNewContact(clientPhoneNumber, chatAgent.id, messageData);
      await this.createLeadIfNotExists(clientPhoneNumber, chatAgent, messageData);
    }

    return { contact, chatAgent };
  }

  private async getChatAgent(phoneNumber: string) {
    return await db.chatAgent.findFirst({
      where: { whatsappPhoneNumber: phoneNumber }
    });
  }

  private async findExistingContact(phoneNumber: string, chatAgentId: string) {
    return await db.chatContact.findFirst({
      where: {
        phone: phoneNumber,
        chatAgentId
      }
    });
  }

  private async createNewContact(phoneNumber: string, chatAgentId: string, messageData?: any) {
    console.log(`[ContactService] Creating new contact for ${phoneNumber}`);
    
    return await db.chatContact.create({
      data: {
        phone: phoneNumber,
        chatAgentId,
        name: messageData?.profile?.name ?? null,
      }
    });
  }

  private async createLeadIfNotExists(phoneNumber: string, chatAgent: any, messageData?: any) {
    const existingLead = await db.lead.findFirst({
      where: {
        phone: phoneNumber,
        userId: chatAgent.userId,
      }
    });

    if (!existingLead) {
      await db.lead.create({
        data: {
          name: messageData?.profile?.name ?? "Nuevo lead",
          company: "",
          email: "",
          phone: phoneNumber,
          stageId: "new",
          tags: [],
          lastContact: new Date().toISOString(),
          notes: "",
          userId: chatAgent.userId,
        }
      });
    }
  }
}

export const contactService = ContactService.getInstance(); 