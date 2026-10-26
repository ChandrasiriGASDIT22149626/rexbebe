import type { Metadata } from 'next';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Contact Concierge & Customer Care',
  description:
    'Get in touch with the REXBEBE boutique concierge team. Inquire about bespoke baby styling, custom nursery gifting, orders, and worldwide delivery support.',
  path: '/contact',
  image: '/images/hero/world_bg.jpg',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
