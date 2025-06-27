-- CreateTable
CREATE TABLE "WorkflowTrigger" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "connectionId" UUID,
    "syncName" TEXT,
    "provider" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTrigger_token_key" ON "WorkflowTrigger"("token");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_connectionId_idx" ON "WorkflowTrigger"("connectionId");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_provider_idx" ON "WorkflowTrigger"("provider");

-- AddForeignKey
ALTER TABLE "WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ChatWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
