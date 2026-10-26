import { NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';

export async function GET() {
  const pages = serverStore.getPages();
  return NextResponse.json({
    success: true,
    message: 'Pages retrieved',
    data: pages,
  });
}
