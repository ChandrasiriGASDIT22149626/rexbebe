import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface CollectionRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  assignedProductIds: string[];
  order: number;
  status: 'published' | 'draft';
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

const collectionsFilePath = path.join(__dirname, '../../data/collections.json');
const productsFilePath = path.join(__dirname, '../../data/products.json');
const auditLogsFilePath = path.join(__dirname, '../../data/audit_logs.json');

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[Collection] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Collection] Error writing ${filePath}:`, err);
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

export const getCollections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = readJson<CollectionRecord[]>(collectionsFilePath, []);
    const { status } = req.query;
    if (status && status !== 'all') {
      const filtered = collections.filter(c => c.status === status);
      return sendSuccess(res, filtered, 'Collections retrieved');
    }
    return sendSuccess(res, collections, 'Collections retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCollectionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const collections = readJson<CollectionRecord[]>(collectionsFilePath, []);
    const found = collections.find(c => c.id === id || c.slug === id);
    if (!found) {
      throw new NotFoundError(`Collection with identifier '${id}' not found`);
    }
    return sendSuccess(res, found, 'Collection retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, bannerImage, assignedProductIds, order, status, badge } = req.body;
    if (!name || !name.trim()) {
      throw new BadRequestError('Collection name is required');
    }

    const collections = readJson<CollectionRecord[]>(collectionsFilePath, []);
    const finalSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const existing = collections.find(c => c.slug === finalSlug);
    if (existing) {
      throw new BadRequestError(`A collection with slug '${finalSlug}' already exists`);
    }

    const newCollection: CollectionRecord = {
      id: req.body.id || `col-${Date.now()}`,
      name: name.trim(),
      slug: finalSlug,
      description: description || '',
      bannerImage: bannerImage || '/images/products/organic-onesie.jpg',
      assignedProductIds: Array.isArray(assignedProductIds) ? assignedProductIds : [],
      order: Number(order) || collections.length + 1,
      status: status === 'draft' ? 'draft' : 'published',
      badge: badge || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    collections.push(newCollection);
    writeJson(collectionsFilePath, collections);
    recordAudit('COLLECTION_CREATE', `Created collection "${newCollection.name}" (${newCollection.slug})`);

    return sendSuccess(res, newCollection, 'Collection created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const collections = readJson<CollectionRecord[]>(collectionsFilePath, []);
    const index = collections.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundError(`Collection with id '${id}' not found`);
    }

    const current = collections[index];
    const { name, slug, description, bannerImage, assignedProductIds, order, status, badge } = req.body;

    const finalSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : current.slug;
    if (finalSlug !== current.slug) {
      const duplicate = collections.find(c => c.slug === finalSlug && c.id !== id);
      if (duplicate) {
        throw new BadRequestError(`Another collection with slug '${finalSlug}' already exists`);
      }
    }

    const updated: CollectionRecord = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      slug: finalSlug,
      description: description !== undefined ? description : current.description,
      bannerImage: bannerImage !== undefined ? bannerImage : current.bannerImage,
      assignedProductIds: Array.isArray(assignedProductIds) ? assignedProductIds : current.assignedProductIds,
      order: order !== undefined ? Number(order) : current.order,
      status: status !== undefined ? status : current.status,
      badge: badge !== undefined ? badge : current.badge,
      updatedAt: new Date().toISOString(),
    };

    collections[index] = updated;
    writeJson(collectionsFilePath, collections);
    recordAudit('COLLECTION_UPDATE', `Updated collection "${updated.name}" (${updated.id})`);

    return sendSuccess(res, updated, 'Changes saved successfully.');
  } catch (err) {
    next(err);
  }
};

export const updateCollectionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'draft'].includes(status)) {
      throw new BadRequestError('Invalid status. Allowed values: published, draft');
    }

    const collections = readJson<CollectionRecord[]>(collectionsFilePath, []);
    const item = collections.find(c => c.id === id);
    if (!item) {
      throw new NotFoundError(`Collection with id '${id}' not found`);
    }

    item.status = status;
    item.updatedAt = new Date().toISOString();
    writeJson(collectionsFilePath, collections);
    recordAudit('COLLECTION_STATUS_CHANGE', `Changed collection "${item.name}" status to ${status}`);

    return sendSuccess(res, item, `Collection publication status updated to ${status}.`);
  } catch (err) {
    next(err);
  }
};

export const deleteCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true' || req.body?.force === true;

    const collections = readJson<CollectionRecord[]>(collectionsFilePath, []);
    const index = collections.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundError(`Collection with id '${id}' not found`);
    }

    const targetCollection = collections[index];

    // Safe deletion check: Check if collection has assigned products
    if (targetCollection.assignedProductIds && targetCollection.assignedProductIds.length > 0 && !force) {
      const assignedCount = targetCollection.assignedProductIds.length;
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message: `This collection contains ${assignedCount} assigned product${assignedCount > 1 ? 's' : ''}. Choose whether to unassign these products before permanently deleting the collection.`,
        assignedCount,
      });
    }

    // Unassign products if any exist
    if (targetCollection.assignedProductIds && targetCollection.assignedProductIds.length > 0) {
      const products = readJson<any[]>(productsFilePath, []);
      let prodModified = false;
      products.forEach(p => {
        if (p.collection && (p.collection.id === id || p.collection.slug === targetCollection.slug)) {
          p.collection = undefined;
          prodModified = true;
        }
      });
      if (prodModified) writeJson(productsFilePath, products);
    }

    collections.splice(index, 1);
    writeJson(collectionsFilePath, collections);
    recordAudit('COLLECTION_DELETE', `Permanently deleted collection "${targetCollection.name}" (${id})`);

    return sendSuccess(res, { deleted: true, id }, 'The item has been permanently deleted.');
  } catch (err) {
    next(err);
  }
};
