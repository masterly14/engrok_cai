-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('FACEBOOK', 'GOOGLE_CALENDAR', 'GOOGLE_SHEETS', 'CAL_COM', 'HUBSPOT', 'AIRTABLE');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'PENDING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'CONTACTS', 'BUTTON', 'INTERACTIVE');

-- CreateEnum
CREATE TYPE "TYPE_AGENT" AS ENUM ('outbound', 'inbound', 'widget');

-- CreateEnum
CREATE TYPE "TYPE_CHAT_AGENT" AS ENUM ('SALES');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'APPROVED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountCredits" INTEGER NOT NULL,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalAverageDuration" INTEGER NOT NULL DEFAULT 0,
    "totalCost" INTEGER NOT NULL DEFAULT 0,
    "initialAmountCredits" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL,
    "waId" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stageId" TEXT,
    "notes" TEXT,
    "stageUserId" UUID,
    "chatAgentId" UUID,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backgroundSound" TEXT,
    "firstMessage" TEXT NOT NULL,
    "vapiId" TEXT,
    "voiceId" TEXT,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "extension" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT DEFAULT 'nuevo-numero',
    "sipPassword" TEXT,
    "sipUri" TEXT,
    "sipUsername" TEXT,
    "twilioAccountId" TEXT,
    "twilioAuthToken" TEXT,
    "vapiId" UUID,
    "credentialId" UUID,
    "assistantId" UUID,
    "workflowId" UUID,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vapiId" TEXT,
    "tools" JSONB,
    "workflowJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" UUID NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerConfigKey" TEXT NOT NULL,
    "authMode" TEXT NOT NULL,
    "endUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" UUID NOT NULL,
    "trieveApiKey" TEXT NOT NULL,
    "vapiId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "credentialId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAgent" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whatsappBusinessId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "activeChats" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "userId" UUID NOT NULL,
    "stageId" TEXT,
    "stageUserId" UUID,
    "phoneNumber" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "type" "TYPE_CHAT_AGENT" NOT NULL DEFAULT 'SALES',
    "wompiEventsKey" TEXT,
    "wompiPrivateKey" TEXT,
    "businessInfo" JSONB,
    "whatsappWebhookSecret" TEXT NOT NULL DEFAULT '',
    "webhook_verify" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "waId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" "MessageType" NOT NULL,
    "textBody" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" UUID NOT NULL,
    "id" UUID NOT NULL,
    "chatAgentId" UUID,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAgentMessageAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalAgentMessages" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "lastResponseTime" INTEGER,
    "isOver24Hours" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" UUID NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'PENDING',
    "components" JSONB NOT NULL,
    "chatAgentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT,
    "tags" TEXT[],
    "lastContact" TEXT NOT NULL,
    "notes" TEXT,
    "value" DOUBLE PRECISION,
    "userId" UUID NOT NULL,
    "stageId" TEXT NOT NULL,
    "chatAgentId" UUID,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "id" TEXT NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id","userId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" JSONB NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chatAgentId" UUID NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "chatAgentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productIds" TEXT[],
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentLink" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountInCents" INTEGER,
    "billingData" JSONB,
    "currency" TEXT,
    "customerData" JSONB,
    "customerEmail" TEXT,
    "origin" TEXT,
    "paymentLinkId" TEXT,
    "paymentMethod" JSONB,
    "paymentMethodType" TEXT,
    "paymentSourceId" TEXT,
    "productQuantities" JSONB,
    "redirectUrl" TEXT,
    "reference" TEXT,
    "shippingAddress" JSONB,
    "statusMessage" TEXT,
    "transactionCreatedAt" TIMESTAMP(3),
    "transactionFinalizedAt" TIMESTAMP(3),
    "transactionId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL,
    "vapiId" TEXT,
    "type" TEXT NOT NULL,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "endedReason" TEXT,
    "cost" DOUBLE PRECISION,
    "costBreakdown" JSONB,
    "costs" JSONB[],
    "phoneCallProvider" TEXT,
    "phoneCallTransport" TEXT,
    "phoneCallProviderId" TEXT,
    "messages" JSONB[],
    "assistantId" TEXT,
    "assistantOverrides" JSONB,
    "squadId" TEXT,
    "workflowId" TEXT,
    "phoneNumberId" TEXT,
    "customerId" TEXT,
    "destination" JSONB,
    "artifactPlan" JSONB,
    "analysis" JSONB,
    "monitor" JSONB,
    "artifact" JSONB,
    "schedulePlan" JSONB,
    "transport" JSONB,
    "name" TEXT,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "lemonSqueezyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "endsAt" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "isUsageBased" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "renewsAt" TEXT,
    "statusFormatted" TEXT NOT NULL,
    "subscriptionItemId" TEXT,
    "trialEndsAt" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "interval" TEXT,
    "description" TEXT,
    "intervalCount" INTEGER,
    "isUsageBased" BOOLEAN NOT NULL DEFAULT false,
    "productId" INTEGER NOT NULL,
    "productName" TEXT,
    "sort" INTEGER,
    "trialInterval" TEXT,
    "trialIntervalCount" INTEGER,
    "variantId" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContactToTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ContactToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ChatAgentToTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ChatAgentToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_waId_key" ON "Contact"("waId");

