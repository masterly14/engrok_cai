"use server"

import { db } from "@/utils";
import { onBoardUser } from "./user";
import { revalidatePath } from "next/cache";
import { type ChatAgentFormData } from "@/context/chat-agent-context";
import { v4 as uuidv4 } from 'uuid';
import { randomUUID } from 'crypto';

export const getChatWorkflow = async (workflowId: string) => {
    const workflow = await db.chatWorkflow.findUnique({
        where: {
            id: workflowId,
        },
        include: {
          agent: {
            select: {
              id: true,
              whatsappPhoneNumberId: true,
              whatsappPhoneNumber: true,
              whatsappBusinessAccountId: true,
              whatsappAccessToken: true,
            }
          }
        }
    });

    if (!workflow) {
      return {
        status: 404,
      }
    }
    return {
      status: 200,
      workflow,
    };
}

export const getAllChatWorkflows = async () => {
  const user = await onBoardUser();
  if (!user) {
    return {
      status: 401,
      message: "Unauthorized",
    }
  }
  const workflows = await db.chatWorkflow.findMany({
    where: {
      userId: user.data.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return workflows;
};


export const createChatWorkflow = async (data: any) => {
  const user = await onBoardUser();
  if (!user) {
    return {
      status: 401,
      message: "Unauthorized",
    }
  }
  
  const { workflowJson, ...otherData } = data;

  const workflow = await db.chatWorkflow.create({
    data: {
      ...otherData,
      workflow: workflowJson,
      userId: user.data.id,
    },
  });

  try {
    // --- Procesar nodos trigger ---
    const nodes = workflowJson?.nodes || [];
    const triggerNodes = nodes.filter((n: any) => n.type === "trigger");

    for (const t of triggerNodes) {
      const tData = t.data || {};
      const provider = tData.provider || "webhook";

      const existing = await db.workflowTrigger.findFirst({
        where: { workflowId: workflow.id, provider },
      });

      if (existing) {
        await db.workflowTrigger.update({
          where: { id: existing.id },
          data: {
            connectionId: tData.connectionId ?? existing.connectionId,
            syncName: tData.syncName ?? existing.syncName,
            mapping: tData.mapping || {},
          },
        });
      } else {
        await db.workflowTrigger.create({
          data: {
            id: uuidv4(),
            token: randomUUID(),
            userId: user.data.id,
            workflowId: workflow.id,
            provider,
            connectionId: tData.connectionId || null,
            syncName: tData.syncName || null,
            mapping: tData.mapping || {},
            updatedAt: new Date(),
            createdAt: new Date(),
          },
        });
      }
    }
  } catch (e) {
    console.error("[Trigger] Failed to sync triggers", e);
  }

  if (!workflow) {
    return {
      status: 500,
      message: "Error creating workflow",
    }
  }
  return {
    status: 200,
    workflow,
  }
}

export const updateChatWorkflow = async (workflowId: string, data: any) => {
  const user = await onBoardUser();
  if (!user) {
    return {
      status: 401,
      message: "Unauthorized",
    };
  }

  const { workflowJson, ...otherData } = data;

  console.log('Workflow JSON:', workflowJson)
  console.log('Other Data:', otherData)
  try {
    const workflow = await db.chatWorkflow.update({
      where: { id: workflowId, userId: user.data.id },
      data: {
        ...otherData,
        workflow: workflowJson,
      },
    });

    console.log('Workflow updated:', workflow)

    // ---- Sync triggers ----
    try {
      const nodes = workflowJson?.nodes || [];
      const triggerNodes = nodes.filter((n: any) => n.type === "trigger");

      for (const t of triggerNodes) {
        const tData = t.data || {};
        const provider = tData.provider || "webhook";

        const existing = await db.workflowTrigger.findFirst({
          where: { workflowId, provider },
        });

        if (existing) {
          await db.workflowTrigger.update({
            where: { id: existing.id },
            data: {
              connectionId: tData.connectionId ?? existing.connectionId,
              syncName: tData.syncName ?? existing.syncName,
              mapping: tData.mapping || {},
            },
          });
        } else {
          await db.workflowTrigger.create({
            data: {
              id: uuidv4(),
              token: randomUUID(),
              userId: user.data.id,
              workflowId,
              provider,
              connectionId: tData.connectionId || null,
              syncName: tData.syncName || null,
              mapping: tData.mapping || {},
              updatedAt: new Date(),
              createdAt: new Date(),
            },
          });
        }
      }

      // Nota: Para simplificar el MVP no eliminamos triggers huérfanos.
    } catch (e) {
      console.error("[Trigger] Failed to sync triggers (update)", e);
    }

    return {
      status: 200,
      workflow,
    };
  } catch (error) {
    console.error('Error updating workflow:', error)
    return {
      status: 500,
      message: "Error updating workflow",
    };
  }
};

export const updateChatWorkflowMedia = async (params: {
  workflowId: string;
  nodeId: string;
  data: {
    fileOrImageUrl?: string | null;
    filePublicId?: string | null;
    fileResourceType?: "raw" | "image" | "video" | null;
  };
}) => {
  const { workflowId, nodeId, data } = params;
  const user = await onBoardUser();
  if (!user) {
    return { status: 401, message: "Unauthorized" };
  }
  try {
    const workflow = await db.chatWorkflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow || workflow.userId !== user.data.id) {
      return { status: 404, message: "Workflow not found" };
    }
    let workflowJson: any = workflow.workflow || { nodes: [], edges: [] };
    if (typeof workflowJson === "string") {
      try {
        workflowJson = JSON.parse(workflowJson);
      } catch (_) {
        workflowJson = { nodes: [], edges: [] };
      }
    }
    const nodes = workflowJson.nodes || [];
    const nodeIndex = nodes.findIndex((n: any) => n.id === nodeId);
    if (nodeIndex === -1) {
      return { status: 400, message: "Node not found in workflow" };
    }
    const node = nodes[nodeIndex];
    node.data = { ...node.data, ...data };
    nodes[nodeIndex] = node;
    const updated = await db.chatWorkflow.update({
      where: { id: workflowId },
      data: { workflow: { ...workflowJson, nodes } },
    });
    return { status: 200, workflow: updated };
  } catch (error) {
    console.error("Error updating chat workflow:", error);
    return { status: 500, message: "Failed to update workflow" };
  }
}

export const getAvailableWorkflows = async (agentId?: string) => {
    const user = await onBoardUser()
    if (!user?.data?.id) throw new Error("User not found")

    // Returns user's workflows that are either unassigned or assigned to the current agent
    return db.chatWorkflow.findMany({
        where: {
            userId: user.data.id,
            OR: [
                { agentId: null },
                { agentId: agentId ?? undefined }
            ]
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export const getChatAgents = async () => {
  const user = await onBoardUser()
  if (!user?.data?.id) {
    throw new Error("User not authenticated")
  }
  try {
    const agents = await db.chatAgent.findMany({
      where: { userId: user.data.id },
      include: {
        workflows: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return agents
  } catch (error) {
    console.error("Error fetching chat agents:", error)
    return []
  }
}

export const createChatAgent = async (data: ChatAgentFormData) => {
    const user = await onBoardUser()
    if (!user?.data?.id) throw new Error("User not found")

    const { workflowId, ...agentData } = data
  
    return db.$transaction(async (prisma) => {
        const newAgent = await prisma.chatAgent.create({
            data: {
                ...agentData,
                userId: user.data!.id,
            },
        })

        if (workflowId) {
            await prisma.chatWorkflow.update({
                where: { id: workflowId },
                data: { agentId: newAgent.id }
            })
        }
        
        revalidatePath("/application/agents/chat-agents/agents")
        
        const agentWithWorkflows = await prisma.chatAgent.findUniqueOrThrow({
            where: { id: newAgent.id },
            include: { workflows: true }
        })

        return agentWithWorkflows
    })
}

export const updateChatAgent = async (agentId: string, data: ChatAgentFormData) => {
    const user = await onBoardUser()
    if (!user?.data?.id) throw new Error("User not authenticated")

    const { workflowId, ...agentData } = data

    return db.$transaction(async (prisma) => {
        const currentAgentState = await prisma.chatAgent.findUnique({
            where: { id: agentId, userId: user.data!.id },
            include: { workflows: true }
        })

        if (!currentAgentState) {
            throw new Error("Agent not found");
        }

        const currentWorkflow = currentAgentState.workflows.find(w => w.agentId === agentId)
        
        if (workflowId && currentWorkflow?.id !== workflowId) {
            await prisma.chatSession.updateMany({
                where: {
                    chatAgentId: agentId,
                    status: {
                        in: ["ACTIVE", "NEEDS_ATTENTION"]
                    }
                },
                data: {
                    status: "COMPLETED"
                }
            })
        }
        
        if (currentWorkflow && currentWorkflow.id !== workflowId) {
            await prisma.chatWorkflow.update({
                where: { id: currentWorkflow.id },
                data: { agentId: null }
            })
        }

        await prisma.chatAgent.update({
            where: { id: agentId },
            data: agentData,
        })

        if (workflowId && workflowId !== currentWorkflow?.id) {
            await prisma.chatWorkflow.update({
                where: { id: workflowId },
                data: { agentId: agentId }
            })
        }
        
        revalidatePath("/application/agents/chat-agents/agents")

        const updatedAgentWithWorkflows = await prisma.chatAgent.findUniqueOrThrow({
            where: { id: agentId },
            include: { workflows: true }
        })

        return updatedAgentWithWorkflows
    })
}


export const deleteChatAgent = async (agentId: string) => {
    const user = await onBoardUser();
    if (!user?.data?.id) {
      throw new Error("User not authenticated");
    }

    try {
      await db.chatAgent.delete({
        where: { id: agentId, userId: user.data.id },
      });
      revalidatePath("/application/agents/chat-agents/agents");
      return { success: true };
    } catch (error) {
      console.error("Error deleting chat agent:", error);
      throw new Error("Failed to delete chat agent");
    }
}

export const saveUserAsset = async (params: { name: string; type: string; url: string }) => {
  const user = await onBoardUser()
  if (!user) {
    return { status: 401, message: "Unauthorized" }
  }

  try {
    const asset = await db.userAssets.create({
      data: {
        name: params.name,
        type: params.type,
        url: params.url,
        userId: user.data.id,
        updatedAt: new Date(),
        id: uuidv4(),
      },
    })
    return { status: 200, data: asset }
  } catch (error) {
    console.error("Error saving asset:", error)
    return { status: 500, message: "Failed to save asset" }
  }
}

export const getUserAssets = async (type?: string) => {
  const user = await onBoardUser()
  if (!user) {
    return { status: 401, message: "Unauthorized", data: [] }
  }
  try {
    const assets = await db.userAssets.findMany({
      where: {
        userId: user.data.id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return { status: 200, data: assets }
  } catch (error) {
    console.error("Error fetching assets:", error)
    return { status: 500, message: "Failed to fetch assets", data: [] }
  }
}
