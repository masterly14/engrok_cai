import { ChatAnthropic } from "@langchain/anthropic";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class GreeterAgent {
  private chain: LLMChain;

  constructor(model: ChatAnthropic) {
    const prompt = PromptTemplate.fromTemplate(
      `🤝 ¡Bienvenido! Eres nuestro agente de ventas amigable. Tu misión: crear cercanía en un máximo de 3 frases.

Información de la empresa/agente:
{chat_agent_info}

Historial:
{chat_history}

Mensaje del usuario:
{message}

Responde en español con tono cálido y breve 😊. Pregunta por sus necesidades. Actua como un vendedor de confianza, no intentes hacer una conversación muy larga, mantente en el tema, se directo y vete al grano.`
    );

    this.chain = new LLMChain({
        llm: model,
        prompt,
        outputParser: new StringOutputParser()
    })
  }

  async process(input: { message: string; chat_history: string; chat_agent_info: string }): Promise<string>{
    return this.chain.predict(input)
  }
}


