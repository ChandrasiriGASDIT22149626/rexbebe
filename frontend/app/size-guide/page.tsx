import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';
import { Sparkles, Ruler, Heart, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Baby Clothes Size Guide & Newborn Measurement Chart',
  description:
    'Find the perfect fit for your little one with the REXBEBE baby clothes size guide. Height and weight sizing charts from Newborn to 24 Months, measuring tips, and organic fabric care.',
  path: '/size-guide',
  image: '/images/products/organic-onesie.jpg',
});

const sizeData = [
  { size: 'Preemie / Tiny Baby', age: 'Up to 5 lbs', height: 'Up to 44 cm (17.5 in)', weight: 'Up to 2.3 kg' },
  { size: 'Newborn (0M)', age: '0 - 1 Month', height: '48 - 56 cm (19 - 22 in)', weight: '2.5 - 4.1 kg (5.5 - 9 lbs)' },
  { size: '0 - 3 Months', age: '1 - 3 Months', height: '56 - 62 cm (22 - 24.5 in)', weight: '4.1 - 5.7 kg (9 - 12.5 lbs)' },
  { size: '3 - 6 Months', age: '3 - 6 Months', height: '62 - 68 cm (24.5 - 27 in)', weight: '5.7 - 7.5 kg (12.5 - 16.5 lbs)' },
  { size: '6 - 9 Months', age: '6 - 9 Months', height: '68 - 74 cm (27 - 29 in)', weight: '7.5 - 9.0 kg (16.5 - 20 lbs)' },
  { size: '9 - 12 Months', age: '9 - 12 Months', height: '74 - 80 cm (29 - 31.5 in)', weight: '9.0 - 11.0 kg (20 - 24 lbs)' },
  { size: '12 - 18 Months', age: '12 - 18 Months', height: '80 - 86 cm (31.5 - 34 in)', weight: '11.0 - 12.5 kg (24 - 27.5 lbs)' },
  { size: '18 - 24 Months', age: '18 - 24 Months', height: '86 - 92 cm (34 - 36 in)', weight: '12.5 - 14.0 kg (27.5 - 31 lbs)' },
  { size: '2 - 3 Years', age: '24 - 36 Months', height: '92 - 98 cm (36 - 38.5 in)', weight: '14.0 - 16.0 kg (31 - 35 lbs)' },
];

export default function SizeGuidePage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Customer Care', url: '/contact' },
    { name: 'Baby Size Guide', url: '/size-guide' },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />
      <main className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb nav */}
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500 mb-6">
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

        {/* Page Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Ruler className="w-3.5 h-3.5 text-pink-500" />
            Fit & Sizing Guide
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Baby Clothes Size Guide
          </h1>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed">
            Babies grow rapidly in their first year. Our garments are thoughtfully tailored with gentle stretch, expandable envelope necklines, and adjustable cuffs to ensure a cozy, long-lasting fit.
          </p>
        </div>

        {/* Measurement Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 mb-12 overflow-x-auto touch-scroll">
          <h2 className="text-lg font-bold text-purple-950 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            Standard Sizing &amp; Growth Chart
          </h2>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-700">
                <th className="py-3 px-4 font-bold rounded-l-xl">REXBEBE Size</th>
                <th className="py-3 px-4 font-bold">Recommended Age</th>
                <th className="py-3 px-4 font-bold">Baby Height</th>
                <th className="py-3 px-4 font-bold rounded-r-xl">Baby Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sizeData.map((row) => (
                <tr key={row.size} className="hover:bg-pink-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-purple-950">{row.size}</td>
                  <td className="py-3.5 px-4 text-stone-600">{row.age}</td>
                  <td className="py-3.5 px-4 text-stone-600">{row.height}</td>
                  <td className="py-3.5 px-4 text-stone-600">{row.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-purple-950">Height is Key</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              When in doubt, choose sizing based primarily on your baby&apos;s height rather than age alone, as babies grow at individual paces.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-purple-950">Size Up for Cashmere</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              For hand-knit cashmere cardigans and swaddles, choosing one size up gives room for layering over onesies through cooler seasons.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-purple-950">Free Size Exchanges</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              If a gift or outfit doesn&apos;t fit your baby comfortably, our concierge offers quick 30-day size swaps with prepaid return labels.
            </p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 rounded-3xl p-8 text-center border border-white shadow-sm space-y-4">
          <Heart className="w-6 h-6 text-pink-500 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-purple-950">
            Ready to dress your little one?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Explore our curated newborn rompers, French linen sets, and delicate knitwear.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/baby"
              className="px-6 py-3 rounded-full bg-purple-950 text-white text-xs font-bold hover:bg-purple-900 transition-all shadow-sm"
            >
              Shop Newborn Clothes
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 rounded-full bg-white text-purple-950 text-xs font-bold hover:bg-stone-50 transition-all border border-stone-200 shadow-sm"
            >
              Browse Complete Boutique
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
