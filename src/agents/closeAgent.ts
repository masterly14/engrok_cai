import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

export class CloseAgent {
  private chain: LLMChain;

  constructor(model: ChatAnthropic) {
    const prompt = PromptTemplate.fromTemplate(`
📈 Actúa como experto en cierre de ventas y guía al cliente a decidir sin presionarlo.

Historial de conversación:  
{chat_history}

Mensaje del cliente:  
{message}

Si detectas interés ✅, señala con amabilidad los siguientes pasos del proceso de compra.  
Responde en español con tono seguro y cordial (nunca agresivo).  
Concluye con un llamado a la acción claro y motivador 🚀.
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
