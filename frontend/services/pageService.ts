import { fetchApi } from './api';

export interface WebsitePageData {
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

export type PageItem = WebsitePageData;

export const pageService = {
  async getPages(status?: string): Promise<WebsitePageData[]> {
    const qs = status ? `?status=${status}` : '';
    return fetchApi<WebsitePageData[]>(`/pages${qs}`);
  },

  async getPageBySlug(slug: string): Promise<WebsitePageData> {
    return fetchApi<WebsitePageData>(`/pages/${slug}`);
  },

  async createPage(payload: Partial<WebsitePageData>): Promise<WebsitePageData> {
    return fetchApi<WebsitePageData>('/pages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePage(id: string, payload: Partial<WebsitePageData>): Promise<WebsitePageData> {
    return fetchApi<WebsitePageData>(`/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updatePageStatus(id: string, status: 'published' | 'draft'): Promise<WebsitePageData> {
    return fetchApi<WebsitePageData>(`/pages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deletePage(id: string): Promise<{ deleted: boolean; id: string }> {
    return fetchApi<{ deleted: boolean; id: string }>(`/pages/${id}`, {
      method: 'DELETE',
    });
  },
};
