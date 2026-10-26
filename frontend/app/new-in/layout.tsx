import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'New In - Fresh Baby Arrivals & Seasonal Boutique',
  description:
    'Discover the newest baby fashion arrivals at REXBEBE. Fresh pastel colorways, new season cashmere rompers, French linen sets, and handcrafted toys.',
  path: '/new-in',
  image: '/images/products/organic-onesie.jpg',
});

export default function NewInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
