import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Boutique Store Locator & Atelier Flagships',
  description:
    'Find REXBEBE boutique stockists and flagship locations. Discover where to experience our certified organic baby clothes and heirloom toys in person.',
  path: '/store-locator',
  image: '/images/hero/world_bg.jpg',
});

export default function StoreLocatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
