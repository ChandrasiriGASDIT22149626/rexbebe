'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  LayoutTemplate,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  Heart,
  Truck,
  Star,
  ShieldCheck,
  Award,
  Gift,
  Percent,
  CheckCircle2,
  Eye,
  Layers,
  X,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { HomepageConfig } from '../../../types/admin';

export default function AdminHomepagePage() {
  const { homepageConfig, updateHomepageConfig, resetHomepageConfig } = useAdminData();

  // Local draft state for smooth editing
  const [draft, setDraft] = useState<HomepageConfig>(homepageConfig);
  const [activeTab, setActiveTab] = useState<
    'hero' | 'announcements' | 'bestsellers' | 'categories' | 'story' | 'whyrexbebe' | 'reviews' | 'social'
  >('hero');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync draft when homepageConfig changes from outside
  React.useEffect(() => {
    setDraft(homepageConfig);
  }, [homepageConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateHomepageConfig(draft);
      showToast('Changes saved successfully.');
    } catch (err: any) {
      showToast(
        err.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all homepage sections to their default values?')) {
      setIsSaving(true);
      try {
        await resetHomepageConfig();
        showToast('Changes saved successfully. Homepage reset to defaults.');
      } catch (err: any) {
        showToast(
          err.message ||
            "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
        );
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Helper updaters
  const updateHero = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const updateAnnouncements = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      announcements: { ...prev.announcements, [field]: value },
    }));
  };

  const updateBestSellers = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      bestSellers: { ...prev.bestSellers, [field]: value },
    }));
  };

  const updateStory = (field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      brandStory: { ...prev.brandStory, [field]: value },
    }));
  };

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | null>(null);

  return (
    <div className="flex min-h-screen bg-[#F8F7F4]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Homepage Studio"
          subtitle="Edit the content, images, buttons and sections of your REXBEBE homepage with zero code."
          actions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold transition-all shadow-2xs"
                title="Preview Mobile layout"
              >
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>Mobile Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold transition-all shadow-2xs"
                title="Preview Desktop layout"
              >
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Desktop Preview</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold transition-all"
                title="Reset to default settings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Publish Changes 🚀</span>
              </button>
            </div>
          }
        />

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-stone-900 text-amber-400 border border-amber-500/30 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-bold animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Studio Navigation Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-stone-200/80 shadow-xs flex items-center overflow-x-auto scrollbar-none space-x-1.5">
            {[
              { id: 'hero', label: '🦕 Hero Banner' },
              { id: 'announcements', label: '📢 Announcement Bar' },
              { id: 'bestsellers', label: '⭐ Best Sellers Section' },
              { id: 'categories', label: '🌸 Categories Showcase' },
              { id: 'story', label: '📖 Brand Story' },
              { id: 'whyrexbebe', label: '🌿 Why Rexbebe (Trust)' },
              { id: 'reviews', label: '💬 Customer Reviews' },
              { id: 'social', label: '📸 Instagram Feed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/20'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: HERO SECTION */}
          {activeTab === 'hero' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">Hero Section Customizer</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Controls the main opening headline, cute mascot speech bubble, and call-to-action buttons.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                  Top of Homepage
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                <div>
                  <label className="block text-stone-700 mb-1">Headline Line 1 (Solid Dark Text)</label>
                  <input
                    type="text"
                    value={draft.hero.headlineLine1}
                    onChange={(e) => updateHero('headlineLine1', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Little Moments."
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Appears on the first line of the hero card</p>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Headline Line 2 (Rainbow Pastel Gradient)</label>
                  <input
                    type="text"
                    value={draft.hero.headlineLine2}
                    onChange={(e) => updateHero('headlineLine2', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Big Adventures."
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Rendered with vibrant pastel gradient text clip</p>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Dinosaur Mascot Speech Bubble</label>
                  <input
                    type="text"
                    value={draft.hero.speechBubbleText}
                    onChange={(e) => updateHero('speechBubbleText', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. Welcome to REXBEBE! 🦕✨"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">The floating greeting above the 3D dinosaur mascot</p>
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Small Top Capsule Badge</label>
                  <input
                    type="text"
                    value={draft.hero.badgeText}
                    onChange={(e) => updateHero('badgeText', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 2026 Atelier Collection"
                  />
                </div>

                {/* CTA 1 */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Primary CTA Button (Shopping)
                  </p>
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Button Text</label>
                    <input
                      type="text"
                      value={draft.hero.ctaPrimaryText}
                      onChange={(e) => updateHero('ctaPrimaryText', e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Destination Link / URL</label>
                    <input
                      type="text"
                      value={draft.hero.ctaPrimaryHref}
                      onChange={(e) => updateHero('ctaPrimaryHref', e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                </div>

                {/* CTA 2 */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    Secondary CTA Button (Explore)
                  </p>
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Button Text</label>
                    <input
                      type="text"
                      value={draft.hero.ctaSecondaryText}
                      onChange={(e) => updateHero('ctaSecondaryText', e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Destination Link / URL</label>
                    <input
                      type="text"
                      value={draft.hero.ctaSecondaryHref}
                      onChange={(e) => updateHero('ctaSecondaryHref', e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-pink-50 to-amber-50 border border-stone-200/80 space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-extrabold">
                  Live Headline Preview:
                </span>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-heading">
                    {draft.hero.headlineLine1 || 'Little Moments.'}
                  </h2>
                  <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#38BDF8] via-[#EC4899] to-[#FB923C] font-heading">
                    {draft.hero.headlineLine2 || 'Big Adventures.'}
                  </h2>
                </div>
                <div className="pt-2 flex items-center space-x-3">
                  <span className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs">
                    {draft.hero.ctaPrimaryText}
                  </span>
                  <span className="px-4 py-2 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-xs">
                    {draft.hero.ctaSecondaryText}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">Top Announcement Bar</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Scrolling promotional bar at the very top of every storefront page
                  </p>
                </div>
                <label className="flex items-center space-x-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.announcements.enabled}
                    onChange={(e) => updateAnnouncements('enabled', e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>Enable Bar</span>
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-stone-700">Announcement Messages</p>
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = [
                        ...draft.announcements.items,
                        {
                          id: `ann-${Date.now()}`,
                          text: 'NEW SEASON OFFER: 15% OFF WITH CODE ATELIER2026 ✨',
                          iconName: 'Sparkles',
                          active: true,
                        },
                      ];
                      updateAnnouncements('items', newItems);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 hover:bg-amber-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Message</span>
                  </button>
                </div>

                {draft.announcements.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-stone-400">#{index + 1}</span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const updated = draft.announcements.items.map((a) =>
                              a.id === item.id ? { ...a, text: e.target.value } : a
                            );
                            updateAnnouncements('items', updated);
                          }}
                          className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-1.5 text-xs font-bold text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={(e) => {
                            const updated = draft.announcements.items.map((a) =>
                              a.id === item.id ? { ...a, active: e.target.checked } : a
                            );
                            updateAnnouncements('items', updated);
                          }}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>Active</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draft.announcements.items.filter((a) => a.id !== item.id);
                          updateAnnouncements('items', updated);
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BEST SELLERS */}
          {activeTab === 'bestsellers' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-bold text-stone-900 font-heading">
                  Best Sellers Section Settings
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Controls the section headline, subtitle, and parent favorites presentation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                <div>
                  <label className="block text-stone-700 mb-1">Small Capsule Badge</label>
                  <input
                    type="text"
                    value={draft.bestSellers.badge}
                    onChange={(e) => updateBestSellers('badge', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                    placeholder="Parent Favorites 💖"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={draft.bestSellers.title}
                    onChange={(e) => updateBestSellers('title', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                    placeholder="FEATURED LITTLE FAVORITES"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-stone-700 mb-1">Subtitle / Supporting Description</label>
                  <textarea
                    rows={2}
                    value={draft.bestSellers.subtitle}
                    onChange={(e) => updateBestSellers('subtitle', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                    placeholder="Curated with unconditional love and ultra-gentle craftsmanship..."
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Maximum Items to Display</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={draft.bestSellers.maxItems}
                    onChange={(e) => updateBestSellers('maxItems', Number(e.target.value))}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start space-x-3 text-xs text-emerald-900">
                <Star className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 fill-emerald-500" />
                <div>
                  <p className="font-bold">How items appear in Best Sellers:</p>
                  <p className="mt-0.5 text-emerald-800">
                    Go to the{' '}
                    <Link href="/admin/products" className="underline font-black hover:text-emerald-950">
                      Products Management
                    </Link>{' '}
                    tab and click the <strong>🌿 YES (Active)</strong> toggle on any item. Those items will
                    immediately be showcased in this section on your public homepage!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES SHOWCASE */}
          {activeTab === 'categories' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">
                    Circular Categories Showcase
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Customize the floating circular category bubbles on the homepage
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...draft.categories,
                      {
                        id: `cat-${Date.now()}`,
                        name: 'BABY SHOES',
                        subtitle: 'First soft steps',
                        href: '/shop?category=shoes',
                        image: '/images/products/organic-onesie.jpg',
                        badge: '👟',
                        bg: 'from-amber-100/80 via-orange-50/70 to-yellow-50/60',
                        ringBorder: 'border-amber-300 group-hover:border-amber-400',
                        dotBg: 'bg-amber-400',
                      },
                    ];
                    setDraft({ ...draft, categories: next });
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 hover:bg-amber-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category Bubble</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draft.categories.map((cat, idx) => (
                  <div
                    key={cat.id || idx}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{cat.badge}</span>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const updated = draft.categories.map((c, i) =>
                              i === idx ? { ...c, name: e.target.value } : c
                            );
                            setDraft({ ...draft, categories: updated });
                          }}
                          className="font-bold text-stone-900 text-xs bg-white border border-stone-200 px-2 py-1 rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draft.categories.filter((_, i) => i !== idx);
                          setDraft({ ...draft, categories: updated });
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="text-stone-500 font-bold block mb-0.5">Subtitle</label>
                        <input
                          type="text"
                          value={cat.subtitle}
                          onChange={(e) => {
                            const updated = draft.categories.map((c, i) =>
                              i === idx ? { ...c, subtitle: e.target.value } : c
                            );
                            setDraft({ ...draft, categories: updated });
                          }}
                          className="w-full bg-white border border-stone-200 px-2 py-1 rounded text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="text-stone-500 font-bold block mb-0.5">Link (Href)</label>
                        <input
                          type="text"
                          value={cat.href}
                          onChange={(e) => {
                            const updated = draft.categories.map((c, i) =>
                              i === idx ? { ...c, href: e.target.value } : c
                            );
                            setDraft({ ...draft, categories: updated });
                          }}
                          className="w-full bg-white border border-stone-200 px-2 py-1 rounded text-stone-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BRAND STORY */}
          {activeTab === 'story' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-bold text-stone-900 font-heading">
                  Brand Story & Ethos Section
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Controls the "Little Days. Big Memories." story card
                </p>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-stone-700 mb-1">Small Capsule Tag</label>
                  <input
                    type="text"
                    value={draft.brandStory.tag}
                    onChange={(e) => updateStory('tag', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Main Headline</label>
                  <input
                    type="text"
                    value={draft.brandStory.title}
                    onChange={(e) => updateStory('title', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 mb-1">Story Paragraph</label>
                  <textarea
                    rows={3}
                    value={draft.brandStory.description1}
                    onChange={(e) => updateStory('description1', e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WHY REXBEBE */}
          {activeTab === 'whyrexbebe' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-bold text-stone-900 font-heading">
                  Why Rexbebe (Trust Propositions Bar)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  The 5 confidence cards shown across the storefront
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {draft.whyRexbebe.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs font-semibold"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">{item.iconName}</span>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={(e) => {
                            const updated = draft.whyRexbebe.map((w, i) =>
                              i === idx ? { ...w, active: e.target.checked } : w
                            );
                            setDraft({ ...draft, whyRexbebe: updated });
                          }}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="text-[10px]">Show</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-stone-500 text-[10px]">Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = draft.whyRexbebe.map((w, i) =>
                            i === idx ? { ...w, title: e.target.value } : w
                          );
                          setDraft({ ...draft, whyRexbebe: updated });
                        }}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 text-[10px]">Subtitle</label>
                      <input
                        type="text"
                        value={item.subtitle}
                        onChange={(e) => {
                          const updated = draft.whyRexbebe.map((w, i) =>
                            i === idx ? { ...w, subtitle: e.target.value } : w
                          );
                          setDraft({ ...draft, whyRexbebe: updated });
                        }}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">
                    Customer Reviews & Testimonials
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Manage testimonials displayed in the Customer Reviews section
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newRev = {
                      id: `rev-${Date.now()}`,
                      name: 'Amara Wijesinghe',
                      role: 'New Mom',
                      location: 'Colombo, Sri Lanka',
                      rating: 5,
                      text: 'Outstanding quality and luxurious packaging! Highly recommended for all moms.',
                      verified: true,
                      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
                      productName: 'Aurelia Organic Romper',
                      productImage: '/images/products/organic-onesie.jpg',
                      badgeEmoji: '🧸',
                    };
                    setDraft({ ...draft, reviews: [newRev, ...draft.reviews] });
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 hover:bg-amber-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Testimonial</span>
                </button>
              </div>

              <div className="space-y-4">
                {draft.reviews.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={rev.name}
                          onChange={(e) => {
                            const updated = draft.reviews.map((r, i) =>
                              i === idx ? { ...r, name: e.target.value } : r
                            );
                            setDraft({ ...draft, reviews: updated });
                          }}
                          className="font-bold text-stone-900 bg-white border border-stone-200 px-2 py-1 rounded"
                          placeholder="Customer Name"
                        />
                        <input
                          type="text"
                          value={rev.location}
                          onChange={(e) => {
                            const updated = draft.reviews.map((r, i) =>
                              i === idx ? { ...r, location: e.target.value } : r
                            );
                            setDraft({ ...draft, reviews: updated });
                          }}
                          className="text-stone-500 bg-white border border-stone-200 px-2 py-1 rounded"
                          placeholder="Location"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draft.reviews.filter((_, i) => i !== idx);
                          setDraft({ ...draft, reviews: updated });
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={rev.text}
                        onChange={(e) => {
                          const updated = draft.reviews.map((r, i) =>
                            i === idx ? { ...r, text: e.target.value } : r
                          );
                          setDraft({ ...draft, reviews: updated });
                        }}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-800 font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SOCIAL / INSTAGRAM */}
          {activeTab === 'social' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-bold text-stone-900 font-heading">
                  Instagram & Social Feed
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Controls the bottom carousel showing Instagram imagery
                </p>
              </div>

              <div className="space-y-4 text-xs font-semibold max-w-md">
                <div>
                  <label className="block text-stone-700 mb-1">Instagram Official Handle</label>
                  <input
                    type="text"
                    value={draft.instagram.handle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        instagram: { ...draft.instagram, handle: e.target.value },
                      })
                    }
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                    placeholder="@rexbebe_baby"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* HOMEPAGE LIVE PREVIEW MODAL */}
      {previewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full h-[90vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden">
            {/* Modal Bar */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <span className="font-heading font-black text-sm text-amber-400">
                  REXBEBE Homepage Live Preview
                </span>
                <span className="text-xs text-stone-400">
                  ({previewMode === 'mobile' ? 'Mobile Viewport 390px' : 'Desktop Viewport 100%'})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'mobile' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  📱 Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'desktop' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300 hover:text-white'
                  }`}
                >
                  💻 Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(null)}
                  className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex-1 bg-stone-100 flex items-center justify-center p-4 overflow-hidden">
              <div
                className={`h-full bg-white transition-all shadow-xl rounded-2xl overflow-hidden border border-stone-300 flex flex-col ${
                  previewMode === 'mobile' ? 'w-[390px] max-w-full' : 'w-full max-w-6xl'
                }`}
              >
                <iframe
                  src="/"
                  title="Homepage Live Preview"
                  className="w-full flex-1 border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
