import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../lib/serverApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = serverStore.findProductById(params.id);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: `Product with id or slug '${params.id}' not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Product details retrieved',
        data: product,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to retrieve product',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = serverStore.updateProduct(params.id, body);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: `Product with id '${params.id}' not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Product updated successfully',
        data: updated,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to update product',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = serverStore.deleteProduct(params.id);
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: `Product with id '${params.id}' not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'The item has been permanently deleted.',
        data: { deleted: true, id: params.id },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to delete product',
      },
      { status: 500 }
    );
  }
}
