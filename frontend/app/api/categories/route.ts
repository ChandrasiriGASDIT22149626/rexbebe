import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const parentId = searchParams.get('parentId') || undefined;

  const cats = serverStore.getCategories({ status, parentId });
  return NextResponse.json({
    success: true,
    message: 'Categories retrieved',
    data: cats,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = serverStore.createCategory(body);
    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully',
        data: created,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to create category',
      },
      { status: 400 }
    );
  }
}
