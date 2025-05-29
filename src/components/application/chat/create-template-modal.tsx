"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { WhatsAppPreview } from "./whatsapp-preview"
import { createAgentMessageTemplate } from "@/actions/message-template"

interface CreateTemplateModalProps {
  trigger: React.ReactElement
  agentId: string
}

interface VariableExample {
  number: number;
  placeholder: string;
  example: string;
}

// Remove mock hook and replace with real implementation
const useCreateAgentMessageTemplate = () => {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (data: {
    agentId: string
    name: string
    language: string
    category: string
    components: any[]
  }) => {
    setIsPending(true)
    try {
      const result = await createAgentMessageTemplate(data)
      return result
    } catch (error) {
      console.error("Error creating template:", error)
      throw error
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

export default function CreateTemplateModal({ trigger, agentId }: CreateTemplateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [name, setName] = useState("")
  const [language, setLanguage] = useState("es")
  const [category, setCategory] = useState("MARKETING")
  const [headerText, setHeaderText] = useState("Hola {{1}}! 👋")
  const [bodyText, setBodyText] = useState(
    "Tenemos una oferta especial para ti: {{2}}\n\nNos gustaría apoyarte en la configuración de tu período de prueba y compartir toda la información relevante.",
  )
  const [footerText, setFooterText] = useState("¿Puedo ayudarte con esto?")
  const [buttons, setButtons] = useState(["Sí, con una llamada"])
  const [variableExamples, setVariableExamples] = useState<VariableExample[]>([])

  const createMutation = useCreateAgentMessageTemplate()

  const getExampleForVariable = (variableNumber: number) => {
    const examples = [
      "Juan (nombre del cliente)",
      "Producto Premium (nombre del producto)",
      "50% de descuento (oferta)",
      "Empresa ABC (nombre de la empresa)",
      "15 de enero (fecha)",
      "2024 (año)",
    ]
    return examples[variableNumber - 1] || `Ejemplo para variable ${variableNumber}`
  }

  // Extract variables from all text fields
  const extractedVariables = useMemo(() => {
    const allText = `${headerText} ${bodyText} ${footerText} ${buttons.join(" ")}`
    const variableMatches = allText.match(/\{\{(\d+)\}\}/g) || []
    const uniqueVariables = [...new Set(variableMatches)]
      .map((match) => Number.parseInt(match.replace(/[{}]/g, "")))
      .sort((a, b) => a - b)
  
    return uniqueVariables.map((num) => ({
      number: num,
      placeholder: `{{${num}}}`,
    }))
  }, [headerText, bodyText, footerText, buttons])
  
  // 🔄 Solo actualiza ejemplos cuando cambia la lista de variables detectadas
  useEffect(() => {
    setVariableExamples((prevExamples) => {
      return extractedVariables.map(({ number, placeholder }) => ({
        number,
        placeholder,
        example: prevExamples.find((v) => v.number === number)?.example || `Ejemplo para variable ${number}`,
      }))
    })
  }, [extractedVariables])
  

  const updateVariableExample = (number: number, example: string) => {
    setVariableExamples(prev => 
      prev.map(v => v.number === number ? { ...v, example } : v)
    )
  }

  const addButton = () => {
    if (buttons.length < 3) {
      setButtons([...buttons, ""])
    }
  }

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index))
  }

  const updateButton = (index: number, value: string) => {
    const newButtons = [...buttons]
    newButtons[index] = value
    setButtons(newButtons)
  }

  const handleSave = async () => {
    if (!name) {
      toast.error("El nombre de la plantilla es obligatorio")
      return
    }

    if (!bodyText) {
      toast.error("El cuerpo del mensaje es obligatorio")
      return
    }

    const components: any[] = []

    if (headerText) {
      const headerVars = headerText.match(/\{\{(\d+)\}\}/g) || []
      const headerExamples = headerVars.map(v => {
        const num = Number.parseInt(v.replace(/[{}]/g, ""))
        return variableExamples.find(ex => ex.number === num)?.example || ""
      })

      console.log("Header Examples:", headerExamples)

      components.push({ 
        type: "HEADER", 
        format: "TEXT", 
        text: headerText,
        example: {
          header_text: headerExamples
        }
      })
    }

    const bodyVars = bodyText.match(/\{\{(\d+)\}\}/g) || []
    const bodyExamples = bodyVars.map(v => {
      const num = Number.parseInt(v.replace(/[{}]/g, ""))
      return variableExamples.find(ex => ex.number === num)?.example || ""
    })

    console.log("Body Examples:", bodyExamples)

    components.push({ 
      type: "BODY", 
      text: bodyText,
      ...(bodyExamples.length > 0 && {
        example: {
          body_text: [bodyExamples]
        }
      })
    })

    if (footerText) {
      components.push({ type: "FOOTER", text: footerText })
    }

    const validButtons = buttons.filter((button) => button.trim())
    console.log("Buttons:", validButtons)

    if (validButtons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: validButtons.map((buttonText) => ({
          type: "QUICK_REPLY",
          text: buttonText,
        })),
      })
    }

    console.log("Final Components:", JSON.stringify(components, null, 2))

    try {
      await createMutation.mutateAsync({
        agentId,
        name,
        language,
        category,
        components,
      })
      setIsOpen(false)
      setName("")
      setHeaderText("Hola {{1}}! 👋")
      setBodyText(
        "Tenemos una oferta especial para ti: {{2}}\n\nNos gustaría apoyarte en la configuración de tu período de prueba y compartir toda la información relevante.",
      )
      setFooterText("¿Puedo ayudarte con esto?")
      setButtons(["Sí, con una llamada"])
      setVariableExamples([])
      toast.success("Plantilla creada exitosamente")
    } catch (error) {
      toast.error("Error al crear la plantilla")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Crear plantilla de WhatsApp</DialogTitle>
          <DialogDescription>
            Completa la información para crear una plantilla de mensaje. Usa {"{{1}}"}, {"{{2}}"}, etc. para variables
            dinámicas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Form Section */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la plantilla *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="promocion_verano_2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="es"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="MARKETING"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="header">Encabezado</Label>
                <Textarea
                  id="header"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Hola {{1}}! 👋"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Texto corto para captar la atención. Máximo 60 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Cuerpo del mensaje *</Label>
                <Textarea
                  id="body"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Tenemos una oferta especial para ti: {{1}}"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Contenido principal del mensaje. Máximo 1024 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer">Pie de mensaje</Label>
                <Textarea
                  id="footer"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Responde para más detalles."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">Texto adicional al final. Máximo 60 caracteres.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Botones de respuesta rápida</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addButton}
                    disabled={buttons.length >= 3}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar botón
                  </Button>
                </div>

                {buttons.map((button, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={button}
                      onChange={(e) => updateButton(index, e.target.value)}
                      placeholder={`Texto del botón ${index + 1}`}
                      maxLength={25}
                    />
                    {buttons.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeButton(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Máximo 3 botones. Cada botón puede tener hasta 25 caracteres.
                </p>
              </div>

              {/* Variables detected */}
              {extractedVariables.length > 0 && (
                <div className="space-y-2">
                  <Label>Variables detectadas</Label>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    {extractedVariables.map((variable) => (
                      <div key={variable.number} className="flex items-center justify-between text-sm">
                        <code className="bg-background px-2 py-1 rounded text-xs">{variable.placeholder}</code>
                        <Input
                          value={variable.placeholder}
                          onChange={(e) => updateVariableExample(variable.number, e.target.value)}
                          placeholder={variable.placeholder}
                          className="w-48 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estas variables serán reemplazadas con datos reales al enviar el mensaje.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="w-80 border-l pl-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Vista previa</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
              <div className="sticky top-0">
                <WhatsAppPreview
                  headerText={headerText}
                  bodyText={bodyText}
                  footerText={footerText}
                  buttons={buttons}
                />
              </div>
            </div>
          )}

          {/* Show preview button when hidden */}
          {!showPreview && (
            <div className="flex items-start pt-8">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Mostrar vista previa
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={createMutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || !name || !bodyText}
            className="flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
