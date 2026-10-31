-- CreateEnum
CREATE TYPE "AnnouncementTone" AS ENUM ('INFO', 'PROMO', 'IMPORTANT');

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkLabel" TEXT,
    "linkUrl" TEXT,
    "tone" "AnnouncementTone" NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_active_startsAt_endsAt_idx" ON "Announcement"("active", "startsAt", "endsAt");


-- Satu banner aktif pada satu waktu; dua aktivasi bersamaan yang bertabrakan ditolak database.
CREATE UNIQUE INDEX "Announcement_single_active_idx" ON "Announcement" ((true)) WHERE "active";
