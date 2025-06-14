-- CreateEnum
CREATE TYPE "LsSubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'TRIALING');

-- AlterTable
ALTER TABLE "Connection" ALTER COLUMN "providerConfigKey" DROP NOT NULL;

-- CreateTable
CREATE TABLE "LsPlan" (
    "id" UUID NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "interval" TEXT,
    "intervalCount" INTEGER,
    "isUsageBased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LsPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LsSubscription" (
    "id" UUID NOT NULL,
    "lsSubscriptionId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "LsSubscriptionStatus" NOT NULL,
    "renewsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LsSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LsPlan_variantId_key" ON "LsPlan"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "LsSubscription_lsSubscriptionId_key" ON "LsSubscription"("lsSubscriptionId");

-- CreateIndex
CREATE INDEX "LsSubscription_userId_idx" ON "LsSubscription"("userId");

-- CreateIndex
CREATE INDEX "LsSubscription_planId_idx" ON "LsSubscription"("planId");

-- AddForeignKey
ALTER TABLE "LsSubscription" ADD CONSTRAINT "LsSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LsSubscription" ADD CONSTRAINT "LsSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LsPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
