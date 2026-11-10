import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';
import { getAsyncServerProducts } from '../../../services/serverSeoService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const featured = searchParams.get('featured') || undefined;
    const bestseller = searchParams.get('bestseller') || undefined;
    const newarrival = searchParams.get('newarrival') || undefined;
    const search = searchParams.get('search') || undefined;

    let products = await getAsyncServerProducts();
    if (!products || products.length === 0) {
      products = serverStore.getProducts({
        category,
        status,
        featured,
        bestseller,
        newarrival,
        search,
      });
    } else {
      if (category) {
        const cat = category.toLowerCase().trim();
        products = products.filter((p) => {
          const cSlug = p.category?.slug?.toLowerCase();
          const cId = p.category?.id?.toLowerCase();
          const cName = p.category?.name?.toLowerCase();
          const sSlug = p.subcategory?.slug?.toLowerCase();
          const sId = p.subcategory?.id?.toLowerCase();
          const sName = p.subcategory?.name?.toLowerCase();
          return (
            cSlug === cat ||
            cId === cat ||
            cName === cat ||
            sSlug === cat ||
            sId === cat ||
            sName === cat ||
            (cat === 'toddler' && (cSlug?.includes('toddler') || cName?.includes('toddler') || sSlug?.includes('12-18') || sSlug?.includes('18-24') || sSlug?.includes('24-36'))) ||
            (cat === 'baby' && (cSlug?.includes('baby') || cName?.includes('baby') || sSlug?.includes('0-6') || sSlug?.includes('6-12')))
          );
        });
      }

      if (status && status !== 'all') {
        products = products.filter((p) => p.status === status);
      }

      if (featured === 'true') {
        products = products.filter((p) => Boolean(p.isFeatured));
      }

      if (bestseller === 'true') {
        products = products.filter((p) => Boolean(p.isBestSeller));
      }

      if (newarrival === 'true') {
        products = products.filter((p) => Boolean(p.isNewArrival));
      }

      if (search) {
        const q = search.toLowerCase().trim();
        products = products.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to retrieve products',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = serverStore.createProduct(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to create product',
      },
      { status: 400 }
    );
  }
}
