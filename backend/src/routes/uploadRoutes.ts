import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

const FRONTEND_UPLOADS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads');
const BACKEND_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const FRONTEND_ORIGINALS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads/originals');
const BACKEND_ORIGINALS_DIR = path.resolve(__dirname, '../../uploads/originals');

const mediaFilePath = path.resolve(__dirname, '../../data/media.json');
const frontendMediaFilePath = path.resolve(__dirname, '../../../frontend/data/media.json');
const productsFilePath = path.resolve(__dirname, '../../data/products.json');
const navigationFilePath = path.resolve(__dirname, '../../data/navigation.json');
const collectionsFilePath = path.resolve(__dirname, '../../data/collections.json');
const pagesFilePath = path.resolve(__dirname, '../../data/pages.json');
const homepageFilePath = path.resolve(__dirname, '../../data/homepage.json');
const auditLogsFilePath = path.resolve(__dirname, '../../data/audit_logs.json');

// Ensure upload and originals backup directories exist
[FRONTEND_UPLOADS_DIR, BACKEND_UPLOADS_DIR, FRONTEND_ORIGINALS_DIR, BACKEND_ORIGINALS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[Upload] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // If writing backend media.json, also sync to frontend data if existing
    if (filePath === mediaFilePath && fs.existsSync(path.dirname(frontendMediaFilePath))) {
      fs.writeFileSync(frontendMediaFilePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error(`[Upload] Error writing ${filePath}:`, err);
  }
}

function recordAudit(action: string, details: string) {
  const logs = readJson<any[]>(auditLogsFilePath, []);
  logs.unshift({
    id: `log-${Date.now()}`,
    userEmail: 'admin@rexbebe.com',
    userName: 'Admin Executive',
    action,
    details,
    ip: '127.0.0.1',
    timestamp: new Date().toISOString(),
  });
  if (logs.length > 500) logs.pop();
  writeJson(auditLogsFilePath, logs);
}

// Check where an image URL or filename is referenced across system records
function checkImageReferences(imageIdentifier: string): string[] {
  const references: string[] = [];
  const cleanId = imageIdentifier.toLowerCase();

  // 1. Check Products
  const products = readJson<any[]>(productsFilePath, []);
  products.forEach(p => {
    const inImages = p.images?.some((img: any) => img.url?.toLowerCase().includes(cleanId));
    if (inImages) {
      references.push(`Product: "${p.name}"`);
    }
  });

  // 2. Check Categories / Navigation
  const nav = readJson<any>(navigationFilePath, { items: [] });
  (nav.items || []).forEach((item: any) => {
    if (item.bannerImage?.toLowerCase().includes(cleanId) || item.thumbnailImage?.toLowerCase().includes(cleanId)) {
      references.push(`Navigation Category: "${item.name}"`);
    }
    (item.subGroups || []).forEach((grp: any) => {
      (grp.subItems || []).forEach((sub: any) => {
        if (sub.bannerImage?.toLowerCase().includes(cleanId) || sub.thumbnailImage?.toLowerCase().includes(cleanId)) {
          references.push(`Subcategory: "${sub.name}"`);
        }
      });
    });
  });

  // 3. Check Collections
  const collections = readJson<any[]>(collectionsFilePath, []);
  collections.forEach(c => {
    if (c.bannerImage?.toLowerCase().includes(cleanId)) {
      references.push(`Collection: "${c.name}"`);
    }
  });

  // 4. Check Website Pages
  const pages = readJson<any[]>(pagesFilePath, []);
  pages.forEach(pg => {
    if (pg.bannerImage?.toLowerCase().includes(cleanId)) {
      references.push(`Website Page: "${pg.name}"`);
    }
  });

  // 5. Check Homepage
  const homepage = readJson<any>(homepageFilePath, {});
  const hpString = JSON.stringify(homepage).toLowerCase();
  if (hpString.includes(cleanId)) {
    references.push('Homepage Studio layout');
  }

  return references;
}

/**
 * GET /api/upload
 * Returns all media items in the persistent library
 */
router.get('/', (req: Request, res: Response) => {
  const media = readJson<any[]>(mediaFilePath, []);
  return sendSuccess(res, media, 'Media library items retrieved');
});

/**
 * POST /api/upload
 * Accepts base64 encoded image or raw file buffer
 * Automatically backs up original, converts photographic/raster images to WebP (quality 80-85),
 * preserves transparency for logos/graphics, and creates responsive thumbnails.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data, filename, category = 'general' } = req.body;

    if (!data) {
      return sendError(res, 'No image data provided', 400);
    }

    // Extract base64 payload & detect extension
    let base64Data = data;
    let originalExt = 'jpg';

    if (data.includes(';base64,')) {
      const parts = data.split(';base64,');
      const mime = parts[0].replace('data:', '');
      if (mime.includes('png')) originalExt = 'png';
      else if (mime.includes('webp')) originalExt = 'webp';
      else if (mime.includes('svg')) originalExt = 'svg';
      else if (mime.includes('gif')) originalExt = 'gif';
      else originalExt = 'jpg';
      base64Data = parts[1];
    } else if (filename) {
      const matchExt = path.extname(filename).replace('.', '').toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(matchExt)) {
        originalExt = matchExt === 'jpeg' ? 'jpg' : matchExt;
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Validate size (max 15MB)
    if (buffer.length > 15 * 1024 * 1024) {
      return sendError(res, 'Image size exceeds maximum limit of 15MB', 400);
    }

    const timestamp = Date.now();
    const rawCleanName = filename
      ? filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/\.[^/.]+$/, '')
      : `upload-${timestamp}`;

    const originalFilename = `${timestamp}-${rawCleanName}.${originalExt}`;
    const webpFilename = `${timestamp}-${rawCleanName}.webp`;
    const thumbFilename = `${timestamp}-${rawCleanName}-thumb.webp`;

    // 1. SAFE BACKUP: Always write untouched original buffer to originals directory
    const frontendOriginalTarget = path.join(FRONTEND_ORIGINALS_DIR, originalFilename);
    const backendOriginalTarget = path.join(BACKEND_ORIGINALS_DIR, originalFilename);
    fs.writeFileSync(frontendOriginalTarget, buffer);
    fs.writeFileSync(backendOriginalTarget, buffer);

    let publicUrl = `/uploads/${webpFilename}`;
    let thumbUrl = `/uploads/${thumbFilename}`;
    let finalFormat = 'webp';
    let outputWidth: number | undefined;
    let outputHeight: number | undefined;
    let outputSizeKb = Math.round(buffer.length / 1024);
    let originalSizeKb = outputSizeKb;
    let savedPercent = '0%';

    // 2. AUTOMATIC WEBP CONVERSION & OPTIMIZATION PIPELINE
    try {
      if (originalExt === 'svg') {
        // SVG is resolution-independent vector graphics: preserve directly
        const svgFilename = `${timestamp}-${rawCleanName}.svg`;
        fs.writeFileSync(path.join(FRONTEND_UPLOADS_DIR, svgFilename), buffer);
        fs.writeFileSync(path.join(BACKEND_UPLOADS_DIR, svgFilename), buffer);
        publicUrl = `/uploads/${svgFilename}`;
        thumbUrl = publicUrl;
        finalFormat = 'svg';
      } else {
        // Inspect image metadata
        const metadata = await sharp(buffer).metadata();
        outputWidth = metadata.width;
        outputHeight = metadata.height;

        const isTransparent = Boolean(metadata.hasAlpha && metadata.channels && metadata.channels > 3);

        // Convert to WebP:
        // - Transparent graphics/logos: lossless WebP to prevent halos or edge fuzziness
        // - Photographic images: quality 85 with effort 4 for optimal visual quality
        let webpBuffer: Buffer;
        if (isTransparent) {
          webpBuffer = await sharp(buffer)
            .webp({ quality: 85, effort: 4, lossless: true, alphaQuality: 100 })
            .toBuffer();
        } else {
          webpBuffer = await sharp(buffer)
            .webp({ quality: 85, effort: 4 })
            .toBuffer();
        }

        // Generate responsive thumbnail variant for product grids
        let thumbBuffer: Buffer;
        if (metadata.width && metadata.width > 420) {
          thumbBuffer = await sharp(buffer)
            .resize({ width: 420, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();
        } else {
          thumbBuffer = webpBuffer;
        }

        // Save WebP and thumbnail to both frontend and backend uploads
        fs.writeFileSync(path.join(FRONTEND_UPLOADS_DIR, webpFilename), webpBuffer);
        fs.writeFileSync(path.join(BACKEND_UPLOADS_DIR, webpFilename), webpBuffer);
        fs.writeFileSync(path.join(FRONTEND_UPLOADS_DIR, thumbFilename), thumbBuffer);
        fs.writeFileSync(path.join(BACKEND_UPLOADS_DIR, thumbFilename), thumbBuffer);

        outputSizeKb = Math.round(webpBuffer.length / 1024);
        const savedBytes = Math.max(0, buffer.length - webpBuffer.length);
        const percentNum = buffer.length > 0 ? Math.round((savedBytes / buffer.length) * 100) : 0;
        savedPercent = `${percentNum}%`;
      }
    } catch (conversionErr: any) {
      // 3. RESILIENT FALLBACK: Never break upload if sharp hits unsupported format
      console.warn(`[Upload Optimizer] Sharp conversion note, falling back to original: ${conversionErr.message}`);
      const fallbackTargetFront = path.join(FRONTEND_UPLOADS_DIR, originalFilename);
      const fallbackTargetBack = path.join(BACKEND_UPLOADS_DIR, originalFilename);
      fs.writeFileSync(fallbackTargetFront, buffer);
      fs.writeFileSync(fallbackTargetBack, buffer);
      publicUrl = `/uploads/${originalFilename}`;
      thumbUrl = publicUrl;
      finalFormat = originalExt;
    }

    const newMediaItem = {
      id: `med-${timestamp}`,
      name: path.basename(publicUrl),
      filename: path.basename(publicUrl),
      url: publicUrl,
      thumbnailUrl: thumbUrl,
      originalUrl: `/uploads/originals/${originalFilename}`,
      size: `${outputSizeKb} KB`,
      originalSize: `${originalSizeKb} KB`,
      storageSaved: savedPercent,
      format: finalFormat,
      width: outputWidth,
      height: outputHeight,
      category: ['products', 'banners', 'general'].includes(category) ? category : 'general',
      uploadedAt: new Date().toISOString(),
      isSystem: false,
    };

    const media = readJson<any[]>(mediaFilePath, []);
    media.unshift(newMediaItem);
    writeJson(mediaFilePath, media);
    recordAudit('MEDIA_UPLOAD', `Uploaded & optimized image asset "${newMediaItem.name}" (Original: ${newMediaItem.originalSize}, WebP: ${newMediaItem.size}, Saved: ${newMediaItem.storageSaved})`);

    return sendSuccess(
      res,
      newMediaItem,
      'Image optimized and uploaded successfully as WebP',
      201
    );
  } catch (err: any) {
    console.error('[Upload Error]', err);
    return sendError(res, `Failed to upload image: ${err.message}`, 500);
  }
});

/**
 * DELETE /api/upload/:id
 * Permanently deletes media item with safe dependency checking
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true' || req.body?.force === true;

    const media = readJson<any[]>(mediaFilePath, []);
    const index = media.findIndex(m => m.id === id || m.name === id || m.url === id);
    if (index === -1) {
      return sendError(res, `Media item '${id}' not found`, 404);
    }

    const item = media[index];

    // Check references before deleting
    const identifier = item.url.split('/').pop() || item.name;
    const references = checkImageReferences(identifier);

    if (references.length > 0 && !force) {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message: `This item is connected to other records. Please review these connections before deleting it.`,
        connections: references,
      });
    }

    // Unlink physical file from disk
    const filename = item.url.startsWith('/uploads/') ? item.url.replace('/uploads/', '') : item.name;
    const frontendPath = path.join(FRONTEND_UPLOADS_DIR, filename);
    const backendPath = path.join(BACKEND_UPLOADS_DIR, filename);

    // Also unlink thumbnail if present
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const thumbFilename = `${baseName}-thumb.webp`;
    const frontendThumbPath = path.join(FRONTEND_UPLOADS_DIR, thumbFilename);
    const backendThumbPath = path.join(BACKEND_UPLOADS_DIR, thumbFilename);

    try {
      if (fs.existsSync(frontendPath)) fs.unlinkSync(frontendPath);
      if (fs.existsSync(backendPath)) fs.unlinkSync(backendPath);
      if (fs.existsSync(frontendThumbPath)) fs.unlinkSync(frontendThumbPath);
      if (fs.existsSync(backendThumbPath)) fs.unlinkSync(backendThumbPath);
    } catch (fileErr) {
      console.warn(`[Upload Delete] Notice unlinking physical file:`, fileErr);
    }

    // Remove from media.json
    media.splice(index, 1);
    writeJson(mediaFilePath, media);
    recordAudit('MEDIA_DELETE', `Permanently deleted media asset "${item.name}"`);

    return sendSuccess(res, { deleted: true, id }, 'The item has been permanently deleted.');
  } catch (err: any) {
    console.error('[Upload Delete Error]', err);
    return sendError(res, `Failed to delete media: ${err.message}`, 500);
  }
});

export default router;

