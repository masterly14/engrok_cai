-- CreateEnum
CREATE TYPE "CreditLedgerType" AS ENUM ('debit', 'credit', 'reset', 'rollover');

-- CreateEnum
CREATE TYPE "UsageKind" AS ENUM ('voice', 'chat');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "chatCreditsPerConversation" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "creditsPerCycle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "overageChatUsd" DOUBLE PRECISION DEFAULT 0.07,
ADD COLUMN     "overageVoiceUsd" DOUBLE PRECISION DEFAULT 0.17,
ADD COLUMN     "voiceCreditsPerMinute" INTEGER NOT NULL DEFAULT 11;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "currentCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cycleEndAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "type" "CreditLedgerType" NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "UsageKind" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "creditsCharged" INTEGER NOT NULL,
    "externalRef" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditLedger_userId_idx" ON "CreditLedger"("userId");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_kind_idx" ON "UsageEvent"("userId", "kind");

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
