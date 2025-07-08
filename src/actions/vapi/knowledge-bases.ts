"use server";

import { VapiClient } from "@vapi-ai/server-sdk";

const client = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});

export const createKnowledgeBase = async (data: any) => {
  const response = await client.knowledgeBases.create({
    provider: "trieve",
    createPlan: {
      providerId: data.credentialId,
      type: "import",
    },
    name: data.name,
    searchPlan: {
      searchType: "fulltext",
      removeStopWords: true,
      topK: 1.1,
      scoreThreshold: 1.1,
    },
  });

  return response;
};
