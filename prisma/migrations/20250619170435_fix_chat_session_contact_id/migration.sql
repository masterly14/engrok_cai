/*
  Warnings:

  - The primary key for the `ChatContact` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `id` on the `ChatContact` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `contactId` on the `ChatSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `chatAgentId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_contactId_fkey";

-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_userId_fkey";

-- AlterTable
ALTER TABLE "ChatContact" DROP CONSTRAINT "ChatContact_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "ChatContact_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ChatSession" DROP COLUMN "contactId",
ADD COLUMN     "contactId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "chatContactId" UUID,
ALTER COLUMN "chatAgentId" SET NOT NULL;

-- DropTable
DROP TABLE "Contact";

-- CreateIndex
CREATE INDEX "ChatSession_contactId_status_idx" ON "ChatSession"("contactId", "status");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ChatContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatContactId_fkey" FOREIGN KEY ("chatContactId") REFERENCES "ChatContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
