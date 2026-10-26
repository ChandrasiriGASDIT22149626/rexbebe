'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Sparkles,
  Star,
  Gift,
  Mail,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Youtube,
  Video,
  Check,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { CurrencySelector } from './CurrencySelector';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    shop: false,
    care: false,
    about: false,
    follow: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="relative bg-user-pastel-header text-purple-950 pt-16 sm:pt-24 pb-8 overflow-hidden border-t border-white/80">
      {/* Header / Hero 3D Pastel World Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/hero/world_bg.jpg"
          alt="REXBEBE Pastel World Background"
          fill
          priority
          className="object-cover object-center opacity-40 mix-blend-soft-light filter brightness-105 contrast-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/15 to-white/40 backdrop-blur-[2px]" />
      </div>

      {/* Decorative Pastel Background Circles & Floating Accents */}
      <div className="absolute top-10 left-6 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl pointer-events-none animate-pulse-soft" />
      <div className="absolute top-40 right-10 w-40 h-40 bg-pink-200/50 rounded-full blur-3xl pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-36 h-36 bg-sky-200/50 rounded-full blur-2xl pointer-events-none animate-pulse-soft" />

      {/* Floating Cute Stars, Sparkles & Bows around Edges */}
      <div className="absolute top-12 left-12 text-pink-400/70 animate-float-slow pointer-events-none hidden sm:block">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="absolute top-24 right-16 text-purple-400/70 animate-bounce pointer-events-none hidden sm:block">
        <Star className="w-5 h-5 fill-purple-300" />
      </div>
      <div className="absolute bottom-40 left-8 text-sky-400/70 animate-float-slow pointer-events-none hidden sm:block">
        <span className="text-xl">☁️</span>
      </div>
      <div className="absolute bottom-32 right-12 text-pink-400/70 animate-pulse pointer-events-none hidden sm:block">
        <Heart className="w-5 h-5 fill-pink-300" />
      </div>

      <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 relative z-10">
        
        {/* 4. FOOTER TOP NEWSLETTER SECTION */}
        <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-4xl shadow-rexbebe-3d p-6 sm:p-10 md:p-12 mb-16 text-center relative overflow-hidden">
          {/* Decorative Corner Stars */}
          <span className="absolute top-4 left-6 text-amber-300 text-xl pointer-events-none">✨</span>
          <span className="absolute bottom-4 right-6 text-pink-300 text-xl pointer-events-none">🌸</span>
          <span className="absolute top-4 right-8 text-sky-300 text-xl pointer-events-none">☁️</span>

          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-pink-100/80 text-pink-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>JOIN THE REXBEBE FAMILY</span>
            </div>

            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight">
              New arrivals, little surprises & special offers
            </h3>

            <p className="text-xs sm:text-sm text-purple-900/70 max-w-lg mx-auto leading-relaxed">
              Subscribe to get exclusive preview access to seasonal capsular collections, nursery decor updates & subscriber gifts.
            </p>

            {subscribed ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold py-3 px-6 rounded-full inline-flex items-center gap-2 shadow-sm animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Welcome to the REXBEBE family! Check your inbox soon 💕</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
                <div className="relative w-full">
                  <Mail className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="w-full bg-white/90 text-purple-950 text-xs sm:text-sm pl-10 pr-4 py-3.5 rounded-full border border-purple-200/80 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white shadow-inner placeholder-purple-400/80 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white text-xs sm:text-sm font-bold tracking-wide px-8 py-3.5 rounded-full shadow-rexbebe-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span>SUBSCRIBE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* MAIN FOOTER CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-purple-200/60">
          
          {/* 5. LOGO & BRAND STATEMENT AREA */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/90 shadow-sm space-y-4">
              <Link href="/" aria-label="REXBEBE Home" className="inline-block group">
                <Image
                  src="/images/logo.png"
                  alt="REXBEBE"
                  width={320}
                  height={180}
                  className="w-36 sm:w-44 h-auto object-contain transition-transform group-hover:scale-105"
                />
              </Link>

              <p className="text-xs sm:text-sm text-purple-900/80 leading-relaxed font-medium pt-1">
                Beautiful little styles
                <br />
                for beautiful little moments.
              </p>

              {/* Company & Location Details */}
              <div className="pt-2 border-t border-purple-100 space-y-2 text-[11px] text-purple-900/80">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="font-semibold text-purple-950">Classen Holdings</strong>
                    <br />
                    62B, Meniklanda, Pepiliyawala, Sri Lanka
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <div className="space-x-1.5 flex flex-wrap">
                    <a href="tel:0332315777" className="hover:text-pink-600 transition-colors">033 2315777</a>
                    <span className="text-purple-300">/</span>
                    <a href="tel:0772303334" className="hover:text-pink-600 transition-colors">077 2303334</a>
                    <span className="text-purple-300">/</span>
                    <a href="tel:0703540988" className="hover:text-pink-600 transition-colors">070 3540988</a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a
                    href="https://wa.me/94760162181"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>WhatsApp: 0760162181</span>
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <a href="mailto:info@classen.lk" className="text-purple-900 hover:text-pink-600 hover:underline">
                    info@classen.lk
                  </a>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] text-purple-800/70 border-t border-purple-100/60">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Handcrafted with organic, certified baby-safe materials.</span>
              </div>
            </div>

            {/* 9. & 10. FOOTER 3D / CUTE BRAND CHARACTER MOMENT */}
            <div className="bg-gradient-to-br from-pink-100/70 via-purple-100/70 to-sky-100/70 border border-white/80 rounded-3xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden group">
              <div className="text-3xl animate-float-slow">🦕</div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-purple-950 flex items-center gap-1">
                  Rexy&apos;s Little Corner ✨
                </p>
                <p className="text-[11px] text-purple-800/80">
                  Made with soft cashmere & pure flax linen for gentle cuddles.
                </p>
              </div>
              <div className="flex space-x-1 text-base">
                <span className="animate-bounce">☁️</span>
                <span className="animate-pulse">⭐</span>
                <span className="animate-bounce">🎁</span>
              </div>
            </div>
          </div>

          {/* 6. DESKTOP MULTI-COLUMN NAVIGATION & 15. MOBILE ACCORDION */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-6">
            
            {/* COLUMN 1: SHOP */}
            <div className="bg-white/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-2xl p-4 md:p-0 border border-white/80 md:border-none">
              <button
                onClick={() => toggleAccordion('shop')}
                className="w-full flex items-center justify-between md:cursor-default focus:outline-none text-left"
              >
                <h4 className="font-heading text-xs font-extrabold uppercase tracking-widest text-purple-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>SHOP</span>
                </h4>
                <span className="md:hidden text-purple-700">
                  {openAccordions.shop ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              <ul
                className={`mt-4 space-y-2.5 text-xs text-purple-900/80 font-medium ${
                  openAccordions.shop ? 'block' : 'hidden md:block'
                }`}
              >
                <li>
                  <Link href="/new-in" className="hover:text-pink-600 hover:translate-x-1.5 transition-all duration-200 inline-flex items-center gap-1.5">
                    <span>New In</span>
                    <span className="text-[9px] bg-pink-100 text-pink-600 font-bold px-1.5 py-0.5 rounded-full">HOT</span>
                  </Link>
                </li>
                <li>
                  <Link href="/girls" className="hover:text-pink-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Girls
                  </Link>
                </li>
                <li>
                  <Link href="/boys" className="hover:text-pink-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Boys
                  </Link>
                </li>
                <li>
                  <Link href="/baby" className="hover:text-pink-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Baby
                  </Link>
                </li>
                <li>
                  <Link href="/collections?cat=newborn" className="hover:text-pink-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Newborn
                  </Link>
                </li>
                <li>
                  <Link href="/collections" className="hover:text-pink-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Collections
                  </Link>
                </li>
                <li>
                  <Link href="/sale" className="hover:text-rose-600 hover:translate-x-1.5 font-bold text-rose-500 transition-all duration-200 inline-flex items-center gap-1">
                    <span>Sale</span>
                    <Sparkles className="w-3 h-3 text-rose-400" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 2: CUSTOMER CARE */}
            <div className="bg-white/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-2xl p-4 md:p-0 border border-white/80 md:border-none">
              <button
                onClick={() => toggleAccordion('care')}
                className="w-full flex items-center justify-between md:cursor-default focus:outline-none text-left"
              >
                <h4 className="font-heading text-xs font-extrabold uppercase tracking-widest text-purple-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>CUSTOMER CARE</span>
                </h4>
                <span className="md:hidden text-purple-700">
                  {openAccordions.care ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              <ul
                className={`mt-4 space-y-2.5 text-xs text-purple-900/80 font-medium ${
                  openAccordions.care ? 'block' : 'hidden md:block'
                }`}
              >
                <li>
                  <Link href="/contact" className="hover:text-sky-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-sky-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-sky-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-sky-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="hover:text-sky-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link href="/size-guide" className="hover:text-sky-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Size Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: ABOUT REXBEBE */}
            <div className="bg-white/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-2xl p-4 md:p-0 border border-white/80 md:border-none">
              <button
                onClick={() => toggleAccordion('about')}
                className="w-full flex items-center justify-between md:cursor-default focus:outline-none text-left"
              >
                <h4 className="font-heading text-xs font-extrabold uppercase tracking-widest text-purple-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>ABOUT REXBEBE</span>
                </h4>
                <span className="md:hidden text-purple-700">
                  {openAccordions.about ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              <ul
                className={`mt-4 space-y-2.5 text-xs text-purple-900/80 font-medium ${
                  openAccordions.about ? 'block' : 'hidden md:block'
                }`}
              >
                <li>
                  <Link href="/about" className="hover:text-orange-600 hover:translate-x-1.5 transition-all duration-200 inline-block font-bold text-orange-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/about#classen-holdings" className="hover:text-orange-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Classen Holdings
                  </Link>
                </li>
                <li>
                  <Link href="/about#business-sectors" className="hover:text-orange-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Business Sectors
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-orange-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/store-locator" className="hover:text-orange-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Store Locator
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="hover:text-orange-600 hover:translate-x-1.5 transition-all duration-200 inline-block">
                    Reviews
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: FOLLOW US & SOCIAL ICONS */}
            <div className="bg-white/60 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-2xl p-4 md:p-0 border border-white/80 md:border-none">
              <button
                onClick={() => toggleAccordion('follow')}
                className="w-full flex items-center justify-between md:cursor-default focus:outline-none text-left"
              >
                <h4 className="font-heading text-xs font-extrabold uppercase tracking-widest text-purple-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>FOLLOW US</span>
                </h4>
                <span className="md:hidden text-purple-700">
                  {openAccordions.follow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              <div
                className={`mt-4 space-y-3 ${
                  openAccordions.follow ? 'block' : 'hidden md:block'
                }`}
              >
                <p className="text-xs text-purple-900/70 font-medium">
                  Join our cute social community:
                </p>

                {/* 8. SOCIAL MEDIA BUTTONS */}
                <div className="flex flex-col space-y-2">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-2xl bg-white/70 hover:bg-pink-100/90 text-purple-950 hover:text-pink-600 border border-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-pink-100 group-hover:bg-pink-200 text-pink-600 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Instagram</span>
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-2xl bg-white/70 hover:bg-sky-100/90 text-purple-950 hover:text-sky-600 border border-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-sky-100 group-hover:bg-sky-200 text-sky-600 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Facebook className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Facebook</span>
                  </a>

                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-2xl bg-white/70 hover:bg-purple-100/90 text-purple-950 hover:text-purple-700 border border-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-100 group-hover:bg-purple-200 text-purple-700 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Video className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">TikTok</span>
                  </a>

                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-2xl bg-white/70 hover:bg-rose-100/90 text-purple-950 hover:text-rose-600 border border-white/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-rose-100 group-hover:bg-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">YouTube</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 13. BOTTOM COPYRIGHT BAR */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-purple-900/70 font-medium gap-4 border-t border-purple-100/60 mt-8 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            <span>
              © Copyright 2026 REXBEBE. Powered by Classen Holdings |{' '}
              <a href="mailto:info@classen.lk" className="hover:text-purple-950 font-semibold underline decoration-purple-300 transition-colors">
                info@classen.lk
              </a>
            </span>
            <span className="hidden sm:inline">· Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-400 inline" />
            <CurrencySelector />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-[11px]">
            <Link href="/about" className="hover:text-purple-950 font-semibold transition-colors">
              About Us
            </Link>
            <span className="text-purple-300">|</span>
            <Link href="/contact" className="hover:text-purple-950 font-semibold transition-colors">
              Contact Us
            </Link>
            <span className="text-purple-300">|</span>
            <Link href="/privacy" className="hover:text-purple-950 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-purple-300">|</span>
            <Link href="/terms" className="hover:text-purple-950 transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-purple-300">|</span>
            <Link href="/cookies" className="hover:text-purple-950 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
