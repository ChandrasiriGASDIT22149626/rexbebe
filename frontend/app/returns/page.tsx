import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';
import { RotateCcw, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Returns & Exchange Policy - 30 Days Happiness Guarantee',
  description:
    'Read about the REXBEBE 30-day baby clothing returns and exchange policy. Simple size swaps, complimentary returns, and hygiene care guidelines.',
  path: '/returns',
  image: '/images/hero/world_bg.jpg',
});

export default function ReturnsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Customer Care', url: '/contact' },
    { name: 'Returns & Exchanges', url: '/returns' },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />
      <main className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((b, idx) => (
              <li key={b.url} className="flex items-center space-x-2">
                {idx > 0 && <span className="text-stone-300">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-purple-950 font-semibold">{b.name}</span>
                ) : (
                  <Link href={b.url} className="hover:text-pink-600 transition-colors">
                    {b.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="text-center max-w-xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
            <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
            Worry-Free Boutique Shopping
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Returns &amp; Exchanges
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            We want you and your little one to be completely in love with every piece. We offer hassle-free 30-day returns and complimentary size exchanges.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6 text-xs sm:text-sm text-stone-600">
          <h2 className="text-base font-bold text-purple-950 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-pink-500" />
            Our 30-Day Guarantee
          </h2>
          <p className="leading-relaxed">
            If an item doesn&apos;t fit your baby or doesn&apos;t meet your expectations, you may return or exchange it within 30 days of receipt. All items must be in their original, unwashed, and unworn condition with tags intact.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="font-bold text-purple-950">1. Submit Request</p>
              <p className="text-xs text-stone-500">Contact our concierge with your order number and desired swap.</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="font-bold text-purple-950">2. Free Prepaid Label</p>
              <p className="text-xs text-stone-500">We send an instant prepaid digital return shipping label.</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 space-y-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="font-bold text-purple-950">3. Quick Refund</p>
              <p className="text-xs text-stone-500">Refunds are issued to original payment within 2 - 3 business days.</p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-6 space-y-3">
            <h3 className="font-bold text-purple-950">Hygiene &amp; Baby Safety Notice</h3>
            <p className="text-xs leading-relaxed text-stone-500">
              To guarantee the health and safety of all newborns, items returned must be free of baby lotions, perfumes, or pet dander. Pacifiers, teethers, and opened hygiene essentials cannot be returned once original protective seals are broken.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-950 text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-sm"
          >
            Contact Concierge to Start a Return
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
