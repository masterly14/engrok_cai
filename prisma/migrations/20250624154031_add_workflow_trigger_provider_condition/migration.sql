/*
  Warnings:

  - A unique constraint covering the columns `[workflowId,provider,connectionId]` on the table `WorkflowTrigger` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTrigger_workflowId_provider_connectionId_key" ON "WorkflowTrigger"("workflowId", "provider", "connectionId");
