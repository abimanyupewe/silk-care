-- AlterTable
ALTER TABLE "DoctorProfile" ADD COLUMN     "photoPublicId" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "videoPublicId" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "photoPublicId" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "videoPublicId" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "DoctorSchedule" (
    "id" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityOperatingHour" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT,
    "closeTime" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityOperatingHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorSchedule_doctorProfileId_dayOfWeek_idx" ON "DoctorSchedule"("doctorProfileId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSchedule_doctorProfileId_dayOfWeek_startTime_key" ON "DoctorSchedule"("doctorProfileId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "FacilityOperatingHour_facilityId_dayOfWeek_idx" ON "FacilityOperatingHour"("facilityId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityOperatingHour_facilityId_dayOfWeek_key" ON "FacilityOperatingHour"("facilityId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "DoctorSchedule" ADD CONSTRAINT "DoctorSchedule_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityOperatingHour" ADD CONSTRAINT "FacilityOperatingHour_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
