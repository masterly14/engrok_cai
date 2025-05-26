// Tipos para la API de WhatsApp Cloud

// Mensaje recibido de WhatsApp
export type WhatsAppMessage = {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    metadata?: {
      display_phone_number: string;
      phone_number_id: string;
    };
    text?: {
      body: string;
    };
    image?: {
      caption?: string;
      mime_type: string;
      sha256: string;
      id: string;
    };
    audio?: {
      mime_type: string;
      sha256: string;
      id: string;
      voice: boolean;
    };
    video?: {
      caption?: string;
      mime_type: string;
      sha256: string;
      id: string;
    };
    document?: {
      caption?: string;
      filename: string;
      mime_type: string;
      sha256: string;
      id: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
    contacts?: Array<{
      name: {
        formatted_name: string;
        first_name?: string;
        last_name?: string;
      };
      phones?: Array<{
        phone: string;
        type: string;
        wa_id?: string;
      }>;
    }>;
    button?: {
      text: string;
      payload: string;
    };
    interactive?: {
      type: string;
      button_reply?: {
        id: string;
        title: string;
      };
      list_reply?: {
        id: string;
        title: string;
        description?: string;
      };
    };
    // Puedes agregar más tipos según sea necesario
  };
  
  // Estructura de un cambio en el webhook
  export type WhatsAppChange = {
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: WhatsAppMessage[];
      statuses?: Array<{
        id: string;
        recipient_id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        errors?: Array<{
          code: number;
          title: string;
        }>;
      }>;
    };
    field: string;
  };
  
  // Payload completo del webhook
  export type WhatsAppWebhookPayload = {
    object: string;
    entry: Array<{
      id: string;
      changes: WhatsAppChange[];
    }>;
  };
  
  // Para enviar mensajes
  export type WhatsAppTextMessage = {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'text';
    text: {
      body: string;
      preview_url?: boolean;
    };
  };
  
  export type WhatsAppTemplateMessage = {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'template';
    template: {
      name: string;
      language: {
        code: string;
      };
      components?: Array<{
        type: 'header' | 'body' | 'button';
        parameters: Array<{
          type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
          text?: string;
          currency?: {
            code: string;
            amount: number;
          };
          date_time?: {
            fallback_value: string;
          };
          image?: {
            link: string;
          };
          document?: {
            link: string;
          };
          video?: {
            link: string;
          };
        }>;
      }>;
    };
  };
  
  export type WhatsAppInteractiveMessage = {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'interactive';
    interactive: {
      type: 'button' | 'list';
      header?: {
        type: 'text' | 'image' | 'video' | 'document';
        text?: string;
        image?: {
          link: string;
        };
        video?: {
          link: string;
        };
        document?: {
          link: string;
        };
      };
      body: {
        text: string;
      };
      footer?: {
        text: string;
      };
      action: {
        buttons?: Array<{
          type: 'reply';
          reply: {
            id: string;
            title: string;
          };
        }>;
        button?: string;
        sections?: Array<{
          title?: string;
          rows: Array<{
            id: string;
            title: string;
            description?: string;
          }>;
        }>;
      };
    };
  };
  
  export type WhatsAppSendMessageResponse = {
    messaging_product: 'whatsapp';
    contacts: Array<{
      input: string;
      wa_id: string;
    }>;
    messages: Array<{
      id: string;
    }>;
  };

  export interface WhatsAppImageMessage {
    messaging_product: "whatsapp";
    to: string;
    type: "image";
    image: {
      link: string;
      caption?: string;
    };
  }
  