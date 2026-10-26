export interface ProductPartImage {
  id?: string;
  colorName?: string;
  sizeName?: string;
  url: string;
  alt?: string;
  isRecolored?: boolean;
  recolorSourceUrl?: string;
}

export interface ProductPart {
  id: string;
  name: string;
  type: 'T-shirt' | 'Shirt' | 'Pants' | 'Shorts' | 'Dress' | 'Romper' | 'Hat' | 'Jacket' | 'Other';
  description?: string;
  colors: ProductColorOption[];
  defaultColor?: string;
  images?: ProductPartImage[];
  active: boolean;
  isPurchasableIndividually?: boolean;
  price?: number;
  comparePrice?: number;
  skuPrefix?: string;
  sizes?: string[];
  maskUrl?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  partColors?: Record<string, string>;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  partId?: string;
  partName?: string;
  purchaseType?: 'complete_set' | 'individual_part';
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  partName?: string;
  colorName?: string;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ProductReviewItem {
  id: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified?: boolean;
  fit?: string;
  helpfulCount?: number;
  status?: 'approved' | 'pending' | 'rejected';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  shortDescription?: string;
  description: string;
  price: number;
  comparePrice?: number;
  discountPercentage?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller?: boolean;
  isSaleBadge?: boolean;
  status?: 'draft' | 'published' | 'unpublished';
  brand?: string;
  productType?: 'single' | 'set';
  parts?: ProductPart[];
  gender?: 'Baby' | 'Girls' | 'Boys' | 'Unisex';
  ageGroup?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
  images: ProductImage[];
  variants: ProductVariant[];
  colors?: ProductColorOption[];
  sizes?: string[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  fabricMaterial?: string;
  careInstructions?: string;
  countryOfOrigin?: string;
  weight?: string;
  features?: string[];
  rating: number;
  reviewCount: number;
  reviewsList?: ProductReviewItem[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

