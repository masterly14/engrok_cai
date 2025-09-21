"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

// Declara las propiedades de la ventana global para TypeScript
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const WhatsAppConnectButton = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

  const isLoading = isAuthorizing || isConnecting;

  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) {
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
      setSdkLoaded(true);
    };

    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs?.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFacebookLogin = () => {
    if (!sdkLoaded) {
      console.error("Facebook SDK no se ha cargado todavía.");
      return;
    }

    console.log(
      "Iniciando login de Facebook con configuración de migración..."
    );
    console.log("Config ID:", process.env.NEXT_PUBLIC_META_CONFIG_ID);

    setIsAuthorizing(true);

    window.FB.login(
      (response: any) => {
        setIsAuthorizing(false);
        console.log("Respuesta completa de Facebook:", response);

        if (response.authResponse && response.authResponse.code) {
          console.log( 
            "Código de autorización obtenido:",
            response.authResponse.code
          );
          exchangeCodeForToken(response.authResponse.code);
        } else {
          console.log(
            "El usuario canceló el login o no autorizó completamente."
          );
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '3',
        },
      }
    );
  };

  const exchangeCodeForToken = async (code: string) => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/meta/whatsapp/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("¡Conexión exitosa!", data);
        setConnectedPhone(data.phoneNumber ?? null);
        setShowSuccessDialog(true);
      } else {
        throw new Error(data.error || "Falló el intercambio de código");
      }
    } catch (error) {
      console.error("Error al conectar la cuenta:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <Button onClick={handleFacebookLogin} disabled={!sdkLoaded || isLoading}>
        {isAuthorizing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isAuthorizing ? "Esperando a Meta..." : "Conectar Cuenta de WhatsApp"}
      </Button>

      {/* Modal de Carga Durante la Conexión */}
      <AlertDialog open={isConnecting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Conectando tu cuenta de WhatsApp...
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estamos verificando tu cuenta con Meta y registrando tu número de
              teléfono. Este proceso puede tardar hasta un minuto debido a las
              verificaciones de seguridad.
              <br />
              <br />
              <strong>Por favor, no cierres ni recargues esta página.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Éxito */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          if (!open) window.location.reload();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Línea conectada con éxito!</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  Ya puedes enviar un mensaje de WhatsApp a tu nueva línea para
                  verificar que el agente esté funcionando correctamente.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    📱 Migración de WhatsApp Business
                  </h4>
                  <p className="text-sm text-blue-800">
                    Si migraste una cuenta de WhatsApp Business existente, tus contactos 
                    e historial de mensajes se están sincronizando automáticamente en segundo plano.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>⏱️ Este proceso puede tardar unos minutos en completarse.</strong>
                    <br />
                    Los datos aparecerán gradualmente en tu panel de control.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {connectedPhone && (
            <div className="text-center my-4">
              <Link
                href={`https://wa.me/${connectedPhone.replace(/\D/g, "")}`}
                target="_blank"
                className="font-medium text-blue-600 hover:underline"
              >
                Abrir chat con {connectedPhone}
              </Link>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WhatsAppConnectButton;
