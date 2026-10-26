import { NextResponse } from 'next/server';
import { serverStore } from '../../../../lib/serverApi';

export async function GET() {
  const nav = serverStore.getNavigation(false);
  return NextResponse.json({
    success: true,
    message: 'Complete navigation structure retrieved',
    data: nav,
  });
}
