import { fetchApi } from './api';

export interface InventoryItemView {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  categoryName: string;
  color?: string;
  size?: string;
  image?: string;
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export interface StockAdjustmentRecord {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variant: string;
  previousQuantity: number;
  newQuantity: number;
  change: number;
  reason: string;
  adjustedBy: string;
  timestamp: string;
}

export const inventoryService = {
  async getInventoryList(params?: { category?: string; stockStatus?: string; search?: string }): Promise<InventoryItemView[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.stockStatus) query.set('stockStatus', params.stockStatus);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<InventoryItemView[]>(`/inventory${qs}`);
  },

  async updateStock(
    variantId: string,
    quantity: number,
    reason?: string,
    adjustedBy?: string
  ): Promise<InventoryItemView> {
    return fetchApi<InventoryItemView>('/inventory/stock', {
      method: 'PATCH',
      body: JSON.stringify({ variantId, quantity, reason, adjustedBy }),
    });
  },

  async getAdjustments(): Promise<StockAdjustmentRecord[]> {
    return fetchApi<StockAdjustmentRecord[]>('/inventory/adjustments');
  },
};
