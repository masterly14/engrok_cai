"use client"

import { Clock } from "lucide-react"

interface WhatsAppPreviewProps {
  headerText: string
  bodyText: string
  footerText: string
  buttons: string[]
}

export function WhatsAppPreview({ headerText, bodyText, footerText, buttons }: WhatsAppPreviewProps) {
  // Generate example values for variables
  const getExampleValue = (variableNumber: number) => {
    const examples = ["Juan", "Producto Premium", "50% de descuento", "Empresa ABC", "15 de enero", "2024"]
    return examples[variableNumber - 1] || `Ejemplo ${variableNumber}`
  }

  // Replace template variables with example values for preview
  const processText = (text: string) => {
    return text.replace(/\{\{(\d+)\}\}/g, (match, number) => {
      return getExampleValue(Number.parseInt(number))
    })
  }

  return (
    <div className="bg-[#e5ddd5] p-4 rounded-lg max-w-sm mx-auto">
      <div className="bg-white rounded-lg p-3 shadow-sm relative">
        {/* Message bubble */}
        <div className="space-y-2">
          {headerText && <div className="text-gray-900 font-medium text-sm">{processText(headerText)}</div>}

          {bodyText && (
            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{processText(bodyText)}</div>
          )}

          {footerText && <div className="text-gray-600 text-xs mt-2">{processText(footerText)}</div>}
        </div>

        {/* Timestamp */}
        <div className="flex justify-end items-center mt-2 text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          15:03
        </div>

        {/* Quick reply buttons */}
        {buttons.length > 0 && (
          <div className="mt-3 space-y-2">
            {buttons
              .filter((button) => button.trim())
              .map((button, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border text-sm text-blue-600 font-medium transition-colors"
                >
                  {processText(button)}
                </button>
              ))}
          </div>
        )}
      </div>
      {/* Preview note */}
      <div className="text-center mt-2 text-xs text-gray-600">
        Vista previa • Las variables {"{{}}"} se muestran con ejemplos
      </div>
    </div>
  )
}
