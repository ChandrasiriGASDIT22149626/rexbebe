import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getWishlistFilePath(): string {
  const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
  const tmpPath = path.join('/tmp', 'wishlists.json');
  if (isVercel && fs.existsSync(tmpPath)) {
    return tmpPath;
  }
  const p1 = path.resolve(process.cwd(), '..', 'backend', 'data', 'wishlists.json');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(process.cwd(), 'backend', 'data', 'wishlists.json');
  if (fs.existsSync(p2)) return p2;
  const p3 = path.resolve(process.cwd(), 'data', 'wishlists.json');
  if (fs.existsSync(p3)) return p3;
  return p1;
}

function readWishlistsFromDisk(): Record<string, { id: string; productIds: string[]; updatedAt?: string }> {
  try {
    const filePath = getWishlistFilePath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function saveWishlistsToDisk(data: Record<string, any>) {
  try {
    const filePath = getWishlistFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

// DELETE /api/wishlist/[id]?wishlistId=...
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: productId } = params;
  const { searchParams } = new URL(request.url);
  const wishlistId = searchParams.get('wishlistId') || request.headers.get('x-wishlist-id') || 'wishlist-default';

  // 1. Try forwarding to backend REST API
  try {
    const backendRes = await fetch(`${BACKEND_URL}/wishlist/${encodeURIComponent(productId)}?wishlistId=${encodeURIComponent(wishlistId)}`, {
      method: 'DELETE',
      headers: {
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
        'x-wishlist-id': wishlistId,
      },
    });
    if (backendRes.ok) {
      const json = await backendRes.json();
      return NextResponse.json(json);
    }
  } catch (backendErr) {
    // Fallback
  }

  // 2. Direct fallback
  const store = readWishlistsFromDisk();
  if (store[wishlistId]) {
    store[wishlistId].productIds = (store[wishlistId].productIds || []).filter((id: string) => id !== productId);
    store[wishlistId].updatedAt = new Date().toISOString();
    saveWishlistsToDisk(store);
  }

  return NextResponse.json({
    success: true,
    message: 'Product removed from wishlist',
    data: {
      id: wishlistId,
      productIds: store[wishlistId]?.productIds || [],
      count: (store[wishlistId]?.productIds || []).length,
      updatedAt: store[wishlistId]?.updatedAt || new Date().toISOString(),
    },
  });
}
