-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" UUID NOT NULL,
    "twilio_account_sid" TEXT NOT NULL,
    "twilio_auth_token" TEXT NOT NULL,
    "twilio_phone_number" TEXT NOT NULL,
    "agentId" UUID NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_agentId_key" ON "PhoneNumber"("agentId");

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
