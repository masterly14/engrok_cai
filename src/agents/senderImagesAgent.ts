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
        Eres un asistente especializado en analizar mensajes que contienen texto e imágenes. Tu tarea es extraer el texto sin los enlaces de las imágenes y devolver una lista con los enlaces y una breve descripción de cada imagen.
        
        Responde **únicamente** en el siguiente formato JSON. No añadas explicaciones, saludos ni ningún otro texto fuera de este formato. Usa siempre el idioma español.
        
        Mensaje:
        {message}
        
        {{
            "text": "Texto extraído del mensaje, excluyendo enlaces de imágenes.",
            "images": [
                {{
                    "link": "https://ejemplo.com/imagen.jpg",
                    "caption": "Descripción breve de la imagen según el contenido del mensaje."
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
