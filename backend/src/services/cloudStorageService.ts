import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { db, DatabaseManager } from '../config/database';
import { postgresMediaRepository } from '../repositories/postgres/PostgresMediaRepository';

export interface CloudStorageConfig {
  vercelBlobToken?: string;
  cloudinaryUrl?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
}

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  category?: string;
  isSystem?: boolean;
}

export interface UploadResult {
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

export class CloudStorageService {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private getConfig(): CloudStorageConfig {
    const rawCloudinaryUrl = process.env.CLOUDINARY_URL || '';
    let cName = process.env.CLOUDINARY_CLOUD_NAME;
    let cKey = process.env.CLOUDINARY_API_KEY;
    let cSecret = process.env.CLOUDINARY_API_SECRET;

    if (rawCloudinaryUrl && rawCloudinaryUrl.startsWith('cloudinary://')) {
      try {
        const parsed = new URL(rawCloudinaryUrl);
        cKey = parsed.username;
        cSecret = parsed.password;
        cName = parsed.hostname;
      } catch (e) {
        // ignore
      }
    }

    return {
      vercelBlobToken: process.env.BLOB_READ_WRITE_TOKEN,
      cloudinaryUrl: rawCloudinaryUrl,
      cloudinaryCloudName: cName,
      cloudinaryApiKey: cKey,
      cloudinaryApiSecret: cSecret,
      s3AccessKey: process.env.STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
      s3SecretKey: process.env.STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
      s3Bucket: process.env.STORAGE_BUCKET,
      s3Region: process.env.STORAGE_REGION || process.env.AWS_REGION || 'us-east-1',
      s3Endpoint: process.env.STORAGE_ENDPOINT,
    };
  }

  public getActiveProviderName(): 'vercel-blob' | 'cloudinary' | 's3' | 'postgres' {
    const config = this.getConfig();
    if (config.vercelBlobToken && config.vercelBlobToken.trim() && !config.vercelBlobToken.includes('placeholder')) {
      return 'vercel-blob';
    }
    if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
      return 'cloudinary';
    }
    if (config.s3AccessKey && config.s3SecretKey && config.s3Bucket && !config.s3AccessKey.includes('placeholder')) {
      return 's3';
    }
    return 'postgres';
  }

  /**
   * Upload buffer to Vercel Blob
   */
  private async uploadToVercelBlob(
    pathname: string,
    buffer: Buffer,
    contentType: string,
    token: string
  ): Promise<string> {
    const { put } = await import('@vercel/blob');
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token,
    });
    return blob.url;
  }

  /**
   * Upload buffer to Cloudinary using REST API
   */
  private async uploadToCloudinary(
    buffer: Buffer,
    filename: string,
    folder: string,
    config: CloudStorageConfig
  ): Promise<string> {
    const timestamp = Math.round(Date.now() / 1000);
    const cleanPublicId = filename.replace(/\.[^/.]+$/, '');
    const stringToSign = `folder=${folder}&public_id=${cleanPublicId}&timestamp=${timestamp}${config.cloudinaryApiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const base64Data = `data:image/webp;base64,${buffer.toString('base64')}`;

    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('api_key', config.cloudinaryApiKey!);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', cleanPublicId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.secure_url) {
      throw new Error(json.error?.message || 'Cloudinary upload failed');
    }
    return json.secure_url;
  }

  /**
   * Primary entry point for uploading and optimizing images
   */
  public async upload(options: UploadOptions): Promise<UploadResult> {
    const { buffer, filename, category = 'general', isSystem = false } = options;

    if (buffer.length > 15 * 1024 * 1024) {
      throw new Error('Image size exceeds maximum limit of 15MB');
    }

    const timestamp = Date.now();
    const cleanBase = filename
      ? filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/\.[^/.]+$/, '')
      : `upload-${timestamp}`;
    const ext = path.extname(filename).toLowerCase().replace('.', '') || 'jpg';

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
        console.warn('[CloudStorage] Sharp fallback to original:', err.message);
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

    const config = this.getConfig();
    const provider = this.getActiveProviderName();

    let publicUrl = '';
    let thumbUrl = '';

    if (provider === 'vercel-blob' && config.vercelBlobToken) {
      publicUrl = await this.uploadToVercelBlob(
        `products/${finalFilename}`,
        webpBuffer,
        finalFormat === 'svg' ? 'image/svg+xml' : 'image/webp',
        config.vercelBlobToken
      );
      thumbUrl = await this.uploadToVercelBlob(
        `products/thumbs/${thumbFilename}`,
        thumbBuffer,
        finalFormat === 'svg' ? 'image/svg+xml' : 'image/webp',
        config.vercelBlobToken
      );
    } else if (provider === 'cloudinary' && config.cloudinaryCloudName) {
      publicUrl = await this.uploadToCloudinary(webpBuffer, finalFilename, 'rexbebe/products', config);
      thumbUrl = await this.uploadToCloudinary(thumbBuffer, thumbFilename, 'rexbebe/products/thumbs', config);
    } else {
      // Default / Resilient fallback: Neon PostgreSQL Managed Storage
      // Creates a permanent HTTPS-served endpoint backed directly by PostgreSQL
      publicUrl = `/api/upload/serve/${assetId}.${finalFormat}`;
      thumbUrl = publicUrl;
    }

    // Persist to Neon PostgreSQL MediaAsset table
    const mediaRecord = {
      id: assetId,
      name: finalFilename,
      url: publicUrl,
      size: `${outputSizeKb} KB`,
      category: ['products', 'banners', 'general'].includes(category) ? category : 'general',
      dimensions: outputWidth && outputHeight ? { width: outputWidth, height: outputHeight } : undefined,
      isSystem,
      uploadedAt: new Date().toISOString(),
      data: webpBuffer.toString('base64'),
      mimeType: finalFormat === 'svg' ? 'image/svg+xml' : 'image/webp',
    };

    if (process.env.USE_POSTGRES === 'true' || process.env.DATABASE_URL) {
      try {
        await this.database.query(
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
            mediaRecord.id,
            mediaRecord.name,
            mediaRecord.url,
            mediaRecord.size,
            mediaRecord.category,
            mediaRecord.dimensions ? JSON.stringify(mediaRecord.dimensions) : null,
            mediaRecord.isSystem,
            new Date(mediaRecord.uploadedAt),
            new Date(),
            new Date(),
            mediaRecord.data,
            mediaRecord.mimeType,
          ]
        );
      } catch (dbErr: any) {
        console.error('[CloudStorage] MediaAsset database record write error:', dbErr);
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
      category: mediaRecord.category,
      provider,
      uploadedAt: mediaRecord.uploadedAt,
      isSystem,
    };
  }

  /**
   * Fetches image data from Neon PostgreSQL MediaAsset table
   */
  public async getStoredAsset(idOrName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cleanId = idOrName.replace(/\.[^/.]+$/, '').trim();
    const res = await this.database.query(
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

    return null;
  }
}

export const cloudStorageService = new CloudStorageService();

