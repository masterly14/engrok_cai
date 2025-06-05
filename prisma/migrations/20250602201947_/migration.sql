/*
  Warnings:

  - You are about to drop the column `showModalCredits` on the `Agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "showModalCredits";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showModalCredits" BOOLEAN NOT NULL DEFAULT false;
