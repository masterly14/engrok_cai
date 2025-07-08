"use client";

import React, { useState, useEffect } from "react";
import {
  getAllLeads,
  CreateUpdateLead,
  deleteLead,
  createTag,
  deleteTag,
  createStage,
  deleteStage,
} from "@/actions/crm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Filter, Save, RefreshCw } from "lucide-react";
import { Lead } from "@/lib/data";
import { toast } from "sonner";

type Props = {
  setIntegrationConnection: (isConnected: boolean) => void;
};

type CRMAction = "get" | "create" | "update" | "delete" | "filter";

const NativeCrmIntegrationComponent = ({ setIntegrationConnection }: Props) => {
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedAction, setSelectedAction] = useState<CRMAction>("get");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    stage: "all",
    tag: "all",
    search: "",
  });

  const [leadForm, setLeadForm] = useState<Lead>({
    id: "",
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "",
    tags: [],
    lastContact: new Date().toISOString().split("T")[0],
    notes: "",
    value: 0,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    try {
      setLoading(true);
      const data = await getAllLeads();
      setLeads(data.leads as Lead[]);
      setStages(data.stages || []);
      setTags(data.tags || []);
      setIntegrationConnection(true);
      toast.success("CRM conectado correctamente");
    } catch (error) {
      console.error("Error loading CRM data:", error);
      toast.error("Error al cargar datos del CRM");
      setIntegrationConnection(false);
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (action: CRMAction) => {
    setSelectedAction(action);
    if (action === "create") {
      setLeadForm({
        id: "",
        name: "",
        company: "",
        email: "",
        phone: "",
        status: stages[0]?.id || "",
        tags: [],
        lastContact: new Date().toISOString().split("T")[0],
        notes: "",
        value: 0,
      });
      setSelectedLead(null);
    }
  };

  const handleCreateUpdateLead = async () => {
    try {
      setLoading(true);
      const leadId = selectedAction === "update" ? selectedLead?.id : undefined;
      await CreateUpdateLead(leadForm, leadId);
      toast.success(
        `Lead ${selectedAction === "create" ? "creado" : "actualizado"} correctamente`,
      );
      await loadCRMData();
      setSelectedAction("get");
    } catch (error) {
      console.error("Error saving lead:", error);
      toast.error(
        `Error al ${selectedAction === "create" ? "crear" : "actualizar"} el lead`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      setLoading(true);
      await deleteLead(leadId);
      toast.success("Lead eliminado correctamente");
      await loadCRMData();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Error al eliminar el lead");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStage =
      filters.stage === "all" || lead.status === filters.stage;
    const matchesTag = filters.tag === "all" || lead.tags.includes(filters.tag);
    const matchesSearch =
      !filters.search ||
      lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.company.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email.toLowerCase().includes(filters.search.toLowerCase());

    return matchesStage && matchesTag && matchesSearch;
  });

  const selectLeadForUpdate = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadForm(lead);
    setSelectedAction("update");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Integración CRM Local de Engrok
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Gestiona y automatiza acciones con tu CRM local
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de acción */}
        <div className="space-y-2">
          <Label>Selecciona una acción</Label>
          <Select
            value={selectedAction}
            onValueChange={(value) => handleActionChange(value as CRMAction)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="get">Obtener Leads</SelectItem>
              <SelectItem value="create">Crear Lead</SelectItem>
              <SelectItem value="update">Actualizar Lead</SelectItem>
              <SelectItem value="delete">Eliminar Lead</SelectItem>
              <SelectItem value="filter">Filtrar Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros */}
        {(selectedAction === "get" || selectedAction === "filter") && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Buscar</Label>
                <Input
                  placeholder="Nombre, empresa o email..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Etapa</Label>
                <Select
                  value={filters.stage}
                  onValueChange={(value) =>
                    setFilters({ ...filters, stage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las etapas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las etapas</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Etiqueta</Label>
                <Select
                  value={filters.tag}
                  onValueChange={(value) =>
                    setFilters({ ...filters, tag: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las etiquetas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las etiquetas</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name}>
                        <Badge
                          style={{ backgroundColor: tag.color, color: "white" }}
                        >
                          {tag.name}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Leads */}
        {(selectedAction === "get" ||
          selectedAction === "filter" ||
          selectedAction === "delete") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Leads ({filteredLeads.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCRMData}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No se encontraron leads
                </p>
              ) : (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h5 className="font-medium">{lead.name}</h5>
                        <p className="text-sm text-gray-600">{lead.company}</p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {stages.find((s) => s.id === lead.status) && (
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor:
                                  stages.find((s) => s.id === lead.status)
                                    ?.color + "20",
                                borderColor: stages.find(
                                  (s) => s.id === lead.status,
                                )?.color,
                                color: stages.find((s) => s.id === lead.status)
                                  ?.color,
                              }}
                            >
                              {stages.find((s) => s.id === lead.status)?.name}
                            </Badge>
                          )}
                          {lead.tags.map((tagName, index) => {
                            const tag = tags.find((t) => t.name === tagName);
                            return tag ? (
                              <Badge
                                key={index}
                                style={{
                                  backgroundColor: tag.color,
                                  color: "white",
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedAction === "delete" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {selectedAction === "get" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => selectLeadForUpdate(lead)}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Formulario de Lead */}
        {(selectedAction === "create" || selectedAction === "update") && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">
              {selectedAction === "create"
                ? "Crear nuevo lead"
                : "Actualizar lead"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={leadForm.name}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, name: e.target.value })
                  }
                  placeholder="Nombre del lead"
                />
              </div>
              <div>
                <Label>Empresa *</Label>
                <Input
                  value={leadForm.company}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, company: e.target.value })
                  }
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, email: e.target.value })
                  }
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={leadForm.phone}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, phone: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label>Etapa</Label>
                <Select
                  value={leadForm.status}
                  onValueChange={(value) =>
                    setLeadForm({ ...leadForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={leadForm.value}
                  onChange={(e) =>
                    setLeadForm({
                      ...leadForm,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={
                        leadForm.tags.includes(tag.name) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      style={{
                        backgroundColor: leadForm.tags.includes(tag.name)
                          ? tag.color
                          : "transparent",
                        color: leadForm.tags.includes(tag.name)
                          ? "white"
                          : tag.color,
                        borderColor: tag.color,
                      }}
                      onClick={() => {
                        if (leadForm.tags.includes(tag.name)) {
                          setLeadForm({
                            ...leadForm,
                            tags: leadForm.tags.filter((t) => t !== tag.name),
                          });
                        } else {
                          setLeadForm({
                            ...leadForm,
                            tags: [...leadForm.tags, tag.name],
                          });
                        }
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Notas</Label>
                <Textarea
                  value={leadForm.notes || ""}
                  onChange={(e) =>
                    setLeadForm({ ...leadForm, notes: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateUpdateLead}
                disabled={
                  loading ||
                  !leadForm.name ||
                  !leadForm.company ||
                  !leadForm.email ||
                  !leadForm.phone
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {selectedAction === "create" ? "Crear Lead" : "Actualizar Lead"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedAction("get")}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Información de configuración para automatización */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Configuración de automatización:</strong> Esta integración
            permite que tu agente de voz interactúe directamente con tu CRM
            local para crear, actualizar, obtener y eliminar leads
            automáticamente durante las llamadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NativeCrmIntegrationComponent;
