import { db, DatabaseManager } from '../../config/database';
import {
  ProductRecord,
  ProductVariant,
  ProductImage,
} from '../productRepository';

export class PostgresProductRepository {
  private database: DatabaseManager;

  constructor(database?: DatabaseManager) {
    this.database = database || db;
  }

  private mapRowToProduct(row: any, variants: any[] = [], images: any[] = []): ProductRecord {
    const category =
      typeof row.categoryJson === 'string'
        ? JSON.parse(row.categoryJson)
        : row.categoryJson || { id: row.categoryId || 'unknown', name: 'General', slug: 'general' };

    const subcategory =
      typeof row.subcategoryJson === 'string'
        ? JSON.parse(row.subcategoryJson)
        : row.subcategoryJson || undefined;

    const collection =
      typeof row.collectionJson === 'string'
        ? JSON.parse(row.collectionJson)
        : row.collectionJson || undefined;

    const colors =
      typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors || [];

    const sizes =
      typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes || [];

    const features =
      typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [];

    const parts =
      typeof row.parts === 'string' ? JSON.parse(row.parts) : row.parts || undefined;

    const reviewsList =
      typeof row.reviewsList === 'string' ? JSON.parse(row.reviewsList) : row.reviewsList || [];

    const mappedVariants: ProductVariant[] = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size || undefined,
      color: v.color || undefined,
      colorHex: v.colorHex || undefined,
      partColors: typeof v.partColors === 'string' ? JSON.parse(v.partColors) : v.partColors || undefined,
      price: Number(v.price || row.price || 0),
      stockQuantity: Number(v.stockQuantity || 0),
      imageUrl: v.imageUrl || undefined,
      partId: v.partId || undefined,
      partName: v.partName || undefined,
      purchaseType: v.purchaseType as any || 'complete_set',
    }));

    const mappedImages: ProductImage[] = images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt || '',
      position: Number(img.position || 0),
      partName: img.partName || undefined,
      colorName: img.colorName || undefined,
    }));

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku || undefined,
      shortDescription: row.shortDescription || undefined,
      description: row.description || '',
      price: Number(row.price || 0),
      comparePrice: row.comparePrice ? Number(row.comparePrice) : undefined,
      discountPercentage: row.discountPercentage ? Number(row.discountPercentage) : undefined,
      saleStartDate: row.saleStartDate || undefined,
      saleEndDate: row.saleEndDate || undefined,
      isFeatured: Boolean(row.isFeatured),
      isNewArrival: Boolean(row.isNewArrival),
      isBestSeller: Boolean(row.isBestSeller),
      isSaleBadge: Boolean(row.isSaleBadge),
      status: row.status as any || 'published',
      brand: row.brand || 'REXBEBE Atelier',
      productType: row.productType as any || 'single',
      parts,
      gender: row.gender as any || 'Baby',
      ageGroup: row.ageGroup || '0–12 months',
      category,
      subcategory,
      collection,
      images: mappedImages,
      variants: mappedVariants,
      colors,
      sizes,
      stockQuantity: Number(row.stockQuantity || 0),
      lowStockThreshold: Number(row.lowStockThreshold || 5),
      stockStatus: row.stockStatus as any || 'in_stock',
      fabricMaterial: row.fabricMaterial || undefined,
      careInstructions: row.careInstructions || undefined,
      countryOfOrigin: row.countryOfOrigin || 'Sri Lanka',
      weight: row.weight || undefined,
      features,
      rating: Number(row.rating || 5.0),
      reviewCount: Number(row.reviewCount || 0),
      reviewsList,
      seoTitle: row.seoTitle || undefined,
      seoDescription: row.seoDescription || undefined,
    };
  }

  public async findAll(): Promise<ProductRecord[]> {
    const prodsRes = await this.database.query(`SELECT * FROM "Product" ORDER BY "createdAt" DESC`);
    if (prodsRes.rows.length === 0) return [];

    const productIds = prodsRes.rows.map((p) => p.id);
    const [variantsRes, imagesRes] = await Promise.all([
      this.database.query(`SELECT * FROM "ProductVariant" WHERE "productId" = ANY($1::text[])`, [productIds]),
      this.database.query(`SELECT * FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY position ASC`, [productIds]),
    ]);

    const variantsByProd = new Map<string, any[]>();
    for (const v of variantsRes.rows) {
      if (!variantsByProd.has(v.productId)) variantsByProd.set(v.productId, []);
      variantsByProd.get(v.productId)!.push(v);
    }

    const imagesByProd = new Map<string, any[]>();
    for (const img of imagesRes.rows) {
      if (!imagesByProd.has(img.productId)) imagesByProd.set(img.productId, []);
      imagesByProd.get(img.productId)!.push(img);
    }

    return prodsRes.rows.map((row) =>
      this.mapRowToProduct(
        row,
        variantsByProd.get(row.id) || [],
        imagesByProd.get(row.id) || []
      )
    );
  }

  public async findById(id: string): Promise<ProductRecord | null> {
    if (!id) return null;
    const res = await this.database.query(`SELECT * FROM "Product" WHERE id = $1 LIMIT 1`, [id.trim()]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const [variantsRes, imagesRes] = await Promise.all([
      this.database.query(`SELECT * FROM "ProductVariant" WHERE "productId" = $1`, [row.id]),
      this.database.query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY position ASC`, [row.id]),
    ]);

    return this.mapRowToProduct(row, variantsRes.rows, imagesRes.rows);
  }

  public async findBySlug(slug: string): Promise<ProductRecord | null> {
    if (!slug) return null;
    const res = await this.database.query(`SELECT * FROM "Product" WHERE LOWER(slug) = LOWER($1) LIMIT 1`, [slug.trim()]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const [variantsRes, imagesRes] = await Promise.all([
      this.database.query(`SELECT * FROM "ProductVariant" WHERE "productId" = $1`, [row.id]),
      this.database.query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY position ASC`, [row.id]),
    ]);

    return this.mapRowToProduct(row, variantsRes.rows, imagesRes.rows);
  }

  public async findVariant(identifier: string): Promise<{ product: ProductRecord; variant: ProductVariant } | null> {
    if (!identifier) return null;
    const vRes = await this.database.query(
      `SELECT * FROM "ProductVariant" WHERE LOWER(sku) = LOWER($1) OR id = $1 LIMIT 1`,
      [identifier.trim()]
    );
    if (vRes.rows.length === 0) return null;

    const vRow = vRes.rows[0];
    const product = await this.findById(vRow.productId);
    if (!product) return null;

    const variant = product.variants.find((v) => v.id === vRow.id || v.sku.toLowerCase() === identifier.toLowerCase());
    if (!variant) return null;

    return { product, variant };
  }

  public async findByIds(ids: string[]): Promise<ProductRecord[]> {
    if (!ids || ids.length === 0) return [];
    const prodsRes = await this.database.query(`SELECT * FROM "Product" WHERE id = ANY($1::text[])`, [ids]);
    if (prodsRes.rows.length === 0) return [];

    const foundIds = prodsRes.rows.map((p) => p.id);
    const [variantsRes, imagesRes] = await Promise.all([
      this.database.query(`SELECT * FROM "ProductVariant" WHERE "productId" = ANY($1::text[])`, [foundIds]),
      this.database.query(`SELECT * FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY position ASC`, [foundIds]),
    ]);

    const variantsByProd = new Map<string, any[]>();
    for (const v of variantsRes.rows) {
      if (!variantsByProd.has(v.productId)) variantsByProd.set(v.productId, []);
      variantsByProd.get(v.productId)!.push(v);
    }

    const imagesByProd = new Map<string, any[]>();
    for (const img of imagesRes.rows) {
      if (!imagesByProd.has(img.productId)) imagesByProd.set(img.productId, []);
      imagesByProd.get(img.productId)!.push(img);
    }

    return prodsRes.rows.map((row) =>
      this.mapRowToProduct(row, variantsByProd.get(row.id) || [], imagesByProd.get(row.id) || [])
    );
  }

  public async create(productData: any): Promise<ProductRecord> {
    const id = productData.id || `prod-${Date.now()}`;
    const now = new Date();

    await this.database.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO "Product" (
          id, name, slug, sku, "shortDescription", description, price, "comparePrice",
          "discountPercentage", "isFeatured", "isNewArrival", "isBestSeller", "isSaleBadge",
          status, brand, gender, "ageGroup", "productType", "categoryId", "subcategoryId",
          "collectionId", "categoryJson", "subcategoryJson", "collectionJson", colors, sizes,
          "stockQuantity", "lowStockThreshold", "stockStatus", "fabricMaterial", "careInstructions",
          "countryOfOrigin", weight, features, parts, rating, "reviewCount", "reviewsList",
          "seoTitle", "seoDescription", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31,
          $32, $33, $34, $35, $36, $37, $38,
          $39, $40, $41, $42
        )`,
        [
          id,
          productData.name,
          productData.slug,
          productData.sku || null,
          productData.shortDescription || null,
          productData.description || '',
          Number(productData.price || 0),
          productData.comparePrice ? Number(productData.comparePrice) : null,
          productData.discountPercentage || null,
          Boolean(productData.isFeatured),
          Boolean(productData.isNewArrival),
          Boolean(productData.isBestSeller),
          Boolean(productData.isSaleBadge),
          productData.status || 'published',
          productData.brand || 'REXBEBE Atelier',
          productData.gender || 'Baby',
          productData.ageGroup || '0–12 months',
          productData.productType || 'single',
          productData.category?.id || null,
          productData.subcategory?.id || null,
          productData.collection?.id || null,
          productData.category ? JSON.stringify(productData.category) : null,
          productData.subcategory ? JSON.stringify(productData.subcategory) : null,
          productData.collection ? JSON.stringify(productData.collection) : null,
          JSON.stringify(productData.colors || []),
          JSON.stringify(productData.sizes || []),
          Number(productData.stockQuantity || 0),
          Number(productData.lowStockThreshold || 5),
          productData.stockStatus || 'in_stock',
          productData.fabricMaterial || null,
          productData.careInstructions || null,
          productData.countryOfOrigin || 'Sri Lanka',
          productData.weight || null,
          JSON.stringify(productData.features || []),
          JSON.stringify(productData.parts || []),
          Number(productData.rating || 5.0),
          Number(productData.reviewCount || 0),
          JSON.stringify(productData.reviewsList || []),
          productData.seoTitle || null,
          productData.seoDescription || null,
          now,
          now,
        ]
      );

      // Variants
      if (productData.variants && Array.isArray(productData.variants)) {
        for (const v of productData.variants) {
          const vId = v.id || `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          await tx.query(
            `INSERT INTO "ProductVariant" (id, "productId", sku, size, color, "colorHex", "partColors", price, "stockQuantity", "imageUrl", "partId", "partName", "purchaseType", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              vId,
              id,
              v.sku || `${productData.sku || id}-${vId}`,
              v.size || null,
              v.color || null,
              v.colorHex || null,
              v.partColors ? JSON.stringify(v.partColors) : null,
              Number(v.price || productData.price || 0),
              Number(v.stockQuantity || 0),
              v.imageUrl || null,
              v.partId || null,
              v.partName || null,
              v.purchaseType || 'complete_set',
              now,
              now,
            ]
          );
        }
      }

      // Images
      if (productData.images && Array.isArray(productData.images)) {
        for (let idx = 0; idx < productData.images.length; idx++) {
          const img = productData.images[idx];
          const imgId = img.id || `img-${Date.now()}-${idx}`;
          await tx.query(
            `INSERT INTO "ProductImage" (id, "productId", url, alt, position, "partName", "colorName", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              imgId,
              id,
              img.url,
              img.alt || '',
              img.position ?? idx,
              img.partName || null,
              img.colorName || null,
              now,
            ]
          );
        }
      }
    });

    const full = await this.findById(id);
    return full!;
  }

  public async update(id: string, updates: any): Promise<ProductRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.database.query(
      `UPDATE "Product" SET
         name = COALESCE($2, name),
         price = COALESCE($3, price),
         "stockQuantity" = COALESCE($4, "stockQuantity"),
         status = COALESCE($5, status),
         "isFeatured" = COALESCE($6, "isFeatured"),
         "isBestSeller" = COALESCE($7, "isBestSeller"),
         "isNewArrival" = COALESCE($8, "isNewArrival"),
         "updatedAt" = NOW()
       WHERE id = $1`,
      [
        id,
        updates.name || null,
        updates.price !== undefined ? Number(updates.price) : null,
        updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : null,
        updates.status || null,
        updates.isFeatured !== undefined ? Boolean(updates.isFeatured) : null,
        updates.isBestSeller !== undefined ? Boolean(updates.isBestSeller) : null,
        updates.isNewArrival !== undefined ? Boolean(updates.isNewArrival) : null,
      ]
    );

    return await this.findById(id);
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.database.query(`DELETE FROM "Product" WHERE id = $1`, [id]);
    return res.rowCount > 0;
  }

  public async toggleBestSeller(id: string): Promise<ProductRecord | null> {
    const p = await this.findById(id);
    if (!p) return null;
    return await this.update(id, { isBestSeller: !p.isBestSeller });
  }

  public async toggleNewArrival(id: string): Promise<ProductRecord | null> {
    const p = await this.findById(id);
    if (!p) return null;
    return await this.update(id, { isNewArrival: !p.isNewArrival });
  }

  public async toggleFeatured(id: string): Promise<ProductRecord | null> {
    const p = await this.findById(id);
    if (!p) return null;
    return await this.update(id, { isFeatured: !p.isFeatured });
  }

  public async updateStatus(id: string, status: string): Promise<ProductRecord | null> {
    return await this.update(id, { status });
  }
}

export const postgresProductRepository = new PostgresProductRepository();

