import { LLMChain } from "langchain/chains";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

export class SenderImagesAgent {
  private chain: LLMChain;
  private message: string;

  constructor(model: ChatAnthropic, message: string) {
    this.message = message;

    const prompt = PromptTemplate.fromTemplate(`
        Eres un asistente especializado en analizar mensajes que contienen texto e imágenes. 
        - Tu tarea es extraer el texto sin los enlaces de las imágenes y devolver una lista con los enlaces de las imagenes.
        - Formatea el texto para que sea más agradable y legible. No incluyas en la respuesta del texto signos como #, *, **, etc.
        - Agrega emojis cuando ayuden a mejorar la claridad o expresividad del mensaje (como ✅, 📦, 🔍, 💡, 🎉, etc.), sin abusar.
        - Extraer todos los enlaces de imágenes, pero **si hay productos repetidos con distintas unidades (por ejemplo, "Producto 1 Unidad", "Producto 2 Unidades", etc.), incluye solo una imagen representativa de ese producto.

        Responde **únicamente** en el siguiente formato JSON. No añadas explicaciones, saludos ni ningún otro texto fuera de este formato. Usa siempre el idioma español.
        
        Mensaje:
        {message}
        
        {{
            "text": "Texto extraído del mensaje una vez excluidos los enlaces de imágenes y formateado para que sea más agradable y legible",
            "images": [
                {{
                    "link": "https://ejemplo.com/imagen.jpg",
                }}
            ]
        }}
        `);
        
        
    

    this.chain = new LLMChain({
      llm: model,
      prompt,
      outputParser: new StringOutputParser(),
    });
  }

  async process(input: {
    message: string;
    chatAgentId: string;
  }): Promise<string> {
    return this.chain.predict({
      message: input.message,
    });
  }
}
