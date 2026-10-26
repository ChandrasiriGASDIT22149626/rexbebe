import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = serverStore.toggleProductField(params.id, 'isNewArrival');
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
      message: 'Product New Arrival status updated',
      data: product,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to toggle New Arrival status',
      },
      { status: 400 }
    );
  }
}
