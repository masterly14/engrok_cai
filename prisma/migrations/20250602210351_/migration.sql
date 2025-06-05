/*
  Warnings:

  - You are about to drop the column `showModalCredits` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "showModalCredits";

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" UUID NOT NULL,
    "vapiId" TEXT,
    "provider" TEXT NOT NULL,
    "assistantId" TEXT,
    "number" TEXT NOT NULL,
    "extension" TEXT,
    "workflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_vapiId_key" ON "PhoneNumber"("vapiId");

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
