/*
  Warnings:

  - You are about to drop the column `agentId` on the `Contact` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_agentId_fkey";

-- DropIndex
DROP INDEX "Contact_agentId_idx";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "agentId";
