import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { uploadToCloud } from '@/lib/cloudStorage';

export const dynamic = 'force-dynamic';

function extractAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }
  const custom = request.headers.get('x-admin-token') || request.headers.get('x-access-token');
  if (custom && custom.trim()) return custom.trim();
  const cookie = request.cookies.get('rexbebe_admin_token')?.value;
  if (cookie && cookie.trim()) return cookie.trim();
  return null;
}

function verifyAdmin(request: NextRequest): boolean {
  const token = extractAdminToken(request);
  if (!token) return false;

  const jwtSecret = process.env.JWT_SECRET || 'rexbebe_super_secure_admin_jwt_secret_key_2026';
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT'];
    return Boolean(decoded && (!decoded.role || allowedRoles.includes(decoded.role)));
  } catch {
    return false;
  }
}

export async function GET() {
  // If database is available, return from MediaAsset table
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 2,
      });
      const res = await pool.query('SELECT id, name, url, size, category, "uploadedAt", "isSystem" FROM "MediaAsset" ORDER BY "uploadedAt" DESC LIMIT 50');
      await pool.end();
      return NextResponse.json({
        success: true,
        data: res.rows,
      });
    } catch {}
  }

  return NextResponse.json({
    success: true,
    data: [],
  });
}

export async function POST(request: NextRequest) {
  // 1. Mandatory Admin Authentication
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Authentication required. Please log in with valid credentials.',
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { data, filename, category = 'general' } = body;

    if (!data) {
      return NextResponse.json({ success: false, message: 'No image data provided' }, { status: 400 });
    }

    let base64Data = data;
    if (data.includes(';base64,')) {
      base64Data = data.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'Image exceeds maximum limit of 15MB' }, { status: 400 });
    }

    // 2. Production-safe upload to persistent cloud storage (Zero writes to read-only /var/task filesystem)
    const mediaItem = await uploadToCloud({
      buffer,
      filename: filename || `upload-${Date.now()}.jpg`,
      category,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Image uploaded successfully to persistent storage',
        data: mediaItem,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API Upload Error]:', err);
    return NextResponse.json(
      {
        success: false,
        message: `Failed to upload image: ${err?.message || 'Server error'}`,
      },
      { status: 500 }
    );
  }
}
