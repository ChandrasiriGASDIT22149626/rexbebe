import { ProductRepository } from '../repositories/productRepository';

export class ProductService {
  private repo = new ProductRepository();

  async getProducts(query?: any) {
    return this.repo.findAll(query);
  }

  async getProductBySlug(slugOrId: string) {
    const found = await this.repo.findBySlug(slugOrId);
    if (found) return found;
    return this.repo.findById(slugOrId);
  }

  async getProductById(id: string) {
    return this.repo.findById(id);
  }

  async createProduct(data: any) {
    return this.repo.create(data);
  }

  async updateProduct(id: string, data: any) {
    return this.repo.update(id, data);
  }

  async duplicateProduct(id: string) {
    return this.repo.duplicate(id);
  }

  async deleteProduct(id: string) {
    return this.repo.delete(id);
  }

  async toggleBestSeller(id: string) {
    return this.repo.toggleBestSeller(id);
  }

  async toggleNewArrival(id: string) {
    return this.repo.toggleNewArrival(id);
  }

  async toggleFeatured(id: string) {
    return this.repo.toggleFeatured(id);
  }

  async updateStatus(id: string, status: 'draft' | 'published' | 'unpublished') {
    return this.repo.updateStatus(id, status);
  }
}
