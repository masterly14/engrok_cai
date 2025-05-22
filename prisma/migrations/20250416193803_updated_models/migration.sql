/*
  Warnings:

  - You are about to drop the column `activated` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `addedKnowledgeBase` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `averageDurarion` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `conversations` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `idElevenLabs` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `voice_id` on the `Widget` table. All the data in the column will be lost.
  - Added the required column `agentId` to the `Widget` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TYPE_AGENT" AS ENUM ('oubound', 'inbound', 'widget');

-- DropForeignKey
ALTER TABLE "Widget" DROP CONSTRAINT "Widget_userId_fkey";

-- DropIndex
DROP INDEX "Widget_idElevenLabs_key";

-- AlterTable
ALTER TABLE "Widget" DROP COLUMN "activated",
DROP COLUMN "addedKnowledgeBase",
DROP COLUMN "averageDurarion",
DROP COLUMN "conversations",
DROP COLUMN "description",
DROP COLUMN "idElevenLabs",
DROP COLUMN "industry",
DROP COLUMN "name",
DROP COLUMN "prompt",
DROP COLUMN "userId",
DROP COLUMN "voice_id",
ADD COLUMN     "agentId" UUID NOT NULL;

-- DropEnum
DROP TYPE "TYPE_USE_WIDGET";

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL,
    "idElevenLabs" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "phoneNumber" TEXT,
    "type" "TYPE_AGENT" NOT NULL,
    "activated" BOOLEAN NOT NULL,
    "isWidget" BOOLEAN NOT NULL,
    "prompt" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL DEFAULT '',
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "averageDurarion" INTEGER NOT NULL DEFAULT 0,
    "addedKnowledgeBase" BOOLEAN NOT NULL DEFAULT false,
    "widgetId" UUID,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_idElevenLabs_key" ON "Agent"("idElevenLabs");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Widget" ADD CONSTRAINT "Widget_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
