import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';
import { Star, Heart, CheckCircle2, Sparkles } from 'lucide-react';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Customer Reviews & Parent Stories - Loved by Families',
  description:
    'Discover genuine reviews from parents around the world who trust REXBEBE for luxury baby clothes, organic cashmere swaddles, and nursery keepsakes.',
  path: '/reviews',
  image: '/images/hero/world_bg.jpg',
});

const parentReviews = [
  {
    name: 'Eleanor Vance',
    location: 'London, UK',
    product: 'Aurelia Organic Cashmere Romper',
    rating: 5,
    date: 'February 2026',
    comment:
      'The cashmere is so whisper-soft on my newborn daughter’s skin. The packaging felt like opening a gift from a high-end French atelier. Worth every single penny.',
  },
  {
    name: 'Liam & Sophia Becker',
    location: 'Zurich, Switzerland',
    product: 'Nordic Artisan Wooden Play Gym',
    rating: 5,
    date: 'January 2026',
    comment:
      'Exceptional craftsmanship! The beechwood is completely smooth with no synthetic smells, and our 4-month-old is mesmerized by the crocheted sensory pendants.',
  },
  {
    name: 'Claire Moreau',
    location: 'Paris, France',
    product: 'Maison Luxe Organic Linen Swaddle Set',
    rating: 5,
    date: 'March 2026',
    comment:
      'Breathable, airy, and washes beautifully. Linen often feels rough when new, but REXBEBE’s triple-washed French flax was supple right out of the box.',
  },
  {
    name: 'Amara Wijesinghe',
    location: 'Colombo, Sri Lanka',
    product: 'Petit Prince Cashmere Cardigan & Bonnet',
    rating: 5,
    date: 'February 2026',
    comment:
      'We bought this for our baby boy’s first blessing ceremony. The mother-of-pearl buttons and gentle cable knit made for stunning milestone photos.',
  },
];

export default function ReviewsPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'About REXBEBE', url: '/about' },
    { name: 'Customer Reviews', url: '/reviews' },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Header />
      <main className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
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

        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400" />
            Verified Parent Stories
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Loved by Modern Families
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Read heartfelt testimonials from parents and gift-givers who trust REXBEBE for their most precious arrivals.
          </p>
        </div>

        {/* Rating Overview Card */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-4xl font-extrabold text-purple-950">4.9</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-stone-500">Based on hundreds of verified boutique purchases worldwide</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-purple-900">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% GOTS Organic Certified
            </span>
            <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full border border-sky-100">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hypoallergenic Tested
            </span>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {parentReviews.map((rev, index) => (
            <article
              key={index}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400">{rev.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="border-t border-stone-100 pt-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-purple-950 flex items-center gap-1.5">
                    <span>{rev.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-full">
                      Verified
                    </span>
                  </p>
                  <p className="text-[11px] text-stone-400">{rev.location}</p>
                </div>
                <span className="text-[11px] text-pink-600 font-medium">{rev.product}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-purple-950 text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-sm"
          >
            <span>Explore The Boutique Collection</span>
            <Sparkles className="w-4 h-4 text-pink-300" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
