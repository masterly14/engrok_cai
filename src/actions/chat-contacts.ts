"use server";

import { db } from "@/utils";
import { currentUser } from "@clerk/nextjs/server";

export const getChatContacts = async () => {
  const user = await currentUser();
  if (!user) {
    throw new Error("User not authenticated.");
  }

  const contacts = await db.chatContact.findMany({
    where: {
      chatAgent: {
        user: {
          clerkId: user.id,
        },
      },
    },
    include: {
      chatAgent: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
        createdAt: 'desc'
    }
  });
  return contacts;
};

export const importContacts = async (
    contacts: { phone: string; name?: string }[],
    chatAgentId: string
  ) => {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated.");
    }
  
    // Optional: Verify that the chatAgentId belongs to the user to prevent unauthorized additions
    const agent = await db.chatAgent.findUnique({
      where: { id: chatAgentId },
      select: { userId: true }
    });
  
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
  
    if (!agent || agent.userId !== dbUser?.id) {
      throw new Error("Invalid agent selected or permission denied.");
    }
  
    const contactsToCreate = contacts.map(contact => ({
      ...contact,
      chatAgentId: chatAgentId,
    }));
  
    try {
      const result = await db.chatContact.createMany({
        data: contactsToCreate,
        skipDuplicates: true, // This will skip inserting contacts with a phone number that already exists
      });
      return result;
    } catch (error) {
      console.error("Error importing contacts:", error);
      throw new Error("Failed to import contacts.");
    }
}; 