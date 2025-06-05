/*
  Warnings:

  - The `vapiId` column on the `PhoneNumber` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `assistantId` column on the `PhoneNumber` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workflowId` column on the `PhoneNumber` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `credentialId` column on the `PhoneNumber` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `squadId` column on the `PhoneNumber` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Files" DROP CONSTRAINT "Files_userId_fkey";

-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "vapiId",
ADD COLUMN     "vapiId" UUID,
DROP COLUMN "assistantId",
ADD COLUMN     "assistantId" UUID,
DROP COLUMN "workflowId",
ADD COLUMN     "workflowId" UUID,
DROP COLUMN "credentialId",
ADD COLUMN     "credentialId" UUID,
DROP COLUMN "squadId",
ADD COLUMN     "squadId" UUID;

-- DropTable
DROP TABLE "Files";

-- CreateTable
CREATE TABLE "Squad" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSquad" (
    "id" UUID NOT NULL,
    "prompt" TEXT,
    "firstMessage" TEXT,
    "voiceId" TEXT,
    "agentId" UUID NOT NULL,
    "squadId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSquad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" UUID NOT NULL,
    "trieveApiKey" TEXT NOT NULL,
    "knowledgeBaseId" TEXT NOT NULL,
    "vapiId" TEXT,
    "name" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentSquad_agentId_idx" ON "AgentSquad"("agentId");

-- CreateIndex
CREATE INDEX "AgentSquad_squadId_idx" ON "AgentSquad"("squadId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSquad_agentId_squadId_key" ON "AgentSquad"("agentId", "squadId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_vapiId_key" ON "KnowledgeBase"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_vapiId_key" ON "PhoneNumber"("vapiId");

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSquad" ADD CONSTRAINT "AgentSquad_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSquad" ADD CONSTRAINT "AgentSquad_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
