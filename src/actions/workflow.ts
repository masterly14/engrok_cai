'use server'

import { db } from "@/utils";
import { onBoardUser } from "./user"

// Función para enviar workflow a la API de Vapi
const sendToVapiAPI = async (vapiPayload: any) => {
    try {
        console.log("-------------------- VAPI PAYLOAD --------------------");
        console.log(JSON.stringify(vapiPayload, null, 2));
        console.log("------------------------------------------------------");

        // Verificar que la API key esté configurada
        if (!process.env.VAPI_API_KEY) {
            throw new Error('VAPI_API_KEY no está configurada en las variables de entorno');
        }

        const response = await fetch('https://api.vapi.ai/workflow', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vapiPayload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Vapi API error: ${errorData.message || response.statusText} (Status: ${response.status})`);
        }

        const vapiResponse = await response.json();
        return {
            success: true,
            vapiWorkflowId: vapiResponse.id,
            data: vapiResponse
        };
    } catch (error) {
        console.error('Error sending to Vapi API:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Función para obtener un workflow específico de Vapi
const getVapiWorkflow = async (vapiWorkflowId: string) => {
    try {
        if (!process.env.VAPI_API_KEY) {
            throw new Error('VAPI_API_KEY no está configurada en las variables de entorno');
        }

        const response = await fetch(`https://api.vapi.ai/workflow/${vapiWorkflowId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Vapi workflow: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching Vapi workflow:', error);
        throw error;
    }
};

export const getAllWorkflows = async () => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user");
    }

    const workflows = await db.workflow.findMany({
        where: {
            userId: user.data.id
        },
        orderBy: {
            'updatedAt': 'desc'
        }
    })
    
    if (!workflows) {
        return {
            status: 500,
            message: "The workflows could not be obtained"
        }
    }

    return {
        status: 200,
        workflows: workflows
    }
}

export const createWorkflow = async (data: any) => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
    }
    
    try {
        // Crear workflow en base de datos local
        const workflow = await db.workflow.create({
            data: {
                ...data,
                userId: user.data.id
            }
        })

        // Si hay un payload de Vapi, enviarlo a la API
        if (data.vapiPayload) {
            const vapiResult = await sendToVapiAPI(data.vapiPayload);
            
            if (vapiResult.success) {
                // Actualizar el workflow local con el ID de Vapi
                await db.workflow.update({
                    where: { id: workflow.id },
                    data: { 
                        vapiWorkflowId: vapiResult.vapiWorkflowId,
                        vapiWorkflowData: vapiResult.data
                    }
                });
            } else {
                console.warn('Vapi API error during creation:', vapiResult.error);
            }
        }

        return {
            status: 200,
            workflow: workflow,
            vapiResult: data.vapiPayload ? await sendToVapiAPI(data.vapiPayload) : null
        }
    } catch (error) {
        return {
            status: 500,
            message: "Failed to create Workflow"
        }
    }
}

export const getWorkflow = async (id: string) => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
    }

    const workflow = await db.workflow.findUnique({
        where: {
            userId: user.data.id,
            id: id
        },
    })
    
    if (!workflow) {
        return {
            status: 500,
            message: "The workflows could not be obtained"
        }
    }

    return {
        status: 200,
        workflow: workflow
    }
}

export const updateWorkflow = async (data: any, id: string) => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
    }
    
    try {
        console.log(data, "data")
        
        // Guardar en base de datos local
        const workflow = await db.workflow.update({
            where: {
                id: id
            },
            data: {
                name: data.name,
                ...(data.workflowJson !== undefined && { workflowJson: data.workflowJson }),
                ...(data.tools !== undefined && { tools: data.tools }),
                userId: user.data.id
            }
        })

        console.log(workflow, "workflow")

        // Si hay un payload de Vapi, enviarlo a la API
        if (data.vapiPayload) {
            const vapiResult = await sendToVapiAPI(data.vapiPayload);
            
            if (vapiResult.success) {
                // Actualizar el workflow local con el ID de Vapi
                await db.workflow.update({
                    where: { id: id },
                    data: { 
                        vapiWorkflowId: vapiResult.vapiWorkflowId,
                        vapiWorkflowData: vapiResult.data
                    }
                });
            } else {
                console.warn('Vapi API error:', vapiResult.error);
                // No fallamos el guardado local por un error de Vapi
            }
        }

        return {
            status: 200,
            workflow: workflow,
            vapiResult: data.vapiPayload ? await sendToVapiAPI(data.vapiPayload) : null
        }
    } catch (error) {
        return {
            status: 500,
            message: "Failed to update Workflow"
        }
    }
}

export const deleteWorkflow = async (workflowId: string) => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
    }

    const workflow = await db.workflow.delete({
        where: {
            userId: user.data.id,
            id: workflowId
        },
    })
    
    if (!workflow) {
        return {
            status: 500,
            message: "The workflows could not be obtained"
        }
    }

    return {
        status: 200,
        workflow: workflow
    }
}

export const syncWorkflowWithVapi = async (workflowId: string) => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
    }
    
    try {
        // Obtener el workflow local
        const workflow = await db.workflow.findUnique({
            where: {
                id: workflowId,
                userId: user.data.id
            }
        });

        if (!workflow) {
            return {
                status: 404,
                message: "Workflow not found"
            };
        }

        // Si no tiene workflowJson, no podemos sincronizar
        if (!workflow.workflowJson) {
            return {
                status: 400,
                message: "Workflow no tiene datos para sincronizar"
            };
        }

        // Transformar el workflowJson a formato Vapi
        const workflowData = typeof workflow.workflowJson === 'string' 
            ? JSON.parse(workflow.workflowJson) 
            : workflow.workflowJson;

        // Aquí necesitarías la lógica de transformación
        // Por ahora, asumimos que ya está en el formato correcto
        const vapiPayload = {
            name: workflow.name,
            nodes: workflowData.nodes || [],
            edges: workflowData.edges || []
        };

        // Si ya tiene un vapiWorkflowId, actualizar; si no, crear
        if (workflow.vapiWorkflowId) {
            // Actualizar workflow existente en Vapi
            const response = await fetch(`https://api.vapi.ai/workflow/${workflow.vapiWorkflowId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vapiPayload),
            });

            if (!response.ok) {
                throw new Error(`Failed to update Vapi workflow: ${response.statusText}`);
            }

            const vapiResponse = await response.json();
            
            // Actualizar datos locales
            await db.workflow.update({
                where: { id: workflowId },
                data: { 
                    vapiWorkflowData: vapiResponse
                }
            });

            return {
                status: 200,
                message: "Workflow sincronizado con Vapi",
                vapiData: vapiResponse
            };
        } else {
            // Crear nuevo workflow en Vapi
            const vapiResult = await sendToVapiAPI(vapiPayload);
            
            if (vapiResult.success) {
                await db.workflow.update({
                    where: { id: workflowId },
                    data: { 
                        vapiWorkflowId: vapiResult.vapiWorkflowId,
                        vapiWorkflowData: vapiResult.data
                    }
                });

                return {
                    status: 200,
                    message: "Workflow creado en Vapi",
                    vapiData: vapiResult.data
                };
            } else {
                return {
                    status: 500,
                    message: `Error al crear workflow en Vapi: ${vapiResult.error}`
                };
            }
        }
    } catch (error) {
        console.error('Error syncing workflow with Vapi:', error);
        return {
            status: 500,
            message: "Error al sincronizar workflow con Vapi"
        };
    }
};
