import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Baby Clothes Sale - Special Boutique Offers',
  description:
    'Shop the REXBEBE boutique sale. Enjoy special pricing on select organic cashmere baby rompers, linen swaddles, and toddler heirloom pieces.',
  path: '/sale',
  image: '/images/products/baby-girl-fashion.jpg',
});

export default function SaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
