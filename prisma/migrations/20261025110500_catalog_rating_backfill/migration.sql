UPDATE "DoctorProfile" AS d
SET
  "ratingAverage" = stats."ratingAverage",
  "reviewCount" = stats."reviewCount"
FROM (
  SELECT
    "doctorProfileId" AS "id",
    ROUND(AVG("rating")::numeric, 2)::double precision AS "ratingAverage",
    COUNT(*)::int AS "reviewCount"
  FROM "Review"
  WHERE "status" = 'APPROVED' AND "doctorProfileId" IS NOT NULL
  GROUP BY "doctorProfileId"
) AS stats
WHERE d."id" = stats."id";

UPDATE "Facility" AS f
SET
  "ratingAverage" = stats."ratingAverage",
  "reviewCount" = stats."reviewCount"
FROM (
  SELECT
    "facilityId" AS "id",
    ROUND(AVG("rating")::numeric, 2)::double precision AS "ratingAverage",
    COUNT(*)::int AS "reviewCount"
  FROM "Review"
  WHERE "status" = 'APPROVED' AND "facilityId" IS NOT NULL
  GROUP BY "facilityId"
) AS stats
WHERE f."id" = stats."id";
