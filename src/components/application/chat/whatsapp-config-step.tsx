"use client"

import { MessageSquare, Phone, Key, Hash, Info, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Definir el tipo inline
type WhatsAppConfigStepProps = {
  formData: {
    whatsappBusinessId: string
    apiKey: string
    phoneNumber: string
    phoneNumberId: string
    wompiEventsKey: string
    wompiPrivateKey: string
  }
  updateFormData: (data: Partial<WhatsAppConfigStepProps["formData"]>) => void
}

export default function WhatsAppConfigStep({ formData, updateFormData }: WhatsAppConfigStepProps) {
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
            <h3 className="font-medium text-green-600">Configuración de WhatsApp Business API</h3>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>WhatsApp Business API</strong> te permite integrar WhatsApp como canal de comunicación oficial con
              tus clientes. A través de esta API podrás enviar y recibir mensajes, automatizar respuestas, y gestionar
              conversaciones de manera profesional y escalable.
            </p>

            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                ¿No tienes acceso a WhatsApp Business API?
              </p>
              <p className="text-green-700 dark:text-green-300 mb-2">
                Para obtener acceso a WhatsApp Business API y configurar tu cuenta, sigue este tutorial completo:
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
                onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Este es el número de teléfono asociado a tu cuenta de WhatsApp Business. Debe incluir el código de país
                (ej: +57 para Colombia).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumberId" className="flex items-center gap-1">
                <Hash size={16} />
                ID del Número de Teléfono
              </Label>
              <Input
                id="phoneNumberId"
                placeholder="Ej: 123456789012345"
                value={formData.phoneNumberId || ""}
                onChange={(e) => updateFormData({ phoneNumberId: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Identificador único del número de teléfono en WhatsApp Business API. Lo encuentras en el panel de Meta
                for Developers, en la sección "WhatsApp" → "Configuración".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappBusinessId" className="flex items-center gap-1">
                <Hash size={16} />
                ID de WhatsApp Business
              </Label>
              <Input
                id="whatsappBusinessId"
                placeholder="Ej: 987654321098765"
                value={formData.whatsappBusinessId || ""}
                onChange={(e) => updateFormData({ whatsappBusinessId: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Identificador de tu cuenta de WhatsApp Business. Se encuentra en el panel de Meta for Developers, en
                "WhatsApp" → "Configuración" → "ID de la cuenta comercial de WhatsApp".
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
                Token de acceso permanente para WhatsApp Business API. Lo generas en Meta for Developers → "WhatsApp" →
                "Configuración" → "Tokens de acceso".
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
              <strong>Wompi</strong> es la pasarela de pagos que permitirá a tus clientes realizar todos los pagos de
              manera segura y confiable. A través de esta integración, podrás procesar pagos con tarjetas de crédito,
              débito, PSE y otros métodos de pago disponibles en Colombia.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">¿No tienes una cuenta en Wompi?</p>
              <p className="text-blue-700 dark:text-blue-300 mb-2">
                Si aún no tienes una cuenta en Wompi, puedes crear una siguiendo este tutorial paso a paso:
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
              <Label htmlFor="wompiEventsKey" className="flex items-center gap-1">
                <Info size={16} />
                Clave de Eventos de Wompi
              </Label>
              <Input
                id="wompiEventsKey"
                placeholder="Ej: prod_events_..."
                value={formData.wompiEventsKey}
                onChange={(e) => updateFormData({ wompiEventsKey: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Esta clave se encuentra en el panel de administración de Wompi, en la sección de "Desarrolladores" →
                "Pagos a Terceros". Asegúrate de copiar la clave que comienza con{" "}
                <code className="bg-muted px-1 py-0.5 rounded">prv_events_</code> o{" "}
                <code className="bg-muted px-1 py-0.5 rounded">test_events_</code> según tu ambiente.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wompiPrivateKey" className="flex items-center gap-1">
                <Info size={16} />
                Clave Privada de Wompi <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wompiPrivateKey"
                type="password"
                placeholder="Ej: prv_prod_... o prv_test_..."
                value={formData.wompiPrivateKey}
                onChange={(e) => updateFormData({ wompiPrivateKey: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Esta es tu clave privada de Wompi que se utiliza para procesar los pagos. La encuentras en el mismo
                panel de administración, en "Desarrolladores" → "API Keys".
                <strong className="text-orange-600 dark:text-orange-400">
                  {" "}
                  Mantén esta clave segura y nunca la compartas públicamente.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
