/*
  Warnings:

  - A unique constraint covering the columns `[vapiWorkflowId]` on the table `Workflow` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "vapiWorkflowData" JSONB,
ADD COLUMN     "vapiWorkflowId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_vapiWorkflowId_key" ON "Workflow"("vapiWorkflowId");
