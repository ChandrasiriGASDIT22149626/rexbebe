import fs from 'fs';
import path from 'path';
import { ProductRepository } from './productRepository';

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

export class InventoryRepository {
  private productRepo = new ProductRepository();
  private adjustmentsFilePath = path.join(__dirname, '../../data/stock_adjustments.json');

  private readAdjustments(): StockAdjustmentRecord[] {
    try {
      if (fs.existsSync(this.adjustmentsFilePath)) {
        return JSON.parse(fs.readFileSync(this.adjustmentsFilePath, 'utf-8'));
      }
    } catch (err) {
      console.error('[InventoryRepository] Error reading adjustments:', err);
    }
    return [];
  }

  private writeAdjustments(logs: StockAdjustmentRecord[]): void {
    try {
      const dir = path.dirname(this.adjustmentsFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.adjustmentsFilePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (err) {
      console.error('[InventoryRepository] Error writing adjustments:', err);
    }
  }

  async findAll(): Promise<InventoryItemView[]> {
    const products = await this.productRepo.findAll();
    const items: InventoryItemView[] = [];

    for (const prod of products) {
      const threshold = prod.lowStockThreshold || 5;
      const mainImg = prod.images?.[0]?.url || '/images/products/organic-onesie.jpg';

      if (prod.variants && prod.variants.length > 0) {
        for (const v of prod.variants) {
          const qty = v.stockQuantity ?? prod.stockQuantity ?? 0;
          let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
          if (qty <= 0) status = 'OUT_OF_STOCK';
          else if (qty <= threshold) status = 'LOW_STOCK';

          items.push({
            productId: prod.id,
            variantId: v.id,
            sku: v.sku || prod.sku || `SKU-${v.id}`,
            productName: prod.name,
            categoryName: prod.category?.name || 'Baby Collection',
            color: v.color || (prod.colors?.[0]?.name),
            size: v.size || (prod.sizes?.[0]),
            image: mainImg,
            quantity: qty,
            reserved: 1,
            lowStockThreshold: threshold,
            stockStatus: status,
            updatedAt: (prod as any).updatedAt || new Date().toISOString(),
          });
        }
      } else {
        const qty = prod.stockQuantity ?? 0;
        let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
        if (qty <= 0) status = 'OUT_OF_STOCK';
        else if (qty <= threshold) status = 'LOW_STOCK';

        items.push({
          productId: prod.id,
          variantId: `var-${prod.id}`,
          sku: prod.sku || `SKU-${prod.id}`,
          productName: prod.name,
          categoryName: prod.category?.name || 'Baby Collection',
          image: mainImg,
          quantity: qty,
          reserved: 0,
          lowStockThreshold: threshold,
          stockStatus: status,
          updatedAt: (prod as any).updatedAt || new Date().toISOString(),
        });
      }
    }

    return items;
  }

  async updateStock(
    variantId: string,
    quantity: number,
    reason: string = 'Manual stock adjustment',
    adjustedBy: string = 'admin@rexbebe.com'
  ): Promise<InventoryItemView | null> {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative.');
    }

    const products = await this.productRepo.findAll();
    let foundProduct: any = null;
    let foundVariant: any = null;
    let prevQty = 0;

    for (const prod of products) {
      if (prod.variants) {
        const v = prod.variants.find((v: any) => v.id === variantId);
        if (v) {
          foundProduct = prod;
          foundVariant = v;
          prevQty = v.stockQuantity ?? 0;
          v.stockQuantity = quantity;
          if (foundProduct.variants && foundProduct.variants.length > 0) {
            foundProduct.stockQuantity = foundProduct.variants.reduce((sum: number, item: any) => sum + (item.stockQuantity || 0), 0);
            const totalQty = foundProduct.stockQuantity;
            const threshold = foundProduct.lowStockThreshold || 5;
            if (totalQty <= 0) foundProduct.stockStatus = 'out_of_stock';
            else if (totalQty <= threshold) foundProduct.stockStatus = 'low_stock';
            else foundProduct.stockStatus = 'in_stock';
          }
          break;
        }
      }
      if (prod.id === variantId || `var-${prod.id}` === variantId) {
        foundProduct = prod;
        prevQty = prod.stockQuantity ?? 0;
        prod.stockQuantity = quantity;
        const threshold = prod.lowStockThreshold || 5;
        if (quantity <= 0) prod.stockStatus = 'out_of_stock';
        else if (quantity <= threshold) prod.stockStatus = 'low_stock';
        else prod.stockStatus = 'in_stock';
        break;
      }
    }

    if (!foundProduct) return null;

    // Persist to products.json
    foundProduct.updatedAt = new Date().toISOString();
    await this.productRepo.update(foundProduct.id, foundProduct);

    // Record adjustment log
    const change = quantity - prevQty;
    const adjustments = this.readAdjustments();
    adjustments.unshift({
      id: `adj-${Date.now()}`,
      productId: foundProduct.id,
      productName: foundProduct.name,
      sku: foundVariant?.sku || foundProduct.sku || 'N/A',
      variant: foundVariant ? `${foundVariant.color || ''} ${foundVariant.size || ''}`.trim() : 'Standard',
      previousQuantity: prevQty,
      newQuantity: quantity,
      change,
      reason,
      adjustedBy,
      timestamp: new Date().toISOString(),
    });
    this.writeAdjustments(adjustments);

    const threshold = foundProduct.lowStockThreshold || 5;
    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (quantity <= 0) status = 'OUT_OF_STOCK';
    else if (quantity <= threshold) status = 'LOW_STOCK';

    return {
      productId: foundProduct.id,
      variantId,
      sku: foundVariant?.sku || foundProduct.sku || 'N/A',
      productName: foundProduct.name,
      categoryName: foundProduct.category?.name || 'Baby Collection',
      color: foundVariant?.color,
      size: foundVariant?.size,
      image: foundProduct.images?.[0]?.url,
      quantity,
      reserved: 0,
      lowStockThreshold: threshold,
      stockStatus: status,
      updatedAt: foundProduct.updatedAt,
    };
  }

  async getAdjustments(): Promise<StockAdjustmentRecord[]> {
    return this.readAdjustments();
  }
}
