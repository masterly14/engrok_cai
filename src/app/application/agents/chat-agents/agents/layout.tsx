"use client";

import React from "react";
import { ChatAgentProvider } from "@/context/chat-agent-context";
import VideoWidget from "@/components/video-widget";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatAgentProvider>
      {children}
      <VideoWidget videoUrl="https://www.loom.com/share/51ea2766d4d14882b165bccac631e8af?sid=dc4538c3-e5af-4753-9aa8-b69052b02bd4" text="Hola, soy un agente de chat" initiallyOpen={false} />
    </ChatAgentProvider>
  );
}
