import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const status = body.status;
    const isActive = body.isActive !== undefined ? body.isActive : status === 'published';
    const updated = serverStore.updateCategory(params.id, { status, isActive });
    return NextResponse.json({
      success: true,
      message: 'Category status updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update category status' },
      { status: 400 }
    );
  }
}
