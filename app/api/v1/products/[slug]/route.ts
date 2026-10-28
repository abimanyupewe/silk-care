import { prisma } from '@/lib/db';
import { handleRouteError, jsonError, jsonOk } from '@/lib/api';
import { productSelect, publicProductWhere } from '@/lib/catalog';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: {
        ...publicProductWhere,
        slug
      },
      select: productSelect
    });

    if (!product) {
      return jsonError('Produk tidak ditemukan.', 404);
    }

    return jsonOk(product);
  } catch (error) {
    return handleRouteError(error);
  }
}
