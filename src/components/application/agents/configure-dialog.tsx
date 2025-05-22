'use client'

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { AddKnowledgeBase } from "./add-knowledge-base";

type Props = {
    userId: string,
    agentId: string,
    prompt: string,
    language: string,
    voice_id: string,
    name: string,
    first_message: string
};


const ConfigureAgentDialog = ({userId, agentId, prompt, voice_id, name, first_message, language}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  console.log('ID de Agente: ', agentId)
  const handleSuccess = () => {
    setIsOpen(false);
    location.reload();
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configure
        </Button>
      </DialogTrigger>
      <ScrollArea>
        <DialogOverlay className="bg-black/60 backdrop-blur-xs" />
        <DialogContent className="w-full max-w-[1200px]">
          <DialogHeader>
            <p>Finish Configure agent</p>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full">
            <AddKnowledgeBase agentId={agentId} userId={userId} prompt={prompt} voice_id={voice_id} name={name} first_message={first_message} language={language} onSuccess={handleSuccess}/>
          </ScrollArea>
        </DialogContent>
      </ScrollArea>
    </Dialog>
  );
};

export default ConfigureAgentDialog;
