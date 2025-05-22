import { getAllAgents } from "@/actions/agents";
import { AgentsList } from "@/components/application/agents/agent-list";
import DehydratePage from "@/components/dehydratedPages";
import React from "react";

const page = () => {
  return (
    <DehydratePage Querykey="agents" Queryfn={getAllAgents}>
      <AgentsList all />;
    </DehydratePage>
  );
};

export default page;
