import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';
import { userRoles, verificationStatuses } from '@/lib/admin';
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

export async function GET() {
  try {
    const auth = await requireRole(['ADMIN']);

    if (!auth.ok) {
      return auth.error;
    }

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
      recentOrders
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
      })
    ]);

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

    return jsonOk({
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
      recentOrders
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
