import { PrismaClient, User } from "@prisma/client";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function getAuthenticatedUser(
  request: NextRequest,
): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7); // Remove "Bearer "
  if (!token) {
    return null;
  }

  try {
    const accessToken = await prisma.accessToken.findUnique({
      where: { accessToken: token },
      include: { user: true },
    });

    return accessToken?.user ?? null;
  } catch (error) {
    console.error("Error validating token:", error);
    return null;
  }
}
