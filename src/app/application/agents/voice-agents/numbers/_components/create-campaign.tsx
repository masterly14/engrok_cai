"use client"

import { Plus, Users, Settings, Info, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import CSVUpload from "./csv-upload"

type Props = {
  phoneNumberId: string
  phoneNumberVapiId: string
}

const CreateCampaign = ({ phoneNumberId, phoneNumberVapiId }: Props) => {
  const [numbersData, setNumbersData] = useState<any[]>([])
  const [campaignName, setCampaignName] = useState("")

  // Estados para controlar qué secciones están abiertas
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(true)
  const [isContactsOpen, setIsContactsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleProcessedData = (data: any) => {
    setNumbersData(data)
    console.log(data)
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Crear Campaña
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Campaña</DialogTitle>
          <DialogDescription>
            Configura una campaña paso a paso. Completa cada sección para configurar tu programación de llamadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información Básica */}
          <Collapsible open={isBasicInfoOpen} onOpenChange={setIsBasicInfoOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold">Información Básica</h3>
                  <p className="text-sm text-muted-foreground">Nombre y descripción de la campaña</p>
                </div>
              </div>
              {isBasicInfoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3">
              <div className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Nombre de la campaña</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Ej: Campaña de cualificación de leads 2025"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Contactos */}
          <Collapsible open={isContactsOpen} onOpenChange={setIsContactsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <h3 className="font-semibold">Contactos</h3>
                  <p className="text-sm text-muted-foreground">
                    Sube tu lista de contactos en formato CSV
                    {numbersData.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {numbersData.length} contactos
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
              {isContactsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3">
              <div className="mt-3">
                <CSVUpload onDataProcessed={handleProcessedData} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Configuración de Llamadas */}
          <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <h3 className="font-semibold">Configuración</h3>
                  <p className="text-sm text-muted-foreground">Programa horarios y configuraciones del agente</p>
                </div>
              </div>
              {isSettingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3">
              <div className="mt-3 p-4 border rounded-lg bg-slate-50">
                <p className="text-sm text-muted-foreground text-center">
                  Configuración de horarios y parámetros de llamada próximamente...
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline">Cancelar</Button>
          <Button disabled={!campaignName || numbersData.length === 0} className="min-w-[120px]">
            Crear Campaña
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCampaign
