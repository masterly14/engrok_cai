"use client";

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAllLeads } from "@/hooks/use-all-leads";

interface ChatAgent {
  id: string;
  name: string;
}

interface ChatContact {
  id: string;
  phone: string;
  name: string | null;
}

interface Template {
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
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [placeholders, setPlaceholders] = useState<string[]>([]); // ["1","2",…]
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, { type: PlaceholderOption; value: string }>>({});

  const {
    leadsData,
    leadsLoading,
  } = useAllLeads(!!selectedAgentId);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  /* ------------------------------------------------------------------ */
  /* Fetch helpers                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    // Load user chat agents
    fetch("/api/chat-agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => toast.error("Error cargando agentes"));
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;

    // Load contacts
    fetch(`/api/chat/broadcast/contacts?agentId=${selectedAgentId}`)
      .then((r) => r.json())
      .then((d) => setContacts(d.data || []))
      .catch(() => toast.error("Error cargando contactos"));

    // Load templates
    fetch(`/api/chat/broadcast/templates?agentId=${selectedAgentId}`)
      .then((r) => r.json())
      .then((d) => setTemplates(d.data || []))
      .catch(() => toast.error("Error cargando plantillas"));

    // reset selections
    setSelectedContactIds(new Set());
    setSelectedTemplateId("");
    setPlaceholders([]);
    setPlaceholderValues({});
    setSelectedLeadIds(new Set());
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) return;

    // Extraer placeholders del cuerpo BODY
    let bodyText = "";
    const comps = typeof tpl.components === "string" ? JSON.parse(tpl.components) : tpl.components;
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
    const newVals: Record<string, { type: PlaceholderOption; value: string }> = {};
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
    if (!phone) return; // no selectable if phone missing
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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
    if (!selectedAgentId || !selectedTemplateId || (selectedContactIds.size === 0 && selectedLeadIds.size === 0)) {
      toast.error("Selecciona al menos un contacto o lead");
      return;
    }

    // Build templateVariableValues
    const tplValues: Record<string, string> = {};
    placeholders.forEach((ph) => {
      const conf = placeholderValues[ph];
      if (!conf) return;
      if (conf.type === "contact.name") tplValues[ph] = "{{contact.name}}";
      else if (conf.type === "contact.phone") tplValues[ph] = "{{contact.phone}}";
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
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Nueva Difusión WhatsApp</h1>

      {/* Agent selector */}
      <div className="space-y-2">
        <label className="font-medium">Agente</label>
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona agente" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts list */}
      {selectedAgentId && (
        <div className="space-y-2">
          <label className="font-medium">Contactos ({selectedContactIds.size})</label>
          <div className="border rounded p-4 max-h-60 overflow-y-auto space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center space-x-2">
                <Checkbox checked={selectedContactIds.has(c.id)} onCheckedChange={() => toggleContact(c.id)} />
                <span>{c.name || c.phone}</span>
                <span className="text-sm text-muted-foreground ml-auto">{c.phone}</span>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-sm text-muted-foreground">Sin contactos</p>}
          </div>
        </div>
      )}

      {/* Leads list */}
      {selectedAgentId && (
        <div className="space-y-2">
          <label className="font-medium">Leads ({selectedLeadIds.size})</label>
          <div className="border rounded p-4 max-h-60 overflow-y-auto space-y-2">
            {leadsLoading && <p className="text-sm">Cargando leads…</p>}
            {!leadsLoading && leadsData.map((l: any) => (
              <div key={l.id} className="flex items-center space-x-2 opacity-100">
                <Checkbox
                  checked={selectedLeadIds.has(l.id)}
                  disabled={!l.phone}
                  onCheckedChange={() => toggleLead(l.id, l.phone)}
                />
                <span>{l.name || l.phone || "Lead sin nombre"}</span>
                <span className="text-sm text-muted-foreground ml-auto">{l.phone || "—"}</span>
              </div>
            ))}
            {!leadsLoading && leadsData.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin leads</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Los leads sin número de teléfono no se pueden seleccionar.</p>
        </div>
      )}

      {/* Template selector */}
      {selectedAgentId && (
        <div className="space-y-2">
          <label className="font-medium">Plantilla</label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona plantilla" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Placeholder mapping */}
      {placeholders.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-medium">Variables</h2>
          {placeholders.map((ph) => {
            const conf = placeholderValues[ph] || { type: "static", value: "" };
            return (
              <div key={ph} className="flex items-center space-x-4">
                <span className="w-24">{`{{${ph}}}`}</span>
                <Select value={conf.type} onValueChange={(val) => handlePlaceholderTypeChange(ph, val as PlaceholderOption)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Texto personalizado</SelectItem>
                    <SelectItem value="contact.name">Nombre contacto</SelectItem>
                    <SelectItem value="contact.phone">Teléfono contacto</SelectItem>
                  </SelectContent>
                </Select>
                {conf.type === "static" && (
                  <Input
                    placeholder="Texto..."
                    value={conf.value}
                    onChange={(e) => handlePlaceholderValueChange(ph, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={handleSend} disabled={!selectedAgentId || !selectedTemplateId || (selectedContactIds.size === 0 && selectedLeadIds.size === 0)}>
        Enviar Difusión
      </Button>
    </div>
  );
}
