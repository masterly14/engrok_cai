"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { getGoogleCalendarCalendarsList } from "@/actions/nango";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useReactFlow } from "reactflow";
import { Switch } from "../ui/switch";
import { IntegrationNodeData } from "@/app/application/agents/voice-agents/workflows/types";
import { Input } from "../ui/input";

type Props = {
  data: IntegrationNodeData;
  onDataChange: (data: Partial<IntegrationNodeData>) => void;
  userId: string | null;
};

const GoogleActions = ({ data, onDataChange, userId }: Props) => {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState<number>(data.rangeDays ?? 15);
  const [availability, setAvailability] = useState<
    { start: string; end: string }[]
  >([]);
  const [isFetchingAvailability, setIsFetchingAvailability] =
    useState<boolean>(false);
  const [action, setAction] = useState<"availability" | "createEvent" | null>(
    (data.calendarAction as "availability" | "createEvent") || null,
  );

  const reactFlowInstance = useReactFlow();
  const variablesList = useMemo(() => {
    const vars: string[] = [];
    reactFlowInstance.getNodes().forEach((n: any) => {
      if (n.data.type === "conversation") {
        (n.data.variables || []).forEach((v: any) => {
          if (v.name && !vars.includes(v.name)) vars.push(v.name);
        });
      }
    });
    return vars;
  }, [reactFlowInstance]);

  const VariableSelect = ({ onSelect }: { onSelect: (v: string) => void }) => {
    if (variablesList.length === 0) return null;
    return (
      <Select onValueChange={onSelect}>
        <SelectTrigger className="h-8 w-8 border-gray-300 ml-2 p-0 flex items-center justify-center">
          <ChevronDown className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent>
          {variablesList.map((v) => (
            <SelectItem key={v} value={v} className="cursor-pointer">
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  useEffect(() => {
    const fetchCalendars = async () => {
      if (!userId) return;
      try {
        const calendars = await getGoogleCalendarCalendarsList(userId);
        setCalendars(calendars || []);
      } catch (error) {
        toast.error("Error al obtener los calendarios");
      }
    };
    fetchCalendars();
  }, [userId]);

  /**
   * Fetch free / busy information from backend and calculate available slots
   */
  const handleFetchAvailability = async () => {
    if (!userId) {
      toast.error("Usuario no definido");
      return;
    }
    if (!data.calendarId) {
      toast.error("Selecciona un calendario");
      return;
    }
    try {
      setIsFetchingAvailability(true);
      const res = await fetch(
        `/api/integrations/calendar?userId=${userId}&calendarId=${data.calendarId}&rangeDays=${rangeDays}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const calendarsJson = await res.json();
      const cal = calendarsJson[data.calendarId] || calendarsJson.primary;
      const avail = cal?.available || [];
      setAvailability(avail);
      if (avail.length === 0)
        toast.info("No se encontraron espacios disponibles");
    } catch (err) {
      console.error(err);
      toast.error("Error obteniendo disponibilidad");
    } finally {
      setIsFetchingAvailability(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 mt-7">
        <Label className="font-medium">
          Selecciona la acción que realizara el agente.
        </Label>
        <Select
          value={action || ""}
          onValueChange={(value) => {
            setAction(value as "availability" | "createEvent");
            onDataChange({ calendarAction: value as any });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="availability">Ver disponibilidad</SelectItem>
            <SelectItem value="createEvent">Crear evento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Selector de Calendario */}
      <div className="space-y-2">
        <Label className="font-medium">Calendario</Label>
        <Select
          value={data.calendarId || ""}
          onValueChange={(value) => onDataChange({ calendarId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un calendario" />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((cal) => (
              <SelectItem key={cal.id} value={cal.id}>
                {cal.summary}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.calendarId && action && (
        <>
          {/* -- Ver Disponibilidad -- */}
          {action === "availability" && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-md font-semibold text-gray-800">
                Ver disponibilidad
              </h3>
              <div className="flex items-center gap-3">
                <Label className="text-sm">Próximos</Label>
                <Input
                  type="number"
                  value={rangeDays}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setRangeDays(v);
                    onDataChange({ rangeDays: v });
                  }}
                  className="w-20"
                  min={1}
                />
                <span className="text-sm">días</span>
              </div>
              <button
                type="button"
                onClick={handleFetchAvailability}
                disabled={isFetchingAvailability}
                className="ml-auto px-3 py-1.5 text-sm rounded bg-emerald-600 text-white disabled:opacity-60"
              >
                {isFetchingAvailability ? "Cargando..." : "Obtener"}
              </button>
            </div>
          )}
          {/* -- Crear Evento -- */}
          {action === "createEvent" && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-md font-semibold text-gray-800">
                Crear Evento
              </h3>
              {/* Resumen del Evento */}
              <div className="space-y-2">
                <Label>Título del Evento</Label>
                <Input
                  value={data.eventSummary || ""}
                  onChange={(e) =>
                    onDataChange({ eventSummary: e.target.value })
                  }
                  placeholder="Ej. Cita con el cliente"
                />
              </div>
              {/* Descripción del Evento */}
              <div className="space-y-2">
                <Label>Descripción del Evento (Opcional)</Label>
                <Input
                  value={data.eventDescription || ""}
                  onChange={(e) =>
                    onDataChange({ eventDescription: e.target.value })
                  }
                  placeholder="Ej. Discutir la propuesta..."
                />
              </div>

              {/* Fecha de Inicio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Fecha de Inicio</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Usar variable</span>
                    <Switch
                      checked={data.isDynamicStartDate || false}
                      onCheckedChange={(checked) =>
                        onDataChange({ isDynamicStartDate: checked })
                      }
                    />
                  </div>
                </div>
                {data.isDynamicStartDate ? (
                  <div className="flex items-center">
                    <Input
                      value={data.eventStartDate || ""}
                      onChange={(e) =>
                        onDataChange({ eventStartDate: e.target.value })
                      }
                      placeholder="{{variable_fecha}}"
                    />
                    <VariableSelect
                      onSelect={(v) =>
                        onDataChange({ eventStartDate: `{{${v}}}` })
                      }
                    />
                  </div>
                ) : (
                  <Input
                    type="date"
                    value={
                      data.eventStartDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      onDataChange({ eventStartDate: e.target.value })
                    }
                  />
                )}
              </div>

              {/* Hora de Inicio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Hora de Inicio</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Usar variable</span>
                    <Switch
                      checked={data.isDynamicStartTime || false}
                      onCheckedChange={(checked) =>
                        onDataChange({ isDynamicStartTime: checked })
                      }
                    />
                  </div>
                </div>
                {data.isDynamicStartTime ? (
                  <div className="flex items-center">
                    <Input
                      value={data.eventStartTime || ""}
                      onChange={(e) =>
                        onDataChange({ eventStartTime: e.target.value })
                      }
                      placeholder="{{variable_hora}}"
                    />
                    <VariableSelect
                      onSelect={(v) =>
                        onDataChange({ eventStartTime: `{{${v}}}` })
                      }
                    />
                  </div>
                ) : (
                  <Input
                    type="time"
                    value={data.eventStartTime || "09:00"}
                    onChange={(e) =>
                      onDataChange({ eventStartTime: e.target.value })
                    }
                  />
                )}
              </div>

              {/* Duración */}
              <div className="space-y-2">
                <Label>Duración (en minutos)</Label>
                <Input
                  type="number"
                  value={data.eventDuration || 30}
                  onChange={(e) =>
                    onDataChange({
                      eventDuration:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  placeholder="Ej. 30"
                />
              </div>
            </div>
          )}

          {availability.length > 0 && (
            <ul className="mt-3 max-h-40 overflow-y-auto space-y-1 text-sm">
              {availability.map((slot, idx) => (
                <li key={idx} className="border rounded p-2 bg-emerald-50">
                  {new Date(slot.start).toLocaleString()} -{" "}
                  {new Date(slot.end).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleActions;
