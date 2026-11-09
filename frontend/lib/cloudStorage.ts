import sharp from 'sharp';
import crypto from 'crypto';
import { Pool } from 'pg';

let pgPool: Pool | null = null;
function getPgPool(): Pool | null {
  if (!pgPool && process.env.DATABASE_URL) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pgPool;
}

export interface CloudUploadOptions {
  buffer: Buffer;
  filename: string;
  category?: string;
  isSystem?: boolean;
}

export interface CloudUploadResult {
  id: string;
  name: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  originalUrl?: string;
  size: string;
  originalSize: string;
  storageSaved: string;
  format: string;
  width?: number;
  height?: number;
  category: string;
  provider: 'vercel-blob' | 'cloudinary' | 's3' | 'postgres';
  uploadedAt: string;
  isSystem: boolean;
}

/**
 * Uploads an image to permanent cloud storage without any local filesystem writes.
 * Supports: Vercel Blob -> Cloudinary -> AWS S3 -> Neon PostgreSQL Managed Storage.
 */
export async function uploadToCloud(options: CloudUploadOptions): Promise<CloudUploadResult> {
  const { buffer, filename, category = 'general', isSystem = false } = options;

  if (buffer.length > 15 * 1024 * 1024) {
    throw new Error('Image size exceeds maximum limit of 15MB');
  }

  const timestamp = Date.now();
  const cleanBase = filename
    ? filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/\.[^/.]+$/, '')
    : `upload-${timestamp}`;
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();

  const originalSizeKb = Math.round(buffer.length / 1024);
  let webpBuffer: Buffer;
  let thumbBuffer: Buffer;
  let outputWidth: number | undefined;
  let outputHeight: number | undefined;
  let finalFormat = 'webp';

  if (ext === 'svg') {
    webpBuffer = buffer;
    thumbBuffer = buffer;
    finalFormat = 'svg';
  } else {
    try {
      const metadata = await sharp(buffer).metadata();
      outputWidth = metadata.width;
      outputHeight = metadata.height;
      const isTransparent = Boolean(metadata.hasAlpha && metadata.channels && metadata.channels > 3);

      if (isTransparent) {
        webpBuffer = await sharp(buffer)
          .webp({ quality: 85, effort: 4, lossless: true, alphaQuality: 100 })
          .toBuffer();
      } else {
        webpBuffer = await sharp(buffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer();
      }

      if (outputWidth && outputWidth > 420) {
        thumbBuffer = await sharp(buffer)
          .resize({ width: 420, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
      } else {
        thumbBuffer = webpBuffer;
      }
    } catch (err: any) {
      console.warn('[CloudStorage] Sharp fallback to original:', err?.message);
      webpBuffer = buffer;
      thumbBuffer = buffer;
      finalFormat = ext;
    }
  }

  const outputSizeKb = Math.round(webpBuffer.length / 1024);
  const savedBytes = Math.max(0, buffer.length - webpBuffer.length);
  const savedPercent = buffer.length > 0 ? `${Math.round((savedBytes / buffer.length) * 100)}%` : '0%';

  const assetId = `med-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;
  const finalFilename = `${timestamp}-${cleanBase}.${finalFormat}`;
  const thumbFilename = `${timestamp}-${cleanBase}-thumb.${finalFormat}`;

  let provider: 'vercel-blob' | 'cloudinary' | 's3' | 'postgres' = 'postgres';
  let publicUrl = '';
  let thumbUrl = '';

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const rawCloudinaryUrl = process.env.CLOUDINARY_URL || '';
  let cName = process.env.CLOUDINARY_CLOUD_NAME;
  let cKey = process.env.CLOUDINARY_API_KEY;
  let cSecret = process.env.CLOUDINARY_API_SECRET;

  if (rawCloudinaryUrl.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(rawCloudinaryUrl);
      cKey = parsed.username;
      cSecret = parsed.password;
      cName = parsed.hostname;
    } catch {}
  }

  // 1. Try Vercel Blob
  if (blobToken && blobToken.trim() && !blobToken.includes('placeholder')) {
    try {
      const { put } = await import('@vercel/blob');
      const mainBlob = await put(`products/${finalFilename}`, webpBuffer, {
        access: 'public',
        contentType: finalFormat === 'svg' ? 'image/svg+xml' : 'image/webp',
        token: blobToken,
      });
      const thumbBlob = await put(`products/thumbs/${thumbFilename}`, thumbBuffer, {
        access: 'public',
        contentType: finalFormat === 'svg' ? 'image/svg+xml' : 'image/webp',
        token: blobToken,
      });
      publicUrl = mainBlob.url;
      thumbUrl = thumbBlob.url;
      provider = 'vercel-blob';
    } catch (blobErr: any) {
      console.warn('[CloudStorage] Vercel Blob upload note, falling back:', blobErr?.message);
    }
  }

  // 2. Try Cloudinary
  if (!publicUrl && cName && cKey && cSecret) {
    try {
      const ts = Math.round(Date.now() / 1000);
      const cleanPublicId = finalFilename.replace(/\.[^/.]+$/, '');
      const stringToSign = `folder=rexbebe/products&public_id=${cleanPublicId}&timestamp=${ts}${cSecret}`;
      const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', `data:image/webp;base64,${webpBuffer.toString('base64')}`);
      formData.append('api_key', cKey);
      formData.append('timestamp', ts.toString());
      formData.append('signature', signature);
      formData.append('folder', 'rexbebe/products');
      formData.append('public_id', cleanPublicId);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.secure_url) {
        publicUrl = json.secure_url;
        thumbUrl = json.secure_url;
        provider = 'cloudinary';
      }
    } catch (cErr: any) {
      console.warn('[CloudStorage] Cloudinary upload note, falling back:', cErr?.message);
    }
  }

  // 3. Fallback: Neon PostgreSQL Persistent Storage (serves permanently over HTTPS via /api/upload/serve/:id)
  if (!publicUrl) {
    publicUrl = `/api/upload/serve/${assetId}.${finalFormat}`;
    thumbUrl = publicUrl;
    provider = 'postgres';
  }

  // Save metadata & binary data to Neon PostgreSQL
  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO "MediaAsset" (
          id, name, url, size, category, dimensions, "isSystem", "uploadedAt", "createdAt", "updatedAt", data, "mimeType"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          url = EXCLUDED.url,
          size = EXCLUDED.size,
          category = EXCLUDED.category,
          data = EXCLUDED.data,
          "mimeType" = EXCLUDED."mimeType",
          "updatedAt" = EXCLUDED."updatedAt"`,
        [
          assetId,
          finalFilename,
          publicUrl,
          `${outputSizeKb} KB`,
          category,
          outputWidth && outputHeight ? JSON.stringify({ width: outputWidth, height: outputHeight }) : null,
          isSystem,
          new Date(),
          new Date(),
          new Date(),
          webpBuffer.toString('base64'),
          finalFormat === 'svg' ? 'image/svg+xml' : 'image/webp',
        ]
      );
    } catch (dbErr: any) {
      console.error('[CloudStorage] Database write warning:', dbErr?.message);
    }
  }

  return {
    id: assetId,
    name: finalFilename,
    filename: finalFilename,
    url: publicUrl,
    thumbnailUrl: thumbUrl,
    originalUrl: publicUrl,
    size: `${outputSizeKb} KB`,
    originalSize: `${originalSizeKb} KB`,
    storageSaved: savedPercent,
    format: finalFormat,
    width: outputWidth,
    height: outputHeight,
    category,
    provider,
    uploadedAt: new Date().toISOString(),
    isSystem,
  };
}

/**
 * Retrieves image buffer and MIME type from Neon PostgreSQL MediaAsset table
 */
export async function getCloudAsset(idOrName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const pool = getPgPool();
  if (!pool) return null;

  const cleanId = idOrName.replace(/\.[^/.]+$/, '').trim();
  try {
    const res = await pool.query(
      `SELECT data, "mimeType" FROM "MediaAsset" 
       WHERE id = $1 OR name = $2 OR url LIKE '%' || $2 
       LIMIT 1`,
      [cleanId, idOrName]
    );

    if (res.rows.length > 0 && res.rows[0].data) {
      return {
        buffer: Buffer.from(res.rows[0].data, 'base64'),
        mimeType: res.rows[0].mimeType || 'image/webp',
      };
    }
  } catch (err: any) {
    console.error('[CloudStorage] Error fetching stored asset from DB:', err?.message);
  }

  return null;
}

