import fs from 'fs';
import path from 'path';
import { ProductRepository, ProductRecord, ProductVariant } from '../repositories/productRepository';
import { postgresCartRepository } from '../repositories/postgres/PostgresCartRepository';

export interface CartItemRecord {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  imageUrl: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  partName?: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  isAvailable: boolean;
  subtotal: number;
}

export interface CartSession {
  id: string;
  items: CartItemRecord[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  updatedAt: string;
}

const STORAGE_PATH = path.resolve(__dirname, '../../data/carts.json');

export class CartService {
  private productRepo = new ProductRepository();

  public isPostgresMode(): boolean {
    return process.env.USE_POSTGRES === 'true';
  }

  private loadCartsFromDisk(): Record<string, { id: string; items: { variantId: string; quantity: number }[]; updatedAt?: string }> {
    try {
      if (fs.existsSync(STORAGE_PATH)) {
        const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[CartService] Error reading carts.json:', e);
    }
    return {};
  }

  private saveCartsToDisk(carts: Record<string, any>, specificCartId?: string): void {
    try {
      if (this.isPostgresMode() && specificCartId && carts[specificCartId]) {
        postgresCartRepository.saveCart(specificCartId, carts[specificCartId].items || []).catch((err) => {
          console.error('[CartService] Failed to sync cart to PostgreSQL:', err);
        });
      }

      if (process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || process.env.NODE_ENV === 'production') {
        return;
      }

      const dir = path.dirname(STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(carts, null, 2), 'utf-8');
    } catch (e: any) {
      if (e?.code === 'EROFS') return;
      console.warn('[CartService] Error saving carts.json:', e.message);
    }
  }

  /**
   * Enriches raw variant items with authoritative pricing and live stock from ProductRepository
   */
  private async enrichCart(id: string, rawItems: { variantId: string; quantity: number }[]): Promise<CartSession> {
    const enrichedItems: CartItemRecord[] = [];

    for (const raw of rawItems) {
      const match = await this.productRepo.findVariant(raw.variantId);
      if (match) {
        const { product, variant } = match;
        const availableStock = variant.stockQuantity ?? product.stockQuantity ?? 0;
        const validatedQuantity = Math.max(1, Math.min(raw.quantity, Math.max(1, availableStock)));
        const validatedPrice = Number(variant.price || product.price || 0);

        enrichedItems.push({
          variantId: variant.id,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: variant.imageUrl || product.images[0]?.url || '/images/products/organic-onesie.jpg',
          sku: variant.sku || product.sku || 'REX-VAR',
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          partName: variant.partName,
          price: validatedPrice,
          quantity: validatedQuantity,
          stockQuantity: availableStock,
          isAvailable: availableStock > 0 && product.status !== 'draft' && product.status !== 'unpublished',
          subtotal: validatedPrice * validatedQuantity,
        });
      } else {
        // If variant not found by variantId, search if variantId was passed as a productId
        const product = await this.productRepo.findById(raw.variantId);
        if (product) {
          const firstVariant = product.variants?.[0];
          const availableStock = firstVariant?.stockQuantity ?? product.stockQuantity ?? 0;
          const validatedPrice = Number(firstVariant?.price || product.price || 0);
          const validatedQuantity = Math.max(1, Math.min(raw.quantity, Math.max(1, availableStock)));

          enrichedItems.push({
            variantId: firstVariant?.id || `var-${product.id}`,
            productId: product.id,
            name: product.name,
            slug: product.slug,
            imageUrl: product.images[0]?.url || '/images/products/organic-onesie.jpg',
            sku: product.sku || 'REX-PROD',
            size: firstVariant?.size || product.sizes?.[0],
            color: firstVariant?.color || product.colors?.[0]?.name,
            colorHex: firstVariant?.colorHex || product.colors?.[0]?.hex,
            price: validatedPrice,
            quantity: validatedQuantity,
            stockQuantity: availableStock,
            isAvailable: availableStock > 0 && product.status !== 'draft' && product.status !== 'unpublished',
            subtotal: validatedPrice * validatedQuantity,
          });
        }
      }
    }

    const subtotal = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = 0;
    const total = subtotal;
    const itemCount = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id,
      items: enrichedItems,
      itemCount,
      subtotal,
      shippingFee,
      total,
      updatedAt: new Date().toISOString(),
    };
  }

