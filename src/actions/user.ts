"use server";

import { db } from "@/utils";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) {
    console.log("No hay user");
    return redirect("/sign-in");
  }
  
  // Devolver solo los datos serializables necesarios
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    name: `${user.firstName} ${user.lastName}`.trim(),
  };
};

export const onBoardUser = async () => {
  const user = await onCurrentUser();

  try {
    const foundUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
      include: {
        agents: true,
      },
    });

    if (foundUser) {
      console.log(user.id)
      return {
        status: 200,
        data: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
        },
        initialCredits: foundUser.initialAmountCredits,
        credits: foundUser.amountCredits,
        agents: foundUser.agents,
      };
    } else {
      console.log('Creando usuario')
      const createdUser = await db.user.create({
        data: {
          clerkId: user.id,
          email: user.email,
          name: user.name,
          transactions: {
            create: {
              amount: 0,
              status: "ACCEPTED",
              type: "INITIAL_RECHARGE",
            },
          },
          amountCredits: 1000,
        },
      });
  
      const initialTags = [
        { name: "Tecnología", color: "#3b82f6", userId: createdUser.id },
        { name: "Retail", color: "#10b981", userId: createdUser.id },
        { name: "Finanzas", color: "#f59e0b", userId: createdUser.id },
        { name: "Salud", color: "#ec4899", userId: createdUser.id },
        { name: "Manufactura", color: "#8b5cf6", userId: createdUser.id },
        { name: "Biotecnología", color: "#06b6d4", userId: createdUser.id },
        { name: "Inteligencia Artificial", color: "#f43f5e", userId: createdUser.id },
        { name: "Negocios", color: "#6366f1", userId: createdUser.id },
        { name: "Educación ", color: "#84cc16", userId: createdUser.id },
        { name: "Servicios", color: "#ef4444", userId: createdUser.id },
      ];
      for (const tag of initialTags) {
        await db.tag.upsert({
          where: {
            name_userId: {
              name: tag.name, 
              userId: createdUser.id  
            },
          },
          update: { color: tag.color },
          create: tag,
        });
        
      }
  
      const initialStages = [
        { id: "new", name: "Nuevo", color: "#3b82f6", userId: createdUser.id },
        { id: "qualified", name: "Calificado", color: "#10b981", userId: createdUser.id },
        { id: "negotiation", name: "Negociación", color: "#f59e0b", userId: createdUser.id },
        { id: "closed", name: "Cerrado", color: "#8b5cf6", userId: createdUser.id },
      ];  

      
      console.log("Creando las stages del CRM");
      for (const stage of initialStages) {
        await db.stage.upsert({
          where: {
            id_userId: {
              id: stage.id,
              userId: createdUser.id,
            },
          },
          update: { name: stage.name, color: stage.color },
          create: stage,
        });
      }
      return {
        status: 201,
        data: createdUser,
      };
    }
  } catch (error: any) {
    console.log(error.message);
  }
};
