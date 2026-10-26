import { API_BASE_URL } from '../utils/constants';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

export const uploadService = {
  /**
   * Upload an image file from user's machine to persistent storage
   */
  async uploadImage(file: File): Promise<UploadResult> {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (JPEG, PNG, WebP, or SVG)');
    }

    // Validate size (max 8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image size is too large. Maximum allowed size is 8MB.');
    }

    // Convert to base64 data URL
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: base64Data,
          filename: file.name,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Image upload failed on server');
      }

      return json.data;
    } catch (err: any) {
      console.error('[uploadService] Server image upload failed:', err);
      throw new Error(`Failed to upload image to permanent storage: ${err.message || 'Server error'}`);
    }
  },

  /**
   * Upload raw base64 data string (e.g. from Canvas export)
   */
  async uploadBase64(base64Data: string, filename: string): Promise<UploadResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: base64Data,
          filename: filename || `recolor-${Date.now()}.png`,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Base64 image upload failed on server');
      }

      return json.data;
    } catch (err: any) {
      console.error('[uploadService] Server base64 upload failed:', err);
      throw new Error(`Failed to upload image to permanent storage: ${err.message || 'Server error'}`);
    }
  },
};
