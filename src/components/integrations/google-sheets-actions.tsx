"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { useReactFlow } from "reactflow";
import { IntegrationNodeData } from "@/app/application/agents/voice-agents/workflows/types";

/* -------------------------------- Types -------------------------------- */
interface Props {
  data: IntegrationNodeData;
  onDataChange: (data: Partial<IntegrationNodeData>) => void;
  userId: string | null;
}

/* ---------------------------------------------------------------------- */
const GoogleSheetsActions = ({ data, onDataChange, userId }: Props) => {
  /* ---------------------------- Local states --------------------------- */
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* ------------------------ Variables from workflow -------------------- */
  const reactFlowInstance = useReactFlow();
  const variablesList = useMemo(() => {
    const vars: string[] = [];
    reactFlowInstance.getNodes().forEach((n: any) => {
      if (n.data.type === "conversation") {
        (n.data.variables || []).forEach((v: any) => {
          if (v.name && !vars.includes(v.name)) vars.push(v.name);
        });
      }
    });
    return vars;
  }, [reactFlowInstance]);

  const VariableSelect = ({ onSelect }: { onSelect: (v: string) => void }) => {
    if (variablesList.length === 0) return null;
    return (
      <Select onValueChange={onSelect}>
        <SelectTrigger className="h-8 w-8 border-gray-300 ml-2 p-0 flex items-center justify-center">
          <ChevronDown className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent>
          {variablesList.map((v) => (
            <SelectItem key={v} value={v} className="cursor-pointer">
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  /* ------------------------------ Effects ------------------------------ */
  // Fetch spreadsheets list
  useEffect(() => {
    const fetchSpreadsheets = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/integrations/sheets?userId=${userId}&action=listSpreadsheets`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        setSpreadsheets(Array.isArray(result) ? result : []);
      } catch (err) {
        toast.error("Error al obtener hojas de cálculo");
        setSpreadsheets([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpreadsheets();
  }, [userId]);

  // Fetch sheets (tabs) when spreadsheetId changes
  useEffect(() => {
    const fetchSheets = async () => {
      if (!data.spreadsheetId || !userId) return;
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/integrations/sheets?userId=${userId}&action=listSheets&spreadsheetId=${data.spreadsheetId}`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        setSheets(Array.isArray(result) ? result : []);
      } catch (err) {
        toast.error("Error al obtener las pestañas del documento");
        setSheets([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSheets();
  }, [data.spreadsheetId, userId]);


  return (
    <div className="space-y-6">
        {/* Spreadsheet selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Hoja de cálculo
          </Label>
          <Select onValueChange={(value) => onDataChange({ spreadsheetId: value })} value={data.spreadsheetId || ''}>
            <SelectTrigger className="w-full border-emerald-200">
              <SelectValue placeholder="Selecciona un documento" />
            </SelectTrigger>
            <SelectContent>
              {spreadsheets.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sheet selection */}
        {data.spreadsheetId && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Pestaña</Label>
            <Select onValueChange={(value) => onDataChange({ sheetName: value })} value={data.sheetName || ''}>
              <SelectTrigger className="w-full border-emerald-200">
                <SelectValue placeholder="Selecciona una pestaña" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((sh) => (
                  <SelectItem key={sh.properties.title} value={sh.properties.title}>
                    {sh.properties.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Column and value */}
        {data.sheetName && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Columna (ej. A, B, C)</Label>
              <input
                type="text"
                value={data.column || "A"}
                onChange={(e) => onDataChange({ column: e.target.value.toUpperCase() })}
                maxLength={2}
                className="border rounded px-2 py-1 text-sm w-20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Valor a insertar
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={data.value || ''}
                  onChange={(e) => onDataChange({ value: e.target.value })}
                  className="border rounded px-2 py-1 text-sm flex-1"
                />
                <VariableSelect onSelect={(v) => onDataChange({ value: `{{${v}}}` })} />
              </div>
            </div>
          </>
        )}
      </div>
  );
};

export default GoogleSheetsActions; 