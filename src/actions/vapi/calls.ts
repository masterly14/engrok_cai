"use server"

import { VapiClient } from "@vapi-ai/server-sdk"

export const startCall = async (vapiId: string) => {
    const client = new VapiClient({
        token: process.env.VAPI_API_KEY!,
    })

    const call = await client.calls.create({
        assistantId: vapiId,
    })
    console.log(call)
}