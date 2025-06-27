/*
  Warnings:

  - Added the required column `chatAgentId` to the `ChatContact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatAgentId` to the `ChatSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatContact" ADD COLUMN     "chatAgentId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "chatAgentId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "ChatContact" ADD CONSTRAINT "ChatContact_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
