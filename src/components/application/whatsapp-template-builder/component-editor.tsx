"use client"

import React, { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, PlusCircle, Trash2, GripVertical } from "lucide-react"
import type { TemplateComponent, ButtonComponent, HeaderFormat, ExampleValues } from "./types" // Ensure this path is correct
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ComponentEditorProps {
  component: TemplateComponent
  index: number
  updateComponent: (index: number, component: TemplateComponent) => void
  removeComponent: (index: number) => void
  isBody?: boolean // True if this is the mandatory BODY component
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION"
}

const MAX_BODY_MARKETING = 1024
const MAX_BODY_UTILITY = 512 // WhatsApp docs vary, some say 1024 for all, some list per category. Let's use stricter ones.
const MAX_BODY_AUTHENTICATION = 256 // This is usually for OTP messages, often shorter.
const MAX_FOOTER_TEXT = 60
const MAX_QUICK_REPLY_TEXT = 25
const MAX_URL_TEXT = 2000 // For the URL itself. Display text is shorter.

const getBodyMaxLength = (category: ComponentEditorProps["category"]) => {
  switch (category) {
    case "MARKETING":
      return MAX_BODY_MARKETING
    case "UTILITY":
      return MAX_BODY_UTILITY
    case "AUTHENTICATION":
      return MAX_BODY_AUTHENTICATION
    default:
      return MAX_BODY_UTILITY
  }
}

const countPlaceholders = (text = ""): number => {
  const matches = text.match(/\{\{(\d+)\}\}/g)
  return matches ? matches.length : 0
}

const generateEmptyExamples = (count: number): string[] => Array(count).fill("")

