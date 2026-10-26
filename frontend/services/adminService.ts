import { fetchApi } from './api';

export interface DashboardOverviewData {
  performance: {
    totalOrders: number;
    newOrders: number;
    processingOrders: number;
    packedOrders: number;
    shippedOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSales: number;
    salesToday: number;
    salesThisMonth: number;
    currency: string;
  };
  inventory: {
    totalActiveProducts: number;
    draftProducts: number;
    publishedProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    newArrivalsCount: number;
    saleProductsCount: number;
  };
  visitors: {
    totalVisits: number;
    uniqueVisitors: number;
    recentLogs: any[];
  };
  timestamp: string;
}

export interface FeedbackRecord {
  id: string;
  type: 'PRODUCT_REVIEW' | 'WEBSITE_FEEDBACK' | 'CUSTOMER_SUGGESTION' | 'SUPPORT_FEEDBACK';
  authorName: string;
  email: string;
  location?: string;
  rating?: number;
  productId?: string;
  productName?: string;
  subject?: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REVIEWED' | 'HIDDEN';
  isVerifiedBuyer?: boolean;
  internalNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'STORE_MANAGER' | 'CONTENT_MANAGER' | 'CUSTOMER_SUPPORT';
  status: 'ACTIVE' | 'SUSPENDED';
  permissions: string[];
  lastLogin?: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}

export const adminService = {
  async getOverview(): Promise<DashboardOverviewData> {
    return fetchApi<DashboardOverviewData>('/admin/overview');
  },

  async getVisitors(period?: string): Promise<any[]> {
    const qs = period ? `?period=${period}` : '';
    return fetchApi<any[]>(`/admin/analytics/visitors${qs}`);
  },

  async clearVisitors(): Promise<{ cleared: boolean }> {
    return fetchApi<{ cleared: boolean }>('/admin/analytics/visitors', { method: 'DELETE' });
  },

  async getFeedback(params?: { type?: string; status?: string; search?: string }): Promise<FeedbackRecord[]> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<FeedbackRecord[]>(`/admin/feedback${qs}`);
  },

  async updateFeedbackStatus(id: string, status: FeedbackRecord['status']): Promise<FeedbackRecord> {
    return fetchApi<FeedbackRecord>(`/admin/feedback/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addFeedbackNote(id: string, note: string): Promise<FeedbackRecord> {
    return fetchApi<FeedbackRecord>(`/admin/feedback/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async deleteFeedback(id: string): Promise<{ deleted: boolean; id: string }> {
    return fetchApi<{ deleted: boolean; id: string }>(`/admin/feedback/${id}`, {
      method: 'DELETE',
    });
  },

  async getUsers(): Promise<AdminUserRecord[]> {
    return fetchApi<AdminUserRecord[]>('/admin/users');
  },

  async createUser(payload: { name: string; email: string; role: string; permissions?: string[] }): Promise<AdminUserRecord> {
    return fetchApi<AdminUserRecord>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUserStatus(id: string, data: { status?: string; role?: string; permissions?: string[] }): Promise<AdminUserRecord> {
    return fetchApi<AdminUserRecord>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async setupFirstAdmin(payload: { name: string; email: string; password?: string }): Promise<AdminUserRecord> {
    return fetchApi<AdminUserRecord>('/admin/setup-first-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getSettings(): Promise<any> {
    return fetchApi<any>('/admin/settings');
  },

  async updateSettings(settings: any): Promise<any> {
    return fetchApi<any>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async deleteUser(id: string): Promise<{ deleted: boolean; id: string }> {
    return fetchApi<{ deleted: boolean; id: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getHomepage(): Promise<any> {
    return fetchApi<any>('/admin/homepage');
  },

  async updateHomepage(config: any): Promise<any> {
    return fetchApi<any>('/admin/homepage', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async resetHomepage(): Promise<any> {
    return fetchApi<any>('/admin/homepage/reset', {
      method: 'POST',
    });
  },

  async getSeo(): Promise<any> {
    return fetchApi<any>('/admin/seo');
  },

  async updateSeo(seoData: any): Promise<any> {
    return fetchApi<any>('/admin/seo', {
      method: 'PUT',
      body: JSON.stringify(seoData),
    });
  },

  async getAuditLogs(): Promise<AuditLogRecord[]> {
    return fetchApi<AuditLogRecord[]>('/admin/audit-logs');
  },

  async trackVisitor(log: any): Promise<any> {
    return fetchApi<any>('/admin/analytics/track', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
};
