import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const descendants = serverStore.getDescendants(params.id);
  return NextResponse.json({
    success: true,
    message: 'Category descendants retrieved',
    data: descendants,
  });
}
