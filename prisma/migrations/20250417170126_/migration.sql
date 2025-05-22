/*
  Warnings:

  - Added the required column `userId` to the `knowledgeBase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "knowledgeBase" ADD COLUMN     "userId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "knowledgeBase" ADD CONSTRAINT "knowledgeBase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
