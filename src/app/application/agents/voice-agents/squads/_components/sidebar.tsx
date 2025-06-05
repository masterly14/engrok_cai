"use client";

import * as React from "react";
import { Plus, Search, Users as UsersIcon, Check, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAllSquads } from "../../../../../../hooks/use-all-squads";
import { useSquad } from "@/context/squad-context";
import { cn } from "@/lib/utils";
import { useAllAgents } from "@/hooks/use-all-agents";

export function Sidebar() {
  const { squadData, squadLoading, squadError } = useAllSquads();
  const { selectedSquad, setSelectedSquad, setIsCreatingNew } = useSquad();
  const { agentsData } = useAllAgents();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredSquads = React.useMemo(() => {
    if (!Array.isArray(squadData)) return [];
    return squadData.filter((squad) => squad.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [squadData, searchTerm]);

  const handleSquadSelect = (squad: any) => {
    setSelectedSquad(squad);
    setIsCreatingNew(false);
  };

  const handleNewSquad = () => {
    if (Array.isArray(agentsData) && agentsData.length < 2) {
      toast.warning("Necesitas al menos dos agentes para crear un Squad");
      return;
    }
    setSelectedSquad(null);
    setIsCreatingNew(true);
    toast.info("Iniciando creación de nuevo squad...");

    if (typeof window !== "undefined" && typeof (window as any).openVoiceAgentTemplateDialog === "function") {
      try {
        (window as any).openVoiceAgentTemplateDialog();
      } catch (error) {
        console.error("Error calling openVoiceAgentTemplateDialog:", error);
        toast.error("Error al intentar abrir el diálogo de plantilla.");
      }
    }
  };

  return (
    <div className="h-screen w-[280px] bg-white border-r border-gray-200 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
              <UsersIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900">Squads</h2>
              <p className="text-xs text-gray-500">Gestiona tus squads</p>
            </div>
          </div>

          {/* Botón Nuevo */}
          <div className="px-4 pb-4">
            <Button
              onClick={handleNewSquad}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 border-0"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Squad
            </Button>
          </div>

          {/* Buscador */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar squads..."
                className="pl-9 bg-gray-50 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm rounded-lg text-gray-900 placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50/30">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <UsersIcon className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                TUS SQUADS ({filteredSquads.length})
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {squadLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-gray-500 mt-3">Cargando squads...</p>
                  </div>
                </div>
              ) : squadError ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4 ring-1 ring-red-100">
                    <UsersIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-600 text-center mb-1">Error al cargar squads</p>
                  <p className="text-xs text-red-500 text-center">Intenta recargar la página</p>
                </div>
              ) : filteredSquads.length > 0 ? (
                filteredSquads.map((squad) => {
                  const isSelected = selectedSquad?.id === squad.id;

                  return (
                    <div
                      key={squad.id}
                      onClick={() => handleSquadSelect(squad)}
                      className={cn(
                        "group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                        isSelected
                          ? "bg-teal-50 border-teal-200 shadow-sm"
                          : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200",
                            isSelected ? "bg-teal-600 shadow-sm" : "bg-gray-100 group-hover:bg-gray-200",
                          )}
                        >
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={cn(
                                "text-sm font-medium transition-colors",
                                isSelected ? "text-gray-900" : "text-gray-800",
                              )}
                            >
                              {squad.name}
                            </p>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-teal-600 shadow-sm animate-pulse" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <UsersIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 text-center mb-2">
                    {searchTerm ? "No se encontraron squads" : "No tienes squads aún"}
                  </p>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    {searchTerm
                      ? "Intenta con otro término de búsqueda"
                      : "Crea tu primer squad para comenzar"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
