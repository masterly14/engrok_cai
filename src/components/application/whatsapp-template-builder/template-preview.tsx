"use client";

import type React from "react";
import { Smartphone, Monitor, MessageSquareText } from "lucide-react";
import type { TemplateFormData } from "./types"; // Ensure path is correct
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ButtonComponent,
  TemplateComponent,
} from "@/actions/whatsapp/templates";

interface TemplatePreviewProps {
  formData: TemplateFormData;
  viewMode?: "ios" | "android" | "desktop";
}

// Helper to replace placeholders like {{1}} with example values
const fillPlaceholders = (text = "", examples: string[] = []): string => {
  let result = text;
  examples.forEach((example, i) => {
    result = result.replace(
      new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"),
      example || `{{${i + 1}}}`,
    );
  });
  return result;
};

const fillUrlPlaceholders = (url = "", examples: string[] = []): string => {
  let result = url;
  examples.forEach((example, i) => {
    result = result.replace(
      new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"),
      example || `{{${i + 1}}}`,
    );
  });
  // For any remaining {{n}} not covered by examples, keep them as is or show a generic placeholder
  result = result.replace(/\{\{(\d+)\}\}/g, "[variable]");
  return result;
};

const IosPreview: React.FC<{ formData: TemplateFormData }> = ({ formData }) => {
  const headerComp = formData.components.find(
    (c: TemplateComponent) => c.type === "HEADER",
  );
  const bodyComp = formData.components.find(
    (c: TemplateComponent) => c.type === "BODY",
  )!; // Body is mandatory
  const footerComp = formData.components.find(
    (c: TemplateComponent) => c.type === "FOOTER",
  );
  const buttonsComp = formData.components.find(
    (c: TemplateComponent) => c.type === "BUTTONS",
  );

  const bodyExamples = bodyComp.example?.body_text?.[0] || [];
  const headerTextExamples = headerComp?.example?.header_text || [];

  const filledBody = fillPlaceholders(bodyComp.text, bodyExamples);
  const filledHeaderText =
    headerComp?.format === "TEXT"
      ? fillPlaceholders(headerComp.text, headerTextExamples)
      : "";

  return (
    <div className="bg-[#E5DDD5] p-4 rounded-lg w-[320px] shadow-md font-sans">
      <div className="bg-white rounded-lg p-2.5 text-[14.2px] leading-snug shadow-sm min-h-[60px]">
        {/* Header */}
        {headerComp && (
          <div className="mb-1">
            {headerComp.format === "TEXT" && filledHeaderText && (
              <p className="font-semibold text-gray-800 break-words">
                {filledHeaderText}
              </p>
            )}
            {headerComp.format === "IMAGE" && (
              <div className="bg-gray-200 h-36 rounded-md flex items-center justify-center text-gray-500">
                <Smartphone className="h-10 w-10 opacity-50" /> Imagen
                {headerComp.link && (
                  <img
                    src={headerComp.link || "/placeholder.svg"}
                    alt="Header Preview"
                    className="max-h-36 w-full object-contain rounded-md"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
            )}
            {headerComp.format === "VIDEO" && (
              <div className="bg-gray-200 h-36 rounded-md flex items-center justify-center text-gray-500">
                <Monitor className="h-10 w-10 opacity-50" /> Video
                {/* Basic video placeholder, no actual player */}
              </div>
            )}
            {headerComp.format === "DOCUMENT" && (
              <div className="bg-gray-200 p-2 rounded-md flex items-center text-gray-600">
                <MessageSquareText className="h-6 w-6 mr-2 text-gray-500" />{" "}
                Documento.pdf
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <p className="text-gray-800 whitespace-pre-wrap break-words">
          {filledBody || "Cuerpo del mensaje..."}
        </p>

        {/* Footer */}
        {footerComp && footerComp.text && (
          <p className="text-xs text-gray-500 mt-1 break-words">
            {footerComp.text}
          </p>
        )}
      </div>

      {/* Buttons */}
      {buttonsComp && buttonsComp.buttons && buttonsComp.buttons.length > 0 && (
        <div className="mt-0.5 space-y-px">
          {buttonsComp.buttons.map((btn: ButtonComponent, idx: number) => (
            <div
              key={idx}
              className="bg-[#F6F6F6]/90 text-center text-[14px] font-medium text-blue-500 py-2.5 rounded-lg border-t border-gray-300/70"
            >
              {btn.text}
            </div>
          ))}
        </div>
      )}
      <div className="text-right text-xs text-gray-600 mt-1">10:00 AM ✓✓</div>
    </div>
  );
};

// AndroidPreview and DesktopPreview would be similar with styling adjustments.
// For brevity, only iOS is fully detailed. Android is a simplified copy.
const AndroidPreview: React.FC<{ formData: TemplateFormData }> = ({
  formData,
}) => {
  const headerComp = formData.components.find(
    (c: TemplateComponent) => c.type === "HEADER",
  );
  const bodyComp = formData.components.find(
    (c: TemplateComponent) => c.type === "BODY",
  )!;
  const footerComp = formData.components.find(
    (c: TemplateComponent) => c.type === "FOOTER",
  );
  const buttonsComp = formData.components.find(
    (c: TemplateComponent) => c.type === "BUTTONS",
  );

  const bodyExamples = bodyComp.example?.body_text?.[0] || [];
  const headerTextExamples = headerComp?.example?.header_text || [];

  const filledBody = fillPlaceholders(bodyComp.text, bodyExamples);
  const filledHeaderText =
    headerComp?.format === "TEXT"
      ? fillPlaceholders(headerComp.text, headerTextExamples)
      : "";

  return (
    <div className="bg-[#ECE5DD] p-3 rounded-lg w-[320px] shadow-lg font-roboto">
      {" "}
      {/* Slightly different green, font */}
      <div className="bg-white rounded-lg p-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[15px] leading-relaxed min-h-[60px]">
        {/* Header */}
        {headerComp && (
          <div className="mb-1">
            {headerComp.format === "TEXT" && filledHeaderText && (
              <p className="font-bold text-black break-words">
                {filledHeaderText}
              </p> // Slightly bolder
            )}
            {headerComp.format === "IMAGE" && (
              <div className="bg-gray-200 h-36 rounded flex items-center justify-center text-gray-500">
                <Smartphone className="h-10 w-10 opacity-50" /> Imagen
                {headerComp.link && (
                  <img
                    src={headerComp.link || "/placeholder.svg"}
                    alt="Header Preview"
                    className="max-h-36 w-full object-contain rounded"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
            )}
            {headerComp.format === "VIDEO" && (
              <div className="bg-gray-200 h-36 rounded flex items-center justify-center text-gray-500">
                <Monitor className="h-10 w-10 opacity-50" /> Video
              </div>
            )}
            {headerComp.format === "DOCUMENT" && (
              <div className="bg-gray-100 p-2 rounded flex items-center text-gray-700 border border-gray-200">
                <MessageSquareText className="h-5 w-5 mr-1.5 text-gray-500" />{" "}
                Documento.pdf
              </div>
            )}
          </div>
        )}
        <p className="text-black whitespace-pre-wrap break-words">
          {filledBody || "Cuerpo del mensaje..."}
        </p>
        {footerComp && footerComp.text && (
          <p className="text-xs text-[#667781] mt-0.5 break-words">
            {footerComp.text}
          </p> // Different muted color
        )}
      </div>
      {buttonsComp && buttonsComp.buttons && buttonsComp.buttons.length > 0 && (
        <div className="mt-0.5">
          {buttonsComp.buttons.map((btn: ButtonComponent, idx: number) => (
            <div
              key={idx}
              className={cn(
                "text-center text-[14px] font-semibold py-2.5 rounded-b-lg",
                "bg-white text-[#007AFF] border-t border-gray-200", // iOS like button
              )}
            >
              {btn.text}
            </div>
          ))}
        </div>
      )}
      <div className="text-right text-xs text-[#667781] mt-1">
        10:00 AM <span className="text-green-500">✓✓</span>
      </div>
    </div>
  );
};

const DesktopPreview: React.FC<{ formData: TemplateFormData }> = ({
  formData,
}) => {
  const headerComp = formData.components.find(
    (c: TemplateComponent) => c.type === "HEADER",
  );
  const bodyComp = formData.components.find(
    (c: TemplateComponent) => c.type === "BODY",
  )!;
  const footerComp = formData.components.find(
    (c: TemplateComponent) => c.type === "FOOTER",
  );
  const buttonsComp = formData.components.find(
    (c: TemplateComponent) => c.type === "BUTTONS",
  );

  const bodyExamples = bodyComp.example?.body_text?.[0] || [];
  const headerTextExamples = headerComp?.example?.header_text || [];

  const filledBody = fillPlaceholders(bodyComp.text, bodyExamples);
  const filledHeaderText =
    headerComp?.format === "TEXT"
      ? fillPlaceholders(headerComp.text, headerTextExamples)
      : "";

  const hasQuickReply = buttonsComp?.buttons?.some(
    (b: ButtonComponent) => b.type === "QUICK_REPLY",
  );
  const hasOtherButtons = buttonsComp?.buttons?.some(
    (b: ButtonComponent) => b.type === "URL" || b.type === "PHONE_NUMBER",
  );
  const showDesktopButtonsWarning = hasQuickReply && hasOtherButtons;

  return (
    <div className="bg-gray-100 p-4 rounded-lg w-[450px] shadow-md font-sans border border-gray-300">
      <div className="bg-white rounded-md p-3 text-sm leading-normal shadow-sm min-h-[70px]">
        {/* Header */}
        {headerComp && (
          <div className="mb-1.5">
            {headerComp.format === "TEXT" && filledHeaderText && (
              <p className="font-bold text-gray-900 break-words">
                {filledHeaderText}
              </p>
            )}
            {headerComp.format === "IMAGE" && (
              <div className="bg-gray-200 h-40 rounded-md flex items-center justify-center text-gray-500">
                <Smartphone className="h-12 w-12 opacity-50" /> Imagen
                {headerComp.link && (
                  <img
                    src={headerComp.link || "/placeholder.svg"}
                    alt="Header Preview"
                    className="max-h-40 w-full object-contain rounded-md"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
            )}
            {headerComp.format === "VIDEO" && (
              <div className="bg-gray-200 h-40 rounded-md flex items-center justify-center text-gray-500">
                <Monitor className="h-12 w-12 opacity-50" /> Video
              </div>
            )}
            {headerComp.format === "DOCUMENT" && (
              <div className="bg-gray-200 p-2.5 rounded-md flex items-center text-gray-700 border">
                <MessageSquareText className="h-6 w-6 mr-2 text-gray-600" />{" "}
                Documento_grande_final.pdf
              </div>
            )}
          </div>
        )}

        <p className="text-gray-800 whitespace-pre-wrap break-words">
          {filledBody || "Cuerpo del mensaje..."}
        </p>

        {footerComp && footerComp.text && (
          <p className="text-xs text-gray-500 mt-1.5 break-words">
            {footerComp.text}
          </p>
        )}
      </div>

      {buttonsComp &&
        buttonsComp.buttons &&
        buttonsComp.buttons.length > 0 &&
        !showDesktopButtonsWarning && (
          <div className="mt-1 flex flex-col space-y-0.5">
            {buttonsComp.buttons.map((btn: ButtonComponent, idx: number) => (
              <div
                key={idx}
                className={cn(
                  "text-center text-sm font-medium py-2.5 rounded-b-md border-t",
                  btn.type === "QUICK_REPLY"
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200",
                )}
              >
                {btn.text}
                {btn.type === "URL" && btn.url && (
                  <span className="text-xs block text-gray-500">
                    ({fillUrlPlaceholders(btn.url, btn.example)})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      {showDesktopButtonsWarning && (
        <div className="mt-2 p-2 text-xs bg-yellow-100 text-yellow-700 rounded text-center">
          Los botones de Respuesta Rápida pueden no mostrarse junto con botones
          URL/Teléfono en Escritorio.
        </div>
      )}
      <div className="text-right text-xs text-gray-500 mt-1.5">10:00 AM ✓✓</div>
    </div>
  );
};

export default function TemplatePreviewDisplay({
  formData,
}: TemplatePreviewProps) {
  return (
    <Tabs defaultValue="ios" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="ios">
          <Smartphone className="inline mr-1 h-4 w-4" />
          iOS
        </TabsTrigger>
        <TabsTrigger value="android">
          <Smartphone className="inline mr-1 h-4 w-4" />
          Android
        </TabsTrigger>
        <TabsTrigger value="desktop">
          <Monitor className="inline mr-1 h-4 w-4" />
          Desktop
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ios">
        <div className="flex justify-center">
          <IosPreview formData={formData} />
        </div>
      </TabsContent>
      <TabsContent value="android">
        <div className="flex justify-center">
          <AndroidPreview formData={formData} />
        </div>
      </TabsContent>
      <TabsContent value="desktop">
        <div className="flex justify-center">
          <DesktopPreview formData={formData} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
