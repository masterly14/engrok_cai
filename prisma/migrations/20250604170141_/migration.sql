/*
  Warnings:

  - A unique constraint covering the columns `[vapiId]` on the table `Squad` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Squad" ADD COLUMN     "vapiId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Squad_vapiId_key" ON "Squad"("vapiId");
