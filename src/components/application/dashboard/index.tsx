"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Clock,
  CreditCard,
  Filter,
  Phone,
  PhoneCall,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { onBoardUser } from "@/actions/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useInfoElevenlabs } from "@/hooks/use-info-elevenlabs";
import { getAllCalls } from "@/actions/elevenlabs";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("Last month");
  const [agentFilter, setAgentFilter] = useState("All agents");
  const [userId, setUserId] = useState<string>("");
  const [agents, setAgents] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const data: { date: string; calls: number }[] = [];

  function getTimeOfDay(): string {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
      return "días";
    } else if (hours >= 12 && hours < 18) {
      return "tardes";
    } else {
      return "noches";
    }
  }

  function secondsConvert(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingMinutes = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingMinutes
    ).padStart(2, "0")}`;
  }

  useEffect(() => {
    const getUserId = async () => {
      const user = await onBoardUser();
      if (user?.agents?.length === 0) {
        setIsOpen(true);
      }
      if (user?.status === 200) {
        setUserId(user.data.id);
      }
    };

    getUserId();
  }, []);
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async () => {
      const refresh = getAllCalls(userId);
      return refresh;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statisticalKey"] });
    },
  });

  const { statisticalData, statisticalError, statisticalLoading } =
    useInfoElevenlabs(userId);

  {
    statisticalLoading && <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background px-6">
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-muted-foreground opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Llamadas activas: 0
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => createMutation.mutate()}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </header>
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {/* Funcion para obtener si es morning, afternoon, evening*/}
            <h2 className="text-3xl font-bold tracking-tight">
              Buenas {getTimeOfDay()}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-center p-2">
              Las estadísticas se actualizan automáticamente cada 10 minutos
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <Filter className="h-4 w-4" />
                  {agentFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2">
                <p className="text-xs">Características en progreso</p>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  {/* Función de filtración de fechas */}
                  <Clock className="h-4 w-4" />
                  {timeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-2">
                <p className="text-xs">Características en progreso</p>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Número de llamadas
                  </CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {statisticalLoading ? (
                      <LoadingSpinner />
                    ) : (
                      statisticalData?.conversations?.totalConversations ?? 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {/* Porcentaje de llamadas en el ultimo día. */}
                    from previous period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {/* Duración promedio de llamadas */}
                    Duración promedio
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {statisticalLoading ? (
                      <LoadingSpinner />
                    ) : (
                      secondsConvert(
                        statisticalData?.conversations?.totalAverageDuration ??
                          0
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    from previous period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Costo total
                    {/*Función para obtener el costo en creditos de cada llamada. */}
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {statisticalLoading ? (
                      <LoadingSpinner />
                    ) : (
                      statisticalData?.conversations?.totalCost ?? 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">credits</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                      Costo promedio
                    {/* Costo promedio del total de llamadas*/}
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {statisticalLoading ? (
                      <LoadingSpinner />
                    ) : (
                      Math.floor(
                        (statisticalData?.conversations?.totalCost || 0) /
                          (statisticalData?.conversations?.totalConversations ||
                            1)
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">creditos/llamada</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Actividad de llamadas</CardTitle>
                <CardDescription>
                  Volumen y duración de llamadas a lo largo del tiempo
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
