import React from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { CategorySection } from '../components/home/CategorySection';
import { BestSellers } from '../components/home/BestSellers';
import { NewArrivals } from '../components/home/NewArrivals';
import { LittleEssentials } from '../components/home/LittleEssentials';
import { TheLittleEdit } from '../components/home/TheLittleEdit';
import { BrandStory } from '../components/home/BrandStory';
import { WhyRexbebe } from '../components/home/WhyRexbebe';
import { Newsletter } from '../components/home/Newsletter';
import { getDatabaseSeoSettings } from '../services/serverSeoService';
import { SITE_URL, BRAND_NAME, generateOpenGraph, generateTwitter } from '../config/seoConfig';

const FeaturedCollection = dynamic(
  () => import('../components/home/FeaturedCollection').then((mod) => mod.FeaturedCollection),
  { ssr: true }
);

const CustomerReviews = dynamic(
  () => import('../components/home/CustomerReviews').then((mod) => mod.CustomerReviews),
  { ssr: true }
);

const InstagramSection = dynamic(
  () => import('../components/home/InstagramSection').then((mod) => mod.InstagramSection),
  { ssr: true }
);

export async function generateMetadata(): Promise<Metadata> {
  const seo = getDatabaseSeoSettings();
  const rawTitle = seo.metaTitle || `REXBEBE | Luxury Baby & Toddler Boutique Online Sri Lanka`;
  const description =
    seo.metaDescription ||
    `Shop luxury organic baby clothes in Sri Lanka. Curated organic cashmere rompers, French flax linen swaddles, wooden nursery toys, and pastel baby clothes online with islandwide delivery.`;
  const canonical = SITE_URL;
  const image = seo.socialShareImage || '/images/hero/world_bg.webp';

  return {
    title: {
      absolute: rawTitle,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({
      title: rawTitle,
      description,
      url: canonical,
      image,
    }),
    twitter: generateTwitter({
      title: rawTitle,
      description,
      image,
    }),
    robots: seo.allowRobotsIndexing === false
      ? { index: false, follow: false }
      : {
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
  };
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="overflow-x-hidden bg-gradient-to-b from-[#FAF9F6] via-[#FDF2F8]/30 via-[#ECFDF5]/20 to-[#FAF9F6]">
        {/* 1. Animated Hero World */}
        <Hero />

        {/* 2. Shop the Little World (Circular & Floating Categories) */}
        <CategorySection />

        {/* 3. Featured Little Favorites (Parent Favorites) */}
        <BestSellers />

        {/* 4. New Arrivals Showcase */}
        <NewArrivals />

        {/* 5. Editorial Section: Little Essentials */}
        <LittleEssentials />

        {/* 6. Editorial Section: The Little Edit */}
        <TheLittleEdit />

        {/* 7. Lifestyle & Story: Little Days. Big Memories. */}
        <BrandStory />

        {/* 8. Special Campaign: For Little Adventures */}
        <FeaturedCollection />

        {/* 9. Trust & Services Bar */}
        <WhyRexbebe />

        {/* 10. Customer Reviews */}
        <CustomerReviews />

        {/* 11. Newsletter Registration */}
        <Newsletter />

        {/* 12. Instagram / Social Feed */}
        <InstagramSection />
      </main>
      <Footer />
    </>
  );
}

