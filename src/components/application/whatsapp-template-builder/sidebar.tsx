"use client";
import { ChevronsUpDown, HelpCircle, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SUPPORTED_LANGUAGES, type Language } from "./types";
import type { ChatAgentWithWorkflows } from "@/types/agent";

interface SidebarProps {
  agents: ChatAgentWithWorkflows[];
  selectedWabaId: string;
  onWabaChange: (wabaId: string) => void;
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  templateQuotaUsed: number;
  templateQuotaMax: number;
}

export default function TemplateBuilderSidebar({
  agents,
  selectedWabaId,
  onWabaChange,
  selectedLanguage,
  onLanguageChange,
  templateQuotaUsed,
  templateQuotaMax,
}: SidebarProps) {
  const wabaAccounts = agents
    .filter((a) => a.whatsappBusinessAccountId)
    .map((a) => ({ id: a.whatsappBusinessAccountId as string, name: a.name }));

  return (
    <aside className="w-80 border-r bg-muted/40 p-6 flex flex-col gap-6 fixed h-full">
      <div>
        <Label htmlFor="waba-select">WhatsApp Business Account. (Agente)</Label>
        <Select value={selectedWabaId} onValueChange={onWabaChange}>
          <SelectTrigger id="waba-select">
            <SelectValue placeholder="Seleccionar WABA..." />
          </SelectTrigger>
          <SelectContent>
            {wabaAccounts.map((waba) => (
              <SelectItem key={waba.id} value={waba.id}>
                {waba.name} ({waba.id.substring(0, 10)}...)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="language-select">Idioma de la Plantilla</Label>
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger id="language-select">
            <SelectValue placeholder="Seleccionar Idioma..." />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {SUPPORTED_LANGUAGES.map((lang: Language) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name} ({lang.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-1">Cuota de Plantillas</h3>
        <p className="text-sm text-muted-foreground">
          Usadas: {templateQuotaUsed} / {templateQuotaMax}
        </p>
        <div className="w-full bg-muted rounded-full h-2.5 mt-1">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{
              width: `${(templateQuotaUsed / templateQuotaMax) * 100}%`,
            }}
          />
        </div>
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="justify-between w-full px-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Ayuda y Lineamientos
            </div>
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2 pl-2">
          <Link
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates"
            target="_blank"
            className="block text-sm hover:underline"
          >
            Guía de Plantillas de Mensajes
          </Link>
          <Link
            href="https://developers.facebook.com/docs/whatsapp/message-templates/guidelines"
            target="_blank"
            className="block text-sm hover:underline"
          >
            Normas para Plantillas
          </Link>
          <Link
            href="https://business.whatsapp.com/products/message-templates"
            target="_blank"
            className="block text-sm hover:underline"
          >
            Visión General de Plantillas
          </Link>
        </CollapsibleContent>
      </Collapsible>

      <Button
        variant="outline"
        className="mt-auto bg-background text-foreground"
      >
        <LayoutGrid className="mr-2 h-4 w-4" />
        Ver Mis Plantillas
      </Button>
    </aside>
  );
}
