"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Phone,
  Clock,
  BarChart2,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  Package,
  ShoppingBag,
  FileText,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Product } from "@prisma/client";
import AssignProductsModal from "@/components/application/chat/assign-products-modal";

// Tipo para los agentes de chat
type ChatAgent = {
  id: string;
  name: string;
  isActive: boolean;
  phoneNumber: string;
  type: string;
  totalMessages: number;
  activeChats: number;
  averageResponseTime: number;
  createdAt: Date;
  products: Product[];
};

interface AgentCardProps {
  agent: ChatAgent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [activeTab, setActiveTab] = useState("products");
  const initials = agent.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const statusColor = agent.isActive ? "bg-emerald-500" : "bg-gray-400";

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case "SALES":
        return "Ventas";
      case "SUPPORT":
        return "Soporte";
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl">
      <div className="relative">
        {/* Decorative header */}
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/60 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {[...Array(10)].map((_, i) => (
                <path
                  key={i}
                  d={`M${i * 10},0 Q${i * 10 + 5},${50 + Math.random() * 20} ${
                    i * 10 + 10
                  },0 V100 H${i * 10} Z`}
                  fill="white"
                  fillOpacity={0.1 + (i % 3) * 0.05}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-6">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-background shadow-md">
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background",
                statusColor
              )}
            ></span>
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <Badge
            variant={agent.isActive ? "default" : "outline"}
            className="px-3 py-1 text-xs font-medium animate-fade-in"
          >
            {agent.isActive ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3 text-muted-foreground" />
            )}
            {agent.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <CardContent className="pt-12 pb-6 px-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-semibold text-xl">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-normal">
                {getAgentTypeLabel(agent.type)}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(agent.createdAt)}
              </span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  <Phone className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <span>{agent.phoneNumber}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Número de teléfono del agente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Stats with animated bars */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center">
                <MessageSquare className="h-3 w-3 mr-1 text-primary" />
                Mensajes
              </span>
              <span className="font-semibold text-sm">
                {agent.totalMessages.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(100, agent.totalMessages / 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center">
                <BarChart2 className="h-3 w-3 mr-1 text-primary" />
                Chats Activos
              </span>
              <span className="font-semibold text-sm">{agent.activeChats}</span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, agent.activeChats * 10)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1 text-primary" />
                Tiempo Resp.
              </span>
              <span className="font-semibold text-sm">
                {agent.averageResponseTime}s
              </span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(
                    100,
                    100 - agent.averageResponseTime * 5
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tabs for different actions */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue={"products"}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-3 mb-4">
            {agent.type === "SALES" && (
              <TabsTrigger value="products" className="text-xs">
                <Package className="h-3.5 w-3.5 mr-1.5" />
                Productos
              </TabsTrigger>
            )}
            <TabsTrigger value="overview" className="text-xs">
              <User className="h-3.5 w-3.5 mr-1.5" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Plantillas
            </TabsTrigger>
          </TabsList>

          {agent.type === "SALES" && (
            <TabsContent value="products" className="mt-0 space-y-3">
              {agent.products.length > 0 ? (
                <Link href={`/application/agents/chat/products/${agent.id}`}>
                  <Button
                    variant="default"
                    className="w-full group hover:shadow-md transition-all"
                  >
                    <span className="flex-1 text-left">Ver mis productos</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Este agente no tiene productos asignados. Agrega productos
                      para que pueda empezar a vender.
                    </p>
                  </div>
                  <AssignProductsModal
                    agentId={agent.id}
                    trigger={
                      <Button
                        variant="default"
                        className="w-full group hover:shadow-md transition-all"
                      >
                        <span className="flex-1 text-left">
                          Asignar productos
                        </span>
                        <Package className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </Button>
                    }
                  />
                </div>
              )}
            </TabsContent>
          )}
          <TabsContent value="overview" className="mt-0 space-y-3">
            <Link
              href={`${
                agent.products.length === 0 && agent.type === "SALES"
                  ? "#"
                  : "/application/agents/chat/conversaciones/${agent.id}"
              }`}
            >
              <Button
                variant="default"
                className="w-full group hover:shadow-md transition-all"
                disabled={agent.products.length === 0 && agent.type === "SALES"}
              >
                <span className="flex-1 text-left">
                  Entrar a conversaciones
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            {agent.type === "SALES" && (
              <Link href={`/application/agents/chat/orders/${agent.id}`}>
                <Button
                  variant="outline"
                  className="w-full group hover:bg-muted/50 transition-all"
                >
                  <span className="flex-1 text-left">
                    Ver todos los pedidos
                  </span>
                  <ShoppingBag className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-0">
            <Link href={`/application/agents/chat/templates/${agent.id}`}>
              <Button
                variant="outline"
                className="w-full group hover:bg-muted/50 transition-all"
              >
                <span className="flex-1 text-left">Gestionar plantillas</span>
                <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
          </TabsContent>
        </Tabs>

        {/* Quick actions dropdown */}
        <div className="mt-4 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Más acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                <span>Editar perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                <span>Ver estadísticas</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={agent.isActive ? "text-red-500" : "text-emerald-500"}
              >
                {agent.isActive ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    <span>Desactivar agente</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Activar agente</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
