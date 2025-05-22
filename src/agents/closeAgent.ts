import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

export class CloseAgent {
  private chain: LLMChain;

  constructor(model: ChatAnthropic) {
    const prompt = PromptTemplate.fromTemplate(`
            Eres un experto en cierre de ventas. Tu función es guiar de forma amable a los clientes interesados para que tomen una decisión de compra, sin ser insistente.

            Conversación actual:  
            {chat_history}

            Mensaje del usuario:  
            {message}

            Si demuestran interés, oriéntalos hacia los próximos pasos del proceso de compra.  
            Responde siempre en español. Sé seguro, pero no agresivo.  
            Incluye un llamado a la acción claro.
`);

    this.chain = new LLMChain({
      llm: model,
      prompt,
      outputParser: new StringOutputParser(),
    });
  }
  async process(input: {
    message: string;
    chat_history: string;
  }): Promise<string> {
    return this.chain.predict(input);
  }
}
