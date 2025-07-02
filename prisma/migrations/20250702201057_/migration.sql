-- CreateTable
CREATE TABLE "WompiIntegration" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "wompiAccessToken" TEXT NOT NULL,
    "wompiEventToken" TEXT NOT NULL,
    "wompiWebhookUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WompiIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_userId_key" ON "WompiIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_wompiAccessToken_key" ON "WompiIntegration"("wompiAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_wompiEventToken_key" ON "WompiIntegration"("wompiEventToken");

-- CreateIndex
CREATE UNIQUE INDEX "WompiIntegration_wompiWebhookUrl_key" ON "WompiIntegration"("wompiWebhookUrl");

-- AddForeignKey
ALTER TABLE "WompiIntegration" ADD CONSTRAINT "WompiIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
