'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { ProductReviews } from './ProductReviews';
import { ProductCard } from './ProductCard';
import { ProductJsonLd, BreadcrumbJsonLd } from '../seo/JsonLd';
import { useAdminData } from '../../hooks/AdminContext';
import { Product } from '../../types/product';
import { ArrowLeft, Sparkles, Home, ChevronRight } from 'lucide-react';

interface ProductDetailViewProps {
  slug: string;
  initialProduct?: Product;
}

export function ProductDetailView({ slug, initialProduct }: ProductDetailViewProps) {
  const { products, isLoaded } = useAdminData();
  const [activeImageUrl, setActiveImageUrl] = React.useState<string | null>(null);
  const [garmentInfo, setGarmentInfo] = React.useState<{
    partName?: string;
    colorName?: string;
    hasAuthenticImage?: boolean;
  }>({});

  // Find product dynamically from AdminContext or fallback to initialProduct
  const product = useMemo(() => {
    const cleanSlug = slug.toLowerCase().trim();
    const found = products.find(
      (p) =>
        p.slug.toLowerCase() === cleanSlug ||
        p.id === initialProduct?.id ||
        p.id === cleanSlug
    );
    return found || initialProduct || null;
  }, [products, slug, initialProduct]);

  // Related products from same category or catalog
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.id !== product.id && p.status !== 'draft' && p.status !== 'unpublished')
      .slice(0, 4);
  }, [products, product]);

  if (!product && isLoaded) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between">
        <Header />
        <main className="py-24 text-center max-w-md mx-auto px-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto text-2xl">
            🧸
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">Product Not Found</h1>
          <p className="text-sm text-slate-600">
            The baby clothing item you are looking for may have been moved or unpublished.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Boutique Shop</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between">
        <Header />
        <div className="py-32 text-center text-sm font-extrabold text-slate-400 animate-pulse">
          Loading boutique item details...
        </div>
        <Footer />
      </div>
    );
  }

  const categoryName = product.category?.name || 'Baby Clothing';
  const categorySlug = product.category?.slug || 'baby-clothing';

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: categoryName, url: `/categories/${categorySlug}` },
    { name: product.name, url: `/products/${product.slug}` },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />

      <main className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Semantic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <li>
              <Link href="/" className="hover:text-pink-600 flex items-center transition-colors">
                <Home className="w-3.5 h-3.5 mr-1" />
                <span>Home</span>
              </Link>
            </li>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <li>
              <Link href="/shop" className="hover:text-pink-600 transition-colors">
                Shop
              </Link>
            </li>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <li>
              <Link
                href={`/categories/${categorySlug}`}
                className="hover:text-pink-600 transition-colors"
              >
                {categoryName}
              </Link>
            </li>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <li className="font-extrabold text-slate-900 truncate max-w-xs sm:max-w-md">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Gallery & Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <ProductGallery
              images={product.images || []}
              productName={product.name}
              activeImageUrl={activeImageUrl}
              activePartName={garmentInfo.partName}
              activeColorName={garmentInfo.colorName}
              hasAuthenticImage={garmentInfo.hasAuthenticImage}
            />
          </div>
          <div className="lg:col-span-5">
            <ProductInfo
              product={product}
              onActiveImageChange={(url) => setActiveImageUrl(url)}
              onGarmentSelectionChange={(info) => setGarmentInfo(info)}
            />
          </div>
        </div>

        {/* Customer Reviews Section */}
        <ProductReviews product={product} />

        {/* You May Also Love (Related Products) */}
        {relatedProducts.length > 0 && (
          <section className="pt-12 border-t border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-pink-600 block">
                  More Heirloom Favorites
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  You May Also Love
                </h3>
              </div>
              <Link
                href="/shop"
                className="text-xs font-black text-pink-600 hover:text-pink-700 underline"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <div key={p.id} className="h-full">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
