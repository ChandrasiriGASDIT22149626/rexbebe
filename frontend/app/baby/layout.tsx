import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Newborn Baby Clothes & Organic Essentials',
  description:
    'Pure organic luxury for little miracles. Shop newborn baby clothes, hospital take-home sets, swaddles, and bonnet sets crafted with Mongolian cashmere.',
  path: '/baby',
  image: '/images/products/organic-onesie.jpg',
});

export default function BabyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
