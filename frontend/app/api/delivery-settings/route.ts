import { NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';

export async function GET() {
  const delivery = serverStore.getDeliverySettings();
  return NextResponse.json({
    success: true,
    message: 'Delivery settings retrieved',
    data: delivery,
  });
}
