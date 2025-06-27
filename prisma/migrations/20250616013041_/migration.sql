/*
  Warnings:

  - You are about to drop the column `activeChats` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `apiKey` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `averageResponseTime` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `businessInfo` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumberId` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `stageId` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `stageUserId` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `totalMessages` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `webhook_verify` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappBusinessId` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappWebhookSecret` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `wompiEventsKey` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `wompiPrivateKey` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `chatAgentId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeen` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `stageId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `stageUserId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `chatAgentId` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `contactId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ChatAgentToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ContactToTag` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatAgent" DROP CONSTRAINT "ChatAgent_stageId_stageUserId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_chatAgentId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_stageId_stageUserId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_chatAgentId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_contactId_fkey";

-- DropForeignKey
ALTER TABLE "MessageTemplate" DROP CONSTRAINT "MessageTemplate_chatAgentId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_chatAgentId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_chatAgentId_fkey";

-- DropForeignKey
ALTER TABLE "_ChatAgentToTag" DROP CONSTRAINT "_ChatAgentToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChatAgentToTag" DROP CONSTRAINT "_ChatAgentToTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_ContactToTag" DROP CONSTRAINT "_ContactToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ContactToTag" DROP CONSTRAINT "_ContactToTag_B_fkey";

-- DropIndex
DROP INDEX "ChatAgent_phoneNumber_key";

-- DropIndex
DROP INDEX "ChatAgent_stageId_stageUserId_idx";

-- DropIndex
DROP INDEX "ChatAgent_userId_idx";

-- DropIndex
DROP INDEX "ChatAgent_whatsappWebhookSecret_key";

-- DropIndex
DROP INDEX "Contact_chatAgentId_idx";

-- DropIndex
DROP INDEX "Contact_phoneNumber_idx";

-- DropIndex
DROP INDEX "Contact_stageId_stageUserId_idx";

-- DropIndex
DROP INDEX "Lead_chatAgentId_idx";

-- DropIndex
DROP INDEX "Message_contactId_idx";

-- AlterTable
ALTER TABLE "ChatAgent" DROP COLUMN "activeChats",
DROP COLUMN "apiKey",
DROP COLUMN "averageResponseTime",
DROP COLUMN "businessInfo",
DROP COLUMN "phoneNumber",
DROP COLUMN "phoneNumberId",
DROP COLUMN "stageId",
DROP COLUMN "stageUserId",
DROP COLUMN "totalMessages",
DROP COLUMN "type",
DROP COLUMN "webhook_verify",
DROP COLUMN "whatsappBusinessId",
DROP COLUMN "whatsappWebhookSecret",
DROP COLUMN "wompiEventsKey",
DROP COLUMN "wompiPrivateKey";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "chatAgentId",
DROP COLUMN "company",
DROP COLUMN "lastSeen",
DROP COLUMN "notes",
DROP COLUMN "stageId",
DROP COLUMN "stageUserId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "chatAgentId";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "contactId";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "MessageTemplate";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "_ChatAgentToTag";

-- DropTable
DROP TABLE "_ContactToTag";

-- CreateTable
CREATE TABLE "ChatWorkflow" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "workflowJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "ChatWorkflow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatWorkflow" ADD CONSTRAINT "ChatWorkflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
