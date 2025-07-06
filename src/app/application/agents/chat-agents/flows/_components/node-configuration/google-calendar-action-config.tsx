"use client"

import { useState, useEffect } from "react"
import { type Node } from "reactflow"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type Props = {
  selectedNode: Node
  updateNode: (nodeId: string, updates: any) => void
}

type Calendar = {
  id: string
  summary: string
}

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? "00" : "30"
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const ampm = hour < 12 ? "AM" : "PM"
  const time = `${String(hour).padStart(2, "0")}:${minute}`
  const display = `${displayHour}:${minute} ${ampm}`
  return { value: time, label: display }
})

export const GoogleCalendarActionConfig = ({ selectedNode, updateNode }: Props) => {
  const [action, setAction] = useState(selectedNode.data.action || "")
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false)

  // State for GET_AVAILABILITY
  const [selectedCalendarId, setSelectedCalendarId] = useState(selectedNode.data.fields?.calendarId || "")
  const [daysToCheck, setDaysToCheck] = useState(selectedNode.data.fields?.daysToCheck || "15")
  const [startTime, setStartTime] = useState(selectedNode.data.fields?.startTime || "09:00")
  const [endTime, setEndTime] = useState(selectedNode.data.fields?.endTime || "17:00")

  // Generic state
  const [saveResponseTo, setSaveResponseTo] = useState<string>(selectedNode.data.saveResponseTo || "disponibilidad")

  useEffect(() => {
    const fetchCalendars = async () => {
      setIsLoadingCalendars(true)
      try {
        const res = await fetch("/api/integrations/calendar/calendars")
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Failed to fetch calendars")
        }
        const data = await res.json()
        setCalendars(data.calendars)
        // Set default calendar if not already set
        if (!selectedCalendarId && data.calendars.length > 0) {
          const primaryCalendar = data.calendars.find((c: any) => c.primary) || data.calendars[0]
          setSelectedCalendarId(primaryCalendar.id)
        }
      } catch (error: any) {
        toast.error("Error al cargar calendarios", { description: error.message })
        console.error(error)
      } finally {
        setIsLoadingCalendars(false)
      }
    }
    if (action === "GET_AVAILABILITY" || action === "CREATE_EVENT") {
      fetchCalendars()
    }
  }, [action])

  const handleSave = () => {
    if (!action) {
      toast.error("Por favor, selecciona una acción.")
      return
    }

    let fields = {}
    let nodeName = "Google Calendar"

    if (action === "GET_AVAILABILITY") {
      if (!selectedCalendarId || !daysToCheck || !startTime || !endTime) {
        toast.error("Completa todos los campos para ver disponibilidad.")
        return
      }
      fields = {
        connectionId: selectedNode.data.connectionId,
        calendarId: selectedCalendarId,
        daysToCheck: parseInt(daysToCheck, 10),
        startTime,
        endTime,
      }
      nodeName = "Ver Disponibilidad (GCal)"
    }

    if (action === "CREATE_EVENT") {
      // Logic for create event will be added here.
      // For now, just save the action type.
      nodeName = "Crear Evento (GCal)"
      fields = selectedNode.data.fields // Preserve existing fields for now
    }

    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        name: nodeName,
        provider: "GOOGLE_CALENDAR",
        action: action,
        fields: fields,
        saveResponseTo: saveResponseTo || "availability",
      },
    })
    toast.success(`Configuración de Google Calendar guardada. Las fechas se almacenarán en la variable {{${saveResponseTo || 'disponibilidad'}}}.`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Acción de Google Calendar</CardTitle>
        <CardDescription>Selecciona qué quieres hacer con Google Calendar en este paso del flujo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Acción a realizar</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una acción..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET_AVAILABILITY">Ver disponibilidad</SelectItem>
              <SelectItem value="CREATE_EVENT">Crear evento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {action === "GET_AVAILABILITY" && (
          <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
            <h4 className="font-medium text-center">Opciones de Disponibilidad</h4>
            <div className="space-y-2">
              <Label>Calendario de Google</Label>
              <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId} disabled={isLoadingCalendars}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCalendars ? "Cargando calendarios..." : "Selecciona un calendario..."} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCalendars ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="ml-2">Cargando calendarios...</span>
                    </div>
                  ) : (
                    calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.summary}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ver disponibilidad para los próximos (días)</Label>
              <Input type="number" value={daysToCheck} onChange={(e) => setDaysToCheck(e.target.value)} placeholder="Ej: 30" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hora inicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hora fin" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="saveResponseTo">Guardar disponibilidad en la variable</Label>
              <Input
                id="saveResponseTo"
                placeholder="disponibilidad"
                value={saveResponseTo}
                onChange={(e) => setSaveResponseTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {action === "CREATE_EVENT" && (
          <div className="p-4 border rounded-md text-center animate-in fade-in-50">
            <p className="text-sm text-muted-foreground">La configuración para crear eventos estará disponible próximamente.</p>
          </div>
        )}

        {action && (
          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Guardar Configuración
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 