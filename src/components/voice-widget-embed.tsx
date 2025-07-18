"use client";

import { useEffect, useRef } from "react";

interface VoiceWidgetEmbedProps {
  agentId?: string;
}

export default function VoiceWidgetEmbed({ agentId }: VoiceWidgetEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!agentId || !iframeRef.current) return;

    // HTML que se inyectará dentro del iframe
    const iframeHtml = `<!DOCTYPE html>
      <html lang="en">
        <head><meta charset="utf-8" /></head>
        <body style="margin:0;">
          <elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>
          <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
        </body>
      </html>`;

    // Establecemos el HTML en el iframe
    iframeRef.current.srcdoc = iframeHtml;
  }, [agentId]);

  if (!agentId) return null;

  return (
    <iframe
      ref={iframeRef}
      title="ElevenLabs Voice Widget"
      style={{
        border: "none",
        position: "fixed",
        bottom: 0,
        right: 0,
        width: "360px",
        height: "420px",
        zIndex: 2147483647,
      }}
    />
  );
} 