"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";
import { ElevenLabsClient } from "elevenlabs";

const apiKey = process.env.ELEVENLABS_API_KEY;
export const getElevenLabsVoices = async () => {
  const client = new ElevenLabsClient();

  
  const voices = await client.voices.getAll();
  return voices;
};