import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = serverStore.duplicateProduct(params.id);
    if (!product) {
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
        message: 'Product duplicated successfully',
        data: product,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to duplicate product',
      },
      { status: 400 }
    );
  }
}
