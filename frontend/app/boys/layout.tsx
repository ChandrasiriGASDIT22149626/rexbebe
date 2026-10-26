import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Baby Boy Clothes, Linen Sets & Knit Rompers',
  description:
    'Shop handsome baby boy clothing, French flax linen sets, cable-knit cardigans, and organic cotton rompers designed for comfort and elegance at REXBEBE.',
  path: '/boys',
  image: '/images/products/baby-boy-fashion.jpg',
});

export default function BoysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
