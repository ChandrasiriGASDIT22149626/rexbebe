import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { sendSuccess, sendError } from '../utils/response';
import { postgresMediaRepository } from '../repositories/postgres/PostgresMediaRepository';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';
import { cloudStorageService } from '../services/cloudStorageService';

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

// Ensure upload and originals backup directories exist (skipped in read-only serverless like Vercel)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  try {
    [FRONTEND_UPLOADS_DIR, BACKEND_UPLOADS_DIR, FRONTEND_ORIGINALS_DIR, BACKEND_ORIGINALS_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  } catch (err) {
    // Gracefully ignored in read-only serverless environments like Vercel
  }
}

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

function recordAudit(action: string, details: string, user?: { email?: string; name?: string }) {
  const logs = readJson<any[]>(auditLogsFilePath, []);
  logs.unshift({
    id: `log-${Date.now()}`,
    userEmail: user?.email || 'admin@rexbebe.com',
    userName: user?.name || 'Admin Executive',
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
router.get('/', async (req: Request, res: Response) => {
  if (process.env.USE_POSTGRES === 'true') {
    const media = await postgresMediaRepository.findAll(req.query as any);
    return sendSuccess(res, media, 'Media library items retrieved');
  }
  const media = readJson<any[]>(mediaFilePath, []);
  return sendSuccess(res, media, 'Media library items retrieved');
});

/**
 * GET /api/upload/serve/:id
 * Streams image buffer with permanent caching headers from persistent cloud storage / PostgreSQL
 */
router.get('/serve/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asset = await cloudStorageService.getStoredAsset(id);
    if (!asset) {
      // Fallback: check if exists in local public uploads
      const localPath = path.join(BACKEND_UPLOADS_DIR, id);
      if (fs.existsSync(localPath)) {
        return res.sendFile(localPath);
      }
      return res.status(404).send('Image not found');
    }
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(asset.buffer);
  } catch (err: any) {
    console.error('[Serve Image Error]:', err);
    return res.status(500).send('Error serving image');
  }
});

/**
 * POST /api/upload
 * Accepts base64 encoded image or raw file buffer
 * Automatically converts photographic/raster images to WebP (quality 80-85),
 * preserves transparency for logos/graphics, and uploads to persistent cloud storage.
 * Protected: Requires valid admin JWT bearer token.
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, filename, category = 'general' } = req.body;

    if (!data) {
      return sendError(res, 'No image data provided', 400);
    }

    // Extract base64 payload
    let base64Data = data;
    if (data.includes(';base64,')) {
      base64Data = data.split(';base64,')[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Validate size (max 15MB)
    if (buffer.length > 15 * 1024 * 1024) {
      return sendError(res, 'Image size exceeds maximum limit of 15MB', 400);
    }

    // Upload to persistent cloud storage (Vercel Blob, Cloudinary, AWS S3, or Neon PostgreSQL)
    // Zero disk writes to read-only serverless /var/task filesystem
    const newMediaItem = await cloudStorageService.upload({
      buffer,
      filename: filename || `upload-${Date.now()}.jpg`,
      category,
    });

    // In local dev only (and if writable), optionally write local copies
    const isLocalDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
    if (isLocalDev) {
      try {
        const localTarget = path.join(BACKEND_UPLOADS_DIR, newMediaItem.name);
        fs.writeFileSync(localTarget, buffer);
      } catch {}
    }

    recordAudit(
      'MEDIA_UPLOAD',
      `Uploaded & optimized image asset "${newMediaItem.name}" (Original: ${newMediaItem.originalSize}, WebP: ${newMediaItem.size}, Saved: ${newMediaItem.storageSaved}, Provider: ${newMediaItem.provider})`,
      req.user
    );

    return sendSuccess(
      res,
      newMediaItem,
      'Image optimized and uploaded successfully to persistent storage',
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
 * Protected: Requires valid admin JWT bearer token.
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

    if (!process.env.VERCEL) {
      try {
        if (fs.existsSync(frontendPath)) fs.unlinkSync(frontendPath);
        if (fs.existsSync(backendPath)) fs.unlinkSync(backendPath);
        if (fs.existsSync(frontendThumbPath)) fs.unlinkSync(frontendThumbPath);
        if (fs.existsSync(backendThumbPath)) fs.unlinkSync(backendThumbPath);
      } catch (fileErr) {
        console.warn(`[Upload Delete] Notice unlinking physical file:`, fileErr);
      }
    }

    // Remove from media.json if in writable local environment
    if (!process.env.VERCEL) {
      media.splice(index, 1);
      writeJson(mediaFilePath, media);
    }
    if (process.env.USE_POSTGRES === 'true') {
      await postgresMediaRepository.delete(item.id || id);
    }
    recordAudit('MEDIA_DELETE', `Permanently deleted media asset "${item.name}"`, req.user);

    return sendSuccess(res, { deleted: true, id }, 'The item has been permanently deleted.');
  } catch (err: any) {
    console.error('[Upload Delete Error]', err);
    return sendError(res, `Failed to delete media: ${err.message}`, 500);
  }
});

export default router;

