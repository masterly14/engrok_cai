import { NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { getElevenLabsVoices } from "@/actions/elevenlabs";

export async function GET() {
  // Ensure the requester is an authenticated user
  const user = await onBoardUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const voices = await getElevenLabsVoices();
    return NextResponse.json(voices);
  } catch (error) {
    console.error("Error fetching ElevenLabs voices", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 },
    );
  }
}
