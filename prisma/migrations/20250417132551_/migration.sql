/*
  Warnings:

  - You are about to drop the column `languaje` on the `Agent` table. All the data in the column will be lost.
  - Added the required column `language` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "languaje",
ADD COLUMN     "language" TEXT NOT NULL;
