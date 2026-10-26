import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { navigationStorage } from '../services/navigationStorage';

const router = Router();

// Public: Get published active navigation tree
router.get('/', (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    navigationStorage.syncWithCategoryRecords(categoryRepository.getAll());
    const publicNav = navigationStorage.getPublic();
    return sendSuccess(res, publicNav, 'Public navigation structure retrieved');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

import { categoryRepository } from '../repositories/categoryRepository';

// Admin: Get all navigation items including inactive
router.get('/all', (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    navigationStorage.syncWithCategoryRecords(categoryRepository.getAll());
    const allNav = navigationStorage.getAll();
    return sendSuccess(res, allNav, 'Complete navigation structure retrieved');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

// Admin: Update entire navigation configuration
router.put('/', (req: Request, res: Response) => {
  try {
    const updated = navigationStorage.updateAll(req.body);
    if (req.body && Array.isArray(req.body.items)) {
      for (const item of req.body.items) {
        if (!item.id || item.id === 'nav-home' || item.id === 'nav-about' || item.id === 'nav-contact') continue;
        const existing = categoryRepository.findById(item.id) || (item.slug ? categoryRepository.findBySlug(item.slug) : null);
        if (!existing) {
          try {
            categoryRepository.create({
              id: item.id,
              name: item.name,
              slug: item.slug,
              pageTitle: item.pageTitle || item.name,
              href: item.href,
              parentId: null,
              order: item.order,
              status: item.status || 'published',
              isActive: item.isActive !== false,
              badge: item.badge,
              description: item.description,
              shortDescription: item.shortDescription,
              detailedDescription: item.detailedDescription,
              bannerImage: item.bannerImage,
              thumbnailImage: item.thumbnailImage,
              galleryImages: item.galleryImages,
              assignedProductIds: item.assignedProductIds,
              destinationType: item.destinationType,
              destinationReference: item.destinationReference,
            });
          } catch (e) {
            // Ignore duplicate/conflict errors during reconciliation
          }
        } else {
          try {
            categoryRepository.update(existing.id, {
              name: item.name,
              status: item.status,
              isActive: item.isActive !== false,
              order: item.order,
              badge: item.badge,
              description: item.description,
              shortDescription: item.shortDescription,
              detailedDescription: item.detailedDescription,
              bannerImage: item.bannerImage,
              thumbnailImage: item.thumbnailImage,
              galleryImages: item.galleryImages,
              assignedProductIds: item.assignedProductIds,
              destinationType: item.destinationType,
              destinationReference: item.destinationReference,
            });
          } catch (e) {}
        }

        // Reconcile nested subcategories in subGroups
        for (const grp of item.subGroups || []) {
          for (const sub of grp.subItems || []) {
            if (!sub.id || sub.id === 'nav-home' || sub.id === 'nav-about' || sub.id === 'nav-contact') continue;
            const existingSub = categoryRepository.findById(sub.id) || (sub.slug ? categoryRepository.findBySlug(sub.slug) : null);
            if (!existingSub) {
              try {
                categoryRepository.create({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  pageTitle: sub.pageTitle || sub.name,
                  href: sub.href,
                  parentId: sub.parentId || item.id,
                  order: sub.order,
                  status: sub.status || 'published',
                  isActive: sub.isActive !== false,
                  badge: sub.badge,
                  description: sub.description,
                  shortDescription: sub.shortDescription,
                  detailedDescription: sub.detailedDescription,
                  bannerImage: sub.bannerImage,
                  thumbnailImage: sub.thumbnailImage,
                  galleryImages: sub.galleryImages,
                  assignedProductIds: sub.assignedProductIds,
                  destinationType: sub.destinationType,
                  destinationReference: sub.destinationReference,
                });
              } catch (e) {}
            } else {
              try {
                categoryRepository.update(existingSub.id, {
                  name: sub.name,
                  status: sub.status,
                  isActive: sub.isActive !== false,
                  order: sub.order,
                  badge: sub.badge,
                  description: sub.description,
                  shortDescription: sub.shortDescription,
                  detailedDescription: sub.detailedDescription,
                  bannerImage: sub.bannerImage,
                  thumbnailImage: sub.thumbnailImage,
                  galleryImages: sub.galleryImages,
                  assignedProductIds: sub.assignedProductIds,
                  destinationType: sub.destinationType,
                  destinationReference: sub.destinationReference,
                });
              } catch (e) {}
            }
          }
        }
      }
    }
    return sendSuccess(res, updated, 'Navigation configuration updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 400);
  }
});

// Admin: Reset navigation to brand default
router.post('/reset', (req: Request, res: Response) => {
  try {
    const reset = navigationStorage.reset();
    return sendSuccess(res, reset, 'Navigation reset to default brand configuration');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
});

export default router;
