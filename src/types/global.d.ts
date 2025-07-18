interface Window {
  openVoiceAgentTemplateDialog?: () => void;
}

// Permitir el uso del custom element <elevenlabs-convai agent-id="..." />
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "agent-id"?: string;
      };
    }
  }
}

export {};
