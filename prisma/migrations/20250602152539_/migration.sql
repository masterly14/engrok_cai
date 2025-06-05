-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "voiceId" TEXT;

-- CreateTable
CREATE TABLE "Files" (
    "id" UUID NOT NULL,
    "vapiId" TEXT,
    "name" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Files_vapiId_key" ON "Files"("vapiId");

-- AddForeignKey
ALTER TABLE "Files" ADD CONSTRAINT "Files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
