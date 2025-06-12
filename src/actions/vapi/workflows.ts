"use server"

import { db } from "@/utils"
import { unstable_cache } from "next/cache"
import { onBoardUser } from "../user"

export const getCachedAllWorkflows = unstable_cache(
    async (userId: string) => {
        const workflows = await db.workflow.findMany({
            where: {
                userId: userId
            }
        })
        console.log('workflows', workflows);
        return workflows
    },
    ["workflows"],
    { revalidate: 3600 }
)

export const getAllWorkflows = async () => {
    const user = await onBoardUser();
    if (!user) {
        return { error: "User not found" };
    }
    return await getCachedAllWorkflows(user.data.id);
}