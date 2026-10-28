-- CreateEnum
CREATE TYPE "IdempotencyScope" AS ENUM ('CHECKOUT', 'CONSULTATION_CREATE');

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "IdempotencyScope" NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "resourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_userId_scope_key_key" ON "IdempotencyKey"("userId", "scope", "key");

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
