import React from "react";
import { getChatAgents } from "@/actions/chat-agents";
import { Sidebar } from "./_components/sidebar";
import ChatAgentsClient from "./ChatAgentsClient";

const ChatAgentsPage = async () => {
  const agents = await getChatAgents();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar agents={agents} />
      <ChatAgentsClient agents={agents} />
    </div>
  );
};

export default ChatAgentsPage;
