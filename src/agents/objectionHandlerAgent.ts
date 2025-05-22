import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";

export class objectionHandlerAgent {
    private chain: LLMChain;


    constructor(model: ChatAnthropic) {
        const prompt = PromptTemplate.fromTemplate(`
            Eres un experto en manejo de objeciones. Tu función es abordar las inquietudes o dudas del cliente de manera empática y efectiva.

            Objeciones comunes y cómo responderlas:  
            - Preocupaciones por el precio: Enfócate en el valor y el retorno de inversión (ROI).  
            - Cuestiones de tiempo: Resalta que es una oportunidad por tiempo limitado.  
            - Comparaciones con la competencia: Destaca nuestras ventajas únicas.  

            Conversación actual:  
            {chat_history}

            Mensaje del usuario:  
            {message}

            Responde a su inquietud de forma profesional, sin ponerte a la defensiva.  
            Responde siempre en español. Sé empático y enfocado en ofrecer soluciones.
        `)

        this.chain = new LLMChain({
            llm: model,
            prompt,
            outputParser: new StringOutputParser()
        })
    }

    async process(input: {message: string; chat_history: string}) : Promise<string> {
        return this.chain.predict(input)
    }
}