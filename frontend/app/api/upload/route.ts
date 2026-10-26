import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FRONTEND_UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');
const BACKEND_UPLOADS_DIR = path.resolve(process.cwd(), '../backend/uploads');
const MEDIA_BACKEND_FILE = path.resolve(process.cwd(), '../backend/data/media.json');
const MEDIA_FRONTEND_FILE = path.resolve(process.cwd(), 'data/media.json');

// Ensure upload dirs exist
[FRONTEND_UPLOADS_DIR, BACKEND_UPLOADS_DIR].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
});

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export async function GET() {
  const media = readJson<any[]>(MEDIA_BACKEND_FILE, readJson<any[]>(MEDIA_FRONTEND_FILE, []));
  return NextResponse.json({
    success: true,
    data: media,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, filename, category = 'general' } = body;

    if (!data) {
      return NextResponse.json({ success: false, message: 'No image data provided' }, { status: 400 });
    }

    let base64Data = data;
    let extension = 'jpg';

    if (data.includes(';base64,')) {
      const parts = data.split(';base64,');
      const mime = parts[0].replace('data:', '');
      if (mime.includes('png')) extension = 'png';
      else if (mime.includes('webp')) extension = 'webp';
      else if (mime.includes('svg')) extension = 'svg';
      else extension = 'jpg';
      base64Data = parts[1];
    }

    const cleanFilename = filename
      ? `${Date.now()}-${filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`
      : `upload-${Date.now()}.${extension}`;

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'Image exceeds maximum limit of 10MB' }, { status: 400 });
    }

    // Write to frontend public directory
    const frontendTarget = path.join(FRONTEND_UPLOADS_DIR, cleanFilename);
    fs.writeFileSync(frontendTarget, buffer);

    // Write to backend uploads directory if exists
    try {
      const backendTarget = path.join(BACKEND_UPLOADS_DIR, cleanFilename);
      fs.writeFileSync(backendTarget, buffer);
    } catch {}

    const publicUrl = `/uploads/${cleanFilename}`;
    const sizeInKb = Math.round(buffer.length / 1024);

    const newMediaItem = {
      id: `med-${Date.now()}`,
      name: cleanFilename,
      url: publicUrl,
      size: `${sizeInKb} KB`,
      category: ['products', 'banners', 'general'].includes(category) ? category : 'general',
      uploadedAt: new Date().toISOString(),
      isSystem: false,
    };

    const media = readJson<any[]>(MEDIA_BACKEND_FILE, []);
    media.unshift(newMediaItem);
    writeJson(MEDIA_BACKEND_FILE, media);
    writeJson(MEDIA_FRONTEND_FILE, media);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: newMediaItem,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: `Failed to upload image: ${err.message}`,
    }, { status: 500 });
  }
}
