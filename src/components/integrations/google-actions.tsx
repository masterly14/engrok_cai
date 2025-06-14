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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit,
  CalendarRange,
  ChevronDown,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useReactFlow } from "reactflow";

type Props = {
  setJsonData: (data: any) => void;
  userId: string | null;
  connectionId: string | null;
  nodeId: string;
  updateNode: (nodeId: string, updates: any) => void;
  selectedNode: any;
};

const GoogleActions = ({
  setJsonData,
  userId,
  connectionId,
  nodeId,
  updateNode,
  selectedNode,
}: Props) => {
  const [typeAction, setTypeAction] = useState<string>(
    (selectedNode as any)?.metadataIntegration?.action || ""
  );
  const [calendarId, setCalendarId] = useState<string>(
    (selectedNode as any)?.metadataIntegration?.calendarId || ""
  );
  const [calendars, setCalendars] = useState<any[]>([]);
  const [rangeDays, setRangeDays] = useState<number>(
    Number((selectedNode as any)?.metadataIntegration?.rangeDays || 15)
  );
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const actualDate = new Date().toISOString().split("T")[0];

  // Estados específicos para eventos
  const [eventSummary, setEventSummary] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<string>(actualDate);
  const [eventStartTime, setEventStartTime] = useState<string>("09:00");
  const [eventEndDate, setEventEndDate] = useState<string>(actualDate);
  const [eventEndTime, setEventEndTime] = useState<string>("10:00");
  const [eventId, setEventId] = useState<string>("");

  // Rango para getEvents
  const [eventsStartDate, setEventsStartDate] = useState<string>(actualDate);
  const [eventsEndDate, setEventsEndDate] = useState<string>(actualDate);

  /* -------------------------------- Variables globales -------------------------------- */
  const reactFlowInstance = useReactFlow();
  const variablesList = useMemo(() => {
    const vars: string[] = [];
    reactFlowInstance.getNodes().forEach((n) => {
      if (n.type === "conversation") {
        const outputs = (n.data as any)?.variableExtractionPlan?.output ?? [];
        outputs.forEach((v: any) => {
          const varName = v?.title || v?.name;
          if (varName && !vars.includes(varName)) vars.push(varName);
        });
      }
    });
    return vars;
  }, [reactFlowInstance]);

  /* -------------------------------- Componente Helper -------------------------------- */
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

  const convertDateToUTC = (dateString: string) => {
    const localDate = new Date(`${dateString}T00:00:00-05:00`);
    // Obtener componentes de la fecha en UTC
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(localDate.getUTCDate()).padStart(2, "0");
    const hours = String(localDate.getUTCHours()).padStart(2, "0");
    const minutes = String(localDate.getUTCMinutes()).padStart(2, "0");
    const seconds = String(localDate.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        setIsLoading(true);
        if (!userId) {
          toast.error("No se encontró el ID de usuario");
          return;
        }
        const calendars = await getGoogleCalendarCalendarsList(userId);
        setCalendars(calendars || []);
      } catch (error) {
        console.error("Error fetching calendars:", error);
        toast.error("Error al obtener los calendarios");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendars();
  }, [userId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "checkAvailability":
        return <CalendarRange className="h-4 w-4 text-blue-500" />;
      case "createEvent":
        return <Plus className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "checkAvailability":
        return "border-blue-200 bg-blue-50";
      case "createEvent":
        return "border-green-200 bg-green-50";
      default:
        return "";
    }
  };

  const getActionTitle = (action: string) => {
    switch (action) {
      case "checkAvailability":
        return "Verificar Disponibilidad";
      case "createEvent":
        return "Crear Evento";
      default:
        return "";
    }
  };

  const updateNodeData = () => {
    setIsLoading(true);

    let method: "GET" | "POST" = "GET";
    let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/calendar?connectionId=${connectionId}&calendarId=${calendarId}`;
    let bodyProps: Record<string, any> | undefined = undefined;

    switch (typeAction) {
      case "checkAvailability": {
        url += `&action=checkAvailability&rangeDays=${rangeDays}`;
        method = "GET";
        break;
      }
      case "getEvents": {
        url += `&action=getEvents&start=${eventsStartDate}&end=${eventsEndDate}`;
        method = "GET";
        break;
      }
      case "createEvent": {
        url += `&action=createEvent`;
        method = "POST";
        bodyProps = {
          summary: eventSummary,
          description: eventDescription,
          start: `${eventStartDate}T${eventStartTime}:00`,
          end: `${eventEndDate}T${eventEndTime}:00`,
        };
        break;
      }
      default:
        break;
    }

    const updatedMetadata: any = {
      providerConfigKey: "google-calendar",
      action: typeAction,
      calendarId,
    };

    if (typeAction === "checkAvailability") {
      updatedMetadata.rangeDays = rangeDays;
    }

    if (typeAction === "getEvents") {
      updatedMetadata.start = eventsStartDate;
      updatedMetadata.end = eventsEndDate;
    }

    if (["createEvent", "updateEvent"].includes(typeAction)) {
      updatedMetadata.eventData = bodyProps;
    }

    updateNode(nodeId, {
      ...selectedNode,
      metadataIntegration: updatedMetadata,
      data: {
        ...selectedNode.data,
        tool: {
          ...((selectedNode.data as any)?.tool ?? {}),
          url,
          method,
          ...(method === "POST" && {
            body: {
              type: "object",
              properties: bodyProps || {},
            },
          }),
        },
      },
    });

    setIsLoading(false);
  };

  useEffect(() => {
    const meta = (selectedNode as any)?.metadataIntegration;
    if (!meta) return;

    if (meta.action && typeof meta.action === "string") {
      setTypeAction(meta.action);
    }

    if (meta.calendarId && typeof meta.calendarId === "string") {
      setCalendarId(meta.calendarId);
    }

    if (meta.rangeDays && !isNaN(Number(meta.rangeDays))) {
      setRangeDays(Number(meta.rangeDays));
    }
    
  }, [selectedNode]);

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-gray-900">
              Acciones de Google Calendar
            </CardTitle>
            <CardDescription className="text-gray-600">
              Gestiona eventos y verifica disponibilidad
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calendar Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <Label className="text-sm font-medium text-gray-700">
              Calendario
            </Label>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Clock className="h-5 w-5 text-blue-500 animate-pulse mr-2" />
              <span className="text-sm text-gray-600">
                Cargando calendarios...
              </span>
            </div>
          ) : calendars.length === 0 ? (
            <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                No se encontraron calendarios
              </p>
            </div>
          ) : (
            <Select
              onValueChange={(value) => setCalendarId(value)}
              value={calendarId}
            >
              <SelectTrigger className="w-full border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Selecciona un calendario" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.id} value={calendar.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            calendar.backgroundColor || "#4285F4",
                        }}
                      ></div>
                      {calendar.summary}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Selection */}
        {calendarId !== "" && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <Label className="text-sm font-medium text-gray-700">
                  Acción
                </Label>
              </div>

              <Select
                onValueChange={(value) => setTypeAction(value)}
                value={typeAction}
              >
                <SelectTrigger className="w-full border-purple-200 focus:ring-purple-500">
                  <SelectValue placeholder="Selecciona una acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkAvailability">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-4 w-4 text-blue-500" />
                      Ver disponibilidad
                    </div>
                  </SelectItem>
                  <SelectItem value="createEvent">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-500" />
                      Crear evento
                    </div>
                  </SelectItem>

                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Action Configuration */}
        {typeAction && (
          <>
            <Separator />
            <div
              className={`rounded-lg border p-4 ${getActionColor(typeAction)}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getActionIcon(typeAction)}
                <h3 className="font-medium">{getActionTitle(typeAction)}</h3>
              </div>

              {typeAction === "checkAvailability" && (
                <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Configuración de rango en días
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Se buscará disponibilidad desde hoy hasta los próximos días que indiques.
                    </p>
                  </div>
                </div>
              
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Días:</Label>
                  <input
                    type="number"
                    min={1}
                    value={rangeDays}
                    onChange={(e) => setRangeDays(parseInt(e.target.value))}
                    className="w-20 border border-blue-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
              
                <Button onClick={updateNodeData} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
              
              )}

              {/* CREATE EVENT FORM */}
              {typeAction === "createEvent" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Título del evento</Label>
                    <div className="flex items-center">
                      <input
                        value={eventSummary}
                        onChange={(e) => setEventSummary(e.target.value)}
                        className="border rounded px-2 py-1 text-sm flex-1"
                      />
                      <VariableSelect onSelect={(v)=>setEventSummary(`{{${v}}}`)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Fecha inicio</Label>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Hora inicio</Label>
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Fecha fin</Label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Hora fin</Label>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">Descripción</Label>
                    <div className="flex items-start gap-2">
                      <textarea
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="border rounded px-2 py-1 text-sm flex-1"
                      />
                      <VariableSelect onSelect={(v)=>setEventDescription(`{{${v}}}`)} />
                    </div>
                  </div>

                  <Button onClick={updateNodeData} disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleActions;
