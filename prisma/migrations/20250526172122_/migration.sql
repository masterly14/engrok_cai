/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `ChatAgent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatAgent_phoneNumber_key" ON "ChatAgent"("phoneNumber");
