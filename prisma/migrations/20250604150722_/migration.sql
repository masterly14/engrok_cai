/*
  Warnings:

  - You are about to drop the column `squadId` on the `PhoneNumber` table. All the data in the column will be lost.
  - You are about to drop the column `workflowId` on the `PhoneNumber` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhoneNumber" DROP CONSTRAINT "PhoneNumber_squadId_fkey";

-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "squadId",
DROP COLUMN "workflowId",
ADD COLUMN     "inboundSquadId" UUID,
ADD COLUMN     "inboundWorkflowId" UUID,
ADD COLUMN     "outboundSquadId" UUID,
ADD COLUMN     "outboundWorkflowId" UUID;
