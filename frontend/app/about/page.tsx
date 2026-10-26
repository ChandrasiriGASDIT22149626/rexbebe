import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Heart,
  Eye,
  Target,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Award,
  Layers,
  CheckCircle2,
  Building2,
  Users,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';

export const metadata: Metadata = {
  title: 'About Us | REXBEBE & Parent Company Classen Holdings',
  description:
    'Discover the story of REXBEBE and parent company Classen Holdings. From our 2010 fashion beginnings to multi-sector excellence in apparel, embellishments, gems, logistics, and construction.',
  openGraph: {
    title: 'About Us | REXBEBE & Classen Holdings',
    description:
      'Learn about REXBEBE baby clothing and Classen Holdings — driving innovation, integrity, and quality across diversified industries.',
    url: 'https://rexbebe.lk/about',
    siteName: 'REXBEBE',
    images: [
      {
        url: '/images/about-hero.jpg',
        width: 1200,
        height: 675,
        alt: 'REXBEBE Baby Clothing Atelier and Heritage',
      },
    ],
  },
};

const BUSINESS_SECTORS = [
  {
    title: 'Apparel',
    tagline: 'Precision Garment Manufacturing',
    description:
      'State-of-the-art apparel production delivering world-class craftsmanship, ethical textile manufacturing, and babywear standards.',
    href: 'https://classen.lk/apparel-manufacturing/',
    image: '/images/sectors/apparel.jpg',
    badge: 'Core Excellence',
  },
  {
    title: 'Embellishments',
    tagline: 'Artisanal Embroidery & Detailing',
    description:
      'Intricate embroidery, delicate beading, and innovative surface embellishments for luxury fashion and bespoke textiles.',
    href: 'https://classen.lk/embellishments/',
    image: '/images/sectors/embellishments.jpg',
    badge: 'Artistry',
  },
  {
    title: 'Custom Made',
    tagline: 'Bespoke Tailoring & Design',
    description:
      'Tailor-made garments created to exact client specifications with heirloom tailoring standards and premium fabrics.',
    href: 'https://classen.lk/custom-made/',
    image: '/images/sectors/custom-made.jpg',
    badge: 'Bespoke',
  },
  {
    title: 'Gems',
    tagline: 'Authentic Ceylon Gemstones',
    description:
      'Ethically sourced, certified natural Ceylon sapphires, rubies, and precious stones cherished by collectors worldwide.',
    href: 'https://classen.lk/gems-2/',
    image: '/images/sectors/gems.jpg',
    badge: 'Natural Luxury',
  },
  {
    title: 'Logistics',
    tagline: 'Dynamic Supply Chain & Freight',
    description:
      'Reliable logistics network managing multi-sector supply chains, express distribution, and dependable freight solutions.',
    href: 'https://classen.lk/logistics/',
    image: '/images/sectors/logistics.jpg',
    badge: 'Supply Chain',
  },
  {
    title: 'Construction Materials',
    tagline: 'Industrial & Architectural Supplies',
    description:
      'High-grade commercial building materials, structural components, and trusted supply partnerships for modern construction.',
    href: 'https://classen.lk/construction-material-supply/',
    image: '/images/sectors/construction.jpg',
    badge: 'Infrastructure',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50/60 dark:bg-slate-950 text-stone-900 dark:text-stone-100 antialiased selection:bg-pink-100 selection:text-pink-900">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-[#FAF7F2] via-pink-50/25 to-stone-50/60 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 border-b border-stone-200/60 dark:border-slate-800">
          {/* Ambient Decorative Blur Orbs */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-pink-200/40 dark:bg-pink-900/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-100/50 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-6">
              <Link href="/" className="hover:text-pink-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-stone-900 dark:text-stone-200 font-bold">About Us</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Headline & Intro */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-pink-200/80 dark:border-pink-900/50 text-pink-700 dark:text-pink-300 text-xs font-extrabold tracking-wider uppercase shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span>Heritage, Innovation &amp; Craftsmanship</span>
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                  Where Gentle Baby Luxury Meets Decades of Manufacturing Excellence
                </h1>

                <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                  REXBEBE is proudly powered by{' '}
                  <strong className="font-semibold text-stone-900 dark:text-white">Classen Holdings</strong>,
                  a diversified multi-sector enterprise with roots in fashion excellence dating back to 2010.
                  Together, we combine ethical textile craftsmanship with contemporary babywear design to
                  celebrate your baby’s most precious moments.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="#classen-holdings"
                    className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <span>About Classen Holdings</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="#business-sectors"
                    className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-slate-700 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-slate-700 transition-all shadow-xs hover:scale-105 active:scale-95"
                  >
                    <span>Our Business Sectors</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Visual Rack Image */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-[4/3] sm:aspect-[16/11]">
                  <Image
                    src="/images/about-hero.jpg"
                    alt="REXBEBE Atelier Babywear Collection & Quality Craftsmanship"
                    fill
                    priority
                    className="object-cover object-center transform transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-white/60 dark:border-slate-700 shadow-lg">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Ethical Babywear Atelier
                    </p>
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-0.5">
                      100% Baby-safe certified cotton, pure French linen &amp; soft cashmere knitwear.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: REXBEBE BRAND PHILOSOPHY */}
        <section className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-stone-200/60 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
              <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-pink-600 dark:text-pink-400">
                The REXBEBE Promise
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-white">
                Crafted for Tenderness, Built on Integrity
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                Every stitch, seam, and button in REXBEBE babywear is carefully considered. Benefiting from Classen
                Holdings’ decade-long manufacturing expertise, we adhere to strict quality control, hypoallergenic
                fabric sourcing, and skin-friendly natural dyes.
              </p>
            </div>

            {/* 3 Core Brand Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80 space-y-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 flex items-center justify-center">
                  <Heart className="w-6 h-6 fill-pink-500/20" />
                </div>
                <h3 className="font-heading text-lg font-bold text-stone-900 dark:text-white">
                  Ultra-Gentle &amp; Baby-Safe
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  We use pre-washed organic cotton and gentle breathable weaves that protect sensitive infant skin
                  from irritation, ensuring cozy comfort through every crawl and cuddle.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80 space-y-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-stone-900 dark:text-white">
                  Master Textile Heritage
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Backed by Classen Holdings’ extensive apparel operations, our production lines follow rigorous
                  European seam standards, reinforced stress points, and durable everyday wearability.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80 space-y-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-lg font-bold text-stone-900 dark:text-white">
                  Ethical &amp; Sustainable
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Fair labor, safe workplace conditions, and sustainable manufacturing are non-negotiable across all
                  Classen Holdings facilities, creating positive community impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ABOUT CLASSEN HOLDINGS (VERBATIM CORPORATE PROFILE) */}
        <section
          id="classen-holdings"
          className="py-16 sm:py-24 bg-gradient-to-b from-stone-50/60 via-white to-stone-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 scroll-mt-20 border-b border-stone-200/60 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Classen Holdings Logo Header Card */}
            <div className="bg-white dark:bg-slate-800/90 rounded-4xl p-8 sm:p-12 border border-stone-200/80 dark:border-slate-700 shadow-xl mb-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Logo Presentation Area */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-stone-50/80 dark:bg-slate-900/80 rounded-3xl border border-stone-200/70 dark:border-slate-700/70 text-center">
                  <div className="relative w-64 sm:w-72 h-28 sm:h-32 flex items-center justify-center">
                    {/* Official Classen Holdings logo with local fallback */}
                    <Image
                      src="https://classen.lk/wp-content/uploads/2025/12/CH_new_tp.png"
                      alt="Classen Holdings Logo"
                      width={360}
                      height={140}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                      priority
                      unoptimized
                    />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400 mt-3">
                    Parent Company of REXBEBE
                  </span>
                  <a
                    href="https://classen.lk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                  >
                    <span>Visit classen.lk</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Corporate Introduction */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center space-x-2 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                    <Building2 className="w-4 h-4" />
                    <span>Corporate Heritage Since 2010</span>
                  </div>

                  <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-white">
                    About Classen Holdings
                  </h2>

                  <div className="space-y-4 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
                    <p>
                      Classen Holdings began its journey around 2010 with the launch of Fairy’s Fashion, our first
                      officially registered business. What started as a focused venture in the fashion industry has
                      since evolved into a dynamic, multi-sector enterprise with a strong and growing presence
                      across a wide range of industries.
                    </p>
                    <p>
                      Over the years, we’ve developed deep expertise in managing sales operations, claims, market
                      returns, and brand development, earning longstanding trust and credibility in the marketplace.
                    </p>
                    <p>
                      Today, we proudly serve as the parent company of Limerence Private Limited, Fensfar Private
                      Limited, Fairy’s Fashion, and several other successful ventures. Our diversified operations span
                      logistics, apparel and fashion, the gem industry, construction material supply,
                      embellishments, and various innovative services.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Subsidiary Venture Highlights */}
            <div className="mb-16">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 text-center mb-6">
                Key Enterprises Under Classen Holdings
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 text-center space-y-1">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Fairy’s Fashion</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Founded ~2010 · Fashion Heritage</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 text-center space-y-1">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Limerence Private Limited</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Strategic Venture</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200/70 dark:border-slate-700 text-center space-y-1">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Fensfar Private Limited</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Commercial Operations</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-center space-y-1 shadow-xs">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">REXBEBE</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Luxury Baby Boutique</p>
                </div>
              </div>
            </div>

            {/* VISION, MISSION, AND VALUES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* VISION */}
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-md relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 block mb-1">
                  Our Direction
                </span>
                <h3 className="font-heading text-xl font-extrabold text-stone-900 dark:text-white mb-3">
                  Vision
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                  To be a globally recognized leader in innovation, building world-class brands and setting new
                  benchmarks across industries.
                </p>
              </div>

              {/* MISSION */}
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-md relative overflow-hidden group hover:border-pink-300 dark:hover:border-pink-600 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 flex items-center justify-center mb-5">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-pink-600 dark:text-pink-400 block mb-1">
                  Our Purpose
                </span>
                <h3 className="font-heading text-xl font-extrabold text-stone-900 dark:text-white mb-3">
                  Mission
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                  Catering the best customer satisfaction to the market.
                </p>
              </div>

              {/* VALUES */}
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 shadow-md relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-sky-600 dark:text-sky-400 block mb-1">
                  Our Foundation
                </span>
                <h3 className="font-heading text-xl font-extrabold text-stone-900 dark:text-white mb-3">
                  Our Values
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                  At Classen Holdings, our core values drive every decision we make. We believe in integrity,
                  innovation, quality, and long-term partnerships. These principles guide our growth, shape our
                  culture, and define how we deliver value across every industry we serve.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION: OUR BUSINESS SECTORS */}
        <section
          id="business-sectors"
          className="py-16 sm:py-24 bg-white dark:bg-slate-900 scroll-mt-20 border-b border-stone-200/60 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-xs font-extrabold tracking-wider uppercase">
                <Layers className="w-3.5 h-3.5" />
                <span>Diversified Portfolio</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white">
                Our Business Sectors
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                Discover the specialized industries and commercial capabilities powering Classen Holdings across Sri Lanka
                and global markets.
              </p>
            </div>

            {/* 6 Responsive Sector Image Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {BUSINESS_SECTORS.map((sector) => (
                <a
                  key={sector.title}
                  href={sector.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col bg-stone-50/70 dark:bg-slate-800/70 rounded-3xl overflow-hidden border border-stone-200/80 dark:border-slate-700/80 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-200 dark:bg-slate-700">
                    <Image
                      src={sector.image}
                      alt={`${sector.title} - Classen Holdings Business Sector`}
                      fill
                      className="object-cover object-center transform transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Floating Sector Badge */}
                    <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-stone-900 dark:text-stone-100 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs">
                      {sector.badge}
                    </span>

                    {/* External Link Icon Button */}
                    <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:bg-amber-500 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </div>

                    {/* Overlay Title */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h3 className="font-heading text-xl font-extrabold drop-shadow-sm">
                        {sector.title}
                      </h3>
                      <p className="text-[11px] font-medium text-amber-200 drop-shadow-xs">
                        {sector.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      {sector.description}
                    </p>

                    <div className="pt-2 border-t border-stone-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      <span className="uppercase tracking-wider">Explore Sector Profile</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </a>
              ))}
            </div>

          </div>
        </section>

        {/* CALL TO ACTION SECTION */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-amber-50 via-pink-50/50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-white">
              Discover the REXBEBE Baby Experience
            </h2>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
              Explore our new seasonal collections or reach out to our concierge team for personalized gift
              consultations and styling assistance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-purple-950 hover:bg-purple-900 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <span>Shop Baby Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-slate-700 text-xs font-extrabold uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-slate-700 transition-all shadow-xs hover:scale-105 active:scale-95"
              >
                <span>Contact Concierge</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
