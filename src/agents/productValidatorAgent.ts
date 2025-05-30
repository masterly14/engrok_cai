import { ChatAnthropic } from "@langchain/anthropic";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

interface ProductValidationResult {
  isValid: boolean;
  recommendations?: string[];
}

interface ProductToValidate {
  name: string;
  description: string;
  category?: string;
  price?: number;
}

export class ProductValidatorAgent {
  private chain: LLMChain;
  private model: ChatAnthropic;

  constructor(model?: ChatAnthropic) {
    // Si no se proporciona un modelo, crear uno por defecto
    this.model = model || new ChatAnthropic({
      apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      modelName: "claude-3-sonnet-20240229",
      temperature: 0.3,
    });

    const prompt = PromptTemplate.fromTemplate(`
Eres un experto en marketing y ventas online. Tu tarea es analizar la información de un producto y dar recomendaciones ESPECÍFICAS y ACCIONABLES para mejorar su descripción y aumentar las ventas.

Producto a analizar:
- Nombre: {productName}
- Categoría: {category}
- Precio: {price}
- Descripción: {description}

IMPORTANTE: 
- Debes responder ÚNICAMENTE en formato JSON válido.
- Si la descripción es excelente (completa, atractiva, con beneficios claros), responde: {"isValid": true}
- Si necesita mejoras, incluye recomendaciones específicas en español.
- Las recomendaciones deben ser CLARAS, CONCISAS y ACCIONABLES.
- Usa emojis para hacer las recomendaciones más amigables.
- Máximo 5 recomendaciones, las más importantes primero.

Analiza estos aspectos:
1. ¿Incluye características específicas del producto? (tamaño, material, color, etc.)
2. ¿Menciona beneficios claros para el cliente?
3. ¿Es única y diferenciada o muy genérica?
4. ¿Tiene la longitud adecuada? (50-500 caracteres ideal)
5. ¿Incluye información relevante para la categoría?
6. ¿Genera confianza y deseo de compra?

Para la categoría "{category}", considera aspectos específicos como:
- Electrónica: compatibilidad, garantía, especificaciones técnicas
- Ropa: tallas, materiales, cuidados
- Alimentos: ingredientes, caducidad, conservación
- Hogar: dimensiones, instalación, materiales

Formato de respuesta:
{
  "isValid": boolean,
  "recommendations": ["recomendación 1", "recomendación 2", ...]
}

RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL.
`);

    this.chain = new LLMChain({
      llm: this.model,
      prompt,
      outputParser: new StringOutputParser(),
    });
  }

  async validateProduct(product: ProductToValidate): Promise<ProductValidationResult> {
    try {
      // Validaciones básicas antes de usar AI
      if (!product.name || product.name.trim().length < 3) {
        return {
          isValid: false,
          recommendations: ["📝 El nombre del producto debe tener al menos 3 caracteres"],
        };
      }

      if (!product.description || product.description.trim().length < 10) {
        return {
          isValid: false,
          recommendations: ["📄 La descripción es muy corta. Describe tu producto para aumentar las ventas"],
        };
      }

      // Usar AI para análisis profundo
      const response = await this.chain.predict({
        productName: product.name || "Sin nombre",
        category: product.category || "General",
        price: product.price || 0,
        description: product.description || "",
      });

      // Parsear la respuesta JSON
      try {
        const result = JSON.parse(response.trim());
        return {
          isValid: result.isValid || false,
          recommendations: result.recommendations || undefined,
        };
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        // Si falla el parsing, intentar extraer recomendaciones del texto
        return this.fallbackParse(response);
      }
    } catch (error) {
      console.error("Error in product validation:", error);
      // Fallback a validación básica si falla la AI
      return this.basicValidation(product);
    }
  }

  private fallbackParse(response: string): ProductValidationResult {
    // Intentar extraer información útil de la respuesta aunque no sea JSON válido
    const isValid = response.toLowerCase().includes("válid") || response.toLowerCase().includes("excelente");
    const recommendations: string[] = [];
    
    // Buscar líneas que parezcan recomendaciones
    const lines = response.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.includes("📝") || line.includes("💡") || line.includes("🎯") || 
          line.includes("⚡") || line.includes("📏") || line.includes("🚀")) {
        recommendations.push(line.trim());
      }
    }

    return {
      isValid: !recommendations.length,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  private basicValidation(product: ProductToValidate): ProductValidationResult {
    const recommendations: string[] = [];
    
    if (product.description.length < 50) {
      recommendations.push("📏 Amplía la descripción para dar más confianza al cliente");
    }
    
    if (!product.category) {
      recommendations.push("📦 Agrega una categoría para ayudar a los clientes a encontrar tu producto");
    }
    
    const descLower = product.description.toLowerCase();
    if (!descLower.includes("ideal para") && !descLower.includes("perfecto para")) {
      recommendations.push("🎯 Menciona para quién o qué situación es ideal tu producto");
    }

    return {
      isValid: recommendations.length === 0,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  // Método para obtener preguntas de mejora usando AI
  async getImprovementQuestions(product: ProductToValidate): Promise<string[]> {
    const questionPrompt = PromptTemplate.fromTemplate(`
Basándote en esta descripción de producto, genera 2-3 preguntas clave que el vendedor debería responder en su descripción para hacerla más completa y atractiva.

Producto: {productName}
Categoría: {category}
Descripción actual: {description}

Las preguntas deben:
- Ser específicas y relevantes para este producto
- Ayudar a destacar beneficios únicos
- Estar en español y empezar con "❓"
- Ser diferentes a la información ya incluida

Responde SOLO con las preguntas, una por línea.
`);

    const questionChain = new LLMChain({
      llm: this.model,
      prompt: questionPrompt,
      outputParser: new StringOutputParser(),
    });

    try {
      const response = await questionChain.predict({
        productName: product.name || "Sin nombre",
        category: product.category || "General",
        description: product.description || "",
      });

      return response
        .split('\n')
        .filter(line => line.trim() && line.includes("❓"))
        .map(line => line.trim())
        .slice(0, 3);
    } catch (error) {
      console.error("Error generating improvement questions:", error);
      // Fallback a preguntas genéricas
      return [
        "❓ ¿Para quién está diseñado este producto?",
        "❓ ¿Qué problema específico resuelve?",
        "❓ ¿Qué lo hace único comparado con otros similares?",
      ];
    }
  }
}

// Exportar una instancia singleton
export const productValidatorAgent = new ProductValidatorAgent();