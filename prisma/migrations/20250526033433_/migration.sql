/*
  Warnings:

  - You are about to drop the column `webhookUrl` on the `ChatAgent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_chatAgentId_fkey";

-- AlterTable
ALTER TABLE "ChatAgent" DROP COLUMN "webhookUrl";

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
