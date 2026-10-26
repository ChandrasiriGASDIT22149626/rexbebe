import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const featured = searchParams.get('featured') || undefined;
    const bestseller = searchParams.get('bestseller') || undefined;
    const newarrival = searchParams.get('newarrival') || undefined;
    const search = searchParams.get('search') || undefined;

    const products = serverStore.getProducts({
      category,
      status,
      featured,
      bestseller,
      newarrival,
      search,
    });

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
