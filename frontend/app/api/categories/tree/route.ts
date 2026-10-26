import { NextResponse } from 'next/server';
import { serverStore } from '../../../../lib/serverApi';

export async function GET() {
  const tree = serverStore.getCategoryTree();
  return NextResponse.json({
    success: true,
    message: 'Category tree retrieved',
    data: tree,
  });
}

export const dynamic = 'force-dynamic';
