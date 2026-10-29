import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';
import { userRoles, verificationStatuses } from '@/lib/admin';
import { consultationStatuses } from '@/lib/consultation';
import { orderStatuses, paymentStatuses } from '@/lib/order';
import { reviewStatuses } from '@/lib/reviews';

const articleStatusKeys = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'] as const;

function toCountMap<T extends string>(
  keys: readonly T[],
  rows: Array<{
    key: T;
    count: number;
  }>
) {
  return Object.fromEntries(
    keys.map((key) => [key, rows.find((row) => row.key === key)?.count ?? 0])
  ) as Record<T, number>;
}

const trendDays = 14;
const jakartaOffsetMs = 7 * 60 * 60 * 1000;

// Tanggal kalender Asia/Jakarta (UTC+7, tanpa DST) dalam format YYYY-MM-DD.
function jakartaDate(date: Date) {
  return new Date(date.getTime() + jakartaOffsetMs).toISOString().slice(0, 10);
}

// Agregat berat (14 query) dibagikan ke semua admin dan polling; TTL pendek menjaga angka tetap segar.
// shortcut: stale hingga 15 dtk setelah mutasi admin, tambahkan revalidateTag('admin-stats') bila perlu instan.
const loadAdminStats = unstable_cache(
  async () => {
    const [
      usersDeleted,
      usersByRole,
      doctorsByStatus,
      facilitiesByStatus,
      articlesByStatus,
      articlesDeleted,
      productsByActive,
      productsDeleted,
      ordersByStatus,
      ordersByPaymentStatus,
      revenue,
      reviewsByStatus,
      recentOrders,
      trendOrders,
      consultationsByStatus,
      refundNeeded,
      stuckPaidOrders,
      negativePendingReviews,
      staleConsultations
    ] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: {
            not: null
          }
        }
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: {
          deletedAt: null
        },
        _count: {
          _all: true
        }
      }),
      prisma.doctorProfile.groupBy({
        by: ['verificationStatus'],
        where: {
          user: {
            deletedAt: null
          }
        },
        _count: {
          _all: true
        }
      }),
      prisma.facility.groupBy({
        by: ['verificationStatus'],
        where: {
          user: {
            deletedAt: null
          }
        },
        _count: {
          _all: true
        }
      }),
      prisma.article.groupBy({
        by: ['status'],
        where: {
          deletedAt: null
        },
        _count: {
          _all: true
        }
      }),
      prisma.article.count({
        where: {
          deletedAt: {
            not: null
          }
        }
      }),
      prisma.product.groupBy({
        by: ['active'],
        where: {
          deletedAt: null
        },
        _count: {
          _all: true
        }
      }),
      prisma.product.count({
        where: {
          deletedAt: {
            not: null
          }
        }
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      }),
      prisma.order.groupBy({
        by: ['paymentStatus'],
        _count: {
          _all: true
        }
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          status: {
            not: 'CANCELLED'
          }
        },
        _sum: {
          total: true
        }
      }),
      prisma.review.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      }),
      prisma.order.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          },
          facility: {
            select: {
              id: true,
              slug: true,
              name: true
            }
          }
        }
      }),
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          createdAt: true,
          total: true,
          status: true,
          paymentStatus: true
        }
      }),
      prisma.consultation.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      }),
      // Dibayar setelah pesanan dibatalkan: perlu refund manual.
      prisma.order.count({
        where: {
          status: 'CANCELLED',
          paymentStatus: 'PAID'
        }
      }),
      prisma.order.count({
        where: {
          status: 'PAID',
          paidAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.review.count({
        where: {
          status: 'PENDING',
          isNegative: true
        }
      }),
      prisma.consultation.count({
        where: {
          status: 'REQUESTED',
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const daily = Array.from({ length: trendDays }, (_, index) => ({
      date: jakartaDate(new Date(Date.now() - (trendDays - 1 - index) * 24 * 60 * 60 * 1000)),
      orders: 0,
      revenue: 0
    }));

    for (const order of trendOrders) {
      const day = daily.find((row) => row.date === jakartaDate(order.createdAt));

      if (!day) continue;

      day.orders += 1;

      if (order.paymentStatus === 'PAID' && order.status !== 'CANCELLED') {
        day.revenue += order.total;
      }
    }

    const usersByRoleMap = toCountMap(
      userRoles,
      usersByRole.map((row) => ({
        key: row.role,
        count: row._count._all
      }))
    );
    const doctorsByStatusMap = toCountMap(
      verificationStatuses,
      doctorsByStatus.map((row) => ({
        key: row.verificationStatus,
        count: row._count._all
      }))
    );
    const facilitiesByStatusMap = toCountMap(
      verificationStatuses,
      facilitiesByStatus.map((row) => ({
        key: row.verificationStatus,
        count: row._count._all
      }))
    );
    const ordersByStatusMap = toCountMap(
      orderStatuses,
      ordersByStatus.map((row) => ({
        key: row.status,
        count: row._count._all
      }))
    );
    const ordersByPaymentStatusMap = toCountMap(
      paymentStatuses,
      ordersByPaymentStatus.map((row) => ({
        key: row.paymentStatus,
        count: row._count._all
      }))
    );
    const reviewsByStatusMap = toCountMap(
      reviewStatuses,
      reviewsByStatus.map((row) => ({
        key: row.status,
        count: row._count._all
      }))
    );

    const consultationsByStatusMap = toCountMap(
      consultationStatuses,
      consultationsByStatus.map((row) => ({
        key: row.status,
        count: row._count._all
      }))
    );
    const articlesByStatusMap = toCountMap(
      articleStatusKeys,
      articlesByStatus.map((row) => ({
        key: row.status,
        count: row._count._all
      }))
    );
    const articlesPending = articlesByStatusMap.PENDING;
    const articlesLive = articleStatusKeys.reduce(
      (total, status) => total + articlesByStatusMap[status],
      0
    );
    const productsActive = productsByActive.find((row) => row.active)?._count._all ?? 0;
    const productsInactive = productsByActive.find((row) => !row.active)?._count._all ?? 0;
    const usersActive = userRoles.reduce((total, role) => total + usersByRoleMap[role], 0);
    const ordersTotal = orderStatuses.reduce(
      (total, status) => total + ordersByStatusMap[status],
      0
    );
    const reviewsTotal = reviewStatuses.reduce(
      (total, status) => total + reviewsByStatusMap[status],
      0
    );

    const doctorTotal = verificationStatuses.reduce(
      (total, status) => total + doctorsByStatusMap[status],
      0
    );
    const facilityTotal = verificationStatuses.reduce(
      (total, status) => total + facilitiesByStatusMap[status],
      0
    );

    return {
      generatedAt: new Date().toISOString(),
      users: {
        total: usersActive + usersDeleted,
        active: usersActive,
        deleted: usersDeleted,
        byRole: usersByRoleMap
      },
      partners: {
        doctors: {
          total: doctorTotal,
          ...doctorsByStatusMap
        },
        facilities: {
          total: facilityTotal,
          ...facilitiesByStatusMap
        }
      },
      catalog: {
        articles: {
          total: articlesLive + articlesDeleted,
          published: articlesByStatusMap.PUBLISHED,
          pending: articlesPending,
          draft: articlesByStatusMap.DRAFT,
          rejected: articlesByStatusMap.REJECTED,
          deleted: articlesDeleted
        },
        products: {
          total: productsActive + productsInactive + productsDeleted,
          active: productsActive,
          inactive: productsInactive,
          deleted: productsDeleted
        }
      },
      orders: {
        total: ordersTotal,
        byStatus: ordersByStatusMap,
        byPaymentStatus: ordersByPaymentStatusMap,
        revenue: revenue._sum.total ?? 0
      },
      reviews: {
        total: reviewsTotal,
        ...reviewsByStatusMap
      },
      moderation: {
        pendingDoctors: doctorsByStatusMap.PENDING,
        pendingFacilities: facilitiesByStatusMap.PENDING,
        pendingReviews: reviewsByStatusMap.PENDING,
        pendingArticles: articlesPending,
        totalPending:
          doctorsByStatusMap.PENDING +
          facilitiesByStatusMap.PENDING +
          reviewsByStatusMap.PENDING +
          articlesPending
      },
      consultations: {
        total: consultationStatuses.reduce(
          (total, status) => total + consultationsByStatusMap[status],
          0
        ),
        ...consultationsByStatusMap
      },
      attention: {
        refundNeeded,
        stuckPaidOrders,
        negativePendingReviews,
        staleConsultations
      },
      recentOrders,
      daily
    };
  },
  ['admin-stats'],
  { revalidate: 15, tags: ['admin-stats'] }
);

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

    return jsonOk(await loadAdminStats());
  } catch (error) {
    return handleRouteError(error);
  }
}
