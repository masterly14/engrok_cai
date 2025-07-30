/*
  Warnings:

  - A unique constraint covering the columns `[phone,chatAgentId]` on the table `ChatContact` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChatContact_phone_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChatContact_phone_chatAgentId_key" ON "ChatContact"("phone", "chatAgentId");
