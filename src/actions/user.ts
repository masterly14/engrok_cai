"use server";

import { db } from "@/utils";
import { checkUserSubscription } from "@/utils/checkSubscription";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) {
    console.log("No hay user");
    throw new Error("User not authenticated on server.");
  }
  
  // Devolver solo los datos serializables necesarios
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    name: `${user.firstName} ${user.lastName}`.trim(),
  };
};

export const onBoardUser = async (variantId?: string) => {
  const user = await onCurrentUser();

  try {
    const userExists = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, temporalVariantId: true, createdAt: true, updatedAt: true },
    });

    let wasJustCreated = false;
    let finalUser;

    if (!userExists) {
      try {
        console.log('Creando usuario');
        finalUser = await db.user.create({
          data: {
            id: uuidv4(),
            clerkId: user.id,
            email: user.email,
            name: user.name,
            temporalVariantId: variantId,
            transactions: {
              create: {
                amount: 0,
                status: 'ACCEPTED',
                type: 'INITIAL_RECHARGE',
              },
            },
            amountCredits: 0,
            initialAmountCredits: 0,
          },
        });
        wasJustCreated = true;
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Race condition: another request created the user. We can proceed as if it existed.
        } else {
          throw error;
        }
      }
    }
    
    if (wasJustCreated && finalUser) {
      console.log('Creando datos iniciales para el nuevo usuario');
      const initialTags = [
        { name: "Tecnología", color: "#3b82f6", userId: finalUser.id },
        { name: "Retail", color: "#10b981", userId: finalUser.id },
        { name: "Finanzas", color: "#f59e0b", userId: finalUser.id },
        { name: "Salud", color: "#ec4899", userId: finalUser.id },
        { name: "Manufactura", color: "#8b5cf6", userId: finalUser.id },
        { name: "Biotecnología", color: "#06b6d4", userId: finalUser.id },
        { name: "Inteligencia Artificial", color: "#f43f5e", userId: finalUser.id },
        { name: "Negocios", color: "#6366f1", userId: finalUser.id },
        { name: "Educación ", color: "#84cc16", userId: finalUser.id },
        { name: "Servicios", color: "#ef4444", userId: finalUser.id },
      ];
      for (const tag of initialTags) {
        await db.tag.upsert({
          where: { name_userId: { name: tag.name, userId: finalUser.id } },
          update: { color: tag.color },
          create: tag,
        });
      }

      const initialStages = [
        { id: "new", name: "Nuevo", color: "#3b82f6", userId: finalUser.id },
        { id: "qualified", name: "Calificado", color: "#10b981", userId: finalUser.id },
        { id: "negotiation", name: "Negociación", color: "#f59e0b", userId: finalUser.id },
        { id: "closed", name: "Cerrado", color: "#8b5cf6", userId: finalUser.id },
      ];
      console.log("Creando las stages del CRM");
      for (const stage of initialStages) {
        await db.stage.upsert({
          where: { id_userId: { id: stage.id, userId: finalUser.id } },
          update: { name: stage.name, color: stage.color },
          create: stage,
        });
      }
    }

    // Fetch the complete user data, including relations
    let fullUser = await db.user.findUnique({
      where: { clerkId: user.id },
      include: { agents: true },
    });

    if (!fullUser) {
      // This should not be null if logic is correct
      throw new Error("User not found after on-boarding process.");
    }

    // Common logic for both new and existing users
    if (variantId && !fullUser.temporalVariantId) {
      fullUser = await db.user.update({
        where: { id: fullUser.id },
        data: { temporalVariantId: variantId },
        include: { agents: true },
      });
    }

    return {
      status: wasJustCreated ? 201 : 200,
      data: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        temporalVariantId: fullUser.temporalVariantId,
      },
      initialCredits: fullUser.initialAmountCredits,
      credits: fullUser.amountCredits,
      agents: fullUser.agents,
    };
  } catch (error: any) {
    console.error("Error during database operation in onBoardUser:", error.message);
    throw error;
  }
};


export async function getUserSubscription() {
  const user = await onBoardUser();
  if (!user) {
    throw new Error("User not found");
  }
  return await checkUserSubscription(user.data.id);
}