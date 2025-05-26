'use server'

import { db } from "@/utils";
import { onBoardUser } from "./user";

export async function getAgentProducts(agentId: string) {
    const user = await onBoardUser();
    if (!user?.data?.id) throw new Error("User not found");

    const agent = await db.chatAgent.findFirst({
        where: { id: agentId, userId: user.data.id },
    });
    if (!agent) throw new Error("Agent not found");

    const products = await db.product.findMany({
        where: { chatAgentId: agentId },
    });

    return products;
}

export async function createAgentProducts(agentId: string, products: any[]) {
    const user = await onBoardUser();
    if (!user?.data?.id) throw new Error("User not found");

    // Verificar que el agente existe y pertenece al usuario
    const agent = await db.chatAgent.findFirst({
        where: { id: agentId, userId: user.data.id },
    });
    if (!agent) throw new Error("Agent not found");

    // Validar que hay productos para crear
    if (!products || products.length === 0) {
        throw new Error("No products provided");
    }

    try {
        // Crear los productos en una transacción
        const createdProducts = await db.$transaction(
            products.map((product) => {
                // Validar campos requeridos
                if (!product.name || !product.description || product.price <= 0) {
                    throw new Error(`Invalid product data: ${JSON.stringify(product)}`);
                }

                return db.product.create({
                    data: {
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        stock: product.stock || 0,
                        images: product.images || [],
                        category: product.category || "",
                        chatAgentId: agentId,
                    },
                });
            })
        );

        return { status: 201, data: createdProducts };
    } catch (error) {
        console.error("Error creating products:", error);
        throw new Error("Error al crear los productos");
    }
}

export async function updateAgentProduct(productId: string, productData: any) {
    const user = await onBoardUser();
    if (!user?.data?.id) throw new Error("User not found");

    // Verificar que el producto existe y pertenece a un agente del usuario
    const product = await db.product.findFirst({
        where: { 
            id: productId,
            chatAgent: {
                userId: user.data.id
            }
        },
        include: {
            chatAgent: true
        }
    });

    if (!product) throw new Error("Product not found");

    try {
        const updatedProduct = await db.product.update({
            where: { id: productId },
            data: {
                name: productData.name,
                description: productData.description,
                price: productData.price,
                stock: productData.stock,
                images: productData.images,
                category: productData.category,
            },
        });

        return { status: 200, data: updatedProduct };
    } catch (error) {
        console.error("Error updating product:", error);
        throw new Error("Error al actualizar el producto");
    }
}

export async function deleteAgentProduct(productId: string) {
    const user = await onBoardUser();
    if (!user?.data?.id) throw new Error("User not found");

    // Verificar que el producto existe y pertenece a un agente del usuario
    const product = await db.product.findFirst({
        where: { 
            id: productId,
            chatAgent: {
                userId: user.data.id
            }
        },
    });

    if (!product) throw new Error("Product not found");

    try {
        await db.product.delete({
            where: { id: productId },
        });

        return { status: 200, message: "Product deleted successfully" };
    } catch (error) {
        console.error("Error deleting product:", error);
        throw new Error("Error al eliminar el producto");
    }
}