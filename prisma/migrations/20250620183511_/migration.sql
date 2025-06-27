/*
  Warnings:

  - A unique constraint covering the columns `[whatsappPhoneNumberId]` on the table `ChatAgent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatAgent_whatsappPhoneNumberId_key" ON "ChatAgent"("whatsappPhoneNumberId");
