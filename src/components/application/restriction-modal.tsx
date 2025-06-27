
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface RestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceName: string; // "agentes", "workflows", etc.
  limit: number;
  planName: string;
}

export const RestrictionModal = ({
  isOpen,
  onClose,
  resourceName,
  limit,
  planName,
}: RestrictionModalProps) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/#pricing"); // Redirige a la sección de precios
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Límite del Plan Alcanzado
          </DialogTitle>
          <DialogDescription className="pt-2">
            Has alcanzado el límite de **{limit} {resourceName}** permitido en tu plan **{planName}**.
            <br />
            Para crear más {resourceName}, por favor, actualiza tu plan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Entendido
          </Button>
          <Button onClick={handleUpgrade}>
            Ver Planes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};