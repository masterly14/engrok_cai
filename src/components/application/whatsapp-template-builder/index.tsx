"use client"; // This page will manage state, so it's a client component

import { useEffect, useState } from "react";
import type { ChatAgentWithWorkflows } from "@/types/agent";
import TemplateBuilderSidebar from "@/components/application/whatsapp-template-builder/sidebar";
import { initialFormData } from "@/components/application/whatsapp-template-builder/types";
import TemplateBuilderWizard from "./wizard";

export default function WhatsAppTemplateBuilder() {
  // These states would ideally come from a context, user settings, or URL params
  const [agents, setAgents] = useState<ChatAgentWithWorkflows[]>([]);
  const [selectedAgent, setSelectedAgent] =
    useState<ChatAgentWithWorkflows | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    initialFormData.language,
  );

  // Mock quota
  const [quota, setQuota] = useState({ used: 120, max: 6000 });

  const selectedWabaId = selectedAgent?.whatsappBusinessAccountId || "";

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/chat-agents");
        if (!res.ok) throw new Error("Failed to fetch chat agents");
        const data = await res.json();
        setAgents(data?.agents || []);

        // Auto select first agent if none selected
        if (!selectedAgent && data?.agents?.length) {
          setSelectedAgent(data.agents[0]);
        }
      } catch (error) {
        console.error("[TemplateBuilder] Error fetching chat agents", error);
      }
    };

    fetchAgents();
  }, []);

  const handleWabaChange = (wabaId: string) => {
    const agent =
      agents.find((a) => a.whatsappBusinessAccountId === wabaId) || null;
    setSelectedAgent(agent);
  };

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    // This should also update the language in the wizard's formData if a template is being edited/created
  };

  return (
    <div className="flex h-screen bg-background ">
      <TemplateBuilderSidebar
        agents={agents}
        selectedWabaId={selectedWabaId}
        onWabaChange={handleWabaChange}
        selectedLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        templateQuotaUsed={quota.used}
        templateQuotaMax={quota.max}
      />
      <main className="flex-1 p-8 overflow-auto ml-80">
        {" "}
        {/* Add ml-80 to offset fixed sidebar */}
        <div className="max-w-4xl mx-auto">
          <TemplateBuilderWizard
            agent={selectedAgent}
            language={currentLanguage}
          />
          {/* Later, a list of existing templates could go here */}
          {/* <TemplateList wabaId={selectedWabaId} /> */}
        </div>
      </main>
    </div>
  );
}
