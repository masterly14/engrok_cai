"use client";

import { useState } from "react";
import {
  MessageSquare,
  Phone,
  Key,
  Hash,
  Info,
  ExternalLink,
  Shield,
  Copy,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { finishSetupServer } from "@/actions/chat-agents";

// Definir el tipo inline
type WhatsAppConfigStepProps = {
  formData: {
    whatsappBusinessId: string;
    apiKey: string;
    phoneNumber: string;
    phoneNumberId: string;
    wompiEventsKey: string;
    wompiPrivateKey: string;
    webhookSecretKey?: string;
  };
  updateFormData: (data: Partial<WhatsAppConfigStepProps["formData"]>) => void;
  agentCreated?: boolean;
  createdAgentId?: string | null;
};

export default function WhatsAppConfigStep({
  formData,
  updateFormData,
  agentCreated = false,
  createdAgentId,
}: WhatsAppConfigStepProps) {
  const [secretKeyGenerated, setSecretKeyGenerated] = useState(
    !!formData.webhookSecretKey
  );
  const [copied, setCopied] = useState(false);

  const generateSecretKey = async () => {
    // Generate a secure random string with letters and numbers
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const secretKey = `whsk_${result}`;
    updateFormData({ webhookSecretKey: secretKey });
    if (createdAgentId) {
      await finishSetupServer(createdAgentId, secretKey);
    }
    setSecretKeyGenerated(true);
  };

  const copyToClipboard = async () => {
    if (formData.webhookSecretKey) {
      await navigator.clipboard.writeText(formData.webhookSecretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Si el agente está creado, solo mostramos la configuración del webhook
  if (agentCreated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary mb-4">
          <Shield size={24} />
          <h2 className="text-xl font-semibold">Configuración del Webhook</h2>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-purple-600" />
            <h3 className="font-medium text-purple-600">
              Configuración de Seguridad de Webhooks
            </h3>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>¿Qué es una Secret Key para Webhooks?</strong>
            </p>
            <p>
              Una Secret Key (clave secreta) es un token de seguridad que se
              utiliza para verificar que los webhooks que recibes realmente
              provienen de WhatsApp y no de un tercero malicioso. Esta clave se
              usa para crear una firma digital (HMAC) que acompaña cada webhook,
              permitiendo a tu aplicación validar la autenticidad del mensaje.
            </p>

            <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-md border border-purple-200 dark:border-purple-800">
              <p className="text-purple-800 dark:text-purple-200 font-medium mb-2">
                ¿Por qué es importante?
              </p>
              <ul className="text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                <li>
                  Protege tu aplicación contra ataques de falsificación de
                  webhooks
                </li>
                <li>
                  Garantiza que solo WhatsApp puede enviar datos a tu endpoint
                </li>
                <li>Cumple con las mejores prácticas de seguridad para APIs</li>
                <li>
                  Es requerido por WhatsApp para validar la integridad de los
                  datos
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                URL del Webhook
              </p>
              <p className="text-amber-700 dark:text-amber-300 mb-2">
                Tu webhook debe apuntar a la siguiente URL:
              </p>
              <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 p-2 rounded border">
                <code className="text-amber-800 dark:text-amber-200 font-mono text-sm flex-1">
                  https://www.karolai.co/api/meta/whatsapp/webhook
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      "https://www.karolai.co/api/meta/webhook"
                    )
                  }
                  className="shrink-0"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Shield size={16} />
                Secret Key para Webhooks{" "}
                <span className="text-destructive">*</span>
              </Label>

              {!secretKeyGenerated ? (
                <div className="space-y-3">
                  <Button
                    onClick={generateSecretKey}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Key size={16} className="mr-2" />
                    Generar Secret Key
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en el botón para generar automáticamente una clave
                    secreta segura de 32 caracteres.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={formData.webhookSecretKey || ""}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cómo configurar el webhook en WhatsApp:</strong>
                      <ol className="mt-2 space-y-1 list-decimal list-inside text-sm">
                        <li>Ve a tu panel de Meta for Developers</li>
                        <li>Navega a WhatsApp → Configuración → Webhooks</li>
                        <li>
                          En "Callback URL", ingresa:{" "}
                          <code className="bg-muted px-1 py-0.5 rounded">
                            https://www.karolai.co/api/meta/webhook
                          </code>
                        </li>
                        <li>
                          En "Verify Token", pega la Secret Key generada arriba
                        </li>
                        <li>
                          Selecciona los eventos que quieres recibir (messages,
                          message_deliveries, etc.)
                        </li>
                        <li>Haz clic en "Verificar y guardar"</li>
                      </ol>
                      <p className="mt-2 text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Asegúrate de que tanto la URL como la Secret Key
                        estén configuradas correctamente para que el webhook
                        funcione.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si el agente no está creado, mostramos la configuración de WhatsApp y Wompi
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <MessageSquare size={24} />
        <h2 className="text-xl font-semibold">Configuración Técnica</h2>
      </div>

      <div className="space-y-6">
        {/* Sección de configuración de WhatsApp */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-green-600" />
            <h3 className="font-medium text-green-600">
              Configuración de WhatsApp Business API
            </h3>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>WhatsApp Business API</strong> te permite integrar
              WhatsApp como canal de comunicación oficial con tus clientes. A
              través de esta API podrás enviar y recibir mensajes, automatizar
              respuestas, y gestionar conversaciones de manera profesional y
              escalable.
            </p>

            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                ¿No tienes acceso a WhatsApp Business API?
              </p>
              <p className="text-green-700 dark:text-green-300 mb-2">
                Para obtener acceso a WhatsApp Business API y configurar tu
                cuenta, sigue este tutorial completo:
              </p>
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium underline"
              >
                Ver tutorial de configuración
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1" htmlFor="phoneNumber">
                <Phone size={16} />
                Número de Teléfono
              </Label>
              <Input
                id="phoneNumber"
                placeholder="Ej: +57 300 123 4567"
                value={formData.phoneNumber || ""}
                onChange={(e) =>
                  updateFormData({ phoneNumber: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Este es el número de teléfono asociado a tu cuenta de WhatsApp
                Business. Debe incluir el código de país (ej: +57 para
                Colombia).
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phoneNumberId"
                className="flex items-center gap-1"
              >
                <Hash size={16} />
                ID del Número de Teléfono
              </Label>
              <Input
                id="phoneNumberId"
                placeholder="Ej: 123456789012345"
                value={formData.phoneNumberId || ""}
                onChange={(e) =>
                  updateFormData({ phoneNumberId: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Identificador único del número de teléfono en WhatsApp Business
                API. Lo encuentras en el panel de Meta for Developers, en la
                sección "WhatsApp" → "Configuración".
              </p>
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
                placeholder="Ej: 987654321098765"
                value={formData.whatsappBusinessId || ""}
                onChange={(e) =>
                  updateFormData({ whatsappBusinessId: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Identificador de tu cuenta de WhatsApp Business. Se encuentra en
                el panel de Meta for Developers, en "WhatsApp" → "Configuración"
                → "ID de la cuenta comercial de WhatsApp".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-1">
                <Key size={16} />
                Token de Acceso <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Ej: EAABsBCS1234..."
                value={formData.apiKey || ""}
                onChange={(e) => updateFormData({ apiKey: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Token de acceso permanente para WhatsApp Business API. Lo
                generas en Meta for Developers → "WhatsApp" → "Configuración" →
                "Tokens de acceso".
                <strong className="text-orange-600 dark:text-orange-400">
                  {" "}
                  Mantén este token seguro y nunca lo compartas públicamente.
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Sección de configuración de Wompi */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-primary" />
            <h3 className="font-medium text-primary">Configuración de Wompi</h3>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Wompi</strong> es la pasarela de pagos que permitirá a tus
              clientes realizar todos los pagos de manera segura y confiable. A
              través de esta integración, podrás procesar pagos con tarjetas de
              crédito, débito, PSE y otros métodos de pago disponibles en
              Colombia.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                ¿No tienes una cuenta en Wompi?
              </p>
              <p className="text-blue-700 dark:text-blue-300 mb-2">
                Si aún no tienes una cuenta en Wompi, puedes crear una siguiendo
                este tutorial paso a paso:
              </p>
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium underline"
              >
                Ver tutorial en YouTube
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="wompiEventsKey"
                className="flex items-center gap-1"
              >
                <Info size={16} />
                Clave de Eventos de Wompi
              </Label>
              <Input
                id="wompiEventsKey"
                placeholder="Ej: prod_events_..."
                value={formData.wompiEventsKey}
                onChange={(e) =>
                  updateFormData({ wompiEventsKey: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Esta clave se encuentra en el panel de administración de Wompi,
                en la sección de "Desarrolladores" → "Pagos a Terceros".
                Asegúrate de copiar la clave que comienza con{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  prv_events_
                </code>{" "}
                o{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  test_events_
                </code>{" "}
                según tu ambiente.
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="wompiPrivateKey"
                className="flex items-center gap-1"
              >
                <Info size={16} />
                Clave Privada de Wompi{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wompiPrivateKey"
                type="password"
                placeholder="Ej: prv_prod_... o prv_test_..."
                value={formData.wompiPrivateKey}
                onChange={(e) =>
                  updateFormData({ wompiPrivateKey: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Esta es tu clave privada de Wompi que se utiliza para procesar
                los pagos. La encuentras en el mismo panel de administración, en
                "Desarrolladores" → "API Keys".
                <strong className="text-orange-600 dark:text-orange-400">
                  {" "}
                  Mantén esta clave segura y nunca la compartas públicamente.
                </strong>
              </p>
            </div>
            <div className="space-y-2 mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>URL del Webhook de Pagos:</strong> Esta URL debe ser configurada en tu panel de Wompi para recibir notificaciones de eventos de pago. Ve a "Desarrolladores" → "Webhooks" y configura esta URL para recibir actualizaciones sobre el estado de los pagos.
              </p>
              <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 p-2 rounded border">
                <code className="text-amber-800 dark:text-amber-200 font-mono text-sm flex-1">
                  https://www.karolai.co/api/payments/webhook
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => 
                    navigator.clipboard.writeText(
                      "https://www.karolai.co/api/payments/webhook"
                    )
                  }
                  className="shrink-0"
                >
                  <Copy size={14} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Copia y pega esta URL en tu panel de Wompi.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
