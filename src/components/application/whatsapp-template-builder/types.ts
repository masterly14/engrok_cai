import type { TemplateCategory } from "@/actions/whatsapp/templates"

export interface TemplateFormData {
  name: string
  category: TemplateCategory
  language: string
  // parameterFormat: 'POSITIONAL' | 'NAMED'; // WhatsApp API uses 'sample' for positional, not a direct setting.
  components: TemplateComponent[]
  // For multi-language, this structure might need to be nested per language
}

export const initialFormData: TemplateFormData = {
  name: "",
  category: "UTILITY",
  language: "en_US",
  components: [
    { type: "BODY", text: "" }, // Body is mandatory
  ],
}

export type Language = {
  code: string
  name: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "ar", name: "Arabic" },
  { code: "az", name: "Azerbaijani" },
  { code: "bn", name: "Bengali" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "zh_CN", name: "Chinese (CHN)" },
  { code: "zh_HK", name: "Chinese (HKG)" },
  { code: "zh_TW", name: "Chinese (TAI)" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "en_GB", name: "English (UK)" },
  { code: "en_US", name: "English (US)" },
  { code: "et", name: "Estonian" },
  { code: "fil", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "ka", name: "Georgian" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "ha", name: "Hausa" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hu", name: "Hungarian" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "ko", name: "Korean" },
  { code: "lo", name: "Lao" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "mk", name: "Macedonian" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mr", name: "Marathi" },
  { code: "nb", name: "Norwegian" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt_BR", name: "Portuguese (BR)" },
  { code: "pt_PT", name: "Portuguese (POR)" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sr", name: "Serbian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "es", name: "Spanish" },
  { code: "es_AR", name: "Spanish (ARG)" },
  { code: "es_ES", name: "Spanish (SPA)" },
  { code: "es_MX", name: "Spanish (MEX)" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
  { code: "zu", name: "Zulu" },
]

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

export interface ButtonComponent {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "OTP"
  text: string // For QUICK_REPLY button title, URL button display text, Phone button display text
  url?: string // For URL button (can contain {{N}} for dynamic part)
  phone_number?: string // For PHONE_NUMBER button
  example?: string[] // For URL button with dynamic parts (e.g., ["/product/123"])
  // Length should match number of dynamic parts in URL.
  // WhatsApp también acepta propiedades para OTP (otp_type, package_name, etc.).
  otp_type?: "COPY_CODE" | "ONE_TAP" | "ZERO_TAP"
  package_name?: string
  signature_hash?: string
}

export type HeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
  format?: HeaderFormat // Only for HEADER
  text?: string // For HEADER (type TEXT), BODY, FOOTER
  example?: ExampleValues // For components with variables (HEADER with text variables, BODY, BUTTONS with dynamic URLs)
  buttons?: ButtonComponent[] // Only for BUTTONS component
  // Campos especiales para templates AUTHENTICATION
  add_security_recommendation?: boolean // BODY
  code_expiration_minutes?: number // FOOTER
  // For HEADER with media, the 'example.header_handle' provides the sample media URL.
  // The actual media to be used in the template is often set by providing a link or an ID
  // directly in the HEADER component if the API supports it, or it's implied by the `example.header_handle`.
  // For `createMessageTemplate`, if `format` is IMAGE/VIDEO/DOCUMENT, `example.header_handle: ["<link_or_id>"]` is key.
  // Some APIs might take a `link` or `id` field directly on the HEADER component itself.
  // For simplicity, we'll assume the `example.header_handle` serves as this or the primary way to specify media.
  // A `link` field could be added to the HEADER component if using a direct link for the media.
  link?: string // For HEADER type IMAGE, VIDEO, DOCUMENT - represents the actual media URL
}
