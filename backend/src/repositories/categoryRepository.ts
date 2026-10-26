import fs from 'fs';
import path from 'path';

export type CategoryStatus = 'published' | 'draft' | 'unpublished' | 'archived';

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  status: CategoryStatus;
  isActive: boolean;
  pageTitle?: string;
  href?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: any[];
  badge?: string;
  seoTitle?: string;
  seoDescription?: string;
  destinationType?: string;
  destinationReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends CategoryRecord {
  children: CategoryTreeNode[];
  depth: number;
}

export interface CreateCategoryInput {
  id?: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  order?: number;
  status?: CategoryStatus;
  isActive?: boolean;
  pageTitle?: string;
  href?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: any[];
  badge?: string;
  seoTitle?: string;
  seoDescription?: string;
  destinationType?: string;
  destinationReference?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  order?: number;
  status?: CategoryStatus;
  isActive?: boolean;
  pageTitle?: string;
  href?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: any[];
  badge?: string;
  seoTitle?: string;
  seoDescription?: string;
  destinationType?: string;
  destinationReference?: string;
}

export class CategoryValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CategoryValidationError';
    this.statusCode = statusCode;
  }
}

export class CategoryRepository {
  private static instance: CategoryRepository;
  private filePath: string;
  private navFilePath: string;
  private categories: CategoryRecord[] = [];

  constructor() {
    this.filePath = path.resolve(__dirname, '../../data/categories.json');
    this.navFilePath = path.resolve(__dirname, '../../data/navigation.json');
    this.init();
  }

  public static getInstance(): CategoryRepository {
    if (!CategoryRepository.instance) {
      CategoryRepository.instance = new CategoryRepository();
    }
    return CategoryRepository.instance;
  }

