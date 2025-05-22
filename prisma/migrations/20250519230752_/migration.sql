-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "chatAgentId" UUID;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "chatAgentId" UUID;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "chatAgentId" UUID;

-- CreateTable
CREATE TABLE "ChatAgent" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "whatsappBusinessId" TEXT,
    "apiKey" TEXT,
    "webhookUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT '¡Hola! ¿En qué puedo ayudarte?',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'Lo siento, no entiendo tu mensaje. ¿Podrías reformularlo?',
    "maxResponseTime" INTEGER NOT NULL DEFAULT 30,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "activeChats" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID NOT NULL,
    "knowledgeBaseId" UUID,
    "stageId" TEXT,
    "stageUserId" UUID,

    CONSTRAINT "ChatAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatAgentToTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ChatAgentToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatAgent_phoneNumber_key" ON "ChatAgent"("phoneNumber");

-- CreateIndex
CREATE INDEX "ChatAgent_userId_idx" ON "ChatAgent"("userId");

-- CreateIndex
CREATE INDEX "ChatAgent_phoneNumber_idx" ON "ChatAgent"("phoneNumber");

-- CreateIndex
CREATE INDEX "ChatAgent_stageId_stageUserId_idx" ON "ChatAgent"("stageId", "stageUserId");

-- CreateIndex
CREATE INDEX "_ChatAgentToTag_B_index" ON "_ChatAgentToTag"("B");

-- CreateIndex
CREATE INDEX "Contact_chatAgentId_idx" ON "Contact"("chatAgentId");

-- CreateIndex
CREATE INDEX "Lead_chatAgentId_idx" ON "Lead"("chatAgentId");

-- CreateIndex
CREATE INDEX "Message_chatAgentId_idx" ON "Message"("chatAgentId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "knowledgeBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_stageId_stageUserId_fkey" FOREIGN KEY ("stageId", "stageUserId") REFERENCES "Stage"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatAgentToTag" ADD CONSTRAINT "_ChatAgentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatAgentToTag" ADD CONSTRAINT "_ChatAgentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
