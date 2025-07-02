import { default as Redis } from "ioredis";
import { PrismaClient, MessageType, ChatAgent, ChatContact } from "@prisma/client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Pusher from "pusher";


// --- CONFIGURACIÓN E INICIALIZACIÓN ---

const db = new PrismaClient();
const pusher = new Pusher({ // <-- 2. Inicializar Pusher
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

function setupRedisLogging(redisInstance: any, instanceName: string) {
  redisInstance.on("connect", () =>
    console.log(`[Redis ${instanceName}] Connected`)
  );
  redisInstance.on("ready", () => console.log(`[Redis ${instanceName}] Ready`));
  redisInstance.on("error", (error: any) =>
    console.error(`[Redis ${instanceName}] Error:`, error)
  );
  redisInstance.on("close", () =>
    console.log(`[Redis ${instanceName}] Connection closed`)
  );
  redisInstance.on("reconnecting", () =>
    console.log(`[Redis ${instanceName}] Reconnecting...`)
  );
}

async function sendWhatsappMessage(
  to: string,
  accessToken: string,
  nodeData: any, // => data de un conversation-node
  agent: ChatAgent,
  contact: ChatContact
) {
  if (!agent) throw new Error("No ChatAgent linked to supplied token");

  const SENDER_ID = agent.whatsappPhoneNumberId;
  const META_URL = `https://graph.facebook.com/v19.0/${SENDER_ID}/messages`;


  /* ------------------------------------------------------------------- */
  /* 1. Construir el payload según la configuración del nodo             */
  /* ------------------------------------------------------------------- */
  let payload: any;

  /* Comprobamos si hay botones interactivos */
  const hasButtons = Array.isArray(nodeData.interactiveButtons) && nodeData.interactiveButtons.length > 0;

  /* 1-0 TEMPLATE MESSAGE --------------------------------------------- */
  if (nodeData.responseType === "template" && nodeData.templateName) {
    const templateComponents: any[] = [];

    const variableMap: Record<string, any> = (nodeData.templateVariableValues && typeof nodeData.templateVariableValues === "object")
      ? nodeData.templateVariableValues
      : {};

    // A. HEADER --------------------------------------------------------
    const headerJson = nodeData.templateJson?.components?.find((c: any) => c.type === "HEADER");
    if (headerJson && headerJson.format === "TEXT") {
      // Contar cuántas variables contiene el header
      const headerVarMatches = (headerJson.text || "").match(/\{\{\d+\}\}/g) || [];
      const headerParams = headerVarMatches.map((match: string) => {
        const idx = match.replace(/[^\d]/g, "");
        const val = variableMap[idx] !== undefined ? String(variableMap[idx]) : "";
        return { type: "text", text: val };
      });
      if (headerParams.length > 0) {
        templateComponents.push({ type: "header", parameters: headerParams });
      }
    }

    // B. BODY ----------------------------------------------------------
    if (Object.keys(variableMap).length) {
      const bodyParams = Object.entries(variableMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([_k, v]) => ({ type: "text", text: String(v) }));
      if (bodyParams.length > 0) {
        templateComponents.push({ type: "body", parameters: bodyParams });
      }
    }

    // C. Botones quick-reply ------------------------------------------
    if (Array.isArray(nodeData.interactiveButtons) && nodeData.interactiveButtons.length > 0) {
      nodeData.interactiveButtons.forEach((btn: any, idx: number) => {
        templateComponents.push({
          type: "button",
          sub_type: "quick_reply",
          index: String(idx),
          parameters: [{ type: "payload", payload: btn.id }],
        });
      });
    }

    payload = {
      type: "template",
      template: {
        name: nodeData.templateName,
        language: { code: nodeData.templateLanguage || "es_ES" },
        components: templateComponents,
      },
    };

  } else if (nodeData.responseType === "audio" && nodeData.audioUrl) {
  /* 1-A AUDIO independientemente de botones --------------------------- */
    payload = {
      type: "audio",
      audio: { link: nodeData.audioUrl },
    };
  } else if (hasButtons) {
    /* 1-B INTERACTIVE (con o sin media) ------------------------------- */
    const interactive: any = {
      type: "button",
      body: { text: nodeData.botResponse || "" },
      action: {
        buttons: nodeData.interactiveButtons.map((btn: any) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.label || btn.title },
        })),
      },
    };

    if (nodeData.fileOrImageUrl) {
      const link = nodeData.fileOrImageUrl;
      switch (nodeData.fileResourceType) {
        case "image":
          interactive.header = {
            type: "image",
            image: { link },
          };
          break;
        case "video":
          interactive.header = {
            type: "video",
            video: { link },
          };
          break;
        default:
          // Otros tipos no soportados como header, se ignoran
          break;
      }
    }

    payload = { type: "interactive", interactive };
  } else if (nodeData.fileOrImageUrl) {

  /* 1-C MEDIA sin botones -------------------------------------------- */
    const link = nodeData.fileOrImageUrl;
    const caption = nodeData.botResponse || undefined;

    switch (nodeData.fileResourceType) {
      case "image":
        payload = { type: "image", image: { link, caption } };
        break;
      case "video":
        payload = { type: "video", video: { link, caption } };
        break;
      case "audio":
        payload = { type: "audio", audio: { link, caption } };
        break;
      default:
        /* 'raw' u otro => lo enviamos como documento */
        payload = { type: "document", document: { link, caption } };
        break;
    }
  } else {

  /* 1-D TEXTO PLANO -------------------------------------------------- */
    payload = { type: "text", text: { body: nodeData.botResponse || "" } };
  }

  /* ------------------------------------------------------------------- */
  /* 2.  Enviar                                                          */
  /* ------------------------------------------------------------------- */
  try {
    console.log(
      `[WhatsApp] → ${to} (${payload.type}) :`,
      JSON.stringify(payload)
    );

    const response = await axios.post(
      META_URL,
      { messaging_product: "whatsapp", to, ...payload },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const sentMessageId = response.data.messages[0].id;
    if (sentMessageId) {
      const messageType = mapWhatsAppTypeToEnum(payload.type);
        let textBody: string | undefined;
        if (payload.type === 'text') textBody = payload.text.body;
        else if (
          payload.type === "interactive" &&
          payload.interactive?.type === "button_reply"
        ) {
          textBody = payload.interactive.button_reply?.title;
        } else if (payload.type === "button") {
          textBody = payload.button?.text;
        }
        // ... (más lógica para extraer textBody de otros tipos si es necesario)

        const newMessage = await db.message.create({
            data: {
                waId: sentMessageId,
                from: agent.whatsappPhoneNumber,
                to: contact.phone,
                timestamp: new Date(),
                type: messageType,
                textBody: textBody,
                metadata: payload as any,
                chatAgentId: agent.id,
                chatContactId: contact.id,
            }
        });

        const channel = `conversation-${agent.id}-${contact.id}`;
        await pusher.trigger(channel, 'new-message', newMessage);
        console.log(`[Pusher] Triggered 'new-message' on channel ${channel}`);
    }
    console.log(response.data);
    console.log("[WhatsApp] ✓ Enviado con éxito");
  } catch (err: any) {
    console.error(
      "[WhatsApp] ✗ Error enviando mensaje:",
      err.response?.data || err.message
    );
  }
}

