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
  history_context?: {
    status: string;
    from_me: boolean;
  };
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

  if (mode === "subscribe" && token === "mast3rly_sugar_1318") {
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
    console.log("phoneNumberId", phoneNumberId);
    if (!phoneNumberId) {
        console.log("Webhook ignored: No phone number ID found.");
        return NextResponse.json({ status: "ignored" });
    }

    const agents = await db.chatAgent.findMany();
    console.log("agents", agents);
    const agent = await db.chatAgent.findUnique({ where: { whatsappPhoneNumberId: phoneNumberId }});
    if (!agent) {
        console.error(`Webhook error: Agent with phone ID ${phoneNumberId} not found.`);
        return NextResponse.json({ status: "agent not found" }, { status: 404 });
    }

    console.log(`Webhook received for agent [${agent.name}] - Field: [${field}]`);


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
            // El webhook 'history' contiene mensajes en una estructura anidada
            if (value.history && Array.isArray(value.history)) {
                for (const historyChunk of value.history) {
                    if (historyChunk.threads && Array.isArray(historyChunk.threads)) {
                        for (const thread of historyChunk.threads) {
                            if (thread.messages && Array.isArray(thread.messages)) {
                                await handleHistoryMessages(thread.messages, agent.id);
                            }
                        }
                    }
                }
            }
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

    // 1. Procesar contactos en batch
    const contactMap = new Map<string, WebhookContact>();
    contacts.forEach(contact => contactMap.set(contact.wa_id, contact));
    
    const contactPhones = [...new Set(messages.map(m => m.from))];
    const existingContacts = await db.chatContact.findMany({
        where: {
            phone: { in: contactPhones },
            chatAgentId: agentId
        }
    });
    
    const existingPhones = new Set(existingContacts.map(c => c.phone));
    const contactsToCreate = contactPhones
        .filter(phone => !existingPhones.has(phone))
        .map(phone => {
            const contactData = contactMap.get(phone);
            return {
                phone,
                name: contactData?.profile.name ?? 'Nuevo Contacto',
                chatAgentId: agentId,
            };
        });
    
    if (contactsToCreate.length > 0) {
        await db.chatContact.createMany({
            data: contactsToCreate,
            skipDuplicates: true
        });
    }
    
    // 2. Actualizar nombres de contactos existentes
    const contactsToUpdate = existingContacts
        .filter(contact => {
            const contactData = contactMap.get(contact.phone);
            return contactData && contactData.profile.name !== contact.name;
        })
        .map(contact => {
            const contactData = contactMap.get(contact.phone);
            return {
                where: { id: contact.id },
                data: { name: contactData!.profile.name }
            };
        });
    
    for (const update of contactsToUpdate) {
        await db.chatContact.update(update);
    }
    
    // 3. Obtener todos los contactos actualizados
    const allContacts = await db.chatContact.findMany({
        where: {
            phone: { in: contactPhones },
            chatAgentId: agentId
        }
    });
    
    const contactIdMap = new Map(allContacts.map(c => [c.phone, c.id]));
    
    // 4. Crear mensajes en batch
    const messagesToCreate = messages
        .map(message => {
            const contactId = contactIdMap.get(message.from);
            if (!contactId) return null;
            
            const messageType = message.type.toUpperCase() as MessageType;
            if (!Object.values(MessageType).includes(messageType)) {
                console.warn(`Unsupported message type "${message.type}", skipping.`);
                return null;
            }
            
            return {
                waId: message.id,
                from: message.from,
                to: message.to ?? '',
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                type: messageType,
                textBody: message.text?.body,
                metadata: message,
                chatAgentId: agentId,
                chatContactId: contactId,
            };
        })
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
    
    if (messagesToCreate.length > 0) {
        await db.message.createMany({
            data: messagesToCreate,
            skipDuplicates: true
        });
    }

    // 5. Aplicar lógica de cobro para cada mensaje
    for (const message of messages) {
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
    
    // 1. Extraer todos los números de teléfono únicos
    const contactPhones = new Set<string>();
    const messageData: Array<{message: WebhookMessage, contactPhone: string}> = [];
    
    for (const message of messages) {
        const isFromMe = message.history_context?.from_me;
        let contactPhone: string | null = null;
        
        if (isFromMe) {
            // Mensaje enviado por el negocio
            contactPhone = message.to || null;
            if (!contactPhone) {
                console.warn(`Message ${message.id} from business but no 'to' field - this might be a system message or broadcast`);
                // Para mensajes del negocio sin 'to', podríamos crear un contacto especial o saltarlo
                continue;
            }
        } else {
            // Mensaje recibido del cliente
            contactPhone = message.from;
        }
        
        if (!contactPhone) {
            console.warn(`Skipping message ${message.id}: no contact phone found (from_me: ${isFromMe}, from: ${message.from}, to: ${message.to})`);
            continue;
        }
        
        contactPhones.add(contactPhone);
        messageData.push({ message, contactPhone });
    }
    
    // 2. Crear contactos en batch (solo los que no existen)
    const existingContacts = await db.chatContact.findMany({
        where: {
            phone: { in: Array.from(contactPhones) },
            chatAgentId: agentId
        }
    });
    
    const existingPhones = new Set(existingContacts.map(c => c.phone));
    const contactsToCreate = Array.from(contactPhones)
        .filter(phone => !existingPhones.has(phone))
        .map(phone => ({
            phone,
            name: `Contacto ${phone.slice(-4)}`,
            chatAgentId: agentId,
        }));
    
    if (contactsToCreate.length > 0) {
        console.log(`Creating ${contactsToCreate.length} contacts in batch`);
        await db.chatContact.createMany({
            data: contactsToCreate,
            skipDuplicates: true
        });
    }
    
    // 3. Obtener todos los contactos (existentes + nuevos)
    const allContacts = await db.chatContact.findMany({
        where: {
            phone: { in: Array.from(contactPhones) },
            chatAgentId: agentId
        }
    });
    
    const contactMap = new Map(allContacts.map(c => [c.phone, c]));
    
    // 4. Crear mensajes en batch
    const messagesToCreate = messageData
        .map(({ message, contactPhone }) => {
            const contact = contactMap.get(contactPhone);
            if (!contact) return null;
            
            const messageType = message.type.toUpperCase() as MessageType;
            if (!Object.values(MessageType).includes(messageType)) {
                console.warn(`Unsupported message type "${message.type}", skipping.`);
                return null;
            }
            
            return {
                waId: message.id,
                from: message.from,
                to: message.to ?? '',
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                type: messageType,
                textBody: message.text?.body,
                metadata: message,
                chatAgentId: agentId,
                chatContactId: contact.id,
            };
        })
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
    
    if (messagesToCreate.length > 0) {
        console.log(`Creating ${messagesToCreate.length} messages in batch`);
        await db.message.createMany({
            data: messagesToCreate,
            skipDuplicates: true
        });
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
    
    // Separar por acción
    const addsAndEdits = stateSyncs.filter(sync => sync.action === 'add' || sync.action === 'edit');
    const removes = stateSyncs.filter(sync => sync.action === 'remove');
    
    // 1. Procesar adds y edits en batch
    if (addsAndEdits.length > 0) {
        const phoneNumbers = addsAndEdits.map(sync => sync.contact.phone_number);
        const existingContacts = await db.chatContact.findMany({
            where: {
                phone: { in: phoneNumbers },
                chatAgentId: agentId
            }
        });
        
        const existingPhones = new Set(existingContacts.map(c => c.phone));
        const contactsToCreate = addsAndEdits
            .filter(sync => !existingPhones.has(sync.contact.phone_number))
            .map(sync => ({
                    phone: sync.contact.phone_number,
                    name: sync.contact.full_name,
                    chatAgentId: agentId,
            }));
        
        const contactsToUpdate = addsAndEdits
            .filter(sync => existingPhones.has(sync.contact.phone_number))
            .map(sync => {
                const existing = existingContacts.find(c => c.phone === sync.contact.phone_number);
                return {
                    where: { id: existing!.id },
                    data: { name: sync.contact.full_name }
                };
            });
        
        // Crear nuevos contactos en batch
        if (contactsToCreate.length > 0) {
            await db.chatContact.createMany({
                data: contactsToCreate,
                skipDuplicates: true
            });
        }
        
        // Actualizar contactos existentes
        for (const update of contactsToUpdate) {
            await db.chatContact.update(update);
        }
    }
    
    // 2. Procesar removes en batch
    if (removes.length > 0) {
        const phoneNumbers = removes.map(sync => sync.contact.phone_number);
        await db.chatContact.deleteMany({
            where: {
                phone: { in: phoneNumbers },
                chatAgentId: agentId
            }
        });
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
