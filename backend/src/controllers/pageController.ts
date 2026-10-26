import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface WebsitePageRecord {
  id: string;
  name: string;
  slug: string;
  url: string;
  heading: string;
  shortDescription: string;
  detailedDescription: string;
  bannerImage: string;
  additionalImages?: string[];
  status: 'published' | 'draft';
  isVisible: boolean;
  seoTitle: string;
  seoDescription: string;
  lastUpdated: string;
}

const pagesFilePath = path.join(__dirname, '../../data/pages.json');
const auditLogsFilePath = path.join(__dirname, '../../data/audit_logs.json');

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[Page] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Page] Error writing ${filePath}:`, err);
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

export const getPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pages = readJson<WebsitePageRecord[]>(pagesFilePath, []);
    const { status } = req.query;
    if (status && status !== 'all') {
      const filtered = pages.filter(p => p.status === status);
      return sendSuccess(res, filtered, 'Pages retrieved');
    }
    return sendSuccess(res, pages, 'Pages retrieved');
  } catch (err) {
    next(err);
  }
};

export const getPageBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const pages = readJson<WebsitePageRecord[]>(pagesFilePath, []);
    const found = pages.find(p => p.slug === slug || p.id === slug);
    if (!found) {
      throw new NotFoundError(`Website page '${slug}' not found`);
    }
    return sendSuccess(res, found, 'Page retrieved');
  } catch (err) {
    next(err);
  }
};

export const createPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, heading, shortDescription, detailedDescription, bannerImage, status, isVisible, seoTitle, seoDescription } = req.body;
    if (!name || !name.trim()) {
      throw new BadRequestError('Page title is required');
    }

    const pages = readJson<WebsitePageRecord[]>(pagesFilePath, []);
    const finalSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const existing = pages.find(p => p.slug === finalSlug);
    if (existing) {
      throw new BadRequestError(`A page with URL slug '${finalSlug}' already exists`);
    }

    const newPage: WebsitePageRecord = {
      id: req.body.id || `page-${finalSlug}`,
      name: name.trim(),
      slug: finalSlug,
      url: `/${finalSlug}`,
      heading: heading || name.trim(),
      shortDescription: shortDescription || '',
      detailedDescription: detailedDescription || '',
      bannerImage: bannerImage || '/images/products/editorial-baby-lifestyle.jpg',
      status: status === 'draft' ? 'draft' : 'published',
      isVisible: isVisible !== false,
      seoTitle: seoTitle || `${name} | REXBEBE Luxury Boutique`,
      seoDescription: seoDescription || shortDescription || '',
      lastUpdated: new Date().toISOString(),
    };

    pages.push(newPage);
    writeJson(pagesFilePath, pages);
    recordAudit('PAGE_CREATE', `Created website page "${newPage.name}" (${newPage.url})`);

    return sendSuccess(res, newPage, 'Page created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pages = readJson<WebsitePageRecord[]>(pagesFilePath, []);
    const index = pages.findIndex(p => p.id === id || p.slug === id);
    if (index === -1) {
      throw new NotFoundError(`Page with identifier '${id}' not found`);
    }

    const current = pages[index];
    const { name, slug, heading, shortDescription, detailedDescription, bannerImage, additionalImages, status, isVisible, seoTitle, seoDescription } = req.body;

    const finalSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : current.slug;
    if (finalSlug !== current.slug) {
      const duplicate = pages.find(p => p.slug === finalSlug && p.id !== current.id);
      if (duplicate) {
        throw new BadRequestError(`Another page with URL slug '${finalSlug}' already exists`);
      }
    }

    const updated: WebsitePageRecord = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      slug: finalSlug,
      url: `/${finalSlug}`,
      heading: heading !== undefined ? heading : current.heading,
      shortDescription: shortDescription !== undefined ? shortDescription : current.shortDescription,
      detailedDescription: detailedDescription !== undefined ? detailedDescription : current.detailedDescription,
      bannerImage: bannerImage !== undefined ? bannerImage : current.bannerImage,
      additionalImages: additionalImages !== undefined ? additionalImages : current.additionalImages,
      status: status !== undefined ? status : current.status,
      isVisible: isVisible !== undefined ? isVisible : current.isVisible,
      seoTitle: seoTitle !== undefined ? seoTitle : current.seoTitle,
      seoDescription: seoDescription !== undefined ? seoDescription : current.seoDescription,
      lastUpdated: new Date().toISOString(),
    };

    pages[index] = updated;
    writeJson(pagesFilePath, pages);
    recordAudit('PAGE_UPDATE', `Updated website page "${updated.name}" (${updated.url})`);

    return sendSuccess(res, updated, 'Changes saved successfully.');
  } catch (err) {
    next(err);
  }
};

export const updatePageStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['published', 'draft'].includes(status)) {
      throw new BadRequestError('Invalid status. Allowed values: published, draft');
    }

    const pages = readJson<WebsitePageRecord[]>(pagesFilePath, []);
    const item = pages.find(p => p.id === id || p.slug === id);
    if (!item) {
      throw new NotFoundError(`Page with identifier '${id}' not found`);
    }

    item.status = status;
    item.isVisible = status === 'published';
    item.lastUpdated = new Date().toISOString();
    writeJson(pagesFilePath, pages);
    recordAudit('PAGE_STATUS_CHANGE', `Updated page "${item.name}" status to ${status}`);

    return sendSuccess(res, item, `Page publication status updated to ${status}.`);
  } catch (err) {
    next(err);
  }
};

export const deletePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pages = readJson<WebsitePageRecord[]>(pagesFilePath, []);
    const index = pages.findIndex(p => p.id === id || p.slug === id);
    if (index === -1) {
      throw new NotFoundError(`Page with identifier '${id}' not found`);
    }

    const targetPage = pages[index];

    // Core brand pages protection: cannot delete essential legal/contact pages unless draft
    const ESSENTIAL_PAGES = ['about', 'shipping', 'returns', 'contact', 'size-guide', 'faq'];
    if (ESSENTIAL_PAGES.includes(targetPage.slug) && targetPage.status === 'published') {
      return res.status(409).json({
        success: false,
        message: 'This is an essential storefront page. To delete or replace it, first unpublish it to Draft status.',
      });
    }

    pages.splice(index, 1);
    writeJson(pagesFilePath, pages);
    recordAudit('PAGE_DELETE', `Permanently deleted website page "${targetPage.name}" (${targetPage.url})`);

    return sendSuccess(res, { deleted: true, id }, 'The item has been permanently deleted.');
  } catch (err) {
    next(err);
  }
};
