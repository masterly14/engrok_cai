"use server"

import { VapiClient } from "@vapi-ai/server-sdk"

export const startCall = async (vapiId: string, data: any) => {
    const client = new VapiClient({
        token: process.env.VAPI_API_KEY!,
    })

    let schedule: Boolean = false 

    if (data.scheduled) {
        schedule = true
    }

    let call

    if (schedule) {
        call = await client.calls.create({
            assistantId: data.assistantId,
            phoneNumberId: vapiId,
            customer: {
                number: data.phoneNumber,
                numberE164CheckEnabled: true,
            },
            schedulePlan: {
                earliestAt: data.scheduledFor.datetime,
                latestAt: data.scheduledFor.datetime,
            },
        })
    } else if (!schedule) {
        call = await client.calls.create({
            assistantId: data.assistantId,
            phoneNumberId: vapiId,
            customer: {
                number: data.phoneNumber,
                numberE164CheckEnabled: true,
            },
        })
    }

    if (call && schedule) {
        return {
            call: call,
            message: "Llamada programada correctamente"
        }
    } else if (call && !schedule) {
        return {
            call: call,
            message: "En breve se realizará la llamada"
        }
    } else {
        return null
    }
}