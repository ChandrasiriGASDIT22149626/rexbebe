import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';

export async function GET() {
  const nav = serverStore.getNavigation(true);
  return NextResponse.json({
    success: true,
    message: 'Public navigation structure retrieved',
    data: nav,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = serverStore.updateNavigation(body);
    return NextResponse.json({
      success: true,
      message: 'Navigation updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update navigation' },
      { status: 400 }
    );
  }
}
