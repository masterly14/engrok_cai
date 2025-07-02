/*
  Warnings:

  - A unique constraint covering the columns `[publicKey]` on the table `WompiIntegration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicKey` to the `WompiIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WompiIntegration" ADD COLUMN     "publicKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_publicKey_key" ON "WompiIntegration"("publicKey");
