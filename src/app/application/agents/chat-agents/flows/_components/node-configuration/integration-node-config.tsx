"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  Link2,
  Settings,
  Save,
} from "lucide-react"
import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import {
  connectIntegrationAccount,
  validateIntegrationUser,
  validateWompiIntegrationUser,
  validateAndSaveWompiCredentials,
} from "@/actions/integrations"
import { toast } from "sonner"
import Image from "next/image"
import IntegrationComponent from "@/components/nango/integrationComponent"
import { GoogleCalendarActionConfig } from "./google-calendar-action-config"

type Props = {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
  workflowId: string
}

const availableIntegrations = [
  {
    id: "wompi",
    name: "Wompi",
    description: "Procesa pagos y genera enlaces de pago",
    className: "hover:border-green-500 hover:bg-green-50/50 transition-all duration-200",
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    provider: "WOMPI",
    img: "/integrations-logos-providers/wompi.jpg",
    color: "green",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Integra con Google Calendar para obtener disponibilidad de horarios y crear eventos.",
    className: "hover:border-green-500 hover:bg-green-50/50 transition-all duration-200",
    icon: <Calendar className="w-5 h-5 text-green-600" />,
    provider: "GOOGLE_CALENDAR",
    img: "/integrations-logos-providers/google-calendar.png",
    color: "green",
  }
]

