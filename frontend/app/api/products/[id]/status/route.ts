import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const status = body.status;
    const product = serverStore.updateProductStatus(params.id, status);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: `Product with id '${params.id}' not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product status updated',
      data: product,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to update product status',
      },
      { status: 400 }
    );
  }
}
