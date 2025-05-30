import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { db } from "@/utils";

// Mapa en memoria para almacenar un vector store por cada ChatAgent
type StoreMap = Record<string, MemoryVectorStore>;

export class productDatabase {
  private stores: StoreMap = {};

  /**
   * Devuelve información formateada de los productos relevantes para un chatAgent.
   * Construye (y cachea) el vector store a partir de los productos de la DB.
   */
  async getRelevanProducts(chatAgentId: string, query: string): Promise<string> {
    console.log(`[productDatabase] Getting relevant products for chatAgentId: ${chatAgentId}`);
    console.log(`[productDatabase] Search query: ${query}`);

    const store = await this.getStoreForAgent(chatAgentId);
    console.log(`[productDatabase] Vector store retrieved/created for chatAgentId: ${chatAgentId}`);

    const results = await store.similaritySearch(query, 3);
    console.log(`[productDatabase] Similarity search results count: ${results.length}`);

    const productIds = Array.from(
      new Set(results.map((doc) => doc.metadata?.productId as string))
    );
    console.log(`[productDatabase] Unique product IDs found: ${productIds.length}`);

    // Obtener los productos directamente de la DB
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });
    console.log(`[productDatabase] Products retrieved from DB: ${products.length}`);

    const formatted = products.map(this.formatProduct).join("\n\n");
    console.log(`[productDatabase] Formatted products response length: ${formatted.length} characters`);
    
    return formatted;
  }

  /**
   * Obtiene (o crea) el vector store para un ChatAgent concreto.
   */
  private async getStoreForAgent(chatAgentId: string): Promise<MemoryVectorStore> {
    console.log(`[productDatabase] Getting/Creating store for chatAgentId: ${chatAgentId}`);
    
    if (this.stores[chatAgentId]) {
      console.log(`[productDatabase] Using cached store for chatAgentId: ${chatAgentId}`);
      return this.stores[chatAgentId];
    }

    console.log(`[productDatabase] Fetching products from DB for chatAgentId: ${chatAgentId}`);
    const products = await db.product.findMany({ where: { chatAgentId } });
    console.log(`[productDatabase] Found ${products.length} products in DB`);

    // Si el agente no tiene productos, devolvemos un vector store vacío para evitar errores
    if (!products.length) {
      console.log(`[productDatabase] No products found, creating empty store for chatAgentId: ${chatAgentId}`);
      const emptyStore = await MemoryVectorStore.fromTexts([], [], new OpenAIEmbeddings());
      this.stores[chatAgentId] = emptyStore;
      return emptyStore;
    }

    console.log(`[productDatabase] Creating documents from products`);
    const documents = products.flatMap((product) => {
      const docs: Document[] = [];

      // Descripción principal
      docs.push(
        new Document({
          pageContent: `${product.name}: ${product.description ?? ""}. Precio: ${product.price}`,
          metadata: { productId: product.id, docType: "overview" },
        })
      );

      // Características (si es que existen en JSON metadata)
      if ((product as any).features) {
        (product as any).features.forEach((feature: string) => {
          docs.push(
            new Document({
              pageContent: `Característica de ${product.name}: ${feature}`,
              metadata: { productId: product.id, docType: "feature" },
            })
          );
        });
      }

      return docs;
    });
    console.log(`[productDatabase] Created ${documents.length} documents from products`);

    console.log(`[productDatabase] Creating vector store with OpenAI embeddings`);
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
    console.log(`[productDatabase] Vector store created successfully`);
    
    this.stores[chatAgentId] = vectorStore;
    return vectorStore;
  }

  private formatProduct(product: any): string {
    console.log(`[productDatabase] Formatting product: ${product.name}`);
    const images: string[] = (product.images || []) as string[];
    console.log(`[productDatabase] Product ${product.name} has ${images.length} images`);
    
    const imgSection = images.length
      ? `Imágenes:\n${images.map((u) => `- ${u}`).join("\n")}`
      : "";

    const formatted = `Nombre: ${product.name}\nDescripción: ${product.description ?? ""}\nPrecio: ${product.price}\n${imgSection}`;
    console.log(`[productDatabase] Formatted product ${product.name} successfully`);
    return formatted;
  }

  async getProductByName(chatAgentId: string, productName: string): Promise<any> {
    console.log(`[productDatabase] Getting product by name: ${productName} for chatAgentId: ${chatAgentId}`);
    
    const product = await db.product.findFirst({
      where: {
        chatAgentId,
        name: productName
      }
    });

    console.log(`[productDatabase] Found product:`, product ? product.name : 'none');
    return product;
  }

  async getAllProducts(chatAgentId: string): Promise<any[]> {
    console.log(`[productDatabase] Getting all products for chatAgentId: ${chatAgentId}`);
    
    const products = await db.product.findMany({
      where: {
        chatAgentId
      }
    });

    console.log(`[productDatabase] Found ${products.length} products`);
    return products;
  }
}
