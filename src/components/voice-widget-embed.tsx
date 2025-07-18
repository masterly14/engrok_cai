"use client";

import { useEffect } from "react";

interface VoiceWidgetEmbedProps {
  agentId?: string;
}

// Componente que inyecta el widget de ElevenLabs de forma global.
// Si el script ya existe, evita duplicarlo.
export default function VoiceWidgetEmbed({ agentId }: VoiceWidgetEmbedProps) {
  useEffect(() => {
    if (!agentId) return;

    // Evitar añadir el script varias veces
    if (!document.getElementById("elevenlabs-convai-script")) {
      const script = document.createElement("script");
      script.id = "elevenlabs-convai-script";
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }
  }, [agentId]);

  if (!agentId) return null;

  // El custom element se renderiza directamente; el script se encargará de inicializarlo.
  // Colocamos el widget sin estilos adicionales para que respete su posición (bottom-right por defecto).
  // Nota: tailwind/estilos globales no afectarán al widget puesto que viene encapsulado.
  return <elevenlabs-convai agent-id={agentId}></elevenlabs-convai> as any;
} 