/*
  Warnings:

  - The primary key for the `Stage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[name,userId]` on the table `Stage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_stageId_fkey";

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_stageId_fkey";

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "stageUserId" UUID,
ALTER COLUMN "stageId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "stageId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Stage" DROP CONSTRAINT "Stage_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Stage_pkey" PRIMARY KEY ("id", "userId");

-- CreateIndex
CREATE INDEX "Contact_stageId_stageUserId_idx" ON "Contact"("stageId", "stageUserId");

-- CreateIndex
CREATE INDEX "Lead_stageId_userId_idx" ON "Lead"("stageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_name_userId_key" ON "Stage"("name", "userId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_stageId_stageUserId_fkey" FOREIGN KEY ("stageId", "stageUserId") REFERENCES "Stage"("id", "userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_userId_fkey" FOREIGN KEY ("stageId", "userId") REFERENCES "Stage"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
