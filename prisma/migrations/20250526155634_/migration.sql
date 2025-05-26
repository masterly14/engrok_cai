/*
  Warnings:

  - You are about to drop the column `description` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `fallbackMessage` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `maxResponseTime` on the `ChatAgent` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeMessage` on the `ChatAgent` table. All the data in the column will be lost.
  - Made the column `whatsappBusinessId` on table `ChatAgent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `apiKey` on table `ChatAgent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumberId` on table `ChatAgent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ChatAgent" DROP COLUMN "description",
DROP COLUMN "fallbackMessage",
DROP COLUMN "maxResponseTime",
DROP COLUMN "welcomeMessage",
ALTER COLUMN "whatsappBusinessId" SET NOT NULL,
ALTER COLUMN "apiKey" SET NOT NULL,
ALTER COLUMN "phoneNumberId" SET NOT NULL;
