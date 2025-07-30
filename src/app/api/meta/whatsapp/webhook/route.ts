// En: src/app/api/meta/whatsapp/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import { PricingService } from "@/services/pricing-service";
import { MessageType } from "@prisma/client";
import { Redis } from "@upstash/redis";

// --- Cliente de Redis ---
const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});
const STREAM_KEY = "incoming_messages";


// --- Tipos para claridad, puedes moverlos a un archivo types.d.ts ---
interface WebhookMessage {
  id: string;
  from: string;
  to?: string; // 'to' no está en mensajes entrantes, pero sí en echoes
  timestamp: string;
  type: string;
  text?: { body: string };
  [key: string]: any; // Para otros tipos de mensajes (image, video, etc.)
}

interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

interface StateSyncContact {
    action: 'add' | 'remove' | 'edit';
    contact: {
        full_name: string;
        first_name: string;
        phone_number: string;
    }
}


/**
 * Maneja la verificación inicial del Webhook de Meta.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    return new NextResponse(challenge);
  } else {
    console.error("Webhook verification failed.");
    return NextResponse.json({ error: "Verificación fallida" }, { status: 403 });
  }
}


/**
 * Maneja los eventos POST del Webhook (mensajes, sincronización, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.object || !body.entry?.[0]?.changes?.[0]?.value) {
      return NextResponse.json({ status: "not a whatsapp webhook" });
    }

    const change = body.entry[0].changes[0];
    const value = change.value;
    const field = change.field;
    
    // Identificar el ChatAgent por el ID del número de teléfono del webhook
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
        console.log("Webhook ignored: No phone number ID found.");
        return NextResponse.json({ status: "ignored" });
    }
    const agent = await db.chatAgent.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId }});
    if (!agent) {
        console.error(`Webhook error: Agent with phone ID ${phoneNumberId} not found.`);
        return NextResponse.json({ status: "agent not found" }, { status: 404 });
    }

    console.log(`Webhook received for agent [${agent.name}] - Field: [${field}]`);

    // --- Switch para manejar diferentes tipos de eventos ---
    switch (field) {
        case 'messages':
            await handleIncomingMessages(value.messages, value.contacts, agent.id, agent.userId);
            // Re-integramos el añadido al stream de Redis
            const messageId = await redis.xadd(STREAM_KEY, "*", {
                payload: JSON.stringify(value),
            });
            console.log(`Message added to Redis stream with ID: ${messageId}`);
            break;
        
        case 'history':
            console.log(`Processing history sync for agent ${agent.id}...`);
            // El webhook 'history' contiene tanto contactos como mensajes
            if (value.contacts) await handleContactSync(value.contacts, agent.id);
            if (value.messages) await handleHistoryMessages(value.messages, agent.id);
            break;

        case 'smb_message_echoes':
            console.log(`Processing message echo for agent ${agent.id}...`);
            await handleMessageEchoes(value.message_echoes, agent.id);
            break;
        
        case 'smb_app_state_sync':
            console.log(`Processing contact state sync for agent ${agent.id}...`);
            await handleContactStateSync(value.state_sync, agent.id);
            break;

        default:
            console.log(`Webhook with unhandled field type "${field}" received. [Ignoring]`);
            break;
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error in webhook POST:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- FUNCIONES HELPER PARA PROCESAR CADA TIPO DE EVENTO ---

async function handleIncomingMessages(messages: WebhookMessage[], contacts: WebhookContact[], agentId: string, userId: string) {
    if (!messages || messages.length === 0) return;

    for (const message of messages) {
        const contactData = contacts.find(c => c.wa_id === message.from);
        const contact = await db.chatContact.upsert({
            where: { phone_chatAgentId: { phone: message.from, chatAgentId: agentId } },
            update: { name: contactData?.profile.name },
            create: {
                phone: message.from,
                name: contactData?.profile.name ?? 'Nuevo Contacto',
                chatAgentId: agentId,
            }
        });

        await saveMessage(message, agentId, contact.id);

        // Aplicar lógica de cobro solo para mensajes entrantes en tiempo real
        try {
          await PricingService.applyChatUsage({
            userId: userId,
            conversations: 1,
            externalRef: message.id,
          });
        } catch (e) {
          console.error(`Credit debit failed for message ${message.id}:`, e);
        }
      }
}

async function handleHistoryMessages(messages: WebhookMessage[], agentId: string) {
    if (!messages || messages.length === 0) return;
    console.log(`Saving ${messages.length} messages from history.`);
    for (const message of messages) {
        // Asumimos que los contactos ya se sincronizaron con el mismo webhook de historia
        const contact = await db.chatContact.findUnique({ where: { phone_chatAgentId: { phone: message.from, chatAgentId: agentId }}});
        if (contact) {
            await saveMessage(message, agentId, contact.id);
        }
    }
}

async function handleMessageEchoes(messages: WebhookMessage[], agentId: string) {
    if (!messages || messages.length === 0) return;
    console.log(`Saving ${messages.length} echoed messages.`);
    for (const message of messages) {
        if (!message.to) continue;
        const contact = await db.chatContact.findUnique({ where: { phone_chatAgentId: { phone: message.to, chatAgentId: agentId }}});
        if (contact) {
            await saveMessage(message, agentId, contact.id);
        }
    }
}

async function handleContactSync(contacts: WebhookContact[], agentId: string) {
    if (!contacts || contacts.length === 0) return;
    console.log(`Syncing ${contacts.length} contacts from history.`);
    for (const contact of contacts) {
        await db.chatContact.upsert({
            where: { phone_chatAgentId: { phone: contact.wa_id, chatAgentId: agentId } },
            update: { name: contact.profile.name },
            create: {
                phone: contact.wa_id,
                name: contact.profile.name,
                chatAgentId: agentId,
            }
        });
    }
}

async function handleContactStateSync(stateSyncs: StateSyncContact[], agentId: string) {
    if (!stateSyncs || stateSyncs.length === 0) return;
    console.log(`Syncing ${stateSyncs.length} contact states.`);
     for (const sync of stateSyncs) {
        if (sync.action === 'add' || sync.action === 'edit') {
            await db.chatContact.upsert({
                where: { phone_chatAgentId: { phone: sync.contact.phone_number, chatAgentId: agentId } },
                update: { name: sync.contact.full_name },
                create: {
                    phone: sync.contact.phone_number,
                    name: sync.contact.full_name,
                    chatAgentId: agentId,
                }
            });
        }
        // Opcional: Manejar la acción 'remove' si se desea
        // else if (sync.action === 'remove') { ... }
    }
}

/**
 * Función centralizada para guardar un mensaje en la BD.
 * Deduplica mensajes usando el `waId`.
 */
async function saveMessage(message: WebhookMessage, agentId: string, contactId: string) {
    const messageType = message.type.toUpperCase() as MessageType;
    if (!Object.values(MessageType).includes(messageType)) {
        console.warn(`Unsupported message type "${message.type}", skipping.`);
        return;
    }

    await db.message.upsert({
        where: { waId: message.id },
        update: {}, // No hacemos nada si el mensaje ya existe
        create: {
            waId: message.id,
            from: message.from,
            to: message.to ?? '', // 'to' solo existe en echoes
            timestamp: new Date(parseInt(message.timestamp) * 1000),
            type: messageType,
            textBody: message.text?.body,
            metadata: message, // Guardamos el payload completo por si acaso
            chatAgentId: agentId,
            chatContactId: contactId,
        }
    });
}
