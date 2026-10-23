import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth-guard';
import { handleRouteError, jsonOk } from '@/lib/api';
import { userRoles, verificationStatuses } from '@/lib/admin';
import { orderStatuses, paymentStatuses } from '@/lib/order';
import { reviewStatuses } from '@/lib/reviews';

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
      usersTotal,
      usersDeleted,
      usersByRole,
      doctorsByStatus,
      facilitiesByStatus,
      articlesTotal,
      articlesPublished,
      articlesPending,
      articlesDraft,
      articlesRejected,
      articlesDeleted,
      productsTotal,
      productsActive,
      productsInactive,
      productsDeleted,
      ordersTotal,
      ordersByStatus,
      ordersByPaymentStatus,
      revenue,
      reviewsTotal,
      reviewsByStatus,
      recentOrders
    ] = await Promise.all([
      prisma.user.count(),
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
      prisma.article.count(),
      prisma.article.count({
        where: {
          status: 'PUBLISHED',
          deletedAt: null
        }
      }),
      prisma.article.count({
        where: {
          status: 'PENDING',
          deletedAt: null
        }
      }),
      prisma.article.count({
        where: {
          status: 'DRAFT',
          deletedAt: null
        }
      }),
      prisma.article.count({
        where: {
          status: 'REJECTED',
          deletedAt: null
        }
      }),
      prisma.article.count({
        where: {
          deletedAt: {
            not: null
          }
        }
      }),
      prisma.product.count(),
      prisma.product.count({
        where: {
          active: true,
          deletedAt: null
        }
      }),
      prisma.product.count({
        where: {
          active: false,
          deletedAt: null
        }
      }),
      prisma.product.count({
        where: {
          deletedAt: {
            not: null
          }
        }
      }),
      prisma.order.count(),
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
      prisma.review.count(),
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
        total: usersTotal,
        active: usersTotal - usersDeleted,
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
          total: articlesTotal,
          published: articlesPublished,
          pending: articlesPending,
          draft: articlesDraft,
          rejected: articlesRejected,
          deleted: articlesDeleted
        },
        products: {
          total: productsTotal,
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
        totalPending:
          doctorsByStatusMap.PENDING + facilitiesByStatusMap.PENDING + reviewsByStatusMap.PENDING
      },
      recentOrders
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
