import React from "react";
import { Sidebar } from "./_components/sidebar";
import { AgentProvider } from "@/context/agent-context";
import { getAllAgents } from "@/actions/agents";

type Props = {
  children: React.ReactNode;
};

export default async function VoiceAgentsLayout(props: Props) {
  const response = await getAllAgents();
  const agents = 'error' in response ? [] : response;
  return (
    <AgentProvider>
      <div className="flex h-screen border-t border-gray-200">
        <Sidebar agents={agents} />
        {props.children}
      </div>
    </AgentProvider>
  );
}
