/*
  Warnings:

  - You are about to drop the column `userId` on the `ChatWorkflow` table. All the data in the column will be lost.
  - You are about to drop the column `workflowJson` on the `ChatWorkflow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,agentId]` on the table `ChatWorkflow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `whatsappAccessToken` to the `ChatAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappBusinessAccountId` to the `ChatAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappPhoneNumber` to the `ChatAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappPhoneNumberId` to the `ChatAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflow` to the `ChatWorkflow` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatWorkflow" DROP CONSTRAINT "ChatWorkflow_userId_fkey";

-- AlterTable
ALTER TABLE "ChatAgent" ADD COLUMN     "whatsappAccessToken" TEXT NOT NULL,
ADD COLUMN     "whatsappBusinessAccountId" TEXT NOT NULL,
ADD COLUMN     "whatsappPhoneNumber" TEXT NOT NULL,
ADD COLUMN     "whatsappPhoneNumberId" TEXT NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "ChatWorkflow" DROP COLUMN "userId",
DROP COLUMN "workflowJson",
ADD COLUMN     "agentId" UUID,
ADD COLUMN     "workflow" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT;

-- CreateTable
CREATE TABLE "ChatContact" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "workflowId" UUID NOT NULL,
    "currentNodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "variables" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatContact_phone_key" ON "ChatContact"("phone");

-- CreateIndex
CREATE INDEX "ChatSession_contactId_status_idx" ON "ChatSession"("contactId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChatWorkflow_name_agentId_key" ON "ChatWorkflow"("name", "agentId");

-- AddForeignKey
ALTER TABLE "ChatWorkflow" ADD CONSTRAINT "ChatWorkflow_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ChatContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ChatWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
