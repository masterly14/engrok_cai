-- CreateEnum
CREATE TYPE "TYPE_USE_WIDGET" AS ENUM ('USER', 'LAYOUT');

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
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "widgetId" UUID NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" UUID NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Widget" (
    "id" UUID NOT NULL,
    "idElevenLabs" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "activated" BOOLEAN NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "action_text" TEXT NOT NULL DEFAULT '¿Need help?',
    "bg_color" TEXT NOT NULL DEFAULT '#ffffff',
    "border_color" TEXT NOT NULL DEFAULT '#dedede',
    "border_radius" INTEGER NOT NULL DEFAULT 23,
    "btn_color" TEXT NOT NULL DEFAULT '#000000',
    "btn_radius" INTEGER NOT NULL DEFAULT 16,
    "btn_text_color" TEXT NOT NULL DEFAULT '#ffffff',
    "end_call_text" TEXT NOT NULL DEFAULT 'Finish',
    "focus_color" TEXT NOT NULL DEFAULT '#000000',
    "gradient_color_1" TEXT NOT NULL DEFAULT '',
    "gradient_color_2" TEXT NOT NULL DEFAULT '#ffffff',
    "start_call_text" TEXT NOT NULL DEFAULT 'Start call',
    "text_color" TEXT NOT NULL DEFAULT '#000000',
    "listening_text" TEXT NOT NULL DEFAULT 'Listening',
    "speaking_text" TEXT NOT NULL DEFAULT 'Speaking',
    "prompt" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL DEFAULT '',
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "averageDurarion" INTEGER NOT NULL DEFAULT 0,
    "addedKnowledgeBase" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_lemonSqueezyId_key" ON "Subscription"("lemonSqueezyId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_variantId_key" ON "Plan"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Widget_idElevenLabs_key" ON "Widget"("idElevenLabs");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Widget" ADD CONSTRAINT "Widget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
