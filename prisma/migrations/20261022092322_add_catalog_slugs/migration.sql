-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_slug_key" ON "DoctorProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");
