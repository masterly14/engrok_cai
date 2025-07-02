/*
  Warnings:

  - Changed the type of `status` on the `Integration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Integration_status_idx";

-- AlterTable
ALTER TABLE "Integration" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropEnum
DROP TYPE "IntegrationStatus";
