-- CreateEnum
CREATE TYPE "ChatAgentMode" AS ENUM ('FLOW', 'PROMPT');

-- AlterTable
ALTER TABLE "ChatAgent" ADD COLUMN     "mode" "ChatAgentMode" NOT NULL DEFAULT 'FLOW',
ADD COLUMN     "prompt" TEXT DEFAULT '';
