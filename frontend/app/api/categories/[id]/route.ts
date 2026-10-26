import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../lib/serverApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cat = serverStore.findCategoryById(params.id);
  if (!cat) {
    return NextResponse.json(
      { success: false, message: `Category '${params.id}' not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({
    success: true,
    message: 'Category details retrieved',
    data: cat,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = serverStore.updateCategory(params.id, body);
    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update category' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const success = serverStore.deleteCategory(params.id);
  if (!success) {
    return NextResponse.json(
      { success: false, message: `Category '${params.id}' not found` },
      { status: 404 }
    );
  }
  return NextResponse.json({
    success: true,
    message: 'Category deleted successfully',
  });
}
