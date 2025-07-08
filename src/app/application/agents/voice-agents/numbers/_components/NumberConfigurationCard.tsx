"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Lock, Building2 } from "lucide-react";
import Image from "next/image";

interface FormData {
  name: string;
  number: string;
  provider: string;
  credentialId?: string;
  twilioAccountId?: string;
  twilioAuthToken?: string;
  numberDesiredAreaCode?: string;
  sipUri?: string;
  sipUsername?: string;
  sipPassword?: string;
  [key: string]: any;
}

interface ProviderOption {
  value: string;
  label: string;
  image: string | null;
  imageSize: { width: number; height: number };
}

interface Props {
  isCreatingNew: boolean;
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string) => void;
}

const providers: ProviderOption[] = [
  {
    value: "telnyx",
    label: "Telnyx",
    image: "/telnyx.webp",
    imageSize: { width: 24, height: 24 },
  },
  {
    value: "twilio",
    label: "Twilio",
    image: "/twilio.png",
    imageSize: { width: 24, height: 24 },
  },
  {
    value: "vonage",
    label: "Vonage",
    image: "/vonage.png",
    imageSize: { width: 24, height: 24 },
  },
  {
    value: "vapi",
    label: "Vapi",
    image: "/vapi.svg",
    imageSize: { width: 24, height: 24 },
  },
  {
    value: "byo-phone-number",
    label: "BYO Phone Number",
    image: null,
    imageSize: { width: 24, height: 24 },
  },
];

const NumberConfigurationCard: React.FC<Props> = ({
  isCreatingNew,
  formData,
  handleInputChange,
}) => {
  return (
    <Card className="shadow-sm bg-white">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Info className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900">
              Configuración del número
            </CardTitle>
            <CardDescription className="text-slate-600">
              Configura la información principal de tu número de teléfono
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-slate-900"
            >
              Nombre del número
            </Label>
            <Input
              id="name"
              placeholder="Nombre del número"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label
              htmlFor="provider"
              className="text-sm font-medium text-slate-900 flex items-center gap-2"
            >
              Proveedor de servicios
              {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
            </Label>
            <Badge
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
            >
              <Info className="h-4 w-4" />
            </Badge>
          </div>
          <Select
            value={formData.provider}
            onValueChange={(value) => handleInputChange("provider", value)}
            disabled={!isCreatingNew}
          >
            <SelectTrigger
              className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
              }`}
            >
              <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent className="border-slate-200">
              {providers.map((provider) => (
                <SelectItem
                  key={provider.value}
                  value={provider.value}
                  className="py-3"
                >
                  <div className="flex items-center gap-3">
                    {provider.image ? (
                      <Image
                        width={provider.imageSize.width}
                        height={provider.imageSize.height}
                        src={provider.image}
                        alt={provider.label}
                        className="rounded"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100">
                        <Building2 className="h-4 w-4 text-slate-600" />
                      </div>
                    )}
                    <span className="font-medium text-slate-900">
                      {provider.label}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic provider fields */}
        {(formData.provider === "telnyx" ||
          formData.provider === "vonage" ||
          formData.provider === "byo-phone-number") && (
          <div className="space-y-3">
            <Label
              htmlFor="credentialId"
              className="text-sm font-medium text-slate-900 flex items-center gap-2"
            >
              Credential ID
              {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
            </Label>
            <Input
              id="credentialId"
              placeholder="Ingresa tu Credential ID"
              value={formData.credentialId}
              onChange={(e) =>
                handleInputChange("credentialId", e.target.value)
              }
              readOnly={!isCreatingNew}
              className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
              }`}
            />
          </div>
        )}

        {formData.provider === "twilio" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label
                htmlFor="twilioAccountSid"
                className="text-sm font-medium text-slate-900 flex items-center gap-2"
              >
                Account SID
                {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
              </Label>
              <Input
                id="twilioAccountSid"
                placeholder="Account SID de Twilio"
                value={formData.twilioAccountId}
                onChange={(e) =>
                  handleInputChange("twilioAccountSid", e.target.value)
                }
                readOnly={!isCreatingNew}
                className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                  !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="twilioAuthToken"
                className="text-sm font-medium text-slate-900 flex items-center gap-2"
              >
                Auth Token
                {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
              </Label>
              <Input
                id="twilioAuthToken"
                placeholder="Auth Token de Twilio"
                value={formData.twilioAuthToken}
                onChange={(e) =>
                  handleInputChange("twilioAuthToken", e.target.value)
                }
                readOnly={!isCreatingNew}
                className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                  !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
        )}

        {formData.provider === "vapi" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label
                htmlFor="numberDesiredAreaCode"
                className="text-sm font-medium text-slate-900 flex items-center gap-2"
              >
                Código de área
                {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
              </Label>
              <Input
                id="numberDesiredAreaCode"
                placeholder="Código de área deseado"
                value={formData.numberDesiredAreaCode}
                onChange={(e) =>
                  handleInputChange("numberDesiredAreaCode", e.target.value)
                }
                readOnly={!isCreatingNew}
                className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                  !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="sipUri"
                className="text-sm font-medium text-slate-900 flex items-center gap-2"
              >
                URI de SIP
                {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
              </Label>
              <Input
                id="sipUri"
                placeholder="URI de SIP"
                value={formData.sipUri}
                onChange={(e) => handleInputChange("sipUri", e.target.value)}
                readOnly={!isCreatingNew}
                className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                  !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="sipUsername"
                className="text-sm font-medium text-slate-900 flex items-center gap-2"
              >
                Username de SIP
                {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
              </Label>
              <Input
                id="sipUsername"
                placeholder="Username de SIP"
                value={formData.sipUsername}
                onChange={(e) =>
                  handleInputChange("sipUsername", e.target.value)
                }
                readOnly={!isCreatingNew}
                className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                  !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="sipPassword"
                className="text-sm font-medium text-slate-900 flex items-center gap-2"
              >
                Password de SIP
                {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
              </Label>
              <Input
                id="sipPassword"
                type="password"
                placeholder="Password de SIP"
                value={formData.sipPassword}
                onChange={(e) =>
                  handleInputChange("sipPassword", e.target.value)
                }
                readOnly={!isCreatingNew}
                className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
                  !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label
            htmlFor="number"
            className="text-sm font-medium text-slate-900 flex items-center gap-2"
          >
            Número de teléfono
            {!isCreatingNew && <Lock className="h-4 w-4 text-slate-400" />}
          </Label>
          <Input
            id="number"
            placeholder="Ej: +1234567890"
            value={formData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            readOnly={!isCreatingNew}
            className={`h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-200 ${
              !isCreatingNew ? "bg-slate-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberConfigurationCard;
