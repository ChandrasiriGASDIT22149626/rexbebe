import { fetchApi } from './api';

export interface CollectionItem {
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

export const collectionService = {
  async getCollections(status?: string): Promise<CollectionItem[]> {
    const qs = status ? `?status=${status}` : '';
    return fetchApi<CollectionItem[]>(`/collections${qs}`);
  },

  async getCollectionById(id: string): Promise<CollectionItem> {
    return fetchApi<CollectionItem>(`/collections/${id}`);
  },

  async createCollection(payload: Partial<CollectionItem>): Promise<CollectionItem> {
    return fetchApi<CollectionItem>('/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCollection(id: string, payload: Partial<CollectionItem>): Promise<CollectionItem> {
    return fetchApi<CollectionItem>(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateCollectionStatus(id: string, status: 'published' | 'draft'): Promise<CollectionItem> {
    return fetchApi<CollectionItem>(`/collections/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteCollection(id: string, force: boolean = false): Promise<{ deleted: boolean; id: string }> {
    const qs = force ? '?force=true' : '';
    return fetchApi<{ deleted: boolean; id: string }>(`/collections/${id}${qs}`, {
      method: 'DELETE',
    });
  },
};
