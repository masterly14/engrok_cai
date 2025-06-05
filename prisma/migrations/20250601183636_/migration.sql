/*
  Warnings:

  - You are about to drop the column `activated` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `addedKnowledgeBase` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `averageDurarion` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `companyLogo` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `companyWebsite` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `conversations` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `first_message` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `idElevenLabs` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `isWidget` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgeBaseId` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `voice_id` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `widgetId` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the `AgentPhoneNumber` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Widget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workflow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledgeBase` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[vapiId]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstMessage` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_knowledgeBaseId_fkey";

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentPhoneNumber" DROP CONSTRAINT "AgentPhoneNumber_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_widgetId_fkey";

-- DropForeignKey
ALTER TABLE "Widget" DROP CONSTRAINT "Widget_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Workflow" DROP CONSTRAINT "Workflow_userId_fkey";

-- DropForeignKey
ALTER TABLE "knowledgeBase" DROP CONSTRAINT "knowledgeBase_userId_fkey";

-- DropIndex
DROP INDEX "Agent_companyName_idx";

-- DropIndex
DROP INDEX "Agent_idElevenLabs_key";

-- DropIndex
DROP INDEX "Agent_phoneNumber_key";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "activated",
DROP COLUMN "addedKnowledgeBase",
DROP COLUMN "averageDurarion",
DROP COLUMN "companyLogo",
DROP COLUMN "companyName",
DROP COLUMN "companyWebsite",
DROP COLUMN "conversations",
DROP COLUMN "first_message",
DROP COLUMN "idElevenLabs",
DROP COLUMN "isWidget",
DROP COLUMN "knowledgeBaseId",
DROP COLUMN "language",
DROP COLUMN "phoneNumber",
DROP COLUMN "type",
DROP COLUMN "voice_id",
DROP COLUMN "widgetId",
ADD COLUMN     "backgroundSound" TEXT,
ADD COLUMN     "firstMessage" TEXT NOT NULL,
ADD COLUMN     "vapiId" TEXT;

-- DropTable
DROP TABLE "AgentPhoneNumber";

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "Question";

-- DropTable
DROP TABLE "Template";

-- DropTable
DROP TABLE "Widget";

-- DropTable
DROP TABLE "Workflow";

-- DropTable
DROP TABLE "knowledgeBase";

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL,
    "vapiId" TEXT,
    "type" TEXT NOT NULL,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "endedReason" TEXT,
    "cost" DOUBLE PRECISION,
    "costBreakdown" JSONB,
    "costs" JSONB[],
    "phoneCallProvider" TEXT,
    "phoneCallTransport" TEXT,
    "phoneCallProviderId" TEXT,
    "messages" JSONB[],
    "assistantId" TEXT,
    "assistantOverrides" JSONB,
    "squadId" TEXT,
    "workflowId" TEXT,
    "phoneNumberId" TEXT,
    "customerId" TEXT,
    "destination" JSONB,
    "artifactPlan" JSONB,
    "analysis" JSONB,
    "monitor" JSONB,
    "artifact" JSONB,
    "schedulePlan" JSONB,
    "transport" JSONB,
    "name" TEXT,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calls_vapiId_key" ON "calls"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_vapiId_key" ON "Agent"("vapiId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
