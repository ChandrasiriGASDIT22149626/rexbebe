import { fetchApi } from './api';

export const customerService = {
  async getProfile() {
    return fetchApi('/customers/me');
  },

  async getMyOrders() {
    return fetchApi('/customers/me/orders');
  },

  async getAllCustomersAdmin() {
    return fetchApi('/customers/admin/all', {
      headers: { 'x-admin-dev': 'true' }
    });
  }
};