// --- CEREBRO DEL WORKER: FASE DE DECISIÓN ---

// ---------------------------------------------------------------------------
// NUEVO: Tipado para eventos de Webhook Trigger
// ---------------------------------------------------------------------------
interface ExternalTriggerEvent {
  kind: "external";
  workflowId: string;
  phone: string;
  variables?: Record<string, any>;
}

// NEW: Tipo para eventos de envío por lotes
interface BatchSendEvent {
  kind: "batch_send";
  agentId: string;
  contactIds: string[];
  nodeData: any;
  /**
   * Variables por contacto para personalizar el mensaje.
   * La clave es el contactId y el valor un objeto con variables.
   */
  perContactVariables?: Record<string, Record<string, any>>;
}

async function handleIncomingMessage(whatsappPayload: any) {
  const whatsappMessage = whatsappPayload.messages[0];
  const userPhone = whatsappMessage.from;
  const businessPhoneId = whatsappPayload.metadata.phone_number_id; // <-- CORRECCIÓN #1

  let userInput;
  if (whatsappMessage.type === "text") {
    userInput = whatsappMessage.text.body;
  } else if (
    whatsappMessage.type === "interactive" &&
    whatsappMessage.interactive.type === "button_reply"
  ) {
    userInput = whatsappMessage.interactive.button_reply.id;
  } else if (whatsappMessage.type === "button") {
    // Los mensajes de plantilla con quick-reply llegan como type="button"
    // El identificador relevante para continuar el flujo es el payload
    userInput = whatsappMessage.button?.payload || whatsappMessage.button?.text;
  }

  if (!userInput) {
    console.log("[Handler] Ignoring non-text/button message.");
    return;
  }

  const agent = await db.chatAgent.findUnique({
    where: { whatsappPhoneNumberId: businessPhoneId },
  });

  if (!agent) {
    console.error(
      `[Handler] CRITICAL: No agent found for business phone ID ${businessPhoneId}`
    );
    return;
  }

  let contact = await db.chatContact.findUnique({
    where: { phone: userPhone },
  });
  if (!contact) {
    console.log(`[Handler] New contact: ${userPhone}. Creating...`);
    contact = await db.chatContact.create({
      data: {
        id: uuidv4(),
        phone: userPhone,
        name: whatsappPayload.contacts[0]?.profile?.name || "Desconocido", // <-- CORRECCIÓN #2
        chatAgentId: agent.id,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    });
  }

  /* -----------------------------------------------------------------
   * Persist incoming message                                         
   * ----------------------------------------------------------------- */
  try {
    const messageType: MessageType = mapWhatsAppTypeToEnum(whatsappMessage.type);

    // Extraer cuerpo de texto (si aplica)
    let textBody: string | undefined;
    if (whatsappMessage.type === "text") {
      textBody = whatsappMessage.text?.body;
    } else if (
      whatsappMessage.type === "interactive" &&
      whatsappMessage.interactive?.type === "button_reply"
    ) {
      textBody = whatsappMessage.interactive.button_reply?.title;
    } else if (whatsappMessage.type === "button") {
      textBody = whatsappMessage.button?.text;
    }

    await db.message.create({
      data: {
        waId: whatsappMessage.id,
        from: userPhone,
        to: agent.whatsappPhoneNumber,
        timestamp: new Date(Number(whatsappMessage.timestamp) * 1000),
        type: messageType,
        textBody,
        metadata: whatsappMessage as any,
        chatAgentId: agent.id,
        chatContactId: contact.id,
      },
    });
    // Después de guardar el mensaje, lo enviamos por Pusher para actualización en tiempo real
    try {
      const newMessage = await db.message.findUnique({ where: { waId: whatsappMessage.id } })
      if (newMessage) {
        const channel = `conversation-${agent.id}-${contact.id}`
        await pusher.trigger(channel, "new-message", newMessage)
        console.log(`[Pusher] Triggered 'new-message' on channel ${channel}`)
      }
    } catch (pusherErr) {
      console.error("[Handler] Failed to trigger Pusher for new message:", pusherErr)
    }
  } catch (error: any) {
    // Evitamos el crash si el mensaje ya existe (constraint waId unique)
    if (error?.code === "P2002") {
      console.log(`[Handler] Message ${whatsappMessage.id} already stored.`);
    } else {
      console.error("[Handler] Failed to store incoming message:", error);
    }
  }

  let session = await db.chatSession.findFirst({
    where: { 
      contactId: contact.id,
      status: { in: ["ACTIVE", "NEEDS_ATTENTION"] }
    },
    orderBy: { updatedAt: 'desc' },
    include: { workflow: true, contact: true },
  });

  // If the agent's active workflow has changed, close the old session.
  if (session && agent.activeWorkflowId && session.workflowId !== agent.activeWorkflowId) {
    console.log(`[Handler] Active workflow changed for agent ${agent.id}. Closing session ${session.id}.`);
    await db.chatSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED' }
    });
    session = null; // Forces creation of a new session with the new workflow
  }

  // Si la sesión necesita un agente, no procesamos el flujo.
  // El mensaje ya fue guardado y Pusher ya lo envió a la UI.
  if (session && session.status === 'NEEDS_ATTENTION') {
      console.log(`[Handler] Session ${session.id} is waiting for an agent. Stopping automation.`);
      return; 
  }

  let nodeToExecute;

  if (!session) {
    console.log(
      `[Handler] No active session for ${userPhone}. Starting new conversation.`
    );

    /* ------------------------------------------------------------------
     * 1. Buscar entre todos los workflows del agente un nodo aislado que
     *    tenga data.userResponse igual al mensaje del usuario
     * ------------------------------------------------------------------ */
    const normalizedInput = typeof userInput === "string" ? userInput.trim().toLowerCase() : "";
    let workflowToStart: any | null = null;
    let startNode: any | null = null;

    const agentWorkflows = await db.chatWorkflow.findMany({ where: { agentId: agent.id } });
    for (const wf of agentWorkflows) {
      if (!wf.workflow) continue;
      const wfData = typeof wf.workflow === "string" ? JSON.parse(wf.workflow) : wf.workflow;
      /* nodo.match: mismo userResponse y SIN edges entrantes (aislado) */
      const isolatedNodes = wfData.nodes.filter((n: any) => !wfData.edges.some((e: any) => e.target === n.id));
      const match = isolatedNodes.find(
        (n: any) =>
          n.type === "conversation" &&
          typeof n.data?.userResponse === "string" &&
          n.data.userResponse.trim().toLowerCase() === normalizedInput
      );
      if (match) {
        workflowToStart = wf;
        startNode = match;
        break;
      }
    }

    /* ------------------------------------------------------------------
     * 2. Fallback al comportamiento anterior si no encontramos match
     * ------------------------------------------------------------------ */
    if (!workflowToStart) {
      if (agent.activeWorkflowId) {
        workflowToStart = await db.chatWorkflow.findUnique({
          where: { id: agent.activeWorkflowId },
        });
        if (!workflowToStart) {
          console.error(`[Handler] CRITICAL: Agent ${agent.name} has active workflow ${agent.activeWorkflowId}, but it was not found.`);
          return;
        }
      } else {
        // Fallback to old behavior if no active workflow is set
        workflowToStart = await db.chatWorkflow.findFirst({ where: { agentId: agent.id } });
      }

      if (!workflowToStart?.workflow) {
        console.error(`[Handler] CRITICAL: Agent ${agent.name} has no workflow configured or assigned.`);
        return;
      }
    }

    const workflowJson = workflowToStart.workflow;
    const workflowData = typeof workflowJson === "string" ? JSON.parse(workflowJson) : workflowJson;

    // Si no había match, usamos el nodo inicial por defecto
    if (!startNode) {
      startNode = findInitialNode(workflowData.nodes, workflowData.edges);
      if (!startNode) {
        console.error(
          `[Handler] CRITICAL: Workflow ${workflowToStart.name} has no initial node.`
        );
        return;
      }
    }

    /* ------------------------------------------------------------------
     * 3. Crear la sesión partiendo del nodo seleccionado
     * ------------------------------------------------------------------ */
    session = await db.chatSession.create({
      data: {
        id: uuidv4(),
        contactId: contact.id,
        workflowId: workflowToStart.id,
        currentNodeId: startNode.id,
        chatAgentId: agent.id,
        status: "ACTIVE",
        variables: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { workflow: true, contact: true },
    });

    nodeToExecute = startNode;
  } else {
    console.log(
      `[Handler] Active session ${session.id} found for ${userPhone}.`
    );
    const workflowJson = session.workflow.workflow;
    const workflowData =
      typeof workflowJson === "string"
        ? JSON.parse(workflowJson)
        : workflowJson;
    const lastNode = workflowData?.nodes.find(
      (n: any) => n.id === session?.currentNodeId
    );

    // Si el nodo anterior era de tipo captureResponse, almacenamos la respuesta del usuario
    if (
      lastNode?.type === "captureResponse" &&
      lastNode.data?.variableName &&
      typeof userInput === "string"
    ) {
      const updatedVariables = {
        ...(session.variables as Record<string, any> || {}),
        [lastNode.data.variableName]: userInput,
      };

      await db.chatSession.update({
        where: { id: session.id },
        data: { variables: updatedVariables },
      });

      session.variables = updatedVariables;
    }

    const nextNodeId = findNextNodeId(lastNode, userInput, workflowData.edges);
    if (!nextNodeId) {
      console.log(
        `[Handler] End of workflow reached or no edge found for input "${userInput}". Resetting to initial node.`
      );
      const initialNode = findInitialNode(workflowData.nodes, workflowData.edges);
      if (!initialNode) {
        console.error(`[Handler] CRITICAL: Workflow has no initial node.`);
        return;
      }
      nodeToExecute = initialNode;
      await db.chatSession.update({
        where: { id: session.id },
        data: { currentNodeId: initialNode.id },
      });
      session.currentNodeId = initialNode.id;
    } else {
      nodeToExecute = workflowData.nodes.find((n: any) => n.id === nextNodeId);
      await db.chatSession.update({
        where: { id: session.id },
        data: { currentNodeId: nodeToExecute.id },
      });
      session.currentNodeId = nodeToExecute.id;
    }
  }

  console.log(
    `[Handler] Executing node ${nodeToExecute.id} (${nodeToExecute.type})`
  );
  await executeNode(nodeToExecute, session, agent);
}

