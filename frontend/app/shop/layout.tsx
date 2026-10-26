import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Shop Baby Clothes Online & Nursery Luxury',
  description:
    'Shop the complete REXBEBE boutique collection: GOTS certified organic cashmere rompers, French flax linen swaddles, handcrafted wooden toys, and pastel baby fashion.',
  path: '/shop',
  image: '/images/products/organic-onesie.jpg',
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
