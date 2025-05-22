/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `ChatAgent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ChatAgent_phoneNumber_idx";

-- DropIndex
DROP INDEX "ChatAgent_phoneNumber_key";

-- AlterTable
ALTER TABLE "ChatAgent" DROP COLUMN "phoneNumber";
