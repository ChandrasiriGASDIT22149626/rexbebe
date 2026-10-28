import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans, Fredoka } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../hooks/useCart';
import { WishlistProvider } from '../hooks/useWishlist';
import { ThemeProvider } from '../hooks/useTheme';
import { ClientOnlyPreloader } from '../components/ui/ClientOnlyPreloader';
import { AdminDataProvider } from '../hooks/AdminContext';
import { VisitorTracker } from '../components/common/VisitorTracker';
import { OrganizationJsonLd, WebSiteJsonLd, LocalBusinessJsonLd } from '../components/seo/JsonLd';
import { GoogleAnalytics } from '../components/analytics/GoogleAnalytics';
import { SITE_URL, BRAND_NAME, generateOpenGraph, generateTwitter } from '../config/seoConfig';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F7EEF9',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'REXBEBE | Luxury Baby & Toddler Boutique Online',
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    'Curated organic cashmere rompers, French flax linen swaddles, handcrafted wooden nursery toys, and pastel baby clothes online at REXBEBE.',
  keywords: [
    'baby clothes',
    'luxury baby clothes',
    'newborn baby clothes',
    'organic baby romper',
    'baby boy clothes',
    'baby girl clothes and dresses',
    'cashmere baby clothing',
    'linen baby swaddles',
    'REXBEBE',
  ],
  authors: [{ name: BRAND_NAME, url: SITE_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: generateOpenGraph({
    title: 'REXBEBE | Luxury Baby & Toddler Boutique Online',
    description:
      'Curated organic cashmere rompers, French flax linen swaddles, handcrafted wooden nursery toys, and pastel baby clothes online at REXBEBE.',
    url: SITE_URL,
    image: '/images/hero/world_bg.webp',
  }),
  twitter: generateTwitter({
    title: 'REXBEBE | Luxury Baby & Toddler Boutique Online',
    description:
      'Curated organic cashmere rompers, French flax linen swaddles, handcrafted wooden nursery toys, and pastel baby clothes online at REXBEBE.',
    image: '/images/hero/world_bg.webp',
  }),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/logo_clean.png' },
      { url: '/images/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo_clean.png', sizes: '180x180' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable} ${fredoka.variable}`} suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <LocalBusinessJsonLd />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('rexbebe_theme');
                if (t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col justify-between bg-[#FAF9F6] text-slate-800 dark:bg-[#0F172A] dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider>
          <GoogleAnalytics />
          <ClientOnlyPreloader />
          <AdminDataProvider>
            <VisitorTracker />
            <CartProvider>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </AdminDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