// --- EJECUTOR DE ACCIONES: FASE DE EJECUCIÓN ---

async function executeNode(node: any, session: any, agent: any) {
  console.log(session);
  const workflowJson = session.workflow.workflow;
  const workflowData =
    typeof workflowJson === "string" ? JSON.parse(workflowJson) : workflowJson;

  switch (node.type) {
    case "conversation":
      // Si el mensaje es plantilla, inyectamos variables del Session
      if (node.data.responseType === "template") {
        node.data.templateVariableValues = {
          ...(node.data.templateVariableValues || {}),
          ...(session.variables || {}),
        };
      }

      const populatedData = populateNodeDataWithVariables(
        node.data,
        session.variables || {}
      );

      await sendWhatsappMessage(
        session.contact.phone,
        agent.whatsappAccessToken,
        populatedData,
        agent,
        session.contact
      );

      if (node.data.jumpToNextNode) {
        console.log(
          `[Executor] Node ${node.id} has jumpToNextNode. Proceeding...`
        );
        const nextNodeId = findNextNodeId(node, null, workflowData.edges);
        if (nextNodeId) {
          const nextNode = workflowData.nodes.find(
            (n: any) => n.id === nextNodeId
          );
          await db.chatSession.update({
            where: { id: session.id },
            data: { currentNodeId: nextNode.id },
          });
          await executeNode(
            nextNode,
            { ...session, currentNodeId: nextNode.id },
            agent
          ); // <-- CORRECCIÓN #3
        }
      }
      break;
    case "apiRequest": {
      // 1. Preparamos la petición sustituyendo variables
      const sessionVariables = session.variables || {};
      const url = interpolateVariables(node.data.url, sessionVariables);
      const method = (node.data.method || "GET").toUpperCase();
      const headers = deepInterpolate(
        node.data.headers || {},
        sessionVariables
      );
      const body = deepInterpolate(node.data.body || {}, sessionVariables);

      console.log(`[Executor] Calling external API (${method}) ${url}`);

      let apiSuccess = false;
      let apiResponseData: any = null;

      try {
        const axiosConfig: any = { method, url, headers };
        if (method !== "GET" && method !== "HEAD") {
          axiosConfig.data = body;
        }
        const apiResponse = await axios(axiosConfig);
        apiResponseData = apiResponse.data;
        apiSuccess = apiResponse.status >= 200 && apiResponse.status < 300;
        console.log(`[Executor] API response status ${apiResponse.status}`);

        // 2. Guardar la respuesta en una variable si la llamada fue exitosa y está configurado
        if (apiSuccess && node.data.agentResponse) {
          const variableName = node.data.agentResponse;
          const dataPath = node.data.dataPath;
          let dataToStore = apiResponseData;

          if (dataPath && typeof dataPath === "string" && dataPath.trim() !== "") {
            const nestedValue = getNested(apiResponseData, dataPath);
            if (nestedValue !== undefined) {
              dataToStore = nestedValue;
              console.log(
                `[Executor] Extracted data from path '${dataPath}'.`
              );
            } else {
              console.warn(
                `[Executor] Path '${dataPath}' not found in API response. Storing full response instead.`
              );
            }
          }
          
          const updatedVariables = {
            ...(session.variables || {}),
            [variableName]: dataToStore,
          };

          await db.chatSession.update({
            where: { id: session.id },
            data: { variables: updatedVariables },
          });

          // Actualizamos el objeto de sesión local para los siguientes pasos
          session.variables = updatedVariables;
          console.log(
            `[Executor] API response saved to session variable '${variableName}'.`
          );
        }
      } catch (error: any) {
        console.error(`[Executor] API request failed:`, error.message);
        apiSuccess = false;
      }

      // 3. Determinar el siguiente nodo según éxito/fallo usando las etiquetas personalizadas
      const successHandle = node.data.statusSuccess || "success";
      const errorHandle = node.data.statusError || "error";
      const handle = apiSuccess ? successHandle : errorHandle;

      const nextEdge = workflowData.edges.find(
        (e: any) => e.source === node.id && e.sourceHandle === handle
      );
      const nextNodeId = nextEdge?.target;

      if (nextNodeId) {
        const nextNode = workflowData.nodes.find(
          (n: any) => n.id === nextNodeId
        );
        await db.chatSession.update({
          where: { id: session.id },
          data: { currentNodeId: nextNodeId },
        });
        await executeNode(
          nextNode,
          { ...session, currentNodeId: nextNodeId },
          agent
        );
      } else {
        console.warn(
          `[Executor] No edge found for apiRequest outcome '${handle}'`
        );
      }
      break;
    }
    case "condition": {
      const variables = session.variables || {};
      const result = evaluateCondition(node.data.condition, variables);

      if (node.data.botResponse) {
        const populated = populateNodeDataWithVariables({
          botResponse: node.data.botResponse,
        }, variables);
        await sendWhatsappMessage(
          session.contact.phone,
          agent.whatsappAccessToken,
          populated,
          agent,
          session.contact
        );
      }

      const handle = result ? "success" : "error";
      const nextEdge = workflowData.edges.find(
        (e: any) => e.source === node.id && e.sourceHandle === handle
      );
      const nextNodeId = nextEdge?.target;
      if (nextNodeId) {
        const nextNode = workflowData.nodes.find((n: any) => n.id === nextNodeId);
        await db.chatSession.update({
          where: { id: session.id },
          data: { currentNodeId: nextNodeId },
        });
        await executeNode(nextNode, { ...session, currentNodeId: nextNodeId }, agent);
      } else {
        console.warn(`[Executor] No edge found for condition outcome ${handle}`);
      }
      break;
    }
    case "captureResponse":
      console.log(
        `[Executor] Node ${node.id} is captureResponse. Waiting for user input.`
      );
      break;
    case "handoverToHuman": {
      console.log(`[Executor] Handing over session ${session.id} to a human agent.`);

      // 1. Send final message from bot, if configured
      if (node.data.botResponse) {
        const populatedData = populateNodeDataWithVariables(
          node.data,
          session.variables || {}
        );
        await sendWhatsappMessage(
          session.contact.phone,
          agent.whatsappAccessToken,
          populatedData,
          agent,
          session.contact
        );
      }

      // 2. Update session status
      await db.chatSession.update({
        where: { id: session.id },
        data: { status: "NEEDS_ATTENTION" },
      });

      // 3. Create persistent notification in DB
      const notificationMessage = `El contacto ${
        session.contact.name || session.contact.phone
      } necesita atención.`;
      const notificationLink = `/application/agents/chat-agents/conversations/${agent.id}?contact=${session.contact.id}`;

      await db.notification.create({
        data: {
          userId: agent.userId,
          type: "HANDOVER_REQUEST",
          message: notificationMessage,
          link: notificationLink,
          id: uuidv4(),
        },
      });

      // 4. Notify frontend to refresh notifications
      const notificationChannel = `notifications-for-user-${agent.userId}`;
      await pusher.trigger(notificationChannel, "new_notification", {
        message: "Nueva notificación", // Simple payload, the UI will refetch
      });
      console.log(`[Pusher] Sent 'new_notification' to ${notificationChannel}`);
      
      break;
    }
    case "turnOffAgent": {
      await sendWhatsappMessage(
        session.contact.phone,
        agent.whatsappAccessToken,
        { botResponse: node.data.message },
        agent,
        session.contact
      );
      await db.chatSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });
      break;
    }
    case "crm": {
      const baseVariables = session.variables || {};
      const enrichedVariables = {
        ...baseVariables,
        whatsappPhone: session.contact.phone,
        whatsappName: session.contact.name,
      };

      const url = interpolateVariables(node.data.url, enrichedVariables);
      const method = (node.data.method || "POST").toUpperCase();
      let bodyContent: any = {};

      // body puede venir como JSON string o como objeto
      if (node.data.body) {
        try {
          bodyContent = typeof node.data.body === "string" ? JSON.parse(node.data.body) : node.data.body;
        } catch (_err) {
          console.warn("[CRM] Body is not valid JSON, usando valor crudo");
          bodyContent = node.data.body;
        }
      }

      if (node.data.useInfoWhatsApp) {
        // Rellenar campos phone y name si no existen
        if (typeof bodyContent === "object" && bodyContent !== null) {
          bodyContent.phone = bodyContent.phone || session.contact.phone;
          bodyContent.name = bodyContent.name || session.contact.name;
        }
      }

      // Sustituir variables dentro del body (manteniendo compatibilidad con placeholders)
      bodyContent = deepInterpolate(bodyContent, enrichedVariables);

      const headers = deepInterpolate(node.data.headers || { "Content-Type": "application/json" }, enrichedVariables);

      console.log(`[Executor] CRM request to ${url}`);

      let crmSuccess = false;
      try {
        console.log(url)
        const axiosConfig: any = { method, url, headers };
        if (method !== "GET" && method !== "HEAD") {
          axiosConfig.data = bodyContent;
        }
        const crmResp = await axios(axiosConfig);
        crmSuccess = crmResp.status >= 200 && crmResp.status < 300;
        console.log(`[Executor] CRM response status ${crmResp.status}`);
      } catch (error: any) {
        console.error(`[Executor] CRM request failed:`, error.message);
        crmSuccess = false;
      }

      const handle = crmSuccess ? "success" : "error";
      let nextEdge = workflowData.edges.find(
        (e: any) => e.source === node.id && e.sourceHandle === handle
      );
      if (!nextEdge) {
        // fallback al edge por defecto
        nextEdge = workflowData.edges.find(
          (e: any) => e.source === node.id && !e.sourceHandle
        );
      }
      const nextNodeId = nextEdge?.target;
      if (nextNodeId) {
        const nextNode = workflowData.nodes.find((n: any) => n.id === nextNodeId);
        await db.chatSession.update({
          where: { id: session.id },
          data: { currentNodeId: nextNodeId },
        });
        await executeNode(nextNode, { ...session, currentNodeId: nextNodeId }, agent);
      } else {
        console.warn(`[Executor] No edge found after CRM node for outcome ${handle}`);
      }
      break;
    }
    case "integration": {
      const provider = node.data.provider;

      let integrationSuccess = false;
      const sessionVariables = session.variables || {};

      if (provider === "WOMPI") {
        try {
          // 1. Interpolar variables en los campos
          const fields = deepInterpolate(node.data.fields || {}, sessionVariables);

          // 2. Obtener las credenciales Wompi del usuario (owner del agente)
          const wompiCreds = await db.wompiIntegration.findUnique({
            where: { userId: agent.userId },
          });

          if (!wompiCreds) {
            throw new Error("No se encontraron credenciales Wompi para el usuario.");
          }

          const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/generated-payment-link`;

          const payload = {
            ...fields,
            wompi_private_key: wompiCreds.privateKey,
          };

          console.log(`[Integration] Generating Wompi link via ${apiUrl}`);

          const resp = await axios.post(apiUrl, payload);
          integrationSuccess = resp.status >= 200 && resp.status < 300;

          if (integrationSuccess) {
            const link =
              resp.data?.data?.payment_link_url ||
              resp.data?.data?.url ||
              resp.data?.payment_link_url ||
              resp.data?.url;

            // Guardar la URL en variables de sesión si se configuró
            if (node.data.saveResponseTo && link) {
              const updatedVars = {
                ...sessionVariables,
                [node.data.saveResponseTo]: link,
              };
              await db.chatSession.update({
                where: { id: session.id },
                data: { variables: updatedVars },
              });
              session.variables = updatedVars;
            }

            // Enviar botResponse con el link interpolado, si está configurado
            if (node.data.botResponse) {
              const populated = populateNodeDataWithVariables(
                { botResponse: node.data.botResponse },
                session.variables || {}
              );
              await sendWhatsappMessage(
                session.contact.phone,
                agent.whatsappAccessToken,
                populated,
                agent,
                session.contact
              );
            }
          }
        } catch (error: any) {
          console.error(`[Integration] Error procesando integración Wompi:`, error.message);
          integrationSuccess = false;
        }
      } else {
        console.warn(`[Integration] Proveedor ${provider} no soportado.`);
      }

      const successHandle = node.data.statusSuccess || "success";
      const errorHandle = node.data.statusError || "error";
      const handle = integrationSuccess ? successHandle : errorHandle;

      let nextEdge = workflowData.edges.find(
        (e: any) => e.source === node.id && e.sourceHandle === handle
      );
      if (!nextEdge) {
        // fallback al edge por defecto
        nextEdge = workflowData.edges.find(
          (e: any) => e.source === node.id && !e.sourceHandle
        );
      }

      const nextNodeId = nextEdge?.target;
      if (nextNodeId) {
        const nextNode = workflowData.nodes.find((n: any) => n.id === nextNodeId);
        await db.chatSession.update({
          where: { id: session.id },
          data: { currentNodeId: nextNodeId },
        });
        await executeNode(nextNode, { ...session, currentNodeId: nextNodeId }, agent);
      } else {
        console.warn(`[Integration] No edge found after integration node for outcome ${handle}`);
      }
      break;
    }
    default:
      console.warn(`[Executor] Unknown node type: ${node.type}`);
  }
}

// --- FUNCIONES DE AYUDA PARA EL FLUJO ---

function findInitialNode(nodes: any, edges: any) {
  const targetNodes = new Set(edges.map((e: any) => e.target));
  return nodes.find((node: any) => !targetNodes.has(node.id));
}

function findNextNodeId(currentNode: any, userInput: any, edges: any) {
  console.log(currentNode);
  console.log(userInput);
  if (!currentNode) return null;
  if (currentNode.type === "conversation" && userInput) {
    const allButtons = currentNode.data.interactiveButtons || currentNode.data.buttons || [];
    const button = allButtons.find((b: any) => b.id === userInput);
    if (button) {
      const edge = edges.find(
        (e: any) => e.source === currentNode.id && e.sourceHandle === button.id
      );
      return edge?.target;
    }
  }
  const defaultEdge = edges.find((e: any) => e.source === currentNode.id);
  return defaultEdge?.target;
}

// NUEVO: Helper para acceder a propiedades anidadas de un objeto usando dot-notation
function getNested(obj: any, path: string, defaultValue: any = undefined) {
  const result = path
    .split(".")
    .reduce(
      (res, key) => (res !== null && res !== undefined ? res[key] : res),
      obj
    );
  return result === undefined || result === obj ? defaultValue : result;
}

// Helper for variable substitution across strings containing {{var}} placeholders
function interpolateVariables(
  text: string,
  variables: Record<string, any>
): string {
  if (typeof text !== "string") return text as any;
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, varName) => {
    const key = String(varName).trim();
    // Usamos el nuevo helper para acceder a datos anidados
    const value = getNested(variables, key);
    return value !== undefined ? String(value) : _match;
  });
}

// Deep-clone node.data and replace any placeholders in supported fields
function populateNodeDataWithVariables(
  nodeData: any,
  variables: Record<string, any>
) {
  // simple deep clone
  const dataClone = JSON.parse(JSON.stringify(nodeData));
  if (dataClone.botResponse) {
    dataClone.botResponse = interpolateVariables(dataClone.botResponse, variables);
  }

  // Update interactive buttons if present
  if (Array.isArray(dataClone.interactiveButtons)) {
    dataClone.interactiveButtons = dataClone.interactiveButtons.map((btn: any) => ({
      ...btn,
      title: interpolateVariables(btn.title || btn.label || "", variables),
      label: btn.label ? interpolateVariables(btn.label, variables) : undefined,
    }));
  }

  return dataClone;
}

// Recorre recursivamente un objeto/array y sustituye placeholders en todas las cadenas
function deepInterpolate(obj: any, variables: Record<string, any>): any {
  if (obj == null) return obj;
  if (typeof obj === "string") return interpolateVariables(obj, variables);
  if (Array.isArray(obj)) return obj.map((item) => deepInterpolate(item, variables));
  if (typeof obj === "object") {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = deepInterpolate(v, variables);
    }
    return result;
  }
  return obj;
}

// Evalúa expresiones condicionales después de interpolar variables. Devuelve true/false.
function evaluateCondition(rawCondition: string, variables: Record<string, any>): boolean {
  if (!rawCondition || typeof rawCondition !== "string") return false;
  // Primero sustituimos los placeholders {{var}}
  const withValues = rawCondition.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, varName) => {
    const value = variables[varName.trim()];
    if (value === undefined || value === null) return "undefined";
    if (typeof value === "string") return JSON.stringify(value);
    return String(value);
  });

  try {
    // eslint-disable-next-line no-new-func
    return !!Function(`"use strict"; return (${withValues});`)();
  } catch (_e) {
    console.warn(`[Condition] Invalid expression: ${withValues}`);
    return false;
  }
}

// Devuelve el enum MessageType correspondiente al tipo de mensaje de WhatsApp
function mapWhatsAppTypeToEnum(type: string | undefined): MessageType {
  const mapping: Record<string, MessageType> = {
    text: "TEXT",
    image: "IMAGE",
    audio: "AUDIO",
    video: "VIDEO",
    document: "DOCUMENT",
    location: "LOCATION",
    contacts: "CONTACTS",
    button: "BUTTON",
    interactive: "INTERACTIVE",
    template: "INTERACTIVE",
  } as const;
  if (!type) return "TEXT";
  return mapping[type] || "TEXT";
}

// --- CONSUMIDOR DE REDIS: FASE DE RECEPCIÓN ---

const STREAM_KEY = "incoming_messages";
const GROUP_NAME = "chatbot-worker-group";
const CONSUMER_NAME = `consumer-${
  process.env.FLY_ALLOC_ID || new Date().getTime()
}`;

async function setupConsumerGroup() {
  try {
    await redisClient.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "$", "MKSTREAM");
    console.log(`[Setup] Consumer group ${GROUP_NAME} created.`);
  } catch (error: any) {
    if (error.message.includes("BUSYGROUP")) {
      console.log(`[Setup] Consumer group ${GROUP_NAME} already exists.`);
    } else {
      console.error(
        `[Setup] CRITICAL: Could not create consumer group:`,
        error
      );
      process.exit(1);
    }
  }
}

async function processMessages() {
  console.log(`[Worker] Starting message processing for ${CONSUMER_NAME}.`);
  while (true) {
    try {
      const response = await redisSubscriber.xreadgroup(
        "GROUP",
        GROUP_NAME,
        CONSUMER_NAME,
        "COUNT",
        "1",
        "BLOCK",
        "0",
        "STREAMS",
        STREAM_KEY,
        ">"
      );
      if (response) {
        const [stream, messages] = response[0] as [string, any[]];
        const [messageId, fields] = messages[0];
        const payloadIndex = fields.findIndex((f: any) => f === "payload");
        if (payloadIndex !== -1) {
          const messageObject = JSON.parse(fields[payloadIndex + 1]);

          if (messageObject?.kind === "external") {
            await handleExternalTrigger(messageObject as ExternalTriggerEvent);
          } else if (messageObject?.kind === "batch_send") {
            await handleBatchSend(messageObject as BatchSendEvent);
          } else {
            await handleIncomingMessage(messageObject);
          }
          await redisClient.xack(STREAM_KEY, GROUP_NAME, messageId);
          console.log(`[Worker] Message ${messageId} processed and ACKed.`);
        }
      }
    } catch (error: any) {
      console.error(
        `[Worker] Error in main loop. Reconnecting in 5s...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// --- PUNTO DE ENTRADA ---
console.log("[Worker] Starting...");

const redisConfig = {
  url: process.env.REDIS_URL,
  tls: {},
  maxRetriesPerRequest: null,
};

const redisSubscriber = new Redis(redisConfig.url || "", {
  ...redisConfig,
  lazyConnect: true,
});
const redisClient = new Redis(redisConfig.url || "", {
  ...redisConfig,
  lazyConnect: true,
});

setupRedisLogging(redisSubscriber, "Subscriber");
setupRedisLogging(redisClient, "Client");

async function startWorker() {
  try {
    console.log("[Startup] Connecting to Redis...");
    await Promise.all([redisSubscriber.connect(), redisClient.connect()]);
    console.log("[Startup] Redis connections successful.");
    await setupConsumerGroup();
    await processMessages();
  } catch (error: any) {
    console.error("[Startup] CRITICAL: Worker failed to start:", error);
    process.exit(1);
  }
}

startWorker();  

// ---------------------------------------------------------------------------
// NUEVO: Manejar eventos provenientes de Webhook Trigger
// ---------------------------------------------------------------------------
async function handleExternalTrigger(event: ExternalTriggerEvent) {
  const { workflowId, phone, variables = {} } = event;

  try {
    // 1. Obtener el flujo y su agente
    const workflow = await db.chatWorkflow.findUnique({
      where: { id: workflowId },
      include: { agent: true },
    });

    if (!workflow || !workflow.workflow) {
      console.error(`[Trigger] Workflow ${workflowId} not found or no JSON.`);
      return;
    }

    const agent = workflow.agent;
    if (!agent) {
      console.error(`[Trigger] Workflow ${workflowId} has no assigned ChatAgent.`);
      return;
    }

    // 2. Contacto (crear si no existe)
    let contact = await db.chatContact.findUnique({ where: { phone } });
    if (!contact) {
      contact = await db.chatContact.create({
        data: {
          id: uuidv4(),
          phone,
          name: phone,
          chatAgentId: agent.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 3. Parsear JSON del flujo
    const wfData = typeof workflow.workflow === "string" ? JSON.parse(workflow.workflow) : workflow.workflow;

    // 4. Obtener nodo inicial
    let initialNode: any = findInitialNode(wfData.nodes, wfData.edges);
    if (!initialNode) {
      console.error(`[Trigger] Workflow ${workflowId} has no initial node.`);
      return;
    }

    // Si el primer nodo es un trigger, saltar al siguiente
    if (initialNode.type === "trigger") {
      const nextId = findNextNodeId(initialNode, null, wfData.edges);
      if (!nextId) {
        console.error(`[Trigger] Trigger node has no outgoing edge.`);
        return;
      }
      initialNode = wfData.nodes.find((n: any) => n.id === nextId);
    }

    // 5. Crear sesión
    const session = await db.chatSession.create({
      data: {
        id: uuidv4(),
        contactId: contact.id,
        workflowId: workflow.id,
        currentNodeId: initialNode.id,
        chatAgentId: agent.id,
        status: "ACTIVE",
        variables,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { contact: true, workflow: true },
    });

    // 6. Ejecutar primer nodo (y cualquier salto subsecuente) reutilizando lógica existente
    await executeNode(initialNode, session, agent);
  } catch (error: any) {
    console.error(`[Trigger] Failed handling external trigger:`, error);
  }
}  

// ---------------------------------------------------------------------------
// NUEVO: Manejar eventos de envío por lotes
// ---------------------------------------------------------------------------
async function handleBatchSend(event: BatchSendEvent) {
  const { agentId, contactIds, nodeData, perContactVariables = {} } = event;
  try {
    // 1. Obtener agente
    const agent = await db.chatAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      console.error(`[BatchSend] Agent ${agentId} not found.`);
      return;
    }

    // 2. Obtener contactos (solo los que pertenecen al agente)
    const contacts = await db.chatContact.findMany({
      where: {
        id: { in: contactIds },
        chatAgentId: agent.id,
      },
    });

    if (!contacts.length) {
      console.warn(`[BatchSend] No contacts found for provided IDs.`);
      return;
    }

    console.log(`[BatchSend] Sending batch message to ${contacts.length} contacts.`);

    for (const contact of contacts) {
      const individualVars = perContactVariables[contact.id] || {};

      // Mezclar variables globales + específicas
      let payloadData: any = JSON.parse(JSON.stringify(nodeData)); // deep clone
      if (payloadData.responseType === "template") {
        payloadData.templateVariableValues = {
          ...(nodeData.templateVariableValues || {}),
          ...individualVars,
        };
      }

      // Variables disponibles para interpolación (texto/botones)
      const mergedVars = {
        ...(payloadData.templateVariableValues || {}),
        contact: {
          name: contact.name,
          phone: contact.phone,
        },
        ...individualVars,
      };
      payloadData = populateNodeDataWithVariables(payloadData, mergedVars);

      try {
        await sendWhatsappMessage(
          contact.phone,
          agent.whatsappAccessToken,
          payloadData,
          agent,
          contact
        );
      } catch (err: any) {
        console.error(`[BatchSend] Failed to send to ${contact.phone}:`, err.message);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (error: any) {
    console.error(`[BatchSend] Error processing batch send:`, error);
  }
}