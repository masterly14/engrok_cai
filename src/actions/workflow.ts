'use server'

import { db } from "@/utils";
import { onBoardUser } from "./user"

export const getAllWorkflows = async () => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
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
        const workflow = await db.workflow.create({
            data: {
                ...data,
                userId: user.data.id
            }
        })

        return {
            status: 200,
            workflow: workflow
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
        const workflow = await db.workflow.update({
            where: {
                id: id
            },
            data: {
                ...data,
                userId: user.data.id
            }
        })

        return {
            status: 200,
            workflow: workflow
        }
    } catch (error) {
        return {
            status: 500,
            message: "Failed to create Workflow"
        }
    }
}

export const deleteWorkflow = async (id: string) => {
    const user = await onBoardUser();
    if (!user?.data.id) {
        throw new Error("Not user")
    }

    const workflow = await db.workflow.delete({
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