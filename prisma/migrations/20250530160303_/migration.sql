/*
  Warnings:

  - Added the required column `amountInCents` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billingData` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerData` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentLinkId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethodType` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `redirectUrl` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reference` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionCreatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionFinalizedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "amountInCents" INTEGER NOT NULL,
ADD COLUMN     "billingData" JSONB NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "customerData" JSONB NOT NULL,
ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "paymentLinkId" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" JSONB NOT NULL,
ADD COLUMN     "paymentMethodType" TEXT NOT NULL,
ADD COLUMN     "paymentSourceId" TEXT,
ADD COLUMN     "productQuantities" JSONB,
ADD COLUMN     "redirectUrl" TEXT NOT NULL,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "shippingAddress" JSONB NOT NULL,
ADD COLUMN     "statusMessage" TEXT,
ADD COLUMN     "transactionCreatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "transactionFinalizedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "transactionId" TEXT NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
