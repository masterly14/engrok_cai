/*
  Warnings:

  - You are about to drop the column `squadId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the `AgentSquad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Squad` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgentSquad" DROP CONSTRAINT "AgentSquad_agentId_fkey";

-- DropForeignKey
ALTER TABLE "AgentSquad" DROP CONSTRAINT "AgentSquad_squadId_fkey";

-- DropForeignKey
ALTER TABLE "Squad" DROP CONSTRAINT "Squad_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "amountInCents" INTEGER,
ADD COLUMN     "billingData" JSONB,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "customerData" JSONB,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "paymentLinkId" TEXT,
ADD COLUMN     "paymentMethod" JSONB,
ADD COLUMN     "paymentMethodType" TEXT,
ADD COLUMN     "paymentSourceId" TEXT,
ADD COLUMN     "productQuantities" JSONB,
ADD COLUMN     "redirectUrl" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "statusMessage" TEXT,
ADD COLUMN     "transactionCreatedAt" TIMESTAMP(3),
ADD COLUMN     "transactionFinalizedAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "squadId";

-- DropTable
DROP TABLE "AgentSquad";

-- DropTable
DROP TABLE "Squad";
