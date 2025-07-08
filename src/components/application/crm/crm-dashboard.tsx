"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Stage, Tag } from "@/lib/data";
import { KanbanBoard } from "./kanban-board";
import { LeadDetailModal } from "./lead-detail-modal";
import { AddLeadModal } from "./add-lead-modal";
import { SettingsModal } from "./settings-modal";
import { useAllLeads } from "@/hooks/use-all-leads";
import { CreateUpdateLead } from "@/actions/crm";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CrmDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // Update leads when stages are deleted or renamed

  const {
    leadsData,
    stagesData,
    tagsData,
    leadsLoading,
    leadsError,
    leadsFetching,
  } = useAllLeads();

  // Update state with data from the hook
  useEffect(() => {
    if (!leadsLoading && !leadsError) {
      console.log("Data del server", {
        leads: leadsData,
        etapas: stagesData,
        etiquetas: tagsData,
      });

      // Update regardless of array length
      if (Array.isArray(stagesData)) {
        setStages(stagesData);
      }

      if (Array.isArray(tagsData)) {
        setTags(tagsData);
      }

      if (leadsData) {
        const mappedLeads: Lead[] = leadsData.map((lead) => ({
          ...lead,
          notes: lead.notes ?? undefined,
          value: lead.value ?? undefined,
          status: lead.status ?? stagesData[0]?.id ?? "new",
        }));

        setLeads(mappedLeads);
      }
    }

    if (leadsError) {
      console.error("Error loading leads:", leadsError);
    }
  }, [leadsLoading, leadsData, stagesData, tagsData, leadsError]);

  useEffect(() => {
    const stageIds = stages.map((stage) => stage.id);
    const updatedLeads = leads.map((lead) => {
      if (!lead.status || !stageIds.includes(lead.status)) {
        return { ...lead, status: stages[0]?.id || "new" };
      }
      return lead;
    });
    setLeads(updatedLeads);
  }, [stages]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(
      leads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead)),
    );
    setSelectedLead(null);
    setIsDetailModalOpen(false);
  };

  const queryClient = useQueryClient();

  const createLeadMutation = useMutation({
    mutationFn: async (newLead: Lead) => {
      try {
        const response = await CreateUpdateLead(newLead);
        return response;
      } catch (error) {
        console.error("Error creating lead:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead creado correctamente	!");
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (Lead: Lead) => {
      try {
        const response = await CreateUpdateLead(Lead, Lead.id);
        return response;
      } catch (error) {
        console.error("Error actualizando lead:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handleAddLead = (newLead: Lead) => {
    createLeadMutation.mutate(newLead);
    setIsAddModalOpen(false);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const updatedLeads = [...leads];
    const movedLead = updatedLeads.find(
      (lead) => lead.id === result.draggableId,
    );

    if (movedLead) {
      // Guardar el estado anterior por si hay errores
      const previousStatus = movedLead.status;

      // Actualizar el estado localmente para una respuesta inmediata en la UI
      movedLead.status = result.destination.droppableId;
      setLeads(updatedLeads);

      // Usar la mutación existente para persistir el cambio en el servidor
      updateLeadMutation.mutateAsync(movedLead);
    }
  };

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());

    // Tag filters
    const matchesTags =
      activeFilters.length === 0 ||
      lead.tags.some((tag) => activeFilters.includes(tag));

    return matchesSearch && matchesTags;
  });

  // Get all unique tag names from the tags array
  const allTagNames = tags.map((tag) => tag.name);

  // Handle tag updates
  const handleTagsUpdate = (updatedTags: Tag[]) => {
    setTags(updatedTags);

    // Update leads with deleted tags
    const tagNames = updatedTags.map((tag) => tag.name);
    const updatedLeads = leads.map((lead) => {
      const filteredTags = lead.tags.filter((tag) => tagNames.includes(tag));
      return { ...lead, tags: filteredTags };
    });
    setLeads(updatedLeads);
  };

  // Handle stages updates
  const handleStagesUpdate = (updatedStages: Stage[]) => {
    setStages(updatedStages);
  };

  useEffect(() => {
    if (leadsData) {
      const mappedLeads: Lead[] = leadsData.map((lead) => ({
        ...lead,
        notes: lead.notes ?? undefined,
        value: lead.value ?? undefined,
        status: lead.status ?? stages[0]?.id ?? "new",
      }));

      setLeads(mappedLeads);
    }
  }, [leadsData, stages]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Gestión de leads</h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar leads..."
                className="pl-8 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="h-4 w-4" />
                    Filtrar por
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1 rounded-full">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filtrar por etiquetas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tags.map((tag) => (
                    <DropdownMenuItem
                      key={tag.name}
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleFilter(tag.name)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                      {activeFilters.includes(tag.name) && (
                        <Badge variant="secondary" className="ml-2">
                          Activo
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                size="sm"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Agregar lead
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFilters.map((filter) => {
              const tagData = tags.find((tag) => tag.name === filter);
              return (
                <Badge
                  key={filter}
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{
                    borderColor: tagData?.color,
                    backgroundColor: `${tagData?.color}20`, // 20% opacity
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: tagData?.color }}
                  />
                  {filter}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleFilter(filter)}
                  />
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setActiveFilters([])}
            >
              Limpiar todos
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-auto p-4 bg-muted/30",
          activeFilters.length > 0 ? "pt-2" : "pt-4",
        )}
      >
        {leadsLoading ? (
          <LoadingSpinner variant="ghost" />
        ) : (
          <KanbanBoard
            leads={filteredLeads}
            stages={stages}
            tags={tags}
            onLeadClick={handleLeadClick}
            onDragEnd={handleDragEnd}
          />
        )}
      </main>

      {/* Modals */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          tags={tags}
          stages={stages}
          open={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLead(null);
          }}
          onUpdate={handleLeadUpdate}
        />
      )}

      <AddLeadModal
        open={isAddModalOpen}
        tags={tags}
        stages={stages}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLead}
      />

      <SettingsModal
        leads={filteredLeads}
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tags={tags}
        stages={stages}
        onTagsUpdate={handleTagsUpdate}
        onStagesUpdate={handleStagesUpdate}
      />
    </div>
  );
}
