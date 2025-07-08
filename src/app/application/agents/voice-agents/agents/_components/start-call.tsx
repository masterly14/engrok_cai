"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

type Props = {
  vapiId: string;
};

const StartCall = ({ vapiId }: Props) => {
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  // Función para obtener cookie
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  // Función para establecer cookie
  const setCookie = (name: string, value: string, days = 365) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  // Función para verificar si el usuario ya aceptó los términos
  const hasAcceptedCallCosts = (): boolean => {
    return getCookie("vapi_call_costs_accepted") === "true";
  };

  useEffect(() => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setActiveCall(true);
      setIsCalling(false);
      toast("Llamada iniciada");
    });

    vapi.on("call-end", () => {
      toast("Llamada finalizada");
      setActiveCall(false);
      setIsCalling(false);
    });

    vapi.on("error", (err) => {
      toast.error("Error en la llamada");
      setIsCalling(false);
      setActiveCall(false);
    });

    return () => {
      vapi.removeAllListeners?.();
    };
  }, []);

  const startCallProcess = async () => {
    const vapi = vapiRef.current;
    if (!vapi || isCalling || activeCall) return;

    try {
      setIsCalling(true);
      await vapi.start(vapiId);
      setActiveCall(true);
    } catch (error) {
      console.log(error);
      toast.error("Error al iniciar la llamada");
      setIsCalling(false);
    }
  };

  const handleStartCall = async () => {
    // Verificar si el usuario ya aceptó los términos
    if (!hasAcceptedCallCosts()) {
      setShowCostModal(true);
      return;
    }

    // Si ya aceptó, proceder con la llamada
    await startCallProcess();
  };

  const handleAcceptCosts = async () => {
    // Guardar la aceptación en cookies
    setCookie("vapi_call_costs_accepted", "true", 365); // Cookie válida por 1 año
    setShowCostModal(false);

    // Proceder con la llamada
    await startCallProcess();

    toast.success("Términos aceptados. Iniciando llamada...");
  };

  const handleCloseCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi || !activeCall) return;

    try {
      await vapi.stop();
      setActiveCall(false);
    } catch {
      toast.error("Error al cerrar la llamada");
    }
  };

  return (
    <>
      <Button
        className={`bg-gradient-to-r from-black via-emerald-900 to-black border border-emerald-500/30 hover:border-emerald-400/50 shadow-lg ${
          activeCall
            ? "shadow-emerald-500/60 animate-pulse-shadow"
            : "shadow-emerald-500/25 hover:shadow-emerald-500/40"
        }`}
        onClick={activeCall ? handleCloseCall : handleStartCall}
        disabled={isCalling === true}
      >
        <Phone
          className={`h-4 w-4 mr-2 ${activeCall ? "animate-pulse" : ""}`}
        />
        {isCalling
          ? activeCall
            ? "Cerrar llamada"
            : "Iniciar llamada"
          : activeCall
            ? "Finalizar llamada"
            : "Hablar con el agente"}
      </Button>

      {/* Modal de confirmación de costos */}
      <Dialog open={showCostModal} onOpenChange={setShowCostModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmación de Costos
            </DialogTitle>
            <DialogDescription className="text-left space-y-3">
              <p>
                <strong>Importante:</strong> Las llamadas de prueba también
                tienen un costo en créditos y no están exentas de cargos.
              </p>
              <p>
                Al continuar, confirmas que entiendes que esta llamada consumirá
                créditos de tu cuenta.
              </p>
              <p className="text-sm text-muted-foreground">
                Si aceptas esta confirmación no se te volverá a mostrar este
                mensaje.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCostModal(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAcceptCosts}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              Acepto y continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StartCall;