  async getCart(cartId: string): Promise<CartSession> {
    if (this.isPostgresMode()) {
      const dbCart = await postgresCartRepository.getCart(cartId);
      if (dbCart) {
        return this.enrichCart(cartId, dbCart.items);
      }
    }
    const carts = this.loadCartsFromDisk();
    const raw = carts[cartId] || { id: cartId, items: [] };
    return this.enrichCart(cartId, raw.items);
  }

  async addItem(cartId: string, variantId: string, quantity: number = 1): Promise<CartSession> {
    const carts = this.loadCartsFromDisk();
    if (!carts[cartId]) {
      carts[cartId] = { id: cartId, items: [], updatedAt: new Date().toISOString() };
    }

    // Check available stock first
    const match = await this.productRepo.findVariant(variantId);
    let maxStock = 999;
    if (match) {
      maxStock = match.variant.stockQuantity ?? match.product.stockQuantity ?? 999;
    }

    const existing = carts[cartId].items.find((i: any) => i.variantId === variantId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, maxStock);
    } else {
      carts[cartId].items.push({
        variantId,
        quantity: Math.min(quantity, maxStock),
      });
    }

    carts[cartId].updatedAt = new Date().toISOString();
    this.saveCartsToDisk(carts, cartId);

    return this.enrichCart(cartId, carts[cartId].items);
  }

  async updateItemQuantity(cartId: string, variantId: string, quantity: number): Promise<CartSession> {
    const carts = this.loadCartsFromDisk();
    if (!carts[cartId]) {
      carts[cartId] = { id: cartId, items: [], updatedAt: new Date().toISOString() };
    }

    if (quantity <= 0) {
      carts[cartId].items = carts[cartId].items.filter((i: any) => i.variantId !== variantId);
    } else {
      const match = await this.productRepo.findVariant(variantId);
      const maxStock = match ? (match.variant.stockQuantity ?? match.product.stockQuantity ?? 999) : 999;
      const capped = Math.min(quantity, maxStock);

      const existing = carts[cartId].items.find((i: any) => i.variantId === variantId);
      if (existing) {
        existing.quantity = capped;
      } else {
        carts[cartId].items.push({ variantId, quantity: capped });
      }
    }

    carts[cartId].updatedAt = new Date().toISOString();
    this.saveCartsToDisk(carts, cartId);

    return this.enrichCart(cartId, carts[cartId].items);
  }

  async removeItem(cartId: string, variantId: string): Promise<CartSession> {
    const carts = this.loadCartsFromDisk();
    if (carts[cartId]) {
      carts[cartId].items = carts[cartId].items.filter((i: any) => i.variantId !== variantId);
      carts[cartId].updatedAt = new Date().toISOString();
      this.saveCartsToDisk(carts, cartId);
    }
    return this.enrichCart(cartId, carts[cartId]?.items || []);
  }

  async clearCart(cartId: string): Promise<CartSession> {
    if (this.isPostgresMode()) {
      await postgresCartRepository.clearCart(cartId);
    }
    const carts = this.loadCartsFromDisk();
    if (carts[cartId]) {
      carts[cartId].items = [];
      carts[cartId].updatedAt = new Date().toISOString();
      this.saveCartsToDisk(carts, cartId);
    }
    return this.enrichCart(cartId, []);
  }

  async validateAndSyncItems(cartId: string, clientItems: { variantId: string; quantity: number }[]): Promise<CartSession> {
    const carts = this.loadCartsFromDisk();
    const sanitizedItems: { variantId: string; quantity: number }[] = [];

    for (const item of clientItems) {
      if (!item.variantId) continue;
      const match = await this.productRepo.findVariant(item.variantId);
      if (match) {
        const stock = match.variant.stockQuantity ?? match.product.stockQuantity ?? 0;
        if (stock > 0) {
          sanitizedItems.push({
            variantId: item.variantId,
            quantity: Math.min(item.quantity || 1, stock),
          });
        }
      }
    }

    carts[cartId] = {
      id: cartId,
      items: sanitizedItems,
      updatedAt: new Date().toISOString(),
    };
    this.saveCartsToDisk(carts, cartId);

    return this.enrichCart(cartId, sanitizedItems);
  }
}
