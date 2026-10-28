-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ARTICLE';

-- DropIndex
DROP INDEX "Article_published_createdAt_idx";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "coverPublicId" TEXT,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT';

-- Migrate existing visibility
UPDATE "Article" SET "status" = 'PUBLISHED' WHERE "published" = TRUE;

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "published";

-- CreateIndex
CREATE INDEX "Article_status_createdAt_idx" ON "Article"("status", "createdAt");
