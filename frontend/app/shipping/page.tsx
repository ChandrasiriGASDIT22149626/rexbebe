import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';
import { Truck, Gift, Clock, Globe, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Shipping Information & Worldwide Delivery Details',
  description:
    'Learn about REXBEBE boutique delivery options, complimentary luxury gift packaging, tracking details, and international shipping rates for baby clothes.',
  path: '/shipping',
  image: '/images/hero/world_bg.jpg',
});

export default function ShippingPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Customer Care', url: '/contact' },
    { name: 'Shipping Information', url: '/shipping' },
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            Fast & Safe Dispatch
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Shipping &amp; Delivery
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Every REXBEBE order is lovingly packaged in our signature keepsake boxes and dispatched with fully insured express couriers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-purple-950">Domestic Delivery</h2>
                <p className="text-xs text-stone-500">Standard: 2 - 4 business days</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Complimentary on all orders over LKR 20,000. Flat shipping fee of LKR 650 for smaller packages. All shipments include live tracking updates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-purple-950">International Express</h2>
                <p className="text-xs text-stone-500">Worldwide: 5 - 8 business days</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              We ship worldwide with DHL Express and FedEx. Customs duties and taxes are calculated transparently during checkout with zero surprise fees.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-purple-950">Complimentary Gift Packaging</h2>
                <p className="text-xs text-stone-500">Luxury pastel presentation</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Each garment is wrapped in acid-free tissue paper with delicate satin ribbon, accompanied by a handwritten note on textured cardstock.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-purple-950">Insured &amp; Tracked</h2>
                <p className="text-xs text-stone-500">Signature required delivery</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every parcel is protected against loss or transit damage. Real-time SMS and email tracking links are sent as soon as your package leaves our atelier.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/track-order"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-950 text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-sm"
          >
            <span>Track An Existing Package</span>
            <Truck className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