  private init(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.categories = parsed.filter(
            (c: any) =>
              c.name !== 'CATEGORIES' &&
              c.id !== 'grp-krish-boxer-1792335408509' &&
              c.id !== 'grp-0-6-months-1792557187552' &&
              c.id !== 'grp-12-18-months-1792557309870'
          );
          const kb = this.categories.find((c) => c.slug === 'krish-boxer' || c.id === 'cat-1792335408478-ks6kfi');
          if (kb) {
            kb.href = '/shop/krish-boxer';
            if (!kb.assignedProductIds) kb.assignedProductIds = [];
            ['prod-1792343149980', 'prod-1792338599637'].forEach((pid) => {
              if (!kb.assignedProductIds!.includes(pid)) kb.assignedProductIds!.push(pid);
            });
          }
          this.migrateFromNavigation();
          this.ensureUniqueSlugs();
          this.saveToDisk();
          return;
        }
      } catch (err) {
        console.error('[CategoryRepository] Error reading categories.json:', err);
      }
    }

    // If categories.json doesn't exist, migrate idempotently from navigation.json
    this.migrateFromNavigation();
    this.ensureUniqueSlugs();
  }

  public ensureUniqueSlugs(): boolean {
    const seenSlugs = new Map<string, string>(); // slug -> categoryId
    let changed = false;

    for (const cat of this.categories) {
      const lowerSlug = (cat.slug || '').toLowerCase();
      if (lowerSlug && !seenSlugs.has(lowerSlug)) {
        seenSlugs.set(lowerSlug, cat.id);
      } else {
        // Disambiguate duplicate slug
        let disambiguated = lowerSlug || `cat-${cat.id}`;
        if (cat.parentId) {
          const parent = this.categories.find((c) => c.id === cat.parentId);
          if (parent && parent.slug) {
            disambiguated = `${parent.slug.toLowerCase()}-${lowerSlug}`;
          }
        }
        let counter = 2;
        let candidate = disambiguated;
        while (seenSlugs.has(candidate) || this.categories.some((c) => c.id !== cat.id && (c.slug || '').toLowerCase() === candidate)) {
          candidate = `${disambiguated}-${counter++}`;
        }
        cat.slug = candidate;
        seenSlugs.set(candidate, cat.id);
        changed = true;
      }
    }

    if (changed) {
      this.saveToDisk();
    }
    return changed;
  }

  public migrateFromNavigation(): { importedCount: number } {
    if (!fs.existsSync(this.navFilePath)) {
      this.categories = [];
      this.saveToDisk();
      return { importedCount: 0 };
    }

    try {
      const rawNav = fs.readFileSync(this.navFilePath, 'utf-8');
      const navData = JSON.parse(rawNav);
      const items = Array.isArray(navData.items) ? navData.items : [];

      const existingMap = new Map<string, CategoryRecord>(this.categories.map((c) => [c.id, c]));
      const now = new Date().toISOString();
      let count = 0;

      for (const item of items) {
        // Skip pure home links if not representing a catalog category
        if (item.id === 'nav-home' && item.href === '/' && !item.subGroups?.length) {
          continue;
        }

        const topSlug = item.slug || item.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${item.id}`;
        if (!existingMap.has(item.id)) {
          const topCat: CategoryRecord = {
            id: item.id,
            name: item.name,
            slug: topSlug,
            parentId: null,
            order: item.order || 99,
            status: (item.status as CategoryStatus) || (item.isActive ? 'published' : 'draft'),
            isActive: item.isActive !== false,
            pageTitle: item.pageTitle || item.name,
            href: item.href || `/shop/${topSlug}`,
            description: item.description || item.shortDescription,
            shortDescription: item.shortDescription || item.description,
            detailedDescription: item.detailedDescription,
            bannerImage: item.bannerImage,
            thumbnailImage: item.thumbnailImage,
            galleryImages: item.galleryImages || [],
            assignedProductIds: item.assignedProductIds || [],
            shortcutButtons: item.shortcutButtons || [],
            badge: item.badge,
            seoTitle: item.seoTitle,
            seoDescription: item.seoDescription,
            destinationType: item.destinationType,
            destinationReference: item.destinationReference,
            createdAt: now,
            updatedAt: now,
          };
          existingMap.set(item.id, topCat);
          count++;
        }

        // Subgroups (Level 2)
        for (const grp of item.subGroups || []) {
          if (
            grp.title?.toUpperCase() === 'CATEGORIES' ||
            grp.id?.includes('grp-krish') ||
            grp.id?.includes('grp-0-6-months') ||
            grp.id?.includes('grp-12-18-months') ||
            grp.id?.includes('grp-toddler') ||
            grp.id?.includes('grp-baby') ||
            grp.title?.toUpperCase().includes('COLLECTION') ||
            grp.title?.toUpperCase().includes('SIZES') ||
            grp.subItems?.some((s: any) => s.name?.toLowerCase() === grp.title?.toLowerCase())
          ) {
            continue;
          }
          const grpSlug = grp.slug || grp.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `grp-${grp.id}`;
          if (!existingMap.has(grp.id)) {
            const grpCat: CategoryRecord = {
              id: grp.id,
              name: grp.title,
              slug: grpSlug,
              parentId: item.id,
              order: grp.order || 99,
              status: 'published',
              isActive: true,
              pageTitle: grp.title,
              href: grp.href || `/shop/${grpSlug}`,
              description: grp.description,
              shortDescription: grp.description,
              destinationType: grp.destinationType,
              createdAt: now,
              updatedAt: now,
            };
            existingMap.set(grp.id, grpCat);
            count++;
          }

          // Subitems (Level 3)
          for (const sub of grp.subItems || []) {
            const subSlug = sub.slug || sub.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `sub-${sub.id}`;
            if (!existingMap.has(sub.id)) {
              const subCat: CategoryRecord = {
                id: sub.id,
                name: sub.name,
                slug: subSlug,
                parentId: sub.parentId || (grp.id?.startsWith('grp-') ? item.id : grp.id),
                order: sub.order || 99,
                status: (sub.status as CategoryStatus) || (sub.isActive !== false ? 'published' : 'draft'),
                isActive: sub.isActive !== false,
                pageTitle: sub.pageTitle || sub.name,
                href: sub.href || `/shop/${subSlug}`,
                description: sub.description || sub.shortDescription,
                shortDescription: sub.shortDescription || sub.description,
                detailedDescription: sub.detailedDescription,
                bannerImage: sub.bannerImage,
                thumbnailImage: sub.thumbnailImage,
                galleryImages: sub.galleryImages || [],
                assignedProductIds: sub.assignedProductIds || [],
                shortcutButtons: sub.shortcutButtons || [],
                badge: sub.badge,
                seoTitle: sub.seoTitle,
                seoDescription: sub.seoDescription,
                destinationType: sub.destinationType,
                destinationReference: sub.destinationReference,
                createdAt: now,
                updatedAt: now,
              };
              existingMap.set(sub.id, subCat);
              count++;
            }
          }
        }
      }

      this.categories = Array.from(existingMap.values());
      this.saveToDisk();
      return { importedCount: count };
    } catch (err) {
      console.error('[CategoryRepository] Failed to migrate navigation.json:', err);
      return { importedCount: 0 };
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.categories, null, 2), 'utf-8');

      // Also persist to frontend/data/categories.json so both stores remain 100% in sync
      const frontendCatPath = path.resolve(__dirname, '../../../frontend/data/categories.json');
      if (fs.existsSync(path.dirname(frontendCatPath))) {
        fs.writeFileSync(frontendCatPath, JSON.stringify(this.categories, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[CategoryRepository] Failed to write categories.json:', err);
      throw new Error('Failed to persist category data to disk');
    }
  }

  // VALIDATION RULES
  public validateCategory(
    data: CreateCategoryInput | UpdateCategoryInput,
    currentId?: string
  ): void {
    // 1. Missing name check
    if (data.name !== undefined && (!data.name || !data.name.trim())) {
      throw new CategoryValidationError('Category name is required', 400);
    }

    // 2. Slug check
    if (data.slug !== undefined) {
      if (!data.slug || !data.slug.trim()) {
        throw new CategoryValidationError('Slug cannot be empty', 400);
      }
      const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugPattern.test(data.slug)) {
        throw new CategoryValidationError(
          `Invalid slug format: "${data.slug}". Slugs must contain only lowercase alphanumeric characters and single hyphens.`,
          400
        );
      }
      // Conflicting slug check
      const duplicateSlug = this.categories.find(
        (c) => c.slug.toLowerCase() === data.slug!.toLowerCase() && c.id !== currentId
      );
      if (duplicateSlug) {
        throw new CategoryValidationError(
          `Category slug "${data.slug}" is already in use by category "${duplicateSlug.name}" (${duplicateSlug.id})`,
          409
        );
      }
    }

    // 3. Status check
    if (data.status !== undefined) {
      const validStatuses: CategoryStatus[] = ['published', 'draft', 'unpublished', 'archived'];
      if (!validStatuses.includes(data.status)) {
        throw new CategoryValidationError(
          `Invalid status: "${data.status}". Must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }
    }

    // 4. Parent ID checks
    if (data.parentId !== undefined && data.parentId !== null && data.parentId !== '') {
      if (['root', 'none', 'null', 'nav-home', 'nav-about', 'nav-contact'].includes(data.parentId)) {
        data.parentId = null;
      } else {
        // Self-parenting check
        if (currentId && data.parentId === currentId) {
          throw new CategoryValidationError('A category cannot be its own parent (self-parenting is invalid)', 400);
        }

        // Parent exists check (by ID or slug)
        const parent = this.categories.find((c) => c.id === data.parentId || c.slug === data.parentId);
        if (!parent) {
          throw new CategoryValidationError(`Parent category with ID "${data.parentId}" does not exist`, 404);
        }
        data.parentId = parent.id;

      // Circular hierarchy check
      if (currentId) {
        let ancestorId: string | null = parent.parentId;
        const visited = new Set<string>([currentId, parent.id]);
        while (ancestorId) {
          if (ancestorId === currentId) {
            throw new CategoryValidationError(
              `Circular parent relationship detected: category "${currentId}" is an ancestor of "${data.parentId}"`,
              400
            );
          }
          if (visited.has(ancestorId)) {
            throw new CategoryValidationError('Circular loop detected in existing category ancestors', 400);
          }
          visited.add(ancestorId);
          const ancestor = this.categories.find((c) => c.id === ancestorId);
          ancestorId = ancestor?.parentId || null;
        }
      }
    }
  }
  }

  public reloadFromDisk(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.categories = parsed.filter(
            (c: any) =>
              c.name !== 'CATEGORIES' &&
              c.id !== 'grp-krish-boxer-1792335408509' &&
              c.id !== 'grp-0-6-months-1792557187552' &&
              c.id !== 'grp-12-18-months-1792557309870'
          );
        }
      } catch (err) {
        console.error('[CategoryRepository] Error reading categories.json:', err);
      }
    }
  }

  // QUERY METHODS
  public getAll(): CategoryRecord[] {
    this.reloadFromDisk();
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  public findById(id: string): CategoryRecord | null {
    this.reloadFromDisk();
    return this.categories.find((c) => c.id === id) || null;
  }

  public findBySlug(slug: string): CategoryRecord | null {
    this.reloadFromDisk();
    const s = slug.toLowerCase();
    return this.categories.find((c) => c.slug.toLowerCase() === s) || null;
  }

  public getChildren(parentId: string | null): CategoryRecord[] {
    this.reloadFromDisk();
    const isRoot = !parentId || parentId === 'root' || parentId === 'none';
    return this.categories
      .filter((c) => (isRoot ? !c.parentId || c.parentId === 'root' || c.parentId === 'none' : c.parentId === parentId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getDescendants(id: string): CategoryRecord[] {
    const descendants: CategoryRecord[] = [];
    const queue = [id];

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;
      const children = this.categories.filter((c) => c.parentId === currentParentId);
      for (const child of children) {
        descendants.push(child);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  public getAncestors(id: string): CategoryRecord[] {
    const ancestors: CategoryRecord[] = [];
    let current = this.findById(id);

    while (current && current.parentId) {
      const parent = this.findById(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }

  public getTree(rootId: string | null = null, options?: { publishedOnly?: boolean }): CategoryTreeNode[] {
    const publishedOnly = options?.publishedOnly ?? false;
    const isCategoryVisible = (cat: CategoryRecord) => {
      if (!publishedOnly) return true;
      return cat.status === 'published' && cat.isActive !== false;
    };

    const buildSubtree = (parentId: string | null, depth: number): CategoryTreeNode[] => {
      let children = this.getChildren(parentId);
      if (publishedOnly) {
        children = children.filter(isCategoryVisible);
      }
      return children.map((cat) => ({
        ...cat,
        depth,
        children: buildSubtree(cat.id, depth + 1),
      }));
    };

    if (rootId) {
      const rootCat = this.findById(rootId);
      if (!rootCat || !isCategoryVisible(rootCat)) return [];
      return [
        {
          ...rootCat,
          depth: 0,
          children: buildSubtree(rootCat.id, 1),
        },
      ];
    }

    return buildSubtree(null, 0);
  }

  // MUTATION METHODS
  public create(input: CreateCategoryInput): CategoryRecord {
    const finalSlug = (input.slug || input.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Reuse and repair existing record if slug or ID already exists
    const existing = (input.id && this.findById(input.id)) || this.findBySlug(finalSlug);
    if (existing) {
      const normalizedUpdates: UpdateCategoryInput = {
        ...input,
        slug: finalSlug,
        parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
        status: input.status || 'published',
        isActive: input.isActive !== undefined ? input.isActive : true,
      };
      return this.update(existing.id, normalizedUpdates);
    }

    const id = input.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Duplicate ID check
    if (this.categories.some((c) => c.id === id)) {
      throw new CategoryValidationError(`Category with ID "${id}" already exists`, 409);
    }

    const normalizedInput = {
      ...input,
      slug: finalSlug,
      parentId: input.parentId || null,
      status: input.status || 'published',
      order: input.order !== undefined ? input.order : 99,
      isActive: input.isActive !== undefined ? input.isActive : (input.status || 'published') === 'published',
    };

    this.validateCategory(normalizedInput);

    const now = new Date().toISOString();
    const newCategory: CategoryRecord = {
      id,
      name: input.name.trim(),
      slug: finalSlug,
      parentId: normalizedInput.parentId,
      order: normalizedInput.order,
      status: normalizedInput.status,
      isActive: normalizedInput.isActive,
      pageTitle: input.pageTitle || input.name.trim(),
      href: input.href || `/shop/${finalSlug}`,
      description: input.description || input.shortDescription,
      shortDescription: input.shortDescription || input.description,
      detailedDescription: input.detailedDescription,
      bannerImage: input.bannerImage,
      thumbnailImage: input.thumbnailImage,
      galleryImages: input.galleryImages || [],
      assignedProductIds: input.assignedProductIds || [],
      shortcutButtons: input.shortcutButtons || [],
      badge: input.badge,
      seoTitle: input.seoTitle || `${input.name.trim()} | REXBEBE Luxury Boutique`,
      seoDescription: input.seoDescription || input.shortDescription,
      destinationType: input.destinationType,
      destinationReference: input.destinationReference,
      createdAt: now,
      updatedAt: now,
    };

    this.categories.push(newCategory);
    this.saveToDisk();
    return newCategory;
  }

  public update(id: string, updates: UpdateCategoryInput): CategoryRecord {
    const existing = this.findById(id);
    if (!existing) {
      throw new CategoryValidationError(`Category with ID "${id}" not found`, 404);
    }

    const finalSlug = updates.slug !== undefined
      ? updates.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : existing.slug;

    const normalizedUpdates = {
      ...updates,
      slug: finalSlug,
      parentId: updates.parentId !== undefined ? updates.parentId : existing.parentId,
    };

    this.validateCategory(normalizedUpdates, id);

    const now = new Date().toISOString();
    const updated: CategoryRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      slug: finalSlug,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      parentId: normalizedUpdates.parentId,
      updatedAt: now,
    };

    if (updates.status !== undefined && updates.isActive === undefined) {
      updated.isActive = updates.status === 'published';
    }

    const index = this.categories.findIndex((c) => c.id === id);
    this.categories[index] = updated;
    this.saveToDisk();
    return updated;
  }

  public delete(
    id: string,
    options: { force?: boolean; reassignTargetId?: string } = {}
  ): { deleted: boolean; id: string; affectedDescendantsCount: number } {
    const existing = this.findById(id);
    if (!existing) {
      throw new CategoryValidationError(`Category with ID "${id}" not found`, 404);
    }

    const descendants = this.getDescendants(id);

    if (descendants.length > 0) {
      if (!options.force && !options.reassignTargetId) {
        throw new CategoryValidationError(
          `Cannot delete category "${existing.name}" because it has ${descendants.length} descendant subcategories. Reassign them or use force deletion.`,
          409
        );
      }

      // Reassign descendants to another parent or root
      if (options.reassignTargetId) {
        const targetParent = options.reassignTargetId === 'root' ? null : this.findById(options.reassignTargetId);
        if (options.reassignTargetId !== 'root' && !targetParent) {
          throw new CategoryValidationError(
            `Reassign target category "${options.reassignTargetId}" does not exist`,
            404
          );
        }
        // Move immediate children
        const immediateChildren = this.getChildren(id);
        for (const child of immediateChildren) {
          child.parentId = targetParent ? targetParent.id : null;
          child.updatedAt = new Date().toISOString();
        }
      } else if (options.force) {
        // Cascade delete all descendants
        const descendantIds = new Set(descendants.map((d) => d.id));
        this.categories = this.categories.filter((c) => !descendantIds.has(c.id));
      }
    }

    this.categories = this.categories.filter((c) => c.id !== id);
    this.saveToDisk();

    return {
      deleted: true,
      id,
      affectedDescendantsCount: descendants.length,
    };
  }

  public removeProductReference(productId: string): void {
    let modified = false;
    for (const cat of this.categories) {
      if (Array.isArray(cat.assignedProductIds) && cat.assignedProductIds.includes(productId)) {
        cat.assignedProductIds = cat.assignedProductIds.filter((id) => id !== productId);
        modified = true;
      }
    }
    if (modified) {
      this.saveToDisk();
    }
  }
}

export const categoryRepository = CategoryRepository.getInstance();
