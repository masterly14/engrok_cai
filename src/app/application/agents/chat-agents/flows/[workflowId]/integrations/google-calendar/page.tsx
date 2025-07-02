"use client";

import {
  connectIntegrationAccount,
  validateIntegrationUser,
} from "@/actions/integrations";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  params: {
    workflowId: string;
  };
};

const GoogleCalendarIntegrationPage = ({ params }: Props) => {
  const router = useRouter();
  const { workflowId } = params;

  useEffect(() => {
    const completeConnection = async () => {
      try {
        const { userId } = await validateIntegrationUser("GOOGLE_CALENDAR");

        if (!userId) {
          toast.error(
            "No se pudo verificar el usuario. Por favor, intenta de nuevo."
          );
          router.push(`/application/agents/chat-agents/flows/${workflowId}`);
          return;
        }

        const result = await connectIntegrationAccount(
          "GOOGLE_CALENDAR",
          userId,
          workflowId,
          true // Ponemos waitingRequest en true para que el servidor espere
        );

        if (result?.isConnected) {
          toast.success("¡Cuenta de Google Calendar conectada exitosamente!");
        } else {
          toast.error(
            "Hubo un problema al conectar tu cuenta de Google Calendar."
          );
        }
      } catch (error) {
        console.error("Error completing Google Calendar connection:", error);
        toast.error("Error al finalizar la conexión con Google Calendar.");
      } finally {
        router.push(`/application/agents/chat-agents/flows/${workflowId}`);
      }
    };

    completeConnection();
  }, [workflowId, router]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">
        Finalizando la conexión con Google Calendar, por favor espera...
      </p>
    </div>
  );
};

export default GoogleCalendarIntegrationPage; 