"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { getGoogleCalendarCalendarsList } from "@/actions/nango";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
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
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

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
  const [startDate, setStartDate] = useState<string>(
    (selectedNode as any)?.metadataIntegration?.timeMin || ""
  );
  const [endDate, setEndDate] = useState<string>(
    (selectedNode as any)?.metadataIntegration?.timeMax || ""
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const actualDate = new Date().toISOString().split("T")[0];

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
      case "deleteEvent":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "updateEvent":
        return <Edit className="h-4 w-4 text-amber-500" />;
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
      case "deleteEvent":
        return "border-red-200 bg-red-50";
      case "updateEvent":
        return "border-amber-200 bg-amber-50";
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
      case "deleteEvent":
        return "Eliminar Evento";
      case "updateEvent":
        return "Actualizar Evento";
      default:
        return "";
    }
  };

  const updateNodeData = () => {
    console.log("Actualizando nodo");
    setIsLoading(true);
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/calendar?connectionId=${connectionId}&calendarId=${calendarId}&timeMin=${startDate}&timeMax=${endDate}`;

    console.log("Tiempo max", endDate);
    console.log("Tiempo min", startDate);
    const updatedMetadata = {
      providerConfigKey: "google-calendar",
      action: typeAction,
      calendarId,
      timeMin: startDate,
      timeMax: endDate,
    };

    updateNode(nodeId, {
      ...selectedNode,
      metadataIntegration: updatedMetadata,
      data: {
        ...selectedNode.data,
        metadataIntegration: updatedMetadata,
        tool: {
          ...((selectedNode.data as any)?.tool ?? {}),
          url,
          method: "GET",
        },
      },
    });
    console.log(selectedNode);
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

    if (meta.timeMin && typeof meta.timeMin === "string") {
      setStartDate(meta.timeMin.split("T")[0]);
    }

    if (meta.timeMax && typeof meta.timeMax === "string") {
      setEndDate(meta.timeMax.split("T")[0]);
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
                  <SelectItem value="deleteEvent">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      Eliminar evento
                    </div>
                  </SelectItem>
                  <SelectItem value="updateEvent">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-amber-500" />
                      Actualizar evento
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
                        Configuración de rango de fechas
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Por defecto, se buscarán los períodos disponibles para
                        los próximos 15 días.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Fecha inicial
                      </Label>
                      <Input
                        type="date"
                        value={startDate}
                        className="border-blue-200 focus:ring-blue-500"
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (newDate < actualDate) {
                            setStartDate(actualDate);
                            toast.error("La fecha no puede ser anterior a hoy");
                          } else {
                            setStartDate(newDate);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">
                        Fecha final
                      </Label>
                      <Input
                        type="date"
                        value={endDate}
                        className="border-blue-200 focus:ring-blue-500"
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (newDate < startDate || newDate < actualDate) {
                            setEndDate(startDate);
                            toast.error(
                              "La fecha final debe ser posterior a la inicial"
                            );
                          } else {
                            setEndDate(newDate);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {startDate && endDate && (
                    <div className="bg-white border border-blue-100 rounded p-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Rango seleccionado
                        </Badge>
                        <span className="text-xs text-gray-600">
                          {convertDateToUTC(startDate).split("T")[0]} -{" "}
                          {convertDateToUTC(endDate).split("T")[0]}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button onClick={updateNodeData} disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}

              {/* Aquí se pueden agregar los formularios para las otras acciones */}
              {typeAction === "createEvent" && (
                <p className="text-sm text-gray-600">
                  Configura los detalles del nuevo evento
                </p>
              )}

              {typeAction === "deleteEvent" && (
                <p className="text-sm text-gray-600">
                  Selecciona el evento que deseas eliminar
                </p>
              )}

              {typeAction === "updateEvent" && (
                <p className="text-sm text-gray-600">
                  Modifica los detalles del evento seleccionado
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleActions;
