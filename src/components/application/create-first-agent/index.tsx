"use client";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import React, { useState } from "react";
import { CreateAgentForm } from "../create-agent-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import Confetti from "@/components/animations/confetti";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
};

const CreateFirstAgentForm = ({ isOpen }: Props) => {
  const [step, setStep] = useState(1);
  const [isOpenDialog, setIsOpenDialog] = useState(true)
  const router = useRouter();
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogTrigger asChild className="hidden">
        <Button variant="outline">Abrir Diálogo</Button>
      </DialogTrigger>
      <ScrollArea>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="w-full max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>Crea tu primer agente</DialogTitle>
          </DialogHeader>
          {step === 1 && (
            <div className="flex items-center flex-col gap-4">
              <p>
                Bienvenido a Engrok. Estás a un paso de llevar tu servicio al cliente a la excelencia y eficacia. Para empezar, crea tu primer agente.
              </p>
              <video width={500} height={200} loop>
                <source src="/video/banner.mp4" />
              </video>
              <Button
                className="mt-5"
                onClick={() => {
                  setStep(2);
                }}
              >
                Crear agente
              </Button>
            </div>
          )}
          <Confetti />
          {step === 2 && (
            <ScrollArea className="h-[400px] w-full">
              <div className="p-4">
                <CreateAgentForm onSubmit={() => {
                  return router.push("/application/agents")
                }}/>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </ScrollArea>
    </Dialog>
  );
};

export default CreateFirstAgentForm;
