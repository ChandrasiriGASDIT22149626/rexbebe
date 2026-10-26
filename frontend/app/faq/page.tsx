import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BreadcrumbJsonLd } from '../../components/seo/JsonLd';
import { generateCategoryMetadata } from '../../config/seoConfig';
import { HelpCircle, Sparkles, Heart } from 'lucide-react';

export const metadata: Metadata = generateCategoryMetadata({
  title: 'Frequently Asked Questions (FAQ) - Baby Care & Ordering',
  description:
    'Answers to common questions about REXBEBE organic baby clothes, GOTS cashmere certifications, sizing advice, delivery times, and garment washing care.',
  path: '/faq',
  image: '/images/hero/world_bg.jpg',
});

const faqs = [
  {
    q: 'Are REXBEBE garments safe for sensitive newborn skin?',
    a: 'Yes, absolutely. Every piece in our atelier is crafted from GOTS-certified 100% organic cotton, natural unbleached flax linen, and hypoallergenic Mongolian cashmere. We use non-toxic, nickel-free snaps and natural mother-of-pearl buttons to safeguard delicate baby skin from irritation.',
  },
  {
    q: 'How do I choose the correct size for a newborn or baby gift?',
    a: 'We recommend checking our detailed Size Guide. When buying a gift for a newborn, our "0-3 Months" or "3-6 Months" sizes are the most popular choices as they allow plenty of room for baby growth. We also offer free 30-day size swaps.',
  },
  {
    q: 'How should I wash and care for organic cashmere and linen?',
    a: 'For our cashmere knitwear, hand washing in cool water with gentle baby-safe wool detergent and drying flat away from direct sunlight preserves the fibers best. Our organic linen and cotton onesies can be gently machine washed in a laundry bag on a delicate cycle.',
  },
  {
    q: 'Does my order come with gift packaging?',
    a: 'Yes! Every REXBEBE boutique order arrives in our signature pastel gift box tied with satin ribbon. You may also include a custom complimentary gift note during checkout.',
  },
  {
    q: 'What are your shipping timeframes and costs?',
    a: 'Domestic orders are delivered within 2-4 business days and are complimentary on purchases over LKR 20,000. Worldwide international express shipping takes 5-8 business days with DHL or FedEx.',
  },
  {
    q: 'What is your return and exchange policy?',
    a: 'We offer an unconditional 30-day return and exchange policy on all unworn, unwashed garments with original tags intact. Contact our concierge to receive a complimentary prepaid return shipping label.',
  },
];

export default function FaqPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Customer Care', url: '/contact' },
    { name: 'Frequently Asked Questions', url: '/faq' },
  ];

  // FAQ Schema JSON-LD
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            Support Center
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-purple-950 font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Everything you need to know about our organic baby garments, luxury materials, sizing, and boutique care.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <article
              key={index}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-2 hover:border-pink-200 transition-colors"
            >
              <h2 className="text-sm sm:text-base font-bold text-purple-950 flex items-start gap-2.5">
                <span className="text-pink-500 font-extrabold flex-shrink-0">Q.</span>
                <span>{faq.q}</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pl-6">
                {faq.a}
              </p>
            </article>
          ))}
        </div>

        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8 text-center border border-pink-100 space-y-3">
          <Sparkles className="w-6 h-6 text-pink-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-purple-950">
            Have a question not answered here?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Our luxury styling concierge is available 7 days a week to assist with order inquiries, sizing, or nursery selections.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-950 text-white text-xs font-bold hover:bg-purple-900 transition-colors shadow-sm"
            >
              Contact Boutique Concierge
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
