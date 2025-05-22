/*
  Warnings:

  - You are about to drop the `ChatAgentPhoneNumber` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `phoneNumber` to the `ChatAgent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatAgentPhoneNumber" DROP CONSTRAINT "ChatAgentPhoneNumber_chatAgentId_fkey";

-- AlterTable
ALTER TABLE "ChatAgent" ADD COLUMN     "phoneNumber" TEXT NOT NULL;

-- DropTable
DROP TABLE "ChatAgentPhoneNumber";
