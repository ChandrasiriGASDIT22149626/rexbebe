import { fetchApi } from './api';

export interface CategoryItem {
  id: string;
  name: string;
  pageTitle?: string;
  slug: string;
  href: string;
  parentName?: string;
  parentId?: string | null;
  parentGroupId?: string;
  badge?: string;
  shortDescription?: string;
  description?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: any[];
  status: 'published' | 'draft' | 'unpublished' | 'archived';
  isActive: boolean;
  order?: number;
  seoTitle?: string;
  seoDescription?: string;
  level?: 'top' | 'sub';
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryTreeNode extends CategoryItem {
  depth: number;
  children: CategoryTreeNode[];
}

export const categoryService = {
  async getCategories(status?: string): Promise<CategoryItem[]> {
    const qs = status ? `?status=${status}` : '';
    return fetchApi<CategoryItem[]>(`/categories${qs}`);
  },

  async getCategoryTree(rootId?: string, publishedOnly?: boolean): Promise<CategoryTreeNode[]> {
    const params = new URLSearchParams();
    if (rootId) params.set('rootId', rootId);
    if (publishedOnly !== undefined) {
      params.set('publishedOnly', String(publishedOnly));
    }
    params.set('_t', String(Date.now()));
    const qs = `?${params.toString()}`;
    return fetchApi<CategoryTreeNode[]>(`/categories/tree${qs}`, {
      cache: 'no-store',
    });
  },

  async getCategoryDescendants(id: string): Promise<CategoryItem[]> {
    return fetchApi<CategoryItem[]>(`/categories/${id}/descendants`);
  },

  async getCategoryAncestors(id: string): Promise<CategoryItem[]> {
    return fetchApi<CategoryItem[]>(`/categories/${id}/ancestors`);
  },

  async getCategoryById(id: string): Promise<CategoryItem> {
    return fetchApi<CategoryItem>(`/categories/${id}`);
  },

  async createCategory(payload: Partial<CategoryItem>): Promise<CategoryItem> {
    return fetchApi<CategoryItem>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(id: string, payload: Partial<CategoryItem>): Promise<CategoryItem> {
    return fetchApi<CategoryItem>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateCategoryStatus(id: string, status: string): Promise<{ id: string; status: string }> {
    return fetchApi<{ id: string; status: string }>(`/categories/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteCategory(
    id: string,
    arg2?: boolean | string,
    arg3?: string | boolean
  ): Promise<{ deleted: boolean; id: string }> {
    let force = false;
    let reassignTargetId: string | undefined;

    if (typeof arg2 === 'boolean') {
      force = arg2;
      if (typeof arg3 === 'string') reassignTargetId = arg3;
    } else if (typeof arg2 === 'string') {
      reassignTargetId = arg2;
      if (typeof arg3 === 'boolean') force = arg3;
    }

    const params = new URLSearchParams();
    if (reassignTargetId && reassignTargetId !== 'none') params.set('reassignTargetId', reassignTargetId);
    if (force) params.set('force', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';

    return fetchApi<{ deleted: boolean; id: string }>(`/categories/${id}${qs}`, {
      method: 'DELETE',
    });
  },
};
