-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nangoConnectSessionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "nangoConnectSessionToken" TEXT;
