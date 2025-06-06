import React from "react";
import VoiceAgentsClient from "./VoiceAgentsClient";
import { getAllAgents } from "@/actions/agents";

const Page = async () => {
  const response = await getAllAgents();
  const agents = 'error' in response ? [] : response;
  return <VoiceAgentsClient agents={agents} />;
};

export default Page;
