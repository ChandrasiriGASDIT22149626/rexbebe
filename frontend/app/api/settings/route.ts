import { NextResponse } from 'next/server';
import { serverStore } from '../../../lib/serverApi';

export async function GET() {
  const settings = serverStore.getSettings();
  return NextResponse.json({
    success: true,
    message: 'Settings retrieved',
    data: settings,
  });
}
