import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { categoryRepository, CategoryRecord, CategoryValidationError } from '../repositories/categoryRepository';
import { navigationStorage } from '../services/navigationStorage';

const productsFilePath = path.join(__dirname, '../../data/products.json');
const auditLogsFilePath = path.join(__dirname, '../../data/audit_logs.json');

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`[Category] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Category] Error writing ${filePath}:`, err);
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

// Backward-compatible transformation helper
function formatCategoryForConsumer(cat: CategoryRecord, allCats: CategoryRecord[]) {
  const parent = cat.parentId ? allCats.find((c) => c.id === cat.parentId) : null;
  return {
    ...cat,
    parentName: parent ? parent.name : 'Top Level Navigation',
    level: cat.parentId ? 'sub' : 'top',
  };
}

// Sync helper to keep navigation.json in sync with category updates where applicable
function syncCategoryWithNavigation(cat: CategoryRecord, action: 'save' | 'delete') {
  try {
    const nav = navigationStorage.getAll();
    const items = JSON.parse(JSON.stringify(nav.items || []));

    if (action === 'delete') {
      const allDeletedIds = new Set<string>([cat.id, cat.slug]);
      const descendants = categoryRepository.getDescendants(cat.id);
      descendants.forEach((d) => {
        allDeletedIds.add(d.id);
        allDeletedIds.add(d.slug);
      });

      const filtered = items.filter((i: any) => !allDeletedIds.has(i.id) && !allDeletedIds.has(i.slug));
      filtered.forEach((item: any) => {
        item.subGroups = (item.subGroups || []).filter(
          (grp: any) => !allDeletedIds.has(grp.id) && !allDeletedIds.has(grp.slug)
        );
        item.subGroups.forEach((grp: any) => {
          grp.subItems = (grp.subItems || []).filter(
            (sub: any) => !allDeletedIds.has(sub.id) && !allDeletedIds.has(sub.slug)
          );
        });
      });
      navigationStorage.updateAll({ items: filtered });
      return;
    }

    // On save/update, check if item exists in navigation tree and update it
    let found = false;
    for (const item of items) {
      if (item.id === cat.id || item.slug === cat.slug) {
        item.name = cat.name.toUpperCase();
        item.pageTitle = cat.pageTitle || cat.name;
        item.slug = cat.slug;
        item.href = cat.href || item.href;
        item.status = cat.status;
        item.isActive = cat.isActive !== false;
        item.bannerImage = cat.bannerImage;
        item.thumbnailImage = cat.thumbnailImage;
        item.galleryImages = cat.galleryImages || item.galleryImages || [];
        item.assignedProductIds = cat.assignedProductIds || item.assignedProductIds || [];
        item.badge = cat.badge;
        item.description = cat.description;
        item.shortDescription = cat.shortDescription;
        item.detailedDescription = cat.detailedDescription;
        item.seoTitle = cat.seoTitle;
        item.seoDescription = cat.seoDescription;
        item.destinationType = cat.destinationType || item.destinationType;
        item.destinationReference = cat.destinationReference || item.destinationReference;
        if (cat.order !== undefined) item.order = cat.order;
        found = true;
        break;
      }
      for (const grp of item.subGroups || []) {
        if (grp.id === cat.id || grp.slug === cat.slug) {
          grp.title = cat.name;
          grp.slug = cat.slug;
          grp.href = cat.href || grp.href;
          found = true;
          break;
        }
        for (const sub of grp.subItems || []) {
          if (sub.id === cat.id || sub.slug === cat.slug) {
            sub.name = cat.name;
            sub.pageTitle = cat.pageTitle || cat.name;
            sub.slug = cat.slug;
            sub.href = cat.href || sub.href;
            sub.status = cat.status;
            sub.isActive = cat.isActive !== false;
            sub.bannerImage = cat.bannerImage;
            sub.thumbnailImage = cat.thumbnailImage;
            sub.galleryImages = cat.galleryImages || sub.galleryImages || [];
            sub.assignedProductIds = cat.assignedProductIds || sub.assignedProductIds || [];
            sub.badge = cat.badge;
            sub.description = cat.description;
            sub.shortDescription = cat.shortDescription;
            sub.detailedDescription = cat.detailedDescription;
            sub.seoTitle = cat.seoTitle;
            sub.seoDescription = cat.seoDescription;
            sub.destinationType = cat.destinationType || sub.destinationType;
            sub.destinationReference = cat.destinationReference || sub.destinationReference;
            if (cat.order !== undefined) sub.order = cat.order;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      if (!cat.parentId || cat.parentId === 'root' || cat.parentId === 'none') {
        items.push({
          id: cat.id,
          name: cat.name.toUpperCase(),
          pageTitle: cat.pageTitle || cat.name,
          slug: cat.slug,
          href: cat.href || `/shop/${cat.slug}`,
          badge: cat.badge,
          order: cat.order || items.length + 1,
          status: cat.status,
          isActive: cat.isActive !== false,
          description: cat.description,
          shortDescription: cat.shortDescription,
          detailedDescription: cat.detailedDescription,
          bannerImage: cat.bannerImage,
          thumbnailImage: cat.thumbnailImage,
          galleryImages: cat.galleryImages || [],
          assignedProductIds: cat.assignedProductIds || [],
          destinationType: cat.destinationType,
          destinationReference: cat.destinationReference,
          subGroups: [],
        });
        found = true;
      } else {
        let parentNav = items.find((i: any) => i.id === cat.parentId || i.slug === cat.parentId);
        if (!parentNav) {
          const ancestors = categoryRepository.getAncestors(cat.id);
          for (const anc of ancestors) {
            parentNav = items.find((i: any) => i.id === anc.id || i.slug === anc.slug);
            if (parentNav) break;
          }
        }

        if (parentNav) {
          if (!parentNav.subGroups || parentNav.subGroups.length === 0) {
            parentNav.subGroups = [
              {
                id: `grp-${cat.slug}-${Date.now()}`,
                title: 'CATEGORIES',
                slug: cat.slug,
                href: cat.href || `/shop/${cat.slug}`,
                subItems: [],
              },
            ];
          }
          const targetGroup = parentNav.subGroups[0];
          const existingSubIndex = (targetGroup.subItems || []).findIndex(
            (s: any) => s.id === cat.id || s.slug === cat.slug
          );
          const subItemData = {
            id: cat.id,
            name: cat.name,
            pageTitle: cat.pageTitle || cat.name,
            slug: cat.slug,
            href: cat.href || `/shop/${cat.slug}`,
            status: cat.status,
            isActive: cat.isActive !== false,
            parentId: cat.parentId,
            order: cat.order || 1,
            badge: cat.badge,
            description: cat.description,
            shortDescription: cat.shortDescription,
            detailedDescription: cat.detailedDescription,
            bannerImage: cat.bannerImage,
            thumbnailImage: cat.thumbnailImage,
            galleryImages: cat.galleryImages || [],
            assignedProductIds: cat.assignedProductIds || [],
            destinationType: cat.destinationType,
            destinationReference: cat.destinationReference,
          };
          if (existingSubIndex !== -1) {
            targetGroup.subItems[existingSubIndex] = subItemData;
          } else {
            targetGroup.subItems.push(subItemData);
          }
          found = true;
        }
      }
    }

    if (found) {
      navigationStorage.updateAll({ items });
    }
  } catch (err) {
    console.warn('[CategoryController] Warning syncing with navigation:', err);
  }
}

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const all = categoryRepository.getAll();
    const { status, parentId } = req.query;

    let result = all;
    if (status && status !== 'all') {
      result = result.filter((c) => c.status === status);
    }
    if (parentId !== undefined) {
      const targetParent = parentId === 'root' || parentId === 'null' ? null : (parentId as string);
      result = result.filter((c) => c.parentId === targetParent);
    }

    const formatted = result.map((c) => formatCategoryForConsumer(c, all));
    return sendSuccess(res, formatted, 'Categories retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const rootId = (req.query.rootId as string) || null;
    const publishedOnly = req.query.publishedOnly === 'true' || req.query.status === 'published';
    const tree = categoryRepository.getTree(rootId, { publishedOnly });
    return sendSuccess(res, tree, 'Category tree retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCategoryAncestors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const found = categoryRepository.findById(id) || categoryRepository.findBySlug(id);

    if (!found) {
      throw new NotFoundError(`Category with identifier '${id}' not found`);
    }

    const all = categoryRepository.getAll();
    const ancestors = categoryRepository.getAncestors(found.id);
    const formatted = ancestors.map((c) => formatCategoryForConsumer(c, all));

    return sendSuccess(res, formatted, 'Category ancestors retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const all = categoryRepository.getAll();
    const found = categoryRepository.findById(id) || categoryRepository.findBySlug(id);

    if (!found) {
      throw new NotFoundError(`Category with identifier '${id}' not found`);
    }

    const formatted = formatCategoryForConsumer(found, all);
    return sendSuccess(res, formatted, 'Category details retrieved');
  } catch (err) {
    next(err);
  }
};

export const getCategoryDescendants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const found = categoryRepository.findById(id) || categoryRepository.findBySlug(id);

    if (!found) {
      throw new NotFoundError(`Category with identifier '${id}' not found`);
    }

    const all = categoryRepository.getAll();
    const descendants = categoryRepository.getDescendants(found.id);
    const formatted = descendants.map((c) => formatCategoryForConsumer(c, all));

    return sendSuccess(res, formatted, 'Category descendants retrieved');
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      pageTitle,
      slug,
      href,
      parentId,
      badge,
      shortDescription,
      detailedDescription,
      bannerImage,
      thumbnailImage,
      galleryImages,
      assignedProductIds,
      shortcutButtons,
      status,
      seoTitle,
      seoDescription,
      destinationType,
      destinationReference,
      order,
      isActive,
    } = req.body;

    const effectiveStatus = status || 'published';
    const effectiveIsActive = isActive !== undefined ? isActive : effectiveStatus === 'published';

    const created = categoryRepository.create({
      id: req.body.id,
      name,
      pageTitle,
      slug,
      href,
      parentId: parentId === 'none' || parentId === 'null' || !parentId ? null : parentId,
      badge,
      shortDescription,
      description: shortDescription,
      detailedDescription,
      bannerImage,
      thumbnailImage,
      galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
      assignedProductIds: Array.isArray(assignedProductIds) ? assignedProductIds : [],
      shortcutButtons: Array.isArray(shortcutButtons) ? shortcutButtons : [],
      status: effectiveStatus,
      seoTitle,
      seoDescription,
      destinationType,
      destinationReference,
      order: order !== undefined ? Number(order) : 99,
      isActive: effectiveIsActive,
    });

    syncCategoryWithNavigation(created, 'save');
    recordAudit('CATEGORY_CREATE', `Created canonical category "${created.name}" (${created.slug})`);

    const all = categoryRepository.getAll();
    return sendSuccess(res, formatCategoryForConsumer(created, all), 'Category created successfully', 201);
  } catch (err: any) {
    if (err instanceof CategoryValidationError) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = categoryRepository.findById(id) || categoryRepository.findBySlug(id);

    if (!existing) {
      throw new NotFoundError(`Category with identifier '${id}' not found`);
    }

    const {
      name,
      pageTitle,
      slug,
      href,
      parentId,
      badge,
      shortDescription,
      detailedDescription,
      bannerImage,
      thumbnailImage,
      galleryImages,
      assignedProductIds,
      shortcutButtons,
      status,
      seoTitle,
      seoDescription,
      destinationType,
      destinationReference,
      order,
      isActive,
    } = req.body;

    const normalizedParentId =
      parentId === 'none' || parentId === 'null' ? null : parentId !== undefined ? parentId : existing.parentId;

    const effectiveStatus = status !== undefined ? status : existing.status;
    const effectiveIsActive = isActive !== undefined ? isActive : status !== undefined ? status === 'published' : existing.isActive;

    const updated = categoryRepository.update(existing.id, {
      name,
      pageTitle,
      slug,
      href,
      parentId: normalizedParentId,
      badge,
      shortDescription,
      description: shortDescription,
      detailedDescription,
      bannerImage,
      thumbnailImage,
      galleryImages: galleryImages !== undefined ? galleryImages : existing.galleryImages,
      assignedProductIds: assignedProductIds !== undefined ? assignedProductIds : existing.assignedProductIds,
      shortcutButtons: shortcutButtons !== undefined ? shortcutButtons : existing.shortcutButtons,
      status: effectiveStatus,
      seoTitle,
      seoDescription,
      destinationType: destinationType !== undefined ? destinationType : existing.destinationType,
      destinationReference: destinationReference !== undefined ? destinationReference : existing.destinationReference,
      order: order !== undefined ? Number(order) : existing.order,
      isActive: effectiveIsActive,
    });

    syncCategoryWithNavigation(updated, 'save');
    recordAudit('CATEGORY_UPDATE', `Updated category "${updated.name}" (${updated.id})`);

    const all = categoryRepository.getAll();
    return sendSuccess(res, formatCategoryForConsumer(updated, all), 'Changes saved successfully.');
  } catch (err: any) {
    if (err instanceof CategoryValidationError) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

export const updateCategoryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = categoryRepository.findById(id) || categoryRepository.findBySlug(id);
    if (!existing) {
      throw new NotFoundError(`Category with identifier '${id}' not found`);
    }

    const updated = categoryRepository.update(existing.id, {
      status,
      isActive: status === 'published',
    });

    syncCategoryWithNavigation(updated, 'save');
    recordAudit('CATEGORY_STATUS_CHANGE', `Updated category status ${id} to ${status}`);

    return sendSuccess(res, { id: updated.id, status: updated.status }, `Category publication status updated to ${status}.`);
  } catch (err: any) {
    if (err instanceof CategoryValidationError) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true' || req.body?.force === true;
    const reassignTargetId = req.query.reassignTargetId || req.body?.reassignTargetId;

    const targetCat = categoryRepository.findById(id) || categoryRepository.findBySlug(id);
    if (!targetCat) {
      throw new NotFoundError(`Category with identifier '${id}' not found`);
    }

    // 1. SAFE DELETION: Check products using this category
    const products = readJson<any[]>(productsFilePath, []);
    const matchingProducts = products.filter((p) => {
      const pCatId = p.category?.id;
      const pCatSlug = p.category?.slug?.toLowerCase();
      const pSubId = p.subcategory?.id;
      const pSubSlug = p.subcategory?.slug?.toLowerCase();
      const targetSlug = targetCat.slug.toLowerCase();

      return (
        pCatId === targetCat.id ||
        pCatSlug === targetSlug ||
        pSubId === targetCat.id ||
        pSubSlug === targetSlug ||
        (targetCat.assignedProductIds && targetCat.assignedProductIds.includes(p.id))
      );
    });

    if (matchingProducts.length > 0 && !force && !reassignTargetId) {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        message: `This category contains ${matchingProducts.length} product${
          matchingProducts.length > 1 ? 's' : ''
        }. Choose whether to reassign those products before deleting the category.`,
        productCount: matchingProducts.length,
        categoryName: targetCat.name,
      });
    }

    // 2. SAFE DELETION: Check descendants
    const descendants = categoryRepository.getDescendants(targetCat.id);
    if (descendants.length > 0 && !force && !reassignTargetId) {
      return res.status(409).json({
        success: false,
        requiresConfirmation: true,
        hasDescendants: true,
        message: `This category has ${descendants.length} descendant subcategor${
          descendants.length > 1 ? 'ies' : 'y'
        }. Choose whether to reassign or delete them with the parent.`,
        descendantCount: descendants.length,
        categoryName: targetCat.name,
      });
    }

    // Reassign or safely unassign products
    if (matchingProducts.length > 0) {
      if (reassignTargetId && reassignTargetId !== 'none') {
        const targetReassignCat = categoryRepository.findById(reassignTargetId) || categoryRepository.findBySlug(reassignTargetId);
        if (targetReassignCat) {
          matchingProducts.forEach((p) => {
            const isMainMatch = p.category?.id === targetCat.id || p.category?.slug?.toLowerCase() === targetCat.slug.toLowerCase();
            const isSubMatch = p.subcategory?.id === targetCat.id || p.subcategory?.slug?.toLowerCase() === targetCat.slug.toLowerCase();
            if (isMainMatch) {
              p.category = {
                id: targetReassignCat.id,
                name: targetReassignCat.name,
                slug: targetReassignCat.slug,
              };
            }
            if (isSubMatch) {
              p.subcategory = undefined;
            }
          });
          writeJson(productsFilePath, products);
          recordAudit('CATEGORY_REASSIGN', `Reassigned ${matchingProducts.length} products to "${targetReassignCat.name}"`);
        }
      } else {
        // User selected keep in general catalog (No category) -> safely clear deleted category reference without deleting products
        matchingProducts.forEach((p) => {
          const isMainMatch = p.category?.id === targetCat.id || p.category?.slug?.toLowerCase() === targetCat.slug.toLowerCase();
          const isSubMatch = p.subcategory?.id === targetCat.id || p.subcategory?.slug?.toLowerCase() === targetCat.slug.toLowerCase();
          if (isMainMatch) {
            p.category = undefined;
          }
          if (isSubMatch) {
            p.subcategory = undefined;
          }
        });
        writeJson(productsFilePath, products);
        recordAudit('CATEGORY_UNASSIGN', `Safely retained ${matchingProducts.length} products in general catalog`);
      }
    }

    // Perform deletion in category repository
    const delResult = categoryRepository.delete(targetCat.id, {
      force,
      reassignTargetId: reassignTargetId === 'none' ? undefined : reassignTargetId,
    });

    // Sync with navigation
    syncCategoryWithNavigation(targetCat, 'delete');
    recordAudit('CATEGORY_DELETE', `Permanently deleted category "${targetCat.name}" (${targetCat.id})`);

    return sendSuccess(res, delResult, 'The item has been permanently deleted.');
  } catch (err: any) {
    if (err instanceof CategoryValidationError) {
      return sendError(res, err.message, err.statusCode);
    }
    next(err);
  }
};
