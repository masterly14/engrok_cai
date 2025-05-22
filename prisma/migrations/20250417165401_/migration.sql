-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "knowledgeBaseId" UUID;

-- CreateTable
CREATE TABLE "knowledgeBase" (
    "id" UUID NOT NULL,
    "idElevenlabs" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "knowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledgeBase_idElevenlabs_key" ON "knowledgeBase"("idElevenlabs");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "knowledgeBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
