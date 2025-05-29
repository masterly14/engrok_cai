-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" UUID NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'PENDING',
    "components" JSONB NOT NULL,
    "chatAgentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_externalId_key" ON "MessageTemplate"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_name_chatAgentId_key" ON "MessageTemplate"("name", "chatAgentId");

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_chatAgentId_fkey" FOREIGN KEY ("chatAgentId") REFERENCES "ChatAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
