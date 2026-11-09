import { NextRequest, NextResponse } from 'next/server';
import { getCloudAsset } from '@/lib/cloudStorage';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return new NextResponse('Asset ID required', { status: 400 });
    }

    // 1. Fetch from persistent PostgreSQL storage
    const asset = await getCloudAsset(id);
    if (asset) {
      return new NextResponse(new Uint8Array(asset.buffer), {
        status: 200,
        headers: {
          'Content-Type': asset.mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Backward compatibility fallback: check local public/uploads directory
    try {
      const localPath = path.resolve(process.cwd(), 'public/uploads', id);
      if (fs.existsSync(localPath)) {
        const fileBuffer = fs.readFileSync(localPath);
        const ext = path.extname(id).toLowerCase().replace('.', '');
        const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/webp';
        return new NextResponse(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch {}

    return new NextResponse('Image not found', { status: 404 });
  } catch (err: any) {
    return new NextResponse(`Error serving image: ${err?.message}`, { status: 500 });
  }
}

