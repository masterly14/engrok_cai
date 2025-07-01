-- DropForeignKey
ALTER TABLE "ElevenLabsWidget" DROP CONSTRAINT "ElevenLabsWidget_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "ElevenLabsWidget" ADD CONSTRAINT "ElevenLabsWidget_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
