import { fetchApi } from './api';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
}

export interface AdminLoginResponse {
  user: AdminUser;
  token: string;
  expiresIn: string;
}

export const authService = {
  /**
   * Dedicated Admin Login
   */
  async adminLogin(credentials: { usernameOrEmail: string; password: string }): Promise<AdminLoginResponse> {
    return fetchApi<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Fetch current authenticated admin user profile
   */
  async getAdminMe(token?: string): Promise<{ user: AdminUser }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchApi<{ user: AdminUser }>('/auth/admin/me', { headers });
  },

  /**
   * Terminate current administrative session
   */
  async adminLogout(token?: string): Promise<{ loggedOut: boolean }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchApi<{ loggedOut: boolean }>('/auth/admin/logout', {
      method: 'POST',
      headers,
    });
  },

  /**
   * Customer / Storefront Login
   */
  async login(credentials: { email: string; password: string }) {
    return fetchApi<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getMe(token: string) {
    return fetchApi<{ user: any }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
