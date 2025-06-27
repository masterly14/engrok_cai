"use server"

import { db } from "@/utils"
import axios from "axios"
import { onBoardUser } from "../user"

/**
 * Versión de la API de WhatsApp Graph a utilizar.
 * Si la variable de entorno WHATSAPP_API_VERSION no está presente se usará v19.0
 */
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v19.0"

/* -------------------------------------------------------------------------- */
/*                              Tipos de soporte                              */
/* -------------------------------------------------------------------------- */

export type TemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION"
export type ParameterFormat = "POSITIONAL" | "NAMED" // No official, but useful for internal logic if needed. WhatsApp API uses "sample" for positional.

// Start of replacement for TemplateComponentExample
export interface ExampleValues {
  // Renamed for clarity, represents the `example` field in API components
  header_text?: [string] // Single string array for header text variable
  header_handle?: [string] // Single string array for media URL/handle
  body_text?: string[][] // Array of arrays of strings for body variables
  // Footer doesn't have variables
  buttons?: string[][] // Array of string arrays for dynamic button URL parts
  // Each inner array corresponds to a button with dynamic URL
  // Example: [ ["product_1"], ["product_2"] ] for two URL buttons with one variable each
}
// End of replacement for TemplateComponentExample

// Start of replacement for TemplateComponent and ButtonComponent
export interface ButtonComponent {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "OTP"
  text: string // For QUICK_REPLY button title, URL button display text, Phone button display text
  url?: string // For URL button (can contain {{N}} for dynamic part)
  phone_number?: string // For PHONE_NUMBER button
  example?: string[] // For URL button with dynamic parts (e.g., ["/product/123"])
  // Length should match number of dynamic parts in URL.
  // WhatsApp also has an `autofill_text` and `package_name`, `signature_hash` for specific auth buttons.
  // These are advanced and not included for brevity.
}

export type HeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
  format?: HeaderFormat // Only for HEADER
  text?: string // For HEADER (type TEXT), BODY, FOOTER
  example?: ExampleValues // For components with variables (HEADER with text variables, BODY, BUTTONS with dynamic URLs)
  buttons?: ButtonComponent[] // Only for BUTTONS component
  // Campos especiales para AUTHENTICATION
  add_security_recommendation?: boolean // BODY
  code_expiration_minutes?: number // FOOTER
  // OTP buttons se describen vía ButtonComponent con type "OTP"
  // For HEADER with media, the 'example.header_handle' provides the sample media URL.
  // The actual media to be used in the template is often set by providing a link or an ID
  // directly in the HEADER component if the API supports it, or it's implied by the `example.header_handle`.
  // For `createMessageTemplate`, if `format` is IMAGE/VIDEO/DOCUMENT, `example.header_handle: ["<link_or_id>"]` is key.
  // Some APIs might take a `link` field directly on the HEADER component itself.
  // For simplicity, we'll assume the `example.header_handle` serves as this or the primary way to specify media.
  // A `link` field could be added to the HEADER component if using a direct link for the media.
  link?: string // For HEADER type IMAGE, VIDEO, DOCUMENT - represents the actual media URL
}
// End of replacement for TemplateComponent and ButtonComponent

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface CreateTemplateParams {
  /** ID de la cuenta de WhatsApp Business */
  businessAccountId: string
  /** Access token con permiso whatsapp_business_management */
  accessToken: string
  /** Nombre único de la plantilla */
  name: string
  /** Categoría */
  category: TemplateCategory
  /** Código de idioma y región, ej. en_US */
  language: string
  /** Componentes de la plantilla */
  components: TemplateComponent[]
  /** Opcional, WhatsApp API infers from components. Kept for potential internal use. */
  allow_category_change?: boolean // New field in API for certain updates
  /** ID del agente */
  agentId: string
}

export interface ListTemplatesParams {
  businessAccountId: string
  accessToken: string
  fields?: string
  limit?: number
  status?: string
  after?: string
  name?: string // Filter by template name
}

export interface UpdateTemplateParams {
  templateIdOrName: string // Can be ID or name for certain API versions/calls
  accessToken: string
  businessAccountId: string // Often needed for context or if updating by name
  category?: TemplateCategory
  components?: TemplateComponent[]
  allow_category_change?: boolean
}

export interface DeleteTemplateParams {
  businessAccountId: string
  accessToken: string
  name: string // Delete by name typically removes all language versions
  hsmId?: string // Specific ID for deleting a single language version
}

/* -------------------------------------------------------------------------- */
/*                                Funciones                                   */
/* -------------------------------------------------------------------------- */

/**
 * Crea una nueva plantilla de mensaje en la cuenta Business indicada.
 */
