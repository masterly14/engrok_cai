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
import { CreateAgentForm } from "../create-agent-form";
import { Plus } from "lucide-react";

type Props = {};

const CreateAgentDialog = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </DialogTrigger>
      <ScrollArea>
        <DialogOverlay className="bg-black/60 backdrop-blur-xs" />
        <DialogContent className="w-full max-w-[1200px]">
          <DialogHeader>
            <p>Create agent</p>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full">
            <div className="p-4">
              <CreateAgentForm
                onSubmit={() => {
                  setIsOpen(false);
                }}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </ScrollArea>
    </Dialog>
  );
};

export default CreateAgentDialog;
