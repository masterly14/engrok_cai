import React from "react";
import { Sidebar } from "./_components/sidebar";
import { AgentProvider } from "@/context/agent-context";

type Props = {
  children: React.ReactNode;
};

export default function VoiceAgentsLayout(props: Props) {
  return (
    <AgentProvider>
      <div className="flex h-screen border-t border-gray-200">
        <Sidebar />
        {props.children}
      </div>
    </AgentProvider>
  );
}
