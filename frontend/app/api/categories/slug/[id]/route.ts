import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '../../../../../lib/serverApi';

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