const IntegrationNodeConfig = ({ selectedNode, updateNode, workflowId }: Props) => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    selectedNode.data.provider || null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [wompiPublicKey, setWompiPublicKey] = useState<string>("")
  const [wompiPrivateKey, setWompiPrivateKey] = useState<string>("")
  const [wompiEventToken, setWompiEventToken] = useState<string>("")

  const nodeData = selectedNode.data

  const [linkName, setLinkName] = useState<string>(nodeData.fields?.name || "")
  const [linkDescription, setLinkDescription] = useState<string>(nodeData.fields?.description || "")
  const [amountInCents, setAmountInCents] = useState<number>(nodeData.fields?.amount_in_cents || 0)
  const [currency, setCurrency] = useState<string>(nodeData.fields?.currency || "USD")
  const [redirectUrl, setRedirectUrl] = useState<string>(nodeData.fields?.redirect_url || "")
  const [saveResponseTo, setSaveResponseTo] = useState<string>(nodeData.saveResponseTo || "paymentLinkUrl")
  const [botResponse, setBotResponse] = useState<string>(
    nodeData.botResponse || "Aquí tienes tu link de pago: {{paymentLinkUrl}}"
  )

  useEffect(() => {
    if (selectedIntegration) {
      handleIntegrationSelect(selectedIntegration)
    }
  }, [])

  const handleIntegrationSelect = async (provider: string) => {
    setSelectedIntegration(provider)
    setIsLoading(true)

    try {
      if (provider === "WOMPI") {
        const validateWompiIntegration = await validateWompiIntegrationUser()
        if (validateWompiIntegration.isConnected) {
          toast.success("Integración validada correctamente")
          setIsConnected(true)
          setSelectedIntegration(validateWompiIntegration.provider)
        } else {
          toast.error(`Conecta tu cuenta de ${provider} para continuar`)
          setIsConnected(false)
        }
      } else {
        const validateIntegration = await validateIntegrationUser(provider)
        setUserId(validateIntegration.userId)
        if (validateIntegration.isConnected) {
          toast.success("Integración validada correctamente")
          setIsConnected(true)
          setSelectedIntegration(validateIntegration.provider)
        } else {
          toast.error(`Conecta tu cuenta de ${provider} para continuar`)
          setIsConnected(false)
        }
      }
    } catch (error) {
      toast.error("Error al validar la integración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectAccount = async (provider: string) => {
    setIsLoading(true)
    try {
      const connectAccount = await connectIntegrationAccount(provider, userId!, workflowId)
      if (connectAccount?.redirectUrl) {
        window.location.href = connectAccount.redirectUrl
      } else {
        toast.error("Error al conectar la cuenta")
      }
    } catch (error) {
      toast.error("Error al conectar la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateWompi = async () => {
    if (!wompiPublicKey || !wompiPrivateKey || !wompiEventToken) {
      toast.error("Por favor, completa todos los campos para continuar")
      return
    }

    setIsLoading(true)
    try {
      const result = await validateAndSaveWompiCredentials(wompiPublicKey, wompiPrivateKey, wompiEventToken)
      if (result.success) {
        toast.success("Wompi conectada correctamente")
        setIsConnected(true)
      } else {
        toast.error(result.error || "Error al validar Wompi")
      }
    } catch (error) {
      toast.error("Error inesperado al validar Wompi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWompiConfig = () => {
    if (!saveResponseTo || !botResponse) {
      toast.error("Por favor, completa los campos de 'Guardar respuesta' y 'Mensaje de respuesta'")
      return
    }

    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        name: "Generar Link Wompi",
        type: "integration",
        provider: "WOMPI",
        action: "CREATE_PAYMENT_LINK",
        fields: {
          name: linkName,
          description: linkDescription,
          amount_in_cents: amountInCents,
          currency: currency,
          redirect_url: redirectUrl,
          collect_shipping: false,
        },
        saveResponseTo: saveResponseTo,
        botResponse: botResponse,
        statusSuccess: "success",
        statusError: "error",
      },
    })
    toast.success("Configuración de Wompi guardada en el nodo.")
  }

  const getSelectedIntegrationData = () => {
    return availableIntegrations.find((int) => int.provider === selectedIntegration)
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Procesando...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Configuración de Integración</h3>
        </div>
        <p className="text-sm text-muted-foreground">Selecciona y configura un servicio de integración para tu flujo</p>
      </div>

      {/* Integration Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Integraciones Disponibles</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedIntegration === integration.provider
                  ? "ring-2 ring-primary border-primary"
                  : integration.className
              }`}
              onClick={() => handleIntegrationSelect(integration.provider)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Image
                      src={integration.img || "/placeholder.svg"}
                      alt={integration.name}
                      width={32}
                      height={32}
                      className="rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {integration.icon}
                      <h4 className="font-medium text-sm">{integration.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Connection Status & Configuration */}
      {selectedIntegration && (
        <>
          <Separator />

          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getSelectedIntegrationData()?.icon}
                <h4 className="font-medium">{getSelectedIntegrationData()?.name}</h4>
              </div>
              {isConnected !== null && (
                <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      No Conectado
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Configuration Content */}
          {isConnected === true ? (
            selectedIntegration === "WOMPI" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="w-4 h-4" />
                    Configurar Generación de Enlace de Pago
                  </CardTitle>
                  <CardDescription>
                    Define los parámetros para el enlace de pago. Puedes usar variables como {"{{nombreVariable}}"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkName">Nombre del Producto</Label>
                      <Input
                        id="linkName"
                        placeholder="e.g., Suscripción Premium"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moneda</Label>
                      <Input
                        id="currency"
                        placeholder="USD, COP, EUR, etc."
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkDescription">Descripción</Label>
                    <Input
                      id="linkDescription"
                      placeholder="Breve descripción del producto o servicio"
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto (en centavos)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g., 1000 para $10.00"
                      value={amountInCents || ""}
                      onChange={(e) => setAmountInCents(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">Ingresa el monto en la menor unidad. Puedes usar una variable como {"{{monto}}"} </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl">URL de Redirección de Éxito</Label>
                    <Input
                      id="redirectUrl"
                      type="url"
                      placeholder="https://yoursite.com/success"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                    />
                  </div>
                  
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="saveResponseTo">Guardar URL del link en la variable</Label>
                    <Input
                      id="saveResponseTo"
                      placeholder="paymentLinkUrl"
                      value={saveResponseTo}
                      onChange={(e) => setSaveResponseTo(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="botResponse">Mensaje de respuesta para el usuario</Label>
                    <Input
                      id="botResponse"
                      placeholder="Tu link de pago: {{paymentLinkUrl}}"
                      value={botResponse}
                      onChange={(e) => setBotResponse(e.target.value)}
                    />
                     <p className="text-xs text-muted-foreground">Usa la variable que definiste arriba para insertar el link dinámicamente.</p>
                  </div>


                  <Button onClick={handleSaveWompiConfig} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Guardar Configuración
                  </Button>
                </CardContent>
              </Card>
            ) : selectedIntegration === "GOOGLE_CALENDAR" ? (
              <GoogleCalendarActionConfig selectedNode={selectedNode} updateNode={updateNode} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuración de Integración</CardTitle>
                  <CardDescription>Configura tu integración con {getSelectedIntegrationData()?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Configuración de integración para {getSelectedIntegrationData()?.name}</p>
                </CardContent>
              </Card>
            )
          ) : isConnected === false ? (
            selectedIntegration === "WOMPI" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Key className="w-4 h-4" />
                    Conecta tu cuenta de Wompi
                  </CardTitle>
                  <CardDescription>Ingresa tus credenciales de Wompi para establecer la conexión</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="publicKey">Clave Pública</Label>
                    <Input
                      id="publicKey"
                      placeholder="pub_test_..."
                      value={wompiPublicKey}
                      onChange={(e) => setWompiPublicKey(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Clave Privada</Label>
                    <Input
                      id="privateKey"
                      type="password"
                      placeholder="prv_test_..."
                      value={wompiPrivateKey}
                      onChange={(e) => setWompiPrivateKey(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventToken">Token de Evento</Label>
                    <Input
                      id="eventToken"
                      type="password"
                      placeholder="Event webhook token"
                      value={wompiEventToken}
                      onChange={(e) => setWompiEventToken(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleValidateWompi}
                    className="w-full"
                    disabled={!wompiPublicKey || !wompiPrivateKey || !wompiEventToken}
                  >
                    Validar y Conectar
                  </Button>
                </CardContent>
              </Card>
            ) : selectedIntegration === "GOOGLE_CALENDAR" ? (
              <IntegrationComponent
                setIntegrationConnection={(connected) => {
                  setIsConnected(connected)
                  if (connected) {
                    toast.success("Cuenta de Google Calendar conectada exitosamente!")
                  }
                }}
                visibleName="Google Calendar"
                providerConfigKey="google-calendar"
                authMode="O_AUTH2"
                nodeId={selectedNode.id}
                updateNode={updateNode}
                _selectedNode={selectedNode}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conexión de Cuenta Requerida</CardTitle>
                  <CardDescription>
                    Conecta tu cuenta de {getSelectedIntegrationData()?.name} para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleConnectAccount(selectedIntegration!)} className="w-full">
                    Conectar Cuenta
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium">No se ha seleccionado ninguna integración</p>
                    <p className="text-sm text-muted-foreground">
                      Por favor, selecciona una integración de la lista de arriba.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default IntegrationNodeConfig
