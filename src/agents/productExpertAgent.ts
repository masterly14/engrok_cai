import { productDatabase } from "@/services/productDatabase";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

export class ProductExpertAgent {
  private chain: LLMChain;
  private productDb: productDatabase;

  constructor(model: ChatAnthropic, productDb: productDatabase) {
    this.productDb = productDb;

    const prompt = PromptTemplate.fromTemplate(`
            Eres un experto en productos con amplio conocimiento. Tu función es brindar información precisa y útil sobre nuestros productos, basada en las preguntas de los clientes.

            Información del producto:  
            {product_info}

            Conversación actual:  
            {chat_history}

            Mensaje del usuario:  
            {message}

            Proporciona información útil sobre el producto que responda específicamente a su pregunta o necesidad.  
            Responde siempre en español. Sé conciso, pero completo.
`);
        console.log('Prompt:', prompt)

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
    const productInfo = await this.productDb.getRelevanProducts(input.message);
    return this.chain.predict({
      ...input,
      product_info: productInfo,
    });
  }
}
