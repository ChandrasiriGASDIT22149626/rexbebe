import { fetchApi } from './api';
import { Product } from '../types/product';

export const productService = {
  async getProducts(params?: Record<string, string>): Promise<Product[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<Product[]>(`/products${query}`);
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return fetchApi<Product>(`/products/${slug}`);
  },

  async getCategories(): Promise<any[]> {
    return fetchApi<any[]>('/categories');
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    return fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return fetchApi<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async duplicateProduct(id: string): Promise<Product> {
    return fetchApi<Product>(`/products/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async deleteProduct(id: string): Promise<{ deleted: boolean; id: string }> {
    return fetchApi<{ deleted: boolean; id: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleBestSeller(id: string): Promise<Product> {
    return fetchApi<Product>(`/products/${id}/toggle-bestseller`, {
      method: 'PATCH',
    });
  },

  async toggleNewArrival(id: string): Promise<Product> {
    return fetchApi<Product>(`/products/${id}/toggle-newarrival`, {
      method: 'PATCH',
    });
  },

  async toggleFeatured(id: string): Promise<Product> {
    return fetchApi<Product>(`/products/${id}/toggle-featured`, {
      method: 'PATCH',
    });
  },

  async updateStatus(id: string, status: 'draft' | 'published' | 'unpublished'): Promise<Product> {
    return fetchApi<Product>(`/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
