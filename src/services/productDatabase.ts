import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export class productDatabase {
  private vectorStore!: MemoryVectorStore;
  private products: any[];

  constructor() {
    this.products = [
      {
        id: "prod-1",
        name: "Paquete de Servicio Premium - Desarrollo de página web y SEO",
        description: "Nuestra oferta de servicio más completa con soporte 24/7",
        price: "$299/mes",
        features: [
          "Soporte 24/7",
          "Atención Prioritaria",
          "Gerente de Cuenta Dedicado",
        ],
        faq: [
          {
            q: "¿Puedo cancelar en cualquier momento?",
            a: "Sí, sin penalización.",
          },
          {
            q: "¿Cuánto tarda la implementación?",
            a: "Normalmente 2-3 días hábiles.",
          },
        ],
      },
      {
        id: "prod-2",
        name: "Paquete Profesional - Desarrollo de página web",
        description:
          "Solución ideal para negocios en crecimiento que necesitan asistencia confiable",
        price: "$149/mes",
        features: [
          "Soporte de lunes a viernes",
          "Tiempo de respuesta en 12h",
          "Consultor asignado",
        ],
        faq: [
          {
            q: "¿Incluye soporte técnico?",
            a: "Sí, dentro del horario laboral.",
          },
          {
            q: "¿Se puede actualizar al paquete Premium?",
            a: "Sí, en cualquier momento.",
          },
        ],
      },
      {
        id: "prod-3",
        name: "Paquete Básico - Prototipado web",
        description:
          "Perfecto para emprendedores o pequeños negocios que inician",
        price: "$49/mes",
        features: [
          "Acceso a recursos básicos",
          "Asistencia por correo electrónico",
          "Panel de usuario simple",
        ],
        faq: [
          {
            q: "¿Tiene soporte incluido?",
            a: "Solo por correo electrónico, en horario laboral.",
          },
          {
            q: "¿Se puede cancelar el plan?",
            a: "Sí, puedes cancelar cuando quieras sin cargos.",
          },
        ],
      },
    ];

    this.initVectorStore();
  }

  private async initVectorStore() {
    const documents = this.products.flatMap((product) => {
      const docs = [
        new Document({
          pageContent: `${product.name}: ${product.description}. Price: ${product.price}`,
          metadata: { productId: product.id, docType: "overview" },
        }),
      ];

      product.features.forEach((feature: any) => {
        docs.push(
          new Document({
            pageContent: `Feature of ${product.name}: ${feature}`,
            metadata: { productId: product.id, docType: "feature" },
          })
        );
      });

      product.faq.forEach((faq: any) => {
        docs.push(
          new Document({
            pageContent: `FAQ about ${product.name}: Q: ${faq.q} A: ${faq.a}`,
            metadata: { productId: product.id, docType: "faq" },
          })
        );
      });

      return docs;
    });

    const embeddings = new OpenAIEmbeddings();
    this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings)
  }

  async getRelevanProducts(query: string): Promise<string> {
    const results = await this.vectorStore.similaritySearch(query, 3);

    return results.map(doc => doc.pageContent).join('\n\n');
  }

  getProductById(productId: string): any {
    return this.products.find(p => p.id === productId);
  }

  getAllProducts(): any[] {
    return this.products;
  }
}
