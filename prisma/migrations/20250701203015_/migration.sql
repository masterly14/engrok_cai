-- AlterTable
ALTER TABLE "ChatAgent" ADD COLUMN     "hasSeenTestWarning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTestNumber" BOOLEAN NOT NULL DEFAULT false;
