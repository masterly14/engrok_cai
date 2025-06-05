/*
  Warnings:

  - You are about to drop the column `bucket` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgeBaseId` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `KnowledgeBase` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `KnowledgeBase` table. All the data in the column will be lost.
  - Added the required column `credentialId` to the `KnowledgeBase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KnowledgeBase" DROP COLUMN "bucket",
DROP COLUMN "knowledgeBaseId",
DROP COLUMN "mimeType",
DROP COLUMN "url",
ADD COLUMN     "credentialId" TEXT NOT NULL;
