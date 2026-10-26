import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Terms & Conditions - Boutique Shopping Terms',
  description:
    'Read the terms and conditions governing the purchase of organic baby clothing, orders, and deliveries at REXBEBE boutique.',
  path: '/terms',
});

export default function TermsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Legal', url: '/terms' },
    { name: 'Terms & Conditions', url: '/terms' },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />
      <main className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-xs text-stone-500">Last updated: January 2026</p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">1. Acceptance of Terms</h2>
            <p>
              By accessing and purchasing from REXBEBE, you acknowledge and agree to comply with these terms, our Shipping Policy, and our 30-Day Return Guarantee.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">2. Authenticity &amp; Product Representation</h2>
            <p>
              We strive to display our garments, cashmere textures, and pastel colors with utmost accuracy. Because organic fabrics involve natural fibers and low-impact dyes, slight natural variations in tone may occur between seasonal batches.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">3. Orders and Pricing</h2>
            <p>
              All prices are listed in local currency and are subject to verification. We reserve the right to decline or cancel orders in cases of pricing typographical errors or stock discrepancies.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
