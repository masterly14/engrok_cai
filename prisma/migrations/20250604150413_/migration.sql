/*
  Warnings:

  - You are about to drop the column `assistantId` on the `PhoneNumber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "assistantId",
ADD COLUMN     "inboundAssistantId" UUID,
ADD COLUMN     "outboundAssistantId" UUID;
