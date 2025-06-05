/*
  Warnings:

  - You are about to drop the column `inboundAssistantId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the column `inboundSquadId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the column `inboundWorkflowId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the column `outboundAssistantId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the column `outboundSquadId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the column `outboundWorkflowId` on the `PhoneNumber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "inboundAssistantId",
DROP COLUMN "inboundSquadId",
DROP COLUMN "inboundWorkflowId",
DROP COLUMN "outboundAssistantId",
DROP COLUMN "outboundSquadId",
DROP COLUMN "outboundWorkflowId",
ADD COLUMN     "assistantId" UUID,
ADD COLUMN     "squadId" UUID,
ADD COLUMN     "workflowId" UUID;
