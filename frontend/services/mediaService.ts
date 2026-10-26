import { fetchApi } from './api';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  category: 'products' | 'banners' | 'general';
  uploadedAt: string;
  isSystem?: boolean;
}

export const mediaService = {
  async getMediaItems(): Promise<MediaItem[]> {
    return fetchApi<MediaItem[]>('/upload');
  },

  async uploadImage(file: File, category: string = 'general'): Promise<{ url: string; filename: string; size: number; id: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const result = await fetchApi<any>('/upload', {
            method: 'POST',
            body: JSON.stringify({
              data: base64Data,
              filename: file.name,
              category,
            }),
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file as base64'));
      reader.readAsDataURL(file);
    });
  },

  async deleteMedia(id: string, force: boolean = false): Promise<{ deleted: boolean; id: string }> {
    const qs = force ? '?force=true' : '';
    return fetchApi<{ deleted: boolean; id: string }>(`/upload/${id}${qs}`, {
      method: 'DELETE',
    });
  },
};
