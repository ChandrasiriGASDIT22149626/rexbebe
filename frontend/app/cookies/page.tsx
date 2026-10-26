import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Cookie Policy - Privacy & Tracking Preferences',
  description:
    'Learn how REXBEBE utilizes essential, analytical, and functional cookies to ensure a secure and smooth shopping experience.',
  path: '/cookies',
});

export default function CookiesPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Legal', url: '/cookies' },
    { name: 'Cookie Policy', url: '/cookies' },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />
      <main className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Cookie Policy
          </h1>
          <p className="mt-2 text-xs text-stone-500">Last updated: January 2026</p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">1. What are Cookies?</h2>
            <p>
              Cookies are tiny text files placed on your device to remember preferences (such as selected currency and items in your shopping bag) across browsing sessions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">2. Types of Cookies We Use</h2>
            <p>
              <strong>Essential Cookies:</strong> Required for the cart, checkout, and account security.
              <br />
              <strong>Preference Cookies:</strong> Remember your preferred currency and theme.
              <br />
              <strong>Analytical Cookies:</strong> Help us measure aggregate boutique traffic anonymously to improve page load speeds and user experience.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">3. Managing Preferences</h2>
            <p>
              You can control or clear cookies at any time via your browser settings. Disabling essential cookies may impair shopping cart functionality.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
