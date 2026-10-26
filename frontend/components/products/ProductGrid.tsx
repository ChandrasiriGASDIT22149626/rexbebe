import React from 'react';
import { Product } from '../../types/product';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 my-6">
        <p className="font-heading font-bold text-base text-stone-600">No products available yet.</p>
        <p className="text-xs text-stone-400 mt-1">Please try clearing your filters or selecting another category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-7">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
