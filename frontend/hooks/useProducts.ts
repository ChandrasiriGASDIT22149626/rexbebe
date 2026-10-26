import { useMemo } from 'react';
import { useAdminData } from './AdminContext';

export function useProducts(categorySlug?: string) {
  const { products, isLoaded } = useAdminData();

  const filteredProducts = useMemo(() => {
    if (!categorySlug) return products;
    const lower = categorySlug.toLowerCase();
    return products.filter(
      p =>
        p.category.slug.toLowerCase() === lower ||
        p.category.name.toLowerCase() === lower ||
        (p.collection && p.collection.slug.toLowerCase() === lower)
    );
  }, [products, categorySlug]);

  return { products: filteredProducts, loading: !isLoaded };
}
