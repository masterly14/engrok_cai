'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button'; // Suponiendo que usas ShadCN UI
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"

// Declara las propiedades de la ventana global para TypeScript
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

const WhatsAppConnectButton = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) {
      setSdkLoaded(true);
      return;
    }
    
    // Define la función de inicialización del SDK en la ventana global
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v20.0',
      });
      setSdkLoaded(true);
    };
    
    // Carga el SDK de forma asíncrona
    (function (d, s, id) {
      let js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s) as HTMLScriptElement; js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs?.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

  }, []);

  const handleFacebookLogin = () => {
    if (!sdkLoaded) {
      console.error("Facebook SDK no se ha cargado todavía.");
      return;
    }
    
    setIsLoading(true);

    window.FB.login(
      (response: any) => {
        if (response.authResponse && response.authResponse.code) {
          console.log('Código de autorización obtenido:', response.authResponse.code);
          // Envía el código a tu backend
          exchangeCodeForToken(response.authResponse.code);
        } else {
          console.log('El usuario canceló el login o no autorizó completamente.');
          setIsLoading(false);
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          session_info_version: '2',
        },
      }
    );
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      const response = await fetch('/api/meta/whatsapp/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('¡Conexión exitosa!', data);
        setConnectedPhone(data.phoneNumber ?? null);
        setShowSuccessDialog(true);
      } else {
        throw new Error(data.error || 'Falló el intercambio de código');
      }
    } catch (error) {
      console.error('Error al conectar la cuenta:', error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleFacebookLogin} 
        disabled={!sdkLoaded || isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLoading ? 'Conectando...' : 'Conectar Cuenta de WhatsApp'}
      </Button>
      <AlertDialog open={showSuccessDialog} onOpenChange={(open) => { if (!open) window.location.reload(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Línea conectada con éxito!</AlertDialogTitle>
            <AlertDialogDescription>
              Ya puedes enviar un mensaje de WhatsApp a tu nueva línea para verificar que el agente esté funcionando correctamente.
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
            <AlertDialogAction onClick={() => window.location.reload()}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WhatsAppConnectButton;
