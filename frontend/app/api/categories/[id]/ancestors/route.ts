import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ancestors = serverStore.getAncestors(params.id);
  return NextResponse.json({
    success: true,
    message: 'Category ancestors retrieved',
    data: ancestors,
  });
}
