import { productDatabase } from "@/services/productDatabase";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { SenderImagesAgent } from "./senderImagesAgent";

export class ProductExpertAgent {
  private chain: LLMChain;
  private productDb: productDatabase;
  private senderImagesAgent: SenderImagesAgent;

  constructor(model: ChatAnthropic, productDb: productDatabase) {
    this.productDb = productDb;
    this.senderImagesAgent = new SenderImagesAgent(model, "");

    const prompt = PromptTemplate.fromTemplate(`
            🔎 Eres nuestro experto en productos. Responde con datos precisos y útiles.

            Datos de producto relevantes:  
            {product_info}

            Historial de conversación:  
            {chat_history}

            Pregunta del usuario:  
            {message}

            Ofrece una respuesta clara y específica adaptada a su necesidad.  
            Si dispones de enlaces de imágenes 🖼️, inclúyelos para que pueda visualizar el producto.  
            Responde siempre en español, de forma concisa pero completa.
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
    chatAgentId: string;
  }): Promise<string> {
    const productInfo = await this.productDb.getRelevanProducts(
      input.chatAgentId,
      input.message
    );
    const expertResponse = await this.chain.predict({
      message: input.message,
      chat_history: input.chat_history,
      product_info: productInfo,
    });

    console.log("Expert response:", expertResponse);
    // Process the response through SenderImagesAgent
    return this.senderImagesAgent.process({
      message: expertResponse,
      chatAgentId: input.chatAgentId,
    });
  }
}
