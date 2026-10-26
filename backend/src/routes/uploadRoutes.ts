import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

const FRONTEND_UPLOADS_DIR = path.resolve(__dirname, '../../../frontend/public/uploads');
const BACKEND_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const mediaFilePath = path.resolve(__dirname, '../../data/media.json');
const productsFilePath = path.resolve(__dirname, '../../data/products.json');
const navigationFilePath = path.resolve(__dirname, '../../data/navigation.json');
const collectionsFilePath = path.resolve(__dirname, '../../data/collections.json');
const pagesFilePath = path.resolve(__dirname, '../../data/pages.json');
const homepageFilePath = path.resolve(__dirname, '../../data/homepage.json');
const auditLogsFilePath = path.resolve(__dirname, '../../data/audit_logs.json');

// Ensure upload directories exist
[FRONTEND_UPLOADS_DIR, BACKEND_UPLOADS_DIR].forEach((dir) => {
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
 * Payload: { data: "data:image/png;base64,...", filename: "banner.png", category?: "banners"|"products" }
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { data, filename, category = 'general' } = req.body;

    if (!data) {
      return sendError(res, 'No image data provided', 400);
    }

    // Extract base64 payload
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

    // Validate size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return sendError(res, 'Image size exceeds maximum limit of 10MB', 400);
    }

    // Write to frontend public directory so Next.js serves it immediately
    const frontendTarget = path.join(FRONTEND_UPLOADS_DIR, cleanFilename);
    fs.writeFileSync(frontendTarget, buffer);

    // Write duplicate to backend uploads
    const backendTarget = path.join(BACKEND_UPLOADS_DIR, cleanFilename);
    fs.writeFileSync(backendTarget, buffer);

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

    const media = readJson<any[]>(mediaFilePath, []);
    media.unshift(newMediaItem);
    writeJson(mediaFilePath, media);
    recordAudit('MEDIA_UPLOAD', `Uploaded image asset "${cleanFilename}" (${newMediaItem.size})`);

    return sendSuccess(
      res,
      newMediaItem,
      'Image uploaded successfully',
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

    // Permanently remove physical file from disk if it was an uploaded file
    const filename = item.url.startsWith('/uploads/') ? item.url.replace('/uploads/', '') : item.name;
    const frontendPath = path.join(FRONTEND_UPLOADS_DIR, filename);
    const backendPath = path.join(BACKEND_UPLOADS_DIR, filename);

    try {
      if (fs.existsSync(frontendPath)) fs.unlinkSync(frontendPath);
      if (fs.existsSync(backendPath)) fs.unlinkSync(backendPath);
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
