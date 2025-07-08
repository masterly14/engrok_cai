"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAllLeads } from "@/hooks/use-all-leads";
import {
  MessageSquare,
  Users,
  UserPlus,
  LayoutTemplateIcon as TemplateIcon,
  Send,
  Phone,
  User,
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";

interface ChatAgent {
  id: string;
  name: string;
}

interface ChatContact {
  id: string;
  phone: string;
  name: string | null;
}

interface ChatTemplate {
  id: string;
  name: string;
  language: string;
  components: any;
  category: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
}

type PlaceholderOption = "contact.name" | "contact.phone" | "static";

export default function CampaignPage() {
  /* ------------------------------------------------------------------ */
  /* State                                                              */
  /* ------------------------------------------------------------------ */
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set(),
  );

  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, { type: PlaceholderOption; value: string }>
  >({});

  const [sending, setSending] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [searchLead, setSearchLead] = useState("");

  const { leadsData, leadsLoading } = useAllLeads(!!selectedAgentId);

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
    new Set(),
  );

  /* ------------------------------------------------------------------ */
  /* Computed values                                                    */
  /* ------------------------------------------------------------------ */
  const filteredContacts = contacts.filter(
    (contact) =>
      !searchContact ||
      contact.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
      contact.phone.includes(searchContact),
  );

  const filteredLeads = leadsData.filter(
    (lead: Lead) =>
      !searchLead ||
      lead.name?.toLowerCase().includes(searchLead.toLowerCase()) ||
      lead.phone?.includes(searchLead),
  );

  const totalSelected = selectedContactIds.size + selectedLeadIds.size;
  const canSend = selectedAgentId && selectedTemplateId && totalSelected > 0;

  /* ------------------------------------------------------------------ */
  /* Fetch helpers                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    // Load user chat agents
    setAgentsLoading(true);
    fetch("/api/chat-agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => toast.error("Error cargando agentes"))
      .finally(() => setAgentsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;

    // Load contacts
    setContactsLoading(true);
    fetch(`/api/chat/broadcast/contacts?agentId=${selectedAgentId}`)
      .then((r) => r.json())
      .then((d) => setContacts(d.data || []))
      .catch(() => toast.error("Error cargando contactos"))
      .finally(() => setContactsLoading(false));

    // Load templates
    setTemplatesLoading(true);
    fetch(`/api/chat/broadcast/templates?agentId=${selectedAgentId}`)
      .then((r) => r.json())
      .then((d) => setTemplates(d.data || []))
      .catch(() => toast.error("Error cargando plantillas"))
      .finally(() => setTemplatesLoading(false));

    // reset selections
    setSelectedContactIds(new Set());
    setSelectedTemplateId("");
    setPlaceholders([]);
    setPlaceholderValues({});
    setSelectedLeadIds(new Set());
    setSearchContact("");
    setSearchLead("");
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedTemplateId) return;

    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) return;

    // Extraer placeholders del cuerpo BODY
    let bodyText = "";
    const comps =
      typeof tpl.components === "string"
        ? JSON.parse(tpl.components)
        : tpl.components;
    const bodyComp = comps?.find((c: any) => c.type === "BODY");

    if (tpl.category === "AUTHENTICATION") {
      bodyText = "Tu código es {{1}}"; // genérico
    } else {
      bodyText = bodyComp?.text || "";
    }

    const regex = /\{\{\s*(\d+)\s*\}\}/g;
    const phSet = new Set<string>();
    let m;
    while ((m = regex.exec(bodyText)) !== null) {
      phSet.add(m[1]);
    }

    const phArr = Array.from(phSet);
    setPlaceholders(phArr);

    // Init values if not present
    const newVals: Record<string, { type: PlaceholderOption; value: string }> =
      {};
    phArr.forEach((ph) => {
      newVals[ph] = placeholderValues[ph] || { type: "static", value: "" };
    });
    setPlaceholderValues(newVals);
  }, [selectedTemplateId]);

  /* ------------------------------------------------------------------ */
  /* Handlers                                                           */
  /* ------------------------------------------------------------------ */
  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLead = (id: string, phone: string | null) => {
    if (!phone) return;
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllContacts = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const selectAllLeads = () => {
    const selectableLeads = filteredLeads.filter((l: Lead) => l.phone);
    if (selectedLeadIds.size === selectableLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(selectableLeads.map((l: Lead) => l.id)));
    }
  };

  const handlePlaceholderTypeChange = (ph: string, type: PlaceholderOption) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [ph]: { type, value: type === "static" ? prev[ph]?.value || "" : "" },
    }));
  };

  const handlePlaceholderValueChange = (ph: string, value: string) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [ph]: { ...prev[ph], value },
    }));
  };

  const handleSend = async () => {
    if (!canSend) {
      toast.error("Selecciona al menos un contacto o lead");
      return;
    }

    setSending(true);

    try {
      // Build templateVariableValues
      const tplValues: Record<string, string> = {};
      placeholders.forEach((ph) => {
        const conf = placeholderValues[ph];
        if (!conf) return;

        if (conf.type === "contact.name") tplValues[ph] = "{{contact.name}}";
        else if (conf.type === "contact.phone")
          tplValues[ph] = "{{contact.phone}}";
        else tplValues[ph] = conf.value;
      });

      const tpl = templates.find((t) => t.id === selectedTemplateId)!;
      const nodeData = {
        responseType: "template",
        templateName: tpl.name,
        templateLanguage: tpl.language,
        templateVariableValues: tplValues,
      } as any;

      // Extraer teléfonos de leads seleccionados con número válido
      const leadPhones = leadsData
        .filter((l: Lead) => selectedLeadIds.has(l.id) && l.phone)
        .map((l: Lead) => l.phone as string);

      const payload = {
        agentId: selectedAgentId,
        contactIds: Array.from(selectedContactIds),
        phoneNumbers: leadPhones,
        nodeData,
      };

      const res = await fetch("/api/chat/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Envío encolado correctamente");
        // reset
        setSelectedContactIds(new Set());
        setSelectedTemplateId("");
        setSelectedLeadIds(new Set());
      } else {
        const { error } = await res.json();
        toast.error(error || "Error en el envío");
      }
    } catch (error) {
      toast.error("Error en el envío");
    } finally {
      setSending(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Nueva Difusión WhatsApp
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Envía mensajes masivos a tus contactos y leads de forma
            personalizada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Selection */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Seleccionar Agente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedAgentId}
                    onValueChange={setSelectedAgentId}
                  >
                    <SelectTrigger className="w-full border-slate-200 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Selecciona un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Template Selection */}
            {selectedAgentId && (
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TemplateIcon className="h-5 w-5 text-purple-600" />
                    Plantilla de Mensaje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedTemplateId}
                      onValueChange={setSelectedTemplateId}
                    >
                      <SelectTrigger className="w-full border-slate-200 focus:border-purple-500 transition-colors">
                        <SelectValue placeholder="Selecciona una plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <span>{t.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {t.language}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Variables Configuration */}
            {placeholders.length > 0 && (
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Variables del Mensaje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {placeholders.map((ph) => {
                    const conf = placeholderValues[ph] || {
                      type: "static",
                      value: "",
                    };
                    return (
                      <div
                        key={ph}
                        className="p-4 bg-slate-50 rounded-lg space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {`{{${ph}}}`}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Select
                            value={conf.type}
                            onValueChange={(val) =>
                              handlePlaceholderTypeChange(
                                ph,
                                val as PlaceholderOption,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="static">
                                Texto personalizado
                              </SelectItem>
                              <SelectItem value="contact.name">
                                Nombre contacto
                              </SelectItem>
                              <SelectItem value="contact.phone">
                                Teléfono contacto
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {conf.type === "static" && (
                            <Input
                              placeholder="Ingresa el texto..."
                              value={conf.value}
                              onChange={(e) =>
                                handlePlaceholderValueChange(ph, e.target.value)
                              }
                              className="border-slate-200 focus:border-blue-500 transition-colors"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Recipients */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Contactos:</span>
                  <Badge className="bg-green-600">
                    {selectedContactIds.size}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Leads:</span>
                  <Badge className="bg-green-600">{selectedLeadIds.size}</Badge>
                </div>
                <div className="border-t border-green-200 pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-green-800">Total:</span>
                    <Badge className="bg-green-700 text-lg px-3 py-1">
                      {totalSelected}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!canSend || sending}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Difusión
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Recipients Selection */}
        {selectedAgentId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contacts */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    Contactos ({selectedContactIds.size})
                  </CardTitle>
                  {contacts.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllContacts}
                      className="text-xs bg-transparent"
                    >
                      {selectedContactIds.size === filteredContacts.length
                        ? "Deseleccionar"
                        : "Seleccionar"}{" "}
                      todos
                    </Button>
                  )}
                </div>
                {contacts.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar contactos..."
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {contactsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : filteredContacts.length > 0 ? (
                    filteredContacts.map((c) => (
                      <div
                        key={c.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-slate-50 ${
                          selectedContactIds.has(c.id)
                            ? "bg-blue-50 border-blue-200"
                            : "border-slate-200"
                        }`}
                        onClick={() => toggleContact(c.id)}
                      >
                        <Checkbox
                          checked={selectedContactIds.has(c.id)}
                          onChange={() => toggleContact(c.id)}
                          className="pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {c.name || "Sin nombre"}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No se encontraron contactos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leads */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="h-5 w-5 text-orange-600" />
                    Leads ({selectedLeadIds.size})
                  </CardTitle>
                  {leadsData.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllLeads}
                      className="text-xs bg-transparent"
                    >
                      {selectedLeadIds.size ===
                      filteredLeads.filter((l: Lead) => l.phone).length
                        ? "Deseleccionar"
                        : "Seleccionar"}{" "}
                      todos
                    </Button>
                  )}
                </div>
                {leadsData.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar leads..."
                      value={searchLead}
                      onChange={(e) => setSearchLead(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-orange-500 transition-colors"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {leadsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : filteredLeads.length > 0 ? (
                    filteredLeads.map((l: Lead) => (
                      <div
                        key={l.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                          l.phone
                            ? "cursor-pointer hover:bg-slate-50"
                            : "opacity-50 cursor-not-allowed"
                        } ${selectedLeadIds.has(l.id) ? "bg-orange-50 border-orange-200" : "border-slate-200"}`}
                        onClick={() => l.phone && toggleLead(l.id, l.phone)}
                      >
                        <Checkbox
                          checked={selectedLeadIds.has(l.id)}
                          disabled={!l.phone}
                          onChange={() => toggleLead(l.id, l.phone)}
                          className="pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {l.name || "Lead sin nombre"}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Phone className="h-3 w-3" />
                            {l.phone || "Sin teléfono"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No se encontraron leads</p>
                    </div>
                  )}
                </div>
                {!leadsLoading && (
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Los leads sin número de teléfono no se pueden seleccionar
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
