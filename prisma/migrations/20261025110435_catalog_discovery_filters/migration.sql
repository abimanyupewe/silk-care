-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "ratingAverage" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "ratingAverage" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "DoctorProfile_ratingAverage_idx" ON "DoctorProfile"("ratingAverage");

-- CreateIndex
CREATE INDEX "DoctorProfile_reviewCount_idx" ON "DoctorProfile"("reviewCount");

-- CreateIndex
CREATE INDEX "Facility_ratingAverage_idx" ON "Facility"("ratingAverage");

-- CreateIndex
CREATE INDEX "Facility_reviewCount_idx" ON "Facility"("reviewCount");
