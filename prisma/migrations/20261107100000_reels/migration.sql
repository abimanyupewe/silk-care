-- CreateTable
CREATE TABLE "Reel" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT,
    "facilityId" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Reel_one_owner" CHECK (("doctorProfileId" IS NULL) <> ("facilityId" IS NULL))
);

-- CreateIndex
CREATE INDEX "Reel_doctorProfileId_createdAt_idx" ON "Reel"("doctorProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "Reel_facilityId_createdAt_idx" ON "Reel"("facilityId", "createdAt");

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