-- CreateIndex
CREATE INDEX "Contact_phoneNumber_idx" ON "Contact"("phoneNumber");

-- CreateIndex
CREATE INDEX "Contact_stageId_stageUserId_idx" ON "Contact"("stageId", "stageUserId");

-- CreateIndex
CREATE INDEX "Contact_chatAgentId_idx" ON "Contact"("chatAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_vapiId_key" ON "Agent"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_vapiId_key" ON "PhoneNumber"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_vapiId_key" ON "Workflow"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_vapiId_key" ON "KnowledgeBase"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAgent_phoneNumber_key" ON "ChatAgent"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAgent_whatsappWebhookSecret_key" ON "ChatAgent"("whatsappWebhookSecret");

-- CreateIndex
CREATE INDEX "ChatAgent_userId_idx" ON "ChatAgent"("userId");

-- CreateIndex
CREATE INDEX "ChatAgent_stageId_stageUserId_idx" ON "ChatAgent"("stageId", "stageUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_waId_key" ON "Message"("waId");

-- CreateIndex
CREATE INDEX "Message_from_idx" ON "Message"("from");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE INDEX "Message_contactId_idx" ON "Message"("contactId");

-- CreateIndex
CREATE INDEX "Message_chatAgentId_idx" ON "Message"("chatAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_contactId_key" ON "Conversation"("contactId");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_isActive_idx" ON "Conversation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_externalId_key" ON "MessageTemplate"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_name_chatAgentId_key" ON "MessageTemplate"("name", "chatAgentId");

-- CreateIndex
CREATE INDEX "Lead_stageId_userId_idx" ON "Lead"("stageId", "userId");

-- CreateIndex
CREATE INDEX "Lead_chatAgentId_idx" ON "Lead"("chatAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_name_userId_key" ON "Stage"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_userId_key" ON "Tag"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "calls_vapiId_key" ON "calls"("vapiId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lemonSqueezyId_key" ON "Subscription"("lemonSqueezyId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_variantId_key" ON "Plan"("variantId");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- CreateIndex
CREATE INDEX "Integration_status_idx" ON "Integration"("status");

-- CreateIndex
CREATE INDEX "_ContactToTag_B_index" ON "_ContactToTag"("B");

-- CreateIndex
CREATE INDEX "_ChatAgentToTag_B_index" ON "_ChatAgentToTag"("B");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_stageId_stageUserId_fkey" FOREIGN KEY ("stageId", "stageUserId") REFERENCES "Stage"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_stageId_stageUserId_fkey" FOREIGN KEY ("stageId", "stageUserId") REFERENCES "Stage"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAgent" ADD CONSTRAINT "ChatAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_userId_fkey" FOREIGN KEY ("stageId", "userId") REFERENCES "Stage"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToTag" ADD CONSTRAINT "_ContactToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContactToTag" ADD CONSTRAINT "_ContactToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatAgentToTag" ADD CONSTRAINT "_ChatAgentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatAgentToTag" ADD CONSTRAINT "_ChatAgentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
