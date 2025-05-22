import {
  WhatsAppTextMessage,
  WhatsAppTemplateMessage,
  WhatsAppInteractiveMessage,
  WhatsAppSendMessageResponse,
} from "@/types/whatsapp";
import { db } from "@/utils";
import { agents } from "elevenlabs/api/resources/conversationalAi";

export class WhatsAppService {
  private token: string;
  private phoneNumberId: string;
  private apiVersion: string;
  private baseUrl: string;
  private phoneNumber: any;

  constructor() {
    this.token = process.env.NEXT_PUBLIC_WHATSAPP_TOKEN || "";
    this.phoneNumberId = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || "";
    this.apiVersion = "v18.0";
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
    this.phoneNumber = "15550690050"

    console.log(`[WhatsAppService] Inicializando servicio con:`, {
      hasToken: !!this.token,
      phoneNumberId: this.phoneNumberId,
      baseUrl: this.baseUrl
    });

    if (!this.token || !this.phoneNumberId) {
      console.warn(
        "WhatsApp Api: Credentials are missing in environment variables"
      );
    }
  }

  async updateConfiguration(agentId: string): Promise<void> {
    try {
      console.log(`[WhatsAppService.updateConfiguration] Actualizando configuración para agente: ${agentId}`);
      
      const agent = await db.chatAgent.findUnique({
        where: { id: agentId },
        select: {
          apiKey: true,
          whatsappBusinessId: true,
          phoneNumber: true,
          phoneNumberId: true
        }
      });

      if (!agent) {
        throw new Error(`No se encontró el agente con ID: ${agentId}`);
      }

      if (!agent.apiKey || !agent.whatsappBusinessId || !agent.phoneNumber) {
        throw new Error('El agente no tiene configuradas todas las credenciales necesarias');
      }

      this.token = agent.apiKey || "";
      this.phoneNumberId = agent.phoneNumberId || "";
      this.phoneNumber = agent.phoneNumber || "";
      this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;

      console.log(`[WhatsAppService.updateConfiguration] Configuración actualizada:`, {
        hasToken: !!this.token,
        phoneNumberId: this.phoneNumberId,
        phoneNumber: this.phoneNumber,
        baseUrl: this.baseUrl
      });
    } catch (error) {
      console.error('[WhatsAppService.updateConfiguration] Error al actualizar la configuración:', error);
      throw error;
    }
  }

  async sendTextMessage(
    to: string,
    text: string,
    previewUrl = false
  ): Promise<WhatsAppSendMessageResponse> {
    const data: WhatsAppTextMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        body: text,
        preview_url: previewUrl,
      },
    };
    return this.sendMessage(data);
  }

  async sendMessage(
    data:
      | WhatsAppTextMessage
      | WhatsAppTemplateMessage
      | WhatsAppInteractiveMessage
  ): Promise<WhatsAppSendMessageResponse> {
    try {
      console.log(`[WhatsAppService.sendMessage] Iniciando envío de mensaje:`, {
        to: data.to,
        type: data.type,
        phoneNumberId: this.phoneNumberId
      });

      if (!this.token || !this.phoneNumberId) {
        console.error(`[WhatsAppService.sendMessage] Error: Credenciales faltantes`, {
          hasToken: !!this.token,
          hasPhoneNumberId: !!this.phoneNumberId
        });
        throw new Error("Missing WhatsApp credentials");
      }

      // Buscar o crear el contacto
      console.log(`[WhatsAppService.sendMessage] Intentando obtener/crear contacto para: ${data.to}`);
      const contact = await this.getOrCreateContact(data.to);
      console.log(`[WhatsAppService.sendMessage] Contacto obtenido/creado:`, contact);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[WhatsAppService.sendMessage] Error en API de WhatsApp:`, errorData);
        throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`);
      }

      const result: WhatsAppSendMessageResponse = await response.json();
      console.log(`[WhatsAppService.sendMessage] Mensaje enviado exitosamente:`, result);

      // Crear el mensaje asociado al contactoY
      const message = await db.message.create({
        data: {
          waId: result.messages[0].id,
          from: this.phoneNumberId,
          to: data.to,
          timestamp: new Date(),
          type: data.type.toUpperCase() as any,
          textBody: (data.type === "text" && data.text.body) || null,
          metadata: data,
          contactId: contact.id, 
        },
      });
      console.log(`[WhatsAppService.sendMessage] Mensaje guardado en DB:`, message);

      return result;
    } catch (error) {
      console.error("[WhatsAppService.sendMessage] Error al enviar mensaje de WhatsApp:", error);
      throw error;
    }
  }

  private async getOrCreateContact(phoneNumber: string) {
    console.log(`[WhatsAppService] ===== INICIO DE BÚSQUEDA DE CONTACTO =====`);
    console.log(`[WhatsAppService] Número del remitente: ${phoneNumber}`);
    console.log(`[WhatsAppService] Número de WhatsApp (this.phoneNumberId): ${this.phoneNumberId}`);
    console.log(`[WhatsAppService] Tipo de datos:`, {
      phoneNumberType: typeof phoneNumber,
      phoneNumberIdType: typeof this.phoneNumberId
    });

    // Primero buscar el agente por el número de teléfono de Twilio
    console.log(`[WhatsAppService] Buscando en PhoneNumber con twilio_phone_number: ${this.phoneNumberId}`);
    const agent = await db.chatAgent.findFirst({
      where: {
        phoneNumber: this.phoneNumber
      },
    });

    console.log(`[WhatsAppService] Resultado de búsqueda en PhoneNumber:`, {
      encontrado: !!agent,
      detalles: agent ? {
        id: agent.id,
        twilio_phone_number: agent.phoneNumber,
        agentId: agent.id,
      } : null
    });

    if (!agent) {
      console.error(`[WhatsAppService] Error: No se encontró agente para el número de WhatsApp ${this.phoneNumberId}`);
      console.error(`[WhatsAppService] Detalles del error:`, {
        agent: agent,
        hasAgent: !!agent
      });
      throw new Error("Agent not found for this WhatsApp number");
    }

    // Buscar el contacto existente
    console.log(`[WhatsAppService] Buscando contacto existente para:`, {
      phoneNumber,
      agentId: agent.id
    });
    
    let contact = await db.contact.findFirst({
      where: {
        waId: phoneNumber,
        chatAgentId: agent.id,
      },
    });

    console.log(`[WhatsAppService] Resultado de búsqueda de contacto:`, {
      encontrado: !!contact,
      detalles: contact ? {
        id: contact.id,
        phoneNumber: contact.phoneNumber,
        agentId: contact.chatAgentId
      } : null
    });

    // Si no existe, buscar solo por waId
    if (!contact) {
      contact = await db.contact.findFirst({
        where: { waId: phoneNumber },
      });
    }

    // Si no existe, crear uno nuevo
    if (!contact) {
      console.log(`[WhatsAppService] Creando nuevo contacto para:`, {
        phoneNumber,
        agentId: agent.id
      });
      
      const contactData = {
        waId: phoneNumber,
        phoneNumber,
        chatAgentId: agent.id
      };
      
      contact = await db.contact.create({
        data: contactData,
      });
      
      console.log(`[WhatsAppService] Nuevo contacto creado:`, {
        id: contact.id,
        phoneNumber: contact.phoneNumber,
        agentId: contact.chatAgentId
      });
    }

    console.log(`[WhatsAppService] ===== FIN DE BÚSQUEDA DE CONTACTO =====`);
    return contact;
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Error al marcar mensaje como leído: ${JSON.stringify(errorData)}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error al marcar mensaje como leído:", error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();
