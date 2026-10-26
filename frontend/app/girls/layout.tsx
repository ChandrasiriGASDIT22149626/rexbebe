import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Baby Girl Clothes, Floral Dresses & Rompers',
  description:
    'Discover charming baby girl clothes, organic cotton dresses, delicate lace detailing, and pastel knitwear at REXBEBE boutique atelier.',
  path: '/girls',
  image: '/images/products/baby-girl-fashion.jpg',
});

export default function GirlsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
