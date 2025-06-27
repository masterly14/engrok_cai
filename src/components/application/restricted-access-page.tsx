"use client";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface RestrictedAccessPageProps {
  planName: string | null;
}

export const RestrictedAccessPage = ({ planName }: RestrictedAccessPageProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8">
      <div className="bg-secondary p-6 rounded-full mb-6">
        <Lock className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Función no disponible en tu plan</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Los agentes de voz no están incluidos en tu plan actual ({planName || "Básico"}). Para acceder a esta y otras funciones avanzadas, por favor, considera actualizar tu suscripción.
      </p>
      <Button size="lg" onClick={() => router.push("/#pricing")}>
        Ver Planes
      </Button>
    </div>
  );
}; 