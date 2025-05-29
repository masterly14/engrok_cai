/*
  Warnings:

  - A unique constraint covering the columns `[whatsappWebhookSecret]` on the table `ChatAgent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatAgent_whatsappWebhookSecret_key" ON "ChatAgent"("whatsappWebhookSecret");