export default function ComponentEditor({
  component,
  index,
  updateComponent,
  removeComponent,
  isBody = false,
  category,
}: ComponentEditorProps) {
  const [localComponent, setLocalComponent] = useState<TemplateComponent>(component)

  React.useEffect(() => {
    setLocalComponent(component)
  }, [component])

  const handleFieldChange = (field: keyof TemplateComponent, value: any) => {
    const updated = { ...localComponent, [field]: value }

    if (field === "text" && (updated.type === "BODY" || (updated.type === "HEADER" && updated.format === "TEXT"))) {
      const placeholderCount = countPlaceholders(value as string)
      if (updated.type === "BODY") {
        const currentExamples = updated.example?.body_text?.[0] || []
        if (placeholderCount !== currentExamples.length) {
          updated.example = { ...updated.example, body_text: [generateEmptyExamples(placeholderCount)] }
        }
      } else if (updated.type === "HEADER" && updated.format === "TEXT") {
        const currentExamples = updated.example?.header_text || [""];
        if (placeholderCount !== currentExamples.length) {
          // header_text must always be a tuple of length 1: [string]
          updated.example = { ...updated.example, header_text: [generateEmptyExamples(placeholderCount).join("")] };
        }
      }
    }
    setLocalComponent(updated)
    updateComponent(index, updated)
  }

  const handleButtonChange = (btnIndex: number, field: keyof ButtonComponent, value: any) => {
    const updatedButtons = [...(localComponent.buttons || [])]
    updatedButtons[btnIndex] = { ...updatedButtons[btnIndex], [field]: value }

    // If user switches type to OTP, set default otp_type if absent
    if (field === "type" && value === "OTP") {
      updatedButtons[btnIndex].otp_type = updatedButtons[btnIndex].otp_type || "COPY_CODE"
      // Remove URL/phone fields not relevant
      delete (updatedButtons[btnIndex] as any).url
      delete (updatedButtons[btnIndex] as any).phone_number
      delete (updatedButtons[btnIndex] as any).example
    }

    // If user switches away from OTP, clean otp fields
    if (field === "type" && updatedButtons[btnIndex].type !== "OTP") {
      delete (updatedButtons[btnIndex] as any).otp_type
      delete (updatedButtons[btnIndex] as any).package_name
      delete (updatedButtons[btnIndex] as any).signature_hash
    }

    // If URL changes for a URL button, update its example structure if needed
    if (field === "url" && updatedButtons[btnIndex].type === "URL") {
      const urlPlaceholderCount = countPlaceholders(value as string)
      const currentExample = updatedButtons[btnIndex].example || []
      if (urlPlaceholderCount !== currentExample.length) {
        updatedButtons[btnIndex].example = generateEmptyExamples(urlPlaceholderCount)
      }
    }

    handleFieldChange("buttons", updatedButtons)
  }

  const handleButtonExampleChange = (btnIndex: number, exIndex: number, value: string) => {
    const updatedButtons = [...(localComponent.buttons || [])]
    const buttonToUpdate = updatedButtons[btnIndex]
    if (buttonToUpdate && buttonToUpdate.example) {
      const newExamples = [...buttonToUpdate.example]
      newExamples[exIndex] = value
      buttonToUpdate.example = newExamples
      handleFieldChange("buttons", updatedButtons)
    }
  }

  const addUIButton = () => {
    const newButton: ButtonComponent = { type: "QUICK_REPLY", text: "" }
    const updatedButtons = [...(localComponent.buttons || []), newButton]
    handleFieldChange("buttons", updatedButtons)
  }

  const removeUIButton = (btnIndex: number) => {
    const updatedButtons = (localComponent.buttons || []).filter((_: any, i: number) => i !== btnIndex)
    handleFieldChange("buttons", updatedButtons)
  }

  const handleExampleChange = (
    exampleType: keyof ExampleValues,
    valueIndex: number, // for body_text[0][valueIndex] or header_text[valueIndex]
    value: string,
  ) => {
    const newExample: ExampleValues = { ...(localComponent.example || {}) }
    if (exampleType === "body_text" && newExample.body_text?.[0]) {
      const bodyVars = [...newExample.body_text[0]]
      bodyVars[valueIndex] = value
      newExample.body_text = [bodyVars]
    } else if (exampleType === "header_text" && newExample.header_text) {
      const headerVars = [...newExample.header_text]
      headerVars[valueIndex] = value
      newExample.header_text = headerVars as [string]
    } else if (exampleType === "header_handle") {
      newExample.header_handle = [value] // Assuming single handle
    }
    handleFieldChange("example", newExample)
  }

  const renderHeaderFields = () => (
    <>
      <div className="mb-2">
        <Label htmlFor={`header-format-${index}`}>Formato del Encabezado</Label>
        <Select value={localComponent.format} onValueChange={(val) => handleFieldChange("format", val as HeaderFormat)}>
          <SelectTrigger id={`header-format-${index}`}>
            <SelectValue placeholder="Seleccionar formato..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Texto</SelectItem>
            <SelectItem value="IMAGE">Imagen</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="DOCUMENT">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {localComponent.format === "TEXT" && (
        <>
          <Textarea
            placeholder="Texto del encabezado (opcional, ej. ¡Bienvenido {{1}}!)"
            value={localComponent.text || ""}
            onChange={(e) => handleFieldChange("text", e.target.value)}
            maxLength={160} // General recommendation for header text
            className="h-20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {(localComponent.text || "").length}/160 caracteres. Usa {"{{1}}"} para variables.
          </p>
          {(localComponent.example?.header_text || []).map((ex: string, exIdx: number) => (
            <div key={`header-text-ex-${exIdx}`} className="mt-2">
              <Label htmlFor={`header-text-ex-${index}-${exIdx}`}>Ejemplo para {"{{" + (exIdx + 1) + "}}"}</Label>
              <Input
                id={`header-text-ex-${index}-${exIdx}`}
                value={ex}
                onChange={(e) => handleExampleChange("header_text", exIdx, e.target.value)}
                placeholder={`Valor para {{${exIdx + 1}}}`}
              />
            </div>
          ))}
        </>
      )}
      {(localComponent.format === "IMAGE" ||
        localComponent.format === "VIDEO" ||
        localComponent.format === "DOCUMENT") && (
        <>
          <div className="mt-2">
            <Label htmlFor={`header-link-${index}`}>Link del Media (Imagen/Video/Documento)</Label>
            <Input
              id={`header-link-${index}`}
              placeholder="https://ejemplo.com/media.jpg"
              value={localComponent.link || ""}
              onChange={(e) => handleFieldChange("link", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Proporciona un link público al archivo. Este se usará para el `example.header_handle`.
            </p>
          </div>
          {/* Example for header_handle. For simplicity, this is the same as the link above. */}
          {/* In a real scenario, header_handle might be an ID from WhatsApp's media upload. */}
        </>
      )}
    </>
  )

  const renderBodyFields = () => {
    if (category === "AUTHENTICATION") {
      return (
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!localComponent.add_security_recommendation}
              onChange={(e) => handleFieldChange("add_security_recommendation", e.target.checked)}
            />
            <span>Incluir recomendación de seguridad ("Por tu seguridad, no compartas este código")</span>
          </label>
          <p className="text-xs text-muted-foreground">
            El texto del cuerpo lo genera WhatsApp automáticamente. Sólo puedes decidir si se añade la recomendación de seguridad.
          </p>
        </div>
      )
    }

    const maxLength = getBodyMaxLength(category)
    return (
      <>
        <Textarea
          placeholder="Cuerpo del mensaje (ej. Tu código es {{1}} y expira en {{2}} minutos.)"
          value={localComponent.text || ""}
          onChange={(e) => handleFieldChange("text", e.target.value)}
          maxLength={maxLength}
          className="h-32"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(localComponent.text || "").length}/{maxLength} caracteres. Usa {'{{1}}'} para variables.
        </p>
        {(localComponent.example?.body_text?.[0] || []).map((ex: string, exIdx: number) => (
          <div key={`body-ex-${exIdx}`} className="mt-2">
            <Label htmlFor={`body-ex-${index}-${exIdx}`}>Ejemplo para {`{{${exIdx + 1}}}`}</Label>
            <Input
              id={`body-ex-${index}-${exIdx}`}
              value={ex}
              onChange={(e) => handleExampleChange("body_text", exIdx, e.target.value)}
              placeholder={`Valor para {{${exIdx + 1}}}`}
            />
          </div>
        ))}
      </>
    )
  }

  const renderFooterFields = () => {
    if (category === "AUTHENTICATION") {
      return (
        <div className="space-y-1">
          <Label htmlFor={`exp-min-${index}`}>Minutos hasta que caduque el código</Label>
          <Input
            id={`exp-min-${index}`}
            type="number"
            min={1}
            max={90}
            value={localComponent.code_expiration_minutes ?? ""}
            onChange={(e) => handleFieldChange("code_expiration_minutes", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Entre 1 y 90. WhatsApp mostrará "Este código caduca en X minutos".</p>
        </div>
      )
    }
    return (
      <>
        <Input
          placeholder="Texto del pie de página (opcional)"
          value={localComponent.text || ""}
          onChange={(e) => handleFieldChange("text", e.target.value)}
          maxLength={MAX_FOOTER_TEXT}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {(localComponent.text || "").length}/{MAX_FOOTER_TEXT} caracteres.
        </p>
      </>
    )
  }

  const renderButtonsFields = () => (
    <div className="space-y-3">
      {(localComponent.buttons || []).map((btn: ButtonComponent, btnIdx: number) => (
        <Card key={btnIdx} className="p-3 bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <Label className="font-semibold">Botón {btnIdx + 1}</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeUIButton(btnIdx)}
              disabled={(localComponent.buttons?.length || 0) <= 0}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Select
            value={btn.type}
            onValueChange={(val) => handleButtonChange(btnIdx, "type", val as ButtonComponent["type"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de botón..." />
            </SelectTrigger>
            <SelectContent>
              {category === "AUTHENTICATION" ? (
                <SelectItem value="OTP">OTP</SelectItem>
              ) : (
                <>
                  <SelectItem value="QUICK_REPLY">Respuesta Rápida</SelectItem>
                  <SelectItem value="URL">URL</SelectItem>
                  <SelectItem value="PHONE_NUMBER">Llamar por Teléfono</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Input
            placeholder="Texto del botón"
            value={btn.text}
            onChange={(e) => handleButtonChange(btnIdx, "text", e.target.value)}
            maxLength={btn.type === "QUICK_REPLY" ? MAX_QUICK_REPLY_TEXT : 20} // Display text for URL/Phone is shorter
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Máx: {btn.type === "QUICK_REPLY" ? MAX_QUICK_REPLY_TEXT : 20} caracteres.
          </p>

          {btn.type === "URL" && category !== "AUTHENTICATION" && (
            <>
              <Input
                placeholder="URL (ej. https://dominio.com/{{1}})"
                value={btn.url || ""}
                onChange={(e) => handleButtonChange(btnIdx, "url", e.target.value)}
                maxLength={MAX_URL_TEXT}
                className="mt-2"
              />
              {(btn.example || []).map((exVal: string, exIdx: number) => (
                <div key={`btn-url-ex-${btnIdx}-${exIdx}`} className="mt-1">
                  <Label htmlFor={`btn-url-ex-${btnIdx}-${exIdx}`} className="text-xs">
                    Ejemplo para URL {"{{" + (exIdx + 1) + "}}"}
                  </Label>
                  <Input
                    id={`btn-url-ex-${btnIdx}-${exIdx}`}
                    value={exVal}
                    onChange={(e) => handleButtonExampleChange(btnIdx, exIdx, e.target.value)}
                    placeholder={`Valor para {{${exIdx + 1}}}`}
                  />
                </div>
              ))}
            </>
          )}
          {btn.type === "PHONE_NUMBER" && category !== "AUTHENTICATION" && (
            <Input
              placeholder="Número de teléfono (ej. +1234567890)"
              value={btn.phone_number || ""}
              onChange={(e) => handleButtonChange(btnIdx, "phone_number", e.target.value)}
              className="mt-2"
            />
          )}
          {btn.type === "OTP" && (
            <div className="space-y-2 mt-2">
              <Label htmlFor={`otp-type-${btnIdx}`}>Tipo de OTP</Label>
              <Select
                value={btn.otp_type || "COPY_CODE"}
                onValueChange={(val) => handleButtonChange(btnIdx, "otp_type", val)}
              >
                <SelectTrigger id={`otp-type-${btnIdx}`}>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COPY_CODE">COPY_CODE</SelectItem>
                  <SelectItem value="ONE_TAP">ONE_TAP</SelectItem>
                  <SelectItem value="ZERO_TAP">ZERO_TAP</SelectItem>
                </SelectContent>
              </Select>
              {btn.otp_type === "ONE_TAP" && (
                <>
                  <Input
                    className="mt-2"
                    placeholder="package_name"
                    value={btn.package_name || ""}
                    onChange={(e) => handleButtonChange(btnIdx, "package_name", e.target.value)}
                  />
                  <Input
                    className="mt-2"
                    placeholder="signature_hash (11 chars)"
                    value={btn.signature_hash || ""}
                    onChange={(e) => handleButtonChange(btnIdx, "signature_hash", e.target.value)}
                  />
                </>
              )}
            </div>
          )}
        </Card>
      ))}
      {(localComponent.buttons?.length || 0) < 3 && (! (category === "AUTHENTICATION" && (localComponent.buttons?.length||0) >=1)) && (
        <Button variant="outline" onClick={addUIButton} className="mt-2 w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Botón (Máx. 3)
        </Button>
      )}
      {(localComponent.buttons?.length || 0) > 0 &&
        localComponent.buttons?.some((b: ButtonComponent) => b.type === "QUICK_REPLY") &&
        localComponent.buttons?.some((b: ButtonComponent) => b.type !== "QUICK_REPLY") && (
          <div className="mt-2 p-2 text-xs bg-yellow-100 text-yellow-700 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Mezclar botones de Respuesta Rápida con URL/Teléfono puede no mostrarse en WhatsApp Desktop.
          </div>
        )}
      {category === "AUTHENTICATION" && !(localComponent.buttons || []).some((b: ButtonComponent) => b.type === "OTP") && (
        <div className="mt-2 p-2 text-xs bg-red-100 text-red-700 rounded flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          Plantillas de Autenticación requieren al menos un botón OTP.
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (localComponent.type) {
      case "HEADER":
        return renderHeaderFields()
      case "BODY":
        return renderBodyFields()
      case "FOOTER":
        return renderFooterFields()
      case "BUTTONS":
        return renderButtonsFields()
      default:
        return null
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/50 border-b">
        <div className="flex items-center">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-grab mr-2 focus-visible:ring-0">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Arrastrar para reordenar (funcionalidad pendiente)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CardTitle className="text-base font-medium">{localComponent.type}</CardTitle>
        </div>
        {!isBody && (
          <Button variant="ghost" size="icon" onClick={() => removeComponent(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">{renderContent()}</CardContent>
    </Card>
  )
}
