import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Privacy Policy - Customer Data Protection',
  description:
    'Read the REXBEBE Privacy Policy to understand how we protect your personal information, handle secure transactions, and safeguard user confidentiality.',
  path: '/privacy',
});

export default function PrivacyPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Legal', url: '/privacy' },
    { name: 'Privacy Policy', url: '/privacy' },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />
      <main className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-stone-500">Last updated: January 2026</p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">1. Commitment to Privacy</h2>
            <p>
              REXBEBE respects the privacy of every parent and family visiting our online boutique. We do not sell, rent, or trade your personal data to third parties under any circumstances.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">2. Information We Collect</h2>
            <p>
              When you purchase or inquire through our boutique, we collect necessary contact information (name, shipping address, email, telephone) solely to fulfill orders, process payments, and provide concierge customer support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">3. Payment Security</h2>
            <p>
              All payments are processed using encrypted tokenization protocols. REXBEBE never stores raw credit or debit card numbers on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-purple-950">4. Contact Our Data Protection Concierge</h2>
            <p>
              If you wish to view, update, or request deletion of your account records, please contact our privacy desk at{' '}
              <a href="mailto:privacy@rexbebe.com" className="text-pink-600 underline">
                privacy@rexbebe.com
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
