"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Phone,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  Bot,
} from "lucide-react";

interface DatosLlamada {
  id: string;
  type: string;
  startedAt: string;
  endedAt: string;
  transcript: string;
  recordingUrl: string;
  summary: string;
  cost: number;
  status: string;
  endedReason: string;
  costBreakdown: {
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
    total: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    ttsCharacters: number;
  };
  analysis: {
    summary: string;
    successEvaluation: string;
  };
  messages: Array<{
    role: string;
    message: string;
    time: number;
    secondsFromStart: number;
    duration?: number;
  }>;
}

interface CallsTableProps {
  llamadas: DatosLlamada[];
  onSeleccionarLlamada: (llamada: DatosLlamada) => void;
}

export default function CallsTable({
  llamadas,
  onSeleccionarLlamada,
}: CallsTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [ordenPor, setOrdenPor] = useState<"fecha" | "costo" | "duracion">(
    "fecha",
  );
  const [ordenDireccion, setOrdenDireccion] = useState<"asc" | "desc">("desc");

  const formatearFecha = (fechaString: string) => {
    return new Date(fechaString).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearDuracion = (tiempoInicio: string, tiempoFin: string) => {
    const inicio = new Date(tiempoInicio);
    const fin = new Date(tiempoFin);
    const duracionMs = fin.getTime() - inicio.getTime();
    const segundos = Math.floor(duracionMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos}:${segundosRestantes.toString().padStart(2, "0")}`;
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "ended":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "ended":
        return "Finalizada";
      case "in-progress":
        return "En Progreso";
      case "failed":
        return "Fallida";
      default:
        return estado;
    }
  };

  const obtenerResumenConversacion = (transcript: string) => {
    const lineas = transcript.split("\n").filter((linea) => linea.trim());
    if (lineas.length > 0) {
      const primeraLinea = lineas[0];
      const [, ...mensaje] = primeraLinea.split(": ");
      return mensaje.join(": ").substring(0, 80) + "...";
    }
    return "Sin transcripción disponible";
  };

  // Filtrar llamadas
  const llamadasFiltradas = llamadas.filter((llamada) => {
    const coincideBusqueda =
      llamada.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      llamada.transcript.toLowerCase().includes(busqueda.toLowerCase()) ||
      llamada.summary.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todos" || llamada.status === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  // Ordenar llamadas
  const llamadasOrdenadas = [...llamadasFiltradas].sort((a, b) => {
    let valorA: number;
    let valorB: number;

    switch (ordenPor) {
      case "fecha":
        valorA = new Date(a.startedAt).getTime();
        valorB = new Date(b.startedAt).getTime();
        break;
      case "costo":
        valorA = a.cost;
        valorB = b.cost;
        break;
      case "duracion":
        valorA =
          new Date(a.endedAt).getTime() - new Date(a.startedAt).getTime();
        valorB =
          new Date(b.endedAt).getTime() - new Date(b.startedAt).getTime();
        break;
      default:
        return 0;
    }

    return ordenDireccion === "asc" ? valorA - valorB : valorB - valorA;
  });

  const cambiarOrden = (campo: "fecha" | "costo" | "duracion") => {
    if (ordenPor === campo) {
      setOrdenDireccion(ordenDireccion === "asc" ? "desc" : "asc");
    } else {
      setOrdenPor(campo);
      setOrdenDireccion("desc");
    }
  };

  const estadosUnicos = [...new Set(llamadas.map((l) => l.status))];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Historial de Llamadas
              </h1>
              <p className="text-gray-600">
                Gestiona y analiza todas tus conversaciones
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {llamadas.length}
            </p>
            <p className="text-sm text-gray-600">Total de llamadas</p>
          </div>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exitosas</p>
                  <p className="text-xl font-bold text-green-600">
                    {
                      llamadas.filter(
                        (l) => l.analysis.successEvaluation === "true",
                      ).length
                    }
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fallidas</p>
                  <p className="text-xl font-bold text-red-600">
                    {
                      llamadas.filter(
                        (l) => l.analysis.successEvaluation === "false",
                      ).length
                    }
                  </p>
                </div>
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Costo Total</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${llamadas.reduce((sum, l) => sum + l.cost, 0).toFixed(4)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tiempo Total</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.floor(
                      llamadas.reduce((sum, l) => {
                        const duracion =
                          new Date(l.endedAt).getTime() -
                          new Date(l.startedAt).getTime();
                        return sum + duracion;
                      }, 0) / 60000,
                    )}
                    m
                  </p>
                </div>
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de Filtrado y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por ID, transcripción o resumen..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Estado:{" "}
                {filtroEstado === "todos"
                  ? "Todos"
                  : obtenerTextoEstado(filtroEstado)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFiltroEstado("todos")}>
                Todos los estados
              </DropdownMenuItem>
              {estadosUnicos.map((estado) => (
                <DropdownMenuItem
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                >
                  {obtenerTextoEstado(estado)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabla de Llamadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Llamadas ({llamadasOrdenadas.length})</span>
            <div className="text-sm text-gray-500">
              Haz clic en una fila para ver los detalles
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => cambiarOrden("fecha")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      <Calendar className="h-4 w-4" />
                      Fecha
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => cambiarOrden("duracion")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      <Clock className="h-4 w-4" />
                      Duración
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Conversación</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Evaluación</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => cambiarOrden("costo")}
                      className="flex items-center gap-1 p-0 h-auto font-medium"
                    >
                      <DollarSign className="h-4 w-4" />
                      Costo
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {llamadasOrdenadas.map((llamada) => (
                  <TableRow
                    key={llamada.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSeleccionarLlamada(llamada)}
                  >
                    <TableCell className="font-mono text-xs">
                      {llamada.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatearFecha(llamada.startedAt)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {llamada.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {formatearDuracion(llamada.startedAt, llamada.endedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={obtenerColorEstado(llamada.status)}
                        variant="outline"
                      >
                        {obtenerTextoEstado(llamada.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm text-gray-600 truncate">
                        {obtenerResumenConversacion(llamada.transcript)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-green-600" />
                        <Bot className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-gray-500 ml-1">
                          {
                            llamada.messages.filter((m) => m.role !== "system")
                              .length
                          }{" "}
                          msgs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {llamada.analysis.successEvaluation === "true" ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Exitosa</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Fallida</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${llamada.cost.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeleccionarLlamada(llamada);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {llamadasOrdenadas.length === 0 && (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No se encontraron llamadas que coincidan con los filtros
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
