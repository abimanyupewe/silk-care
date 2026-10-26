import type { Prisma } from '@/lib/generated/prisma';

export type ReviewTargetIds = {
  doctorProfileId: string | null;
  facilityId: string | null;
  productId: string | null;
};

export type MinRatingResult = { value?: number; error?: string };

export function parseMinRating(searchParams: URLSearchParams): MinRatingResult {
  const raw = searchParams.get('minRating');

  if (raw === null || raw.trim() === '') {
    return {};
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0 || value > 5) {
    return { error: 'minRating harus berada di antara 0 dan 5.' };
  }

  return {
    value: value === 0 ? undefined : value
  };
}

export function formatRating(ratingAverage: number | null | undefined) {
  return ratingAverage === null || ratingAverage === undefined
    ? null
    : Number(ratingAverage.toFixed(1));
}

export async function refreshReviewTargetRatings(
  tx: Prisma.TransactionClient,
  target: ReviewTargetIds
) {
  if (target.doctorProfileId) {
    const aggregate = await tx.review.aggregate({
      where: {
        doctorProfileId: target.doctorProfileId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      },
      _count: {
        _all: true
      }
    });

    await tx.doctorProfile.update({
      where: {
        id: target.doctorProfileId
      },
      data: {
        ratingAverage:
          aggregate._avg.rating === null ? null : Number(aggregate._avg.rating.toFixed(2)),
        reviewCount: aggregate._count._all
      }
    });
  }

  if (target.facilityId) {
    const aggregate = await tx.review.aggregate({
      where: {
        facilityId: target.facilityId,
        status: 'APPROVED'
      },
      _avg: {
        rating: true
      },
      _count: {
        _all: true
      }
    });

    await tx.facility.update({
      where: {
        id: target.facilityId
      },
      data: {
        ratingAverage:
          aggregate._avg.rating === null ? null : Number(aggregate._avg.rating.toFixed(2)),
        reviewCount: aggregate._count._all
      }
    });
  }
}
