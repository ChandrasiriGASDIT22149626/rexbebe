import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Curated Baby Collections & Capsule Wardrobes',
  description:
    'Explore REXBEBE boutique capsule collections: Autumn Atelier, Scandinavian Nursery, and Travel Luxury Series crafted with certified organic cashmere and beechwood.',
  path: '/collections',
  image: '/images/hero/world_bg.jpg',
});

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
