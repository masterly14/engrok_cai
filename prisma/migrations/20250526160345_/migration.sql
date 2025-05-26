/*
  Warnings:

  - You are about to drop the column `knowledgeBaseId` on the `ChatAgent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatAgent" DROP CONSTRAINT "ChatAgent_knowledgeBaseId_fkey";

-- AlterTable
ALTER TABLE "ChatAgent" DROP COLUMN "knowledgeBaseId";
