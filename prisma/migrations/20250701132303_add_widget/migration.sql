-- CreateTable
CREATE TABLE "ElevenLabsWidget" (
    "id" UUID NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstMessage" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "voiceId" TEXT,
    "actionText" TEXT,
    "avatarImageUrl" TEXT,
    "dynamicVariables" JSONB,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElevenLabsWidget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ElevenLabsWidget_agentId_key" ON "ElevenLabsWidget"("agentId");

-- AddForeignKey
ALTER TABLE "ElevenLabsWidget" ADD CONSTRAINT "ElevenLabsWidget_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