export const createMessageTemplate = async (params: CreateTemplateParams) => {
  const { businessAccountId, accessToken, name, category, language, components, allow_category_change, agentId } = params

  const url = `https://graph.facebook.com/${API_VERSION}/${businessAccountId}/message_templates`

  const apiComponents = components.map((comp) => {
    const newComp: any = { type: comp.type }
    if (category !== "AUTHENTICATION") {
      if (comp.format) newComp.format = comp.format
      if (comp.text !== undefined) newComp.text = comp.text
    }

    if (
      comp.type === "HEADER" &&
      comp.format === "TEXT"
    ) {
      // WhatsApp requiere que example.header_text esté siempre presente si el HEADER es de texto
      const headerTextExample = comp.example?.header_text ?? [comp.text ?? ""]
      newComp.example = { ...(comp.example || {}), header_text: headerTextExample }
    } else if (
      comp.type === "HEADER" &&
      comp.link &&
      (comp.format === "IMAGE" || comp.format === "VIDEO" || comp.format === "DOCUMENT")
    ) {
      newComp.example = { ...comp.example, header_handle: [comp.link] }
    } else if (comp.example && category !== "AUTHENTICATION") {
      newComp.example = comp.example
    }

    if (category === "AUTHENTICATION") {
      if (comp.type === "BODY" && comp.add_security_recommendation !== undefined) {
        newComp.add_security_recommendation = comp.add_security_recommendation
      }
      if (comp.type === "FOOTER" && comp.code_expiration_minutes !== undefined) {
        newComp.code_expiration_minutes = comp.code_expiration_minutes
      }
    }

    if (comp.type === "BUTTONS" && comp.buttons) {
      newComp.buttons = comp.buttons.map((btn) => {
        const apiBtn: any = { type: btn.type, text: btn.text }
        if (btn.type === "URL" && btn.url) {
          apiBtn.url = btn.url
          if (btn.example && btn.example.length > 0) {
            apiBtn.example = btn.example
          }
        }
        if (btn.type === "PHONE_NUMBER" && btn.phone_number) {
          apiBtn.phone_number = btn.phone_number
        }
        if (btn.type === "OTP") {
          // Mapeo directo, OTP buttons pueden llevar fields adicionales como otp_type etc.
          Object.assign(apiBtn, btn)
        }
        return apiBtn
      })
    }
    return newComp
  })
  
  const payload: any = {
    name,
    category,
    language,
    components: apiComponents,
  }
  console.log(payload)

  try {
    const { data: apiResponse } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    // ------------------------------------------------------------------
    // Persist template metadata locally (ligado al ChatAgent)
    // ------------------------------------------------------------------
    if (!agentId) {
      throw new Error("[createMessageTemplate] agentId is required but was not provided")
    }

    await db.messageTemplate.create({
      data: {
        name,
        language,
        category,
        components: payload.components,
        agentId,
        status: "PENDING",
        whatsappTemplateId: apiResponse.id,
      },
    })
    return { success: true, data: apiResponse } as const
  } catch (error: any) {
    console.error("[createMessageTemplate] Error:", error.response?.data || error.message)
    const errData = error.response?.data?.error
    const message = errData?.message || "WhatsApp API Error (create)"
    return { success: false, error: message, errorData: errData } as const
  }
}

/**
 * Lista plantillas existentes con filtros opcionales.
 */
export const listMessageTemplates = async (params: ListTemplatesParams) => {
  const {
    businessAccountId,
    accessToken,
    fields = "name,status,category,language,components,id",
    limit = 25,
    status,
    after,
    name,
  } = params
  const query = new URLSearchParams({ fields, limit: String(limit) })
  if (status) query.append("status", status)
  if (after) query.append("after", after)
  if (name) query.append("name_or_id", name) // API might use 'name_or_id' or 'name'

  const url = `https://graph.facebook.com/${API_VERSION}/${businessAccountId}/message_templates?${query.toString()}`

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return { success: true, data } as const
  } catch (error: any) {
    console.error("[listMessageTemplates] Error:", error.response?.data || error.message)
    const errData = error.response?.data?.error
    const message = errData?.message || "WhatsApp API Error (list)"
    return { success: false, error: message, errorData: errData } as const
  }
}

/**
 * Actualiza la categoría o los componentes de una plantilla.
 * Note: WhatsApp API for updating templates is nuanced.
 * Sometimes it's POST to /template_id, sometimes POST to /waba_id/message_templates with name.
 * This function assumes updating by template ID for component/category changes.
 */
