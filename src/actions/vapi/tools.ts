"use server"

import { VapiClient } from "@vapi-ai/server-sdk"


const client = new VapiClient({token: process.env.VAPI_TOKEN!})

export async function createTool() {

    const response = await client.tools.create({
        type: "function",
        function: {
            name: "api_request",
            description: "Make a request to an API",
            parameters: {
                type: "object",
                properties: {
                    url: {type: "string", description: "The URL to make the request to"},
                    method: {type: "string", description: "The HTTP method to use"},
                }
            }
        }
    })
}