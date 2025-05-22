/*
  Warnings:

  - The values [oubound] on the enum `TYPE_AGENT` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TYPE_AGENT_new" AS ENUM ('outbound', 'inbound', 'widget');
ALTER TABLE "Agent" ALTER COLUMN "type" TYPE "TYPE_AGENT_new" USING ("type"::text::"TYPE_AGENT_new");
ALTER TYPE "TYPE_AGENT" RENAME TO "TYPE_AGENT_old";
ALTER TYPE "TYPE_AGENT_new" RENAME TO "TYPE_AGENT";
DROP TYPE "TYPE_AGENT_old";
COMMIT;
