"use server";

import axios from "axios";
import { onBoardUser } from "../user";
import { headers } from "next/headers";
import { db } from "@/utils";
import { VapiClient } from "@vapi-ai/server-sdk";

const client = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});
export const createDataSet = async (name: string) => {
  try {
    const response = await fetch("https://api.trieve.ai/api/dataset", {
      method: "POST",
      body: JSON.stringify({
        dataset_name: name,
        organization_id: process.env.TRIEVE_ORGANIZATION_ID,
      }),
      headers: {
        "TR-Organization": process.env.TRIEVE_ORGANIZATION_ID!,
        Authorization: process.env.TRIEVE_API_KEY!,
        "Content-Type": "application/json",
      },
    });
    console.log("Response", response);
    return response.json();
  } catch (error) {
    console.log("Error creating dataset", error);
    return {
      error: "Error creating dataset",
    };
  }
};

export const createDocument = async (
  file: File,
  name: string
): Promise<{ success?: boolean; id?: string; error?: string }> => {
  const user = await onBoardUser();
  if (!user) {
    return {
      error: "User not found",
    };
  }

  try {
    const dataset = await createDataSet(name);
    if ("error" in dataset) {
      return {
        error: dataset.error,
      };
    }

    // Convert the uploaded file to a base64 string as required by Trieve
    const arrayBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(arrayBuffer).toString("base64");

    const payload = {
      base64_file: base64File,
      file_name: file.name || "example.pdf",
      // Optional: replicate behaviour of create_chunks using the new API field
      chunkr_create_task_req_payload: {
        segmentation_strategy: "LayoutAnalysis", // default suggested by docs
      },
      metadata: {
        title: name,
        author: user.data.name || "Unknown",
        category: "General",
      },
    };

    try {
      const response = await axios.post(
        "https://api.trieve.ai/api/file",
        payload,
        {
          headers: {
            Authorization: process.env.TRIEVE_API_KEY!,
            "TR-Dataset": dataset.id,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        return {
          error: response.data.message || "Failed to upload file",
        };
      }

      // Integración con VAPI AI
      const uploadVapi = await client.knowledgeBases.create({
        name: name,
        provider: "trieve",
        createPlan: {
          providerId: dataset.id,
          type: "import",
        },
        searchPlan: {
          searchType: "hybrid",
          removeStopWords: true,
          scoreThreshold: 0.5,
          topK: 10,
        },
      });

      if (!uploadVapi) {
        console.log("Failed to upload document to Vapi", uploadVapi);
        return {
          error: "Failed to upload document to Vapi",
        };
      }

      // Guardar en la base de datos
      const newKnowledgeBase = await db.knowledgeBase.create({
        data: {
          name: name,
          trieveApiKey: process.env.TRIEVE_API_KEY!,
          credentialId: process.env.TRIEVE_ORGANIZATION_ID!,
          vapiId: uploadVapi.id,
          userId: user.data.id,
        },
      });

      return {
        success: true,
        id: newKnowledgeBase.vapiId!,
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || "Failed to upload file",
      };
    }
  } catch (error: any) {
    console.log("Error creating document:", error);
    return {
      error: "Error creating document",
    };
  }
};

export const getKnowledgeBases = async () => {
  const user = await onBoardUser();
  if (!user) {
    return {
      error: "User not found",
    };
  }

  const knowledgeBases = await db.knowledgeBase.findMany({
    where: {
      userId: user.data.id,
    },
  });

  return knowledgeBases;
};