export const updateMessageTemplate = async (params: UpdateTemplateParams) => {
  const { templateIdOrName, accessToken, category, components, businessAccountId, allow_category_change } = params

  if (!category && !components) {
    return { success: false, error: "Debes enviar 'category' o 'components' para actualizar." } as const
  }

  // Determine if templateIdOrName is an ID (numeric) or name (string)
  // This logic might need adjustment based on how you store/retrieve template identifiers.
  // For simplicity, let's assume if it's purely numeric, it's an ID.
  // Otherwise, it could be a name, and the endpoint might change.
  // The WhatsApp API generally uses the template ID for direct updates.
  const isId = /^\d+$/.test(templateIdOrName)
  const url = `https://graph.facebook.com/${API_VERSION}/${templateIdOrName}` // Assumes templateIdOrName is an ID

  const payload: any = {}
  if (category) payload.category = category
  // Replace `payload.components = components` with:
  if (components) {
    payload.components = components.map((comp) => {
      const newComp: any = { type: comp.type }
      if (comp.format) newComp.format = comp.format
      if (comp.text !== undefined) newComp.text = comp.text

      if (
        comp.type === "HEADER" &&
        comp.format === "TEXT"
      ) {
        // WhatsApp requiere que example.header_text esté siempre presente si el HEADER es de texto
        const headerTextExample = comp.example?.header_text ?? [comp.text ?? ""]
        newComp.example = { ...(comp.example || {}), header_text: headerTextExample }
      } else if (
        comp.type === "HEADER" &&
        comp.link &&
        (comp.format === "IMAGE" || comp.format === "VIDEO" || comp.format === "DOCUMENT")
      ) {
        newComp.example = { ...comp.example, header_handle: [comp.link] }
      } else if (comp.example && category !== "AUTHENTICATION") {
        newComp.example = comp.example
      }

      if (category === "AUTHENTICATION") {
        if (comp.type === "BODY" && comp.add_security_recommendation !== undefined) {
          newComp.add_security_recommendation = comp.add_security_recommendation
        }
        if (comp.type === "FOOTER" && comp.code_expiration_minutes !== undefined) {
          newComp.code_expiration_minutes = comp.code_expiration_minutes
        }
      }

      if (comp.type === "BUTTONS" && comp.buttons) {
        newComp.buttons = comp.buttons.map((btn) => {
          const apiBtn: any = { type: btn.type, text: btn.text }
          if (btn.type === "URL" && btn.url) {
            apiBtn.url = btn.url
            if (btn.example && btn.example.length > 0) {
              apiBtn.example = btn.example
            }
          }
          if (btn.type === "PHONE_NUMBER" && btn.phone_number) {
            apiBtn.phone_number = btn.phone_number
          }
          if (btn.type === "OTP") {
            // Mapeo directo, OTP buttons pueden llevar fields adicionales como otp_type etc.
            Object.assign(apiBtn, btn)
          }
          return apiBtn
        })
      }
      return newComp
    })
  }
  // End of modification for payload in updateMessageTemplate
  if (allow_category_change !== undefined) payload.allow_category_change = allow_category_change

  // If updating by name, the endpoint and payload structure can be different (similar to create but with name match)
  // This example focuses on updating by ID for simplicity as per common use cases for editing existing templates.
  // If you need to update by name (which might involve language additions/edits), that's a different flow.
  // For editing components of an existing template, using its ID is standard.

  if (!isId) {
    // If templateIdOrName is a name, and you're trying to update existing components for a specific language
    // you might need to use the create endpoint with the name, language, and new components.
    // This part of the API can be tricky. The safest is to update by specific template ID.
    // For now, this function is simplified to update by ID.
    // If it's a name, we might need a different approach or more params (like language).
    // Let's assume for now this function is for updates via ID.
    console.warn(
      "[updateMessageTemplate] Updating by name is complex and might require a different API structure or more parameters like language. This function is optimized for ID-based updates.",
    )
    // Fallback or error if trying to update by name without specific handling:
    // return { success: false, error: "Updating by name requires specific handling (e.g., language)." } as const;
    // Or, construct URL for update-by-name if applicable:
    // url = `https://graph.facebook.com/${API_VERSION}/${businessAccountId}/message_templates`;
    // payload.name = templateIdOrName; // and potentially payload.language
  }

  try {
    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })
    return { success: true, data } as const
  } catch (error: any) {
    console.error("[updateMessageTemplate] Error:", error.response?.data || error.message)
    const errData = error.response?.data?.error
    const message = errData?.message || "WhatsApp API Error (update)"
    return { success: false, error: message, errorData: errData } as const
  }
}

/**
 * Elimina una plantilla.
 * Can delete by name (all languages) or by hsm_id (specific language version).
 */
export const deleteMessageTemplate = async (params: DeleteTemplateParams) => {
  const { businessAccountId, accessToken, name, hsmId } = params

  let url = `https://graph.facebook.com/${API_VERSION}/${businessAccountId}/message_templates?name=${encodeURIComponent(name)}`
  if (hsmId) {
    url += `&hsm_id=${encodeURIComponent(hsmId)}`
  }

  try {
    const { data } = await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return { success: true, data } as const
  } catch (error: any) {
    console.error("[deleteMessageTemplate] Error:", error.response?.data || error.message)
    const errData = error.response?.data?.error
    const message = errData?.message || "WhatsApp API Error (delete)"
    return { success: false, error: message, errorData: errData } as const
  }
}

// --------------------------------------------------------------------------
// Obtiene todas las plantillas de mensaje creadas para un ChatAgent concreto
// --------------------------------------------------------------------------
export const getMessageTemplates = async (agentId: string) => {
  // Comprobamos la sesión y que el agente pertenezca al usuario autenticado
  const user = await onBoardUser();
  if (!user?.data?.id) {
    return { status: 401, message: "Unauthorized" } as const;
  }

  const agent = await db.chatAgent.findFirst({
    where: { id: agentId, userId: user.data.id },
  });

  if (!agent) {
    return { status: 404, message: "Agent not found" } as const;
  }
  console.log(agentId)
  const templates = await db.messageTemplate.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
  });

  console.log(templates)
  return { status: 200, data: templates } as const;
};
