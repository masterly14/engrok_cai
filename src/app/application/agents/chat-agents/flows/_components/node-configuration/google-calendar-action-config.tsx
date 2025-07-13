"use client";

import { useState, useEffect } from "react";
import { type Node } from "reactflow";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  selectedNode: Node;
  updateNode: (nodeId: string, updates: any) => void;
};

type Calendar = {
  id: string;
  summary: string;
};

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  const time = `${String(hour).padStart(2, "0")}:${minute}`;
  const display = `${displayHour}:${minute} ${ampm}`;
  return { value: time, label: display };
});

export const GoogleCalendarActionConfig = ({
  selectedNode,
  updateNode,
}: Props) => {
  const [action, setAction] = useState(selectedNode.data.action || "");
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  // State for GET_AVAILABILITY
  const [calendarId, setCalendarId] = useState(
    selectedNode.data.fields?.calendarId || "",
  );
  const [daysToCheck, setDaysToCheck] = useState(
    selectedNode.data.fields?.daysToCheck || "15",
  );
  const [startTime, setStartTime] = useState(
    selectedNode.data.fields?.startTime || "09:00",
  );
  const [endTime, setEndTime] = useState(
    selectedNode.data.fields?.endTime || "17:00",
  );

  // State for CREATE_EVENT
  const [eventTitle, setEventTitle] = useState(
    selectedNode.data.fields?.title || "Cita con {{contact.name}}",
  );
  const [eventDescription, setEventDescription] = useState(
    selectedNode.data.fields?.description ||
      "Detalles de la cita agendada a través de Karolai.",
  );
  const [eventStartTimeVar, setEventStartTimeVar] = useState(
    selectedNode.data.fields?.startTimeVar || "user_selected_slot",
  );
  const [eventDurationMinutes, setEventDurationMinutes] = useState(
    selectedNode.data.fields?.eventDurationMinutes || "30",
  );
  const [attendeesVar, setAttendeesVar] = useState(
    selectedNode.data.fields?.attendeesVar || "contact.email",
  );

  // Generic state
  // Default variable name for availability results
  const [saveResponseTo, setSaveResponseTo] = useState<string>(
    selectedNode.data.saveResponseTo ||
      (selectedNode.data.action === "GET_AVAILABILITY" ? "disponibilidad" : ""),
  );

  useEffect(() => {
    const fetchCalendars = async () => {
      setIsLoadingCalendars(true);
      try {
        const res = await fetch("/api/integrations/calendar/calendars");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch calendars");
        }
        const data = await res.json();
        setCalendars(data.calendars);
        // Set default calendar if not already set
        if (!calendarId && data.calendars.length > 0) {
          const primaryCalendar =
            data.calendars.find((c: any) => c.primary) || data.calendars[0];
          setCalendarId(primaryCalendar.id);
        }
      } catch (error: any) {
        toast.error("Error al cargar calendarios", {
          description: error.message,
        });
        console.error(error);
      } finally {
        setIsLoadingCalendars(false);
      }
    };
    if (action === "GET_AVAILABILITY" || action === "CREATE_EVENT") {
      fetchCalendars();
    }
  }, [action]);

  /*
   * =============================
   *  Auto-save logic
   * =============================
   * Cada vez que el usuario cambie un campo relevante guardaremos los cambios
   * en el nodo para que no requiera un botón de Guardar adicional.
   */
  useEffect(() => {
    // Evitar ejecutar si no se ha definido la acción todavía
    if (!action) return;

    let fields: Record<string, any> = {};
    let nodeName = "Google Calendar";

    if (action === "GET_AVAILABILITY") {
      if (!calendarId || !daysToCheck || !startTime || !endTime) {
        // No intentamos guardar hasta que todos los campos mínimos estén
        return;
      }
      fields = {
        connectionId: selectedNode.data.fields?.connectionId,
        calendarId,
        daysToCheck: parseInt(daysToCheck, 10),
        startTime,
        endTime,
        eventDurationMinutes: parseInt(eventDurationMinutes, 10),
      };
      nodeName = "Ver Disponibilidad (GCal)";
    }

    if (action === "CREATE_EVENT") {
      if (
        !calendarId ||
        !eventTitle ||
        !eventStartTimeVar ||
        !eventDurationMinutes
      ) {
        return;
      }
      nodeName = "Crear Evento (GCal)";
      fields = {
        connectionId: selectedNode.data.fields?.connectionId,
        calendarId,
        title: eventTitle,
        description: eventDescription,
        startTimeVar: eventStartTimeVar,
        eventDurationMinutes: parseInt(eventDurationMinutes, 10),
        attendeesVar,
      };
    }

    updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        name: nodeName,
        provider: "GOOGLE_CALENDAR",
        action,
        fields,
        saveResponseTo: saveResponseTo,
      },
    });
  }, [
    action,
    calendarId,
    daysToCheck,
    startTime,
    endTime,
    eventDurationMinutes,
    eventTitle,
    eventDescription,
    eventStartTimeVar,
    attendeesVar,
    saveResponseTo,
    updateNode,
    selectedNode.id,
    selectedNode.data,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Acción de Google Calendar</CardTitle>
        <CardDescription>
          Selecciona qué quieres hacer con Google Calendar en este paso del
          flujo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Acción a realizar</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una acción..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET_AVAILABILITY">
                Ver disponibilidad
              </SelectItem>
              <SelectItem value="CREATE_EVENT">Crear evento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {action === "GET_AVAILABILITY" && (
          <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
            <h4 className="font-medium text-center">
              Opciones de Disponibilidad
            </h4>
            <div className="space-y-2">
              <Label>Calendario de Google</Label>
              <Select
                value={calendarId}
                onValueChange={setCalendarId}
                disabled={isLoadingCalendars}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCalendars
                        ? "Cargando calendarios..."
                        : "Selecciona un calendario..."
                    }
                  />
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
              <Input
                type="number"
                value={daysToCheck}
                onChange={(e) => setDaysToCheck(e.target.value)}
                placeholder="Ej: 30"
              />
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
              <Label>Duración del evento (minutos)</Label>
              <Input
                type="number"
                value={eventDurationMinutes}
                onChange={(e) => setEventDurationMinutes(e.target.value)}
                placeholder="Ej: 30"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="saveResponseTo">
                Guardar disponibilidad en la variable
              </Label>
              <Input
                id="saveResponseTo"
                placeholder="disponibilidad"
                value={saveResponseTo}
                onChange={(e) => setSaveResponseTo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Podrás acceder a estos datos usando <code>{"{{"}{saveResponseTo || "disponibilidad"}{"}}"}</code>
              </p>
            </div>
          </div>
        )}

        {action === "CREATE_EVENT" && (
          <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
            <h4 className="font-medium text-center">
              Opciones para Crear Evento
            </h4>
            <div className="space-y-2">
              <Label>Calendario de Google</Label>
              <Select
                value={calendarId}
                onValueChange={setCalendarId}
                disabled={isLoadingCalendars}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCalendars
                        ? "Cargando calendarios..."
                        : "Selecciona un calendario..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCalendars ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="ml-2">Cargando...</span>
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
              <Label htmlFor="eventTitle">Título del Evento</Label>
              <Input
                id="eventTitle"
                placeholder="Ej: Cita con {{contact.name}}"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {"Puedes usar variables como `{{contact.name}}`."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDescription">Descripción del Evento</Label>
              <Textarea
                id="eventDescription"
                placeholder="Ej: Confirmación de cita para el servicio..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStartTimeVar">
                  Variable de Hora de Inicio
                </Label>
                <Input
                  id="eventStartTimeVar"
                  placeholder="Ej: user_selected_slot"
                  value={eventStartTimeVar}
                  onChange={(e) => setEventStartTimeVar(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {
                    "La variable debe contener una fecha/hora en formato ISO (ej: `2024-08-15T10:00:00-05:00`)."
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label>Duración del evento (minutos)</Label>
                <Input
                  type="number"
                  value={eventDurationMinutes}
                  onChange={(e) => setEventDurationMinutes(e.target.value)}
                  placeholder="Ej: 30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendeesVar">
                Variables de Invitados (emails)
              </Label>
              <Input
                id="attendeesVar"
                placeholder="Ej: contact.email, {{some_other_email_var}}"
                value={attendeesVar}
                onChange={(e) => setAttendeesVar(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {"Separa las variables o emails con comas."}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="saveResponseTo">
                Guardar ID del evento en la variable (opcional)
              </Label>
              <Input
                id="saveResponseTo"
                placeholder="google_event_id"
                value={saveResponseTo}
                onChange={(e) => setSaveResponseTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Se elimina el botón de guardado manual: ahora se guarda automáticamente */}
      </CardContent>
    </Card>
  );
};
