/*
  Warnings:

  - A unique constraint covering the columns `[name,agentId,userId]` on the table `ChatWorkflow` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChatWorkflow_name_agentId_key";

-- AlterTable
ALTER TABLE "ChatWorkflow" ADD COLUMN     "userId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "ChatWorkflow_name_agentId_userId_key" ON "ChatWorkflow"("name", "agentId", "userId");

-- AddForeignKey
ALTER TABLE "ChatWorkflow" ADD CONSTRAINT "ChatWorkflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
