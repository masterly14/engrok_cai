"use client";
import type { ButtonComponent, TemplateFormData } from "./types";
import TemplatePreviewDisplay from "@/components/application/whatsapp-template-builder/template-preview";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TemplateComponent } from "@/actions/whatsapp/templates";

interface Step3PreviewProps {
  formData: TemplateFormData;
}

// Function to prepare the JSON payload similar to how it would be sent to the API
// This needs to align with the mapping logic in `whatsapp-actions.ts`
const generateApiPayload = (formData: TemplateFormData) => {
  const { name, category, language } = formData;
  const components = formData.components
    .map((comp) => {
      const newComp: any = { type: comp.type };
      if (comp.format) newComp.format = comp.format;
      if (comp.text !== undefined) newComp.text = comp.text;

      if (
        comp.type === "HEADER" &&
        comp.link &&
        (comp.format === "IMAGE" ||
          comp.format === "VIDEO" ||
          comp.format === "DOCUMENT")
      ) {
        newComp.example = {
          ...(comp.example || {}),
          header_handle: [comp.link],
        };
      } else if (comp.example && Object.keys(comp.example).length > 0) {
        // Filter out empty example arrays for clarity in JSON, though API might accept them
        const cleanExample: any = {};
        if (
          comp.example.header_text &&
          comp.example.header_text.some((s: string) => s)
        )
          cleanExample.header_text = comp.example.header_text;
        if (
          comp.example.header_handle &&
          comp.example.header_handle.some((s: string) => s)
        )
          cleanExample.header_handle = comp.example.header_handle;
        if (
          comp.example.body_text &&
          comp.example.body_text.some((arr: string[]) =>
            arr.some((s: string) => s),
          )
        )
          cleanExample.body_text = comp.example.body_text;
        if (
          comp.example.buttons &&
          comp.example.buttons.some((arr: string[]) =>
            arr.some((s: string) => s),
          )
        )
          cleanExample.buttons = comp.example.buttons;
        if (Object.keys(cleanExample).length > 0)
          newComp.example = cleanExample;
      }

      if (comp.type === "BUTTONS" && comp.buttons && comp.buttons.length > 0) {
        newComp.buttons = comp.buttons.map((btn: ButtonComponent) => {
          const apiBtn: any = { type: btn.type, text: btn.text };
          if (btn.type === "URL" && btn.url) {
            apiBtn.url = btn.url;
            if (
              btn.example &&
              btn.example.length > 0 &&
              btn.example.some((s: string) => s)
            ) {
              // Only add if example has content
              apiBtn.example = btn.example;
            }
          }
          if (btn.type === "PHONE_NUMBER" && btn.phone_number) {
            apiBtn.phone_number = btn.phone_number;
          }
          return apiBtn;
        });
      } else if (
        comp.type === "BUTTONS" &&
        (!comp.buttons || comp.buttons.length === 0)
      ) {
        // If it's a BUTTONS component but no buttons are defined, it shouldn't be sent.
        // However, the component itself might be added to the list.
        // The API usually expects the "buttons" array not to be empty if type is "BUTTONS".
        // Let's assume the UI prevents adding an empty BUTTONS component or this map filters it.
        // For now, if comp.buttons is empty, we still map it, API will validate.
      }
      return newComp;
    })
    .filter((comp: TemplateComponent) => {
      // Filter out BUTTONS component if it has no buttons array or an empty buttons array
      if (
        comp.type === "BUTTONS" &&
        (!comp.buttons || comp.buttons.length === 0)
      ) {
        return false;
      }
      return true;
    });

  return {
    name,
    language,
    category,
    components,
  };
};

export default function Step3Preview({ formData }: Step3PreviewProps) {
  const apiPayload = generateApiPayload(formData);
  const jsonString = JSON.stringify(apiPayload, null, 2);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Previsualización de la Plantilla
        </h3>
        <TemplatePreviewDisplay formData={formData} />
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>JSON de la API</CardTitle>
            <CardDescription>
              Este es el JSON que se enviará a la API de WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonString}
              readOnly
              rows={20}
              className="text-xs font-mono bg-muted/30 max-h-[200px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
