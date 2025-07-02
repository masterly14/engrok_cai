-- CreateTable
CREATE TABLE "VoiceWorkflowTrigger" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "VoiceWorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoiceWorkflowTrigger_token_key" ON "VoiceWorkflowTrigger"("token");

-- CreateIndex
CREATE INDEX "VoiceWorkflowTrigger_workflowId_idx" ON "VoiceWorkflowTrigger"("workflowId");

-- CreateIndex
CREATE INDEX "VoiceWorkflowTrigger_userId_idx" ON "VoiceWorkflowTrigger"("userId");

-- AddForeignKey
ALTER TABLE "VoiceWorkflowTrigger" ADD CONSTRAINT "VoiceWorkflowTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceWorkflowTrigger" ADD CONSTRAINT "VoiceWorkflowTrigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
