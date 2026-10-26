'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { pageService, PageItem } from '../../../services/pageService';
import { Lock, FileText, ChevronRight, ArrowLeft } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export default function DynamicWebsitePage({ params }: Props) {
  const [page, setPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      setIsLoading(true);
      try {
        const data = await pageService.getPageBySlug(params.slug);
        setPage(data);
      } catch (err: any) {
        setError(err.message || 'Page not found');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPage();
  }, [params.slug]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center p-8 bg-[#FAF9F6]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-500">Loading page content...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !page) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center p-8 bg-[#FAF9F6]">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-heading font-black text-stone-900">Page Not Found</h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              The page you are looking for does not exist or may have been removed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return Home</span>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Publication status check
  if (page.status !== 'published') {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center p-8 bg-[#FAF9F6]">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              Draft Content
            </span>
            <h1 className="text-xl font-heading font-black text-stone-900">{page.name}</h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              This storefront page is currently in draft mode and undergoing review by the boutique administrative team.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Boutique</span>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FBF9F5]">
        {/* Banner Image */}
        {page.bannerImage && (
          <div className="w-full h-64 sm:h-80 md:h-96 relative bg-stone-100 overflow-hidden">
            <Image
              src={page.bannerImage}
              alt={page.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-stone-950/30" />
            <div className="absolute inset-0 flex items-center justify-center text-center p-4">
              <div className="max-w-2xl text-white space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  REXBEBE BOUTIQUE
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black">
                  {page.heading || page.name}
                </h1>
                {page.shortDescription && (
                  <p className="text-xs sm:text-sm text-stone-100 font-medium max-w-lg mx-auto">
                    {page.shortDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
          {!page.bannerImage && (
            <div className="text-center space-y-3">
              <span className="text-xs font-bold tracking-widest uppercase text-amber-800">
                REXBEBE BOUTIQUE
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl font-black text-stone-900">
                {page.heading || page.name}
              </h1>
              {page.shortDescription && (
                <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
                  {page.shortDescription}
                </p>
              )}
            </div>
          )}

          {/* Body Content */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/80 shadow-2xs space-y-6">
            <div className="prose prose-stone max-w-none text-stone-700 text-sm leading-relaxed whitespace-pre-line font-medium">
              {page.detailedDescription || page.shortDescription}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
