"use client";

import { MessageSquare, Phone, Key, Globe, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TwilioCredentialsForm } from "@/components/application/agents/twilio-credentials-form";
import { useState } from "react";

// Definir el tipo inline
type WhatsAppConfigStepProps = {
  formData: {
    whatsappBusinessId: string;
    apiKey: string;
    webhookUrl: string;
    phoneNumber: string;
    phoneNumberId: string;
  };
  updateFormData: (data: Partial<WhatsAppConfigStepProps["formData"]>) => void;
};

export default function WhatsAppConfigStep({
  formData,
  updateFormData,
}: WhatsAppConfigStepProps) {
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    isVerified: false,
    message: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <MessageSquare size={24} />
        <h2 className="text-xl font-semibold">Configuración de WhatsApp</h2>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-1" htmlFor="phoneNumber">
            Número de Teléfono
          </Label>
          <Phone size={16} />
          <Input
            id="phoneNumber"
            placeholder="Número de Teléfono"
            value={formData.phoneNumber || ""}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumberId" className="flex items-center gap-1">
            <Hash size={16} />
            ID del Número de Teléfono
          </Label>
          <Input
            id="phoneNumberId"
            placeholder="ID del Número de Teléfono"
            value={formData.phoneNumberId || ""}
            onChange={(e) => updateFormData({ phoneNumberId: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="whatsappBusinessId"
            className="flex items-center gap-1"
          >
            <Hash size={16} />
            ID de WhatsApp Business
          </Label>
          <Input
            id="whatsappBusinessId"
            placeholder="ID de WhatsApp Business"
            value={formData.whatsappBusinessId || ""}
            onChange={(e) =>
              updateFormData({ whatsappBusinessId: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="flex items-center gap-1">
            <Key size={16} />
            Clave API
          </Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Clave API de WhatsApp"
            value={formData.apiKey || ""}
            onChange={(e) => updateFormData({ apiKey: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookUrl" className="flex items-center gap-1">
            <Globe size={16} />
            URL del Webhook
          </Label>
          <Input
            id="webhookUrl"
            placeholder="https://ejemplo.com/webhook"
            value={formData.webhookUrl || ""}
            onChange={(e) => updateFormData({ webhookUrl: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
