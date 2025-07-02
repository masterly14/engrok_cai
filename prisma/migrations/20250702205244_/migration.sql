/*
  Warnings:

  - You are about to drop the column `wompiEventToken` on the `WompiIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `wompiWebhookUrl` on the `WompiIntegration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[privateKey]` on the table `WompiIntegration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[eventsSecret]` on the table `WompiIntegration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventsSecret` to the `WompiIntegration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `privateKey` to the `WompiIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "WompiIntegration_wompiEventToken_key";

-- DropIndex
DROP INDEX "WompiIntegration_wompiWebhookUrl_key";

-- AlterTable
ALTER TABLE "WompiIntegration" DROP COLUMN "wompiEventToken",
DROP COLUMN "wompiWebhookUrl",
ADD COLUMN     "eventsSecret" TEXT NOT NULL,
ADD COLUMN     "privateKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_privateKey_key" ON "WompiIntegration"("privateKey");

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_eventsSecret_key" ON "WompiIntegration"("eventsSecret");
