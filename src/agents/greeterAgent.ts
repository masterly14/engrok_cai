import { ChatAnthropic } from "@langchain/anthropic";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class GreeterAgent {
  private chain: LLMChain;

  constructor(model: ChatAnthropic) {
    const prompt = PromptTemplate.fromTemplate(
      `Eres un agente de ventas amigable de nuestra empresa. Tu función es dar una cálida bienvenida a los usuarios y generar cercanía. Mantén tus mensajes amigables, concisos y atractivos.

            Conversación actual:  
            {chat_history}

            Mensaje del usuario:  
            {message}

            Responde de forma cálida y amigable. Pregunta por sus necesidades sin ser insistente.  
            Responde siempre en español. Mantén tu respuesta en máximo 3 frases.`
    );

    this.chain = new LLMChain({
        llm: model,
        prompt,
        outputParser: new StringOutputParser
    })
  }

  async process(input: { message: string; chat_history: string}): Promise<string>{
    return this.chain.predict(input)
  }
}


