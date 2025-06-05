-- AlterTable
ALTER TABLE "PhoneNumber" ADD COLUMN     "credentialId" TEXT,
ADD COLUMN     "sipPassword" TEXT,
ADD COLUMN     "sipUri" TEXT,
ADD COLUMN     "sipUsername" TEXT,
ADD COLUMN     "twilioAccountId" TEXT,
ADD COLUMN     "twilioAuthToken" TEXT;
