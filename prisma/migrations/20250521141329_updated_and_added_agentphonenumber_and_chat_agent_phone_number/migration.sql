/*
  Warnings:

  - You are about to drop the `PhoneNumber` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhoneNumber" DROP CONSTRAINT "PhoneNumber_agentId_fkey";

-- DropTable
DROP TABLE "PhoneNumber";

-- CreateTable
CREATE TABLE "AgentPhoneNumber" (
    "id" UUID NOT NULL,
    "twilio_account_sid" TEXT NOT NULL,
    "twilio_auth_token" TEXT NOT NULL,
    "twilio_phone_number" TEXT NOT NULL,
    "agentId" UUID NOT NULL,

    CONSTRAINT "AgentPhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAgentPhoneNumber" (
    "id" UUID NOT NULL,
    "twilio_account_sid" TEXT NOT NULL,
    "twilio_auth_token" TEXT NOT NULL,
    "twilio_phone_number" TEXT NOT NULL,
    "chatAgentId" UUID NOT NULL,

    CONSTRAINT "ChatAgentPhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentPhoneNumber_agentId_key" ON "AgentPhoneNumber"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAgentPhoneNumber_chatAgentId_key" ON "ChatAgentPhoneNumber"("chatAgentId");

-- AddForeignKey
ALTER TABLE "AgentPhoneNumber" ADD CONSTRAINT "AgentPhoneNumber_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAgentPhoneNumber" ADD CONSTRAINT "ChatAgentPhoneNumber_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
