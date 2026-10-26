import { InventoryRepository } from '../repositories/inventoryRepository';

export class InventoryService {
  private repo = new InventoryRepository();

  async getInventoryList() {
    return this.repo.findAll();
  }

  async updateStock(variantId: string, quantity: number, reason?: string, adjustedBy?: string) {
    return this.repo.updateStock(variantId, quantity, reason, adjustedBy);
  }

  async getAdjustments() {
    return this.repo.getAdjustments();
  }
}
