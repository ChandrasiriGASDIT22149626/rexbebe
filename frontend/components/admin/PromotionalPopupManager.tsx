'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Upload,
  Eye,
  Save,
  Tag,
  Calendar,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { SalePopupCard, SalePopupData } from '../promotions/SalePopupCard';

const SAMPLE_IMAGES = [
  { label: 'Organic Onesie', url: '/images/products/organic-onesie.jpg' },
  { label: 'Cashmere Romper', url: '/images/products/insta-cocomelon-family-cream.jpg' },
  { label: 'Peppa Pink Dress', url: '/images/products/insta-peppa-pink-dress.webp' },
  { label: 'Baby Bluey Outfit', url: '/images/products/insta-bluey-boy-dungaree.webp' },
];

export function PromotionalPopupManager({ onShowToast }: { onShowToast?: (msg: string) => void }) {
  const [config, setConfig] = useState<SalePopupData>({
    enabled: true,
    heading: 'LITTLE ONES SALE!',
    subheading: 'SPECIAL OFFER 🌸',
    description: 'Enjoy special discounts on selected baby clothing! Soft organic cashmere rompers & pastel sets for your little darling.',
    offerBadge: '20% OFF',
    discountPercentage: 20,
    discountType: 'PERCENTAGE',
    promoCode: 'LITTLE20',
    minSpend: 0,
    imageUrl: '/images/products/organic-onesie.jpg',
    shopNowText: 'Shop Little Ones Sale 🛍',
    shopNowHref: '/sale',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    displayDelaySeconds: 2,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load existing configuration from backend
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('rexbebe_admin_token') || '';
        const res = await fetch('/api/promotions/popup/admin', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setConfig((prev) => ({ ...prev, ...data.data }));
        }
      } catch (err) {
        console.warn('Failed to load admin popup config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('rexbebe_admin_token') || '';
      const res = await fetch('/api/promotions/popup/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Promotional Popup settings saved and published successfully! 🌸', type: 'success' });
        if (onShowToast) onShowToast('Promotional Popup updated successfully! ✨');
      } else {
        setMessage({ text: data.message || 'Failed to save settings', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Network error while saving', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'promotions');

    try {
      const token = localStorage.getItem('rexbebe_admin_token') || '';
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        setConfig((prev) => ({ ...prev, imageUrl: data.data.url }));
        setMessage({ text: 'Image uploaded and optimized successfully! ✨', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Image upload failed', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Upload error', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 text-pink-600 animate-spin" />
        <span className="text-xs font-bold text-stone-600">Loading Promotional Popup Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Preview Modal Overlay */}
      {previewOpen && (
        <div className="relative z-50">
          <SalePopupCard forceOpen={true} previewData={config} />
          <button
            onClick={() => setPreviewOpen(false)}
            className="fixed bottom-6 right-6 z-[10000] min-h-[46px] px-6 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl shadow-2xl hover:bg-black transition-all active:scale-[0.98] cursor-pointer flex items-center space-x-2"
          >
            <span>Exit Preview</span>
          </button>
        </div>
      )}

      {/* Header & Status Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-pink-50 text-pink-600 font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-stone-900">
                Promotional Popup Management
              </h2>
              <p className="text-xs text-stone-500">
                Configure the homepage promotional sale popup, baby clothing imagery, promo code, and discount settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center space-x-2 min-h-[46px] px-5 py-2.5 rounded-xl border border-pink-200 text-pink-700 bg-pink-50 hover:bg-pink-100 text-xs font-bold transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 min-h-[46px] px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Main Controls & Visuals */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status & Visibility Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
              Popup Status &amp; Visibility
            </h3>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <div>
                <label className="text-sm font-bold text-stone-900 block">
                  Enable Promotional Popup
                </label>
                <p className="text-xs text-stone-500">
                  When enabled, visitors will see this modal on the homepage with a brief entry delay.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.enabled ? 'bg-pink-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={config.startDate || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={config.endDate || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Display Delay
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={config.displayDelaySeconds}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, displayDelaySeconds: Number(e.target.value) || 2 }))
                    }
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-300 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold">seconds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography & Messaging Card */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
              Content &amp; Messaging
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subheading Badge Text
                </label>
                <input
                  type="text"
                  value={config.subheading}
                  onChange={(e) => setConfig((prev) => ({ ...prev, subheading: e.target.value }))}
                  placeholder="e.g. SPECIAL OFFER 🌸"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Offer Highlight Badge
                </label>
                <input
                  type="text"
                  value={config.offerBadge}
                  onChange={(e) => setConfig((prev) => ({ ...prev, offerBadge: e.target.value }))}
                  placeholder="e.g. 20% OFF or LUXURY CAPSULE"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Main Headline
              </label>
              <input
                type="text"
                value={config.heading}
                onChange={(e) => setConfig((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder="e.g. LITTLE ONES SALE!"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-black text-stone-900 focus:ring-2 focus:ring-pink-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description / Body Copy
              </label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enjoy special discounts on selected baby clothing..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-300 focus:outline-none"
              />
            </div>
          </div>

          {/* CTA & Shop Now Button Destination */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
              Call-To-Action (Shop Now)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={config.shopNowText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, shopNowText: e.target.value }))}
                  placeholder="e.g. Shop Now 🌸"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={config.shopNowHref}
                  onChange={(e) => setConfig((prev) => ({ ...prev, shopNowHref: e.target.value }))}
                  placeholder="e.g. /sale or /collections/sale"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Image & Discount Rule Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Promotional Image Selection & Upload */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">
              Promotional Baby Clothing Image
            </h3>

            {/* Image Preview Box */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group flex items-center justify-center">
              {config.imageUrl ? (
                <Image
                  src={config.imageUrl}
                  alt="Promotional Popup Graphic"
                  fill
                  className="object-cover object-center"
                />
              ) : (
                <div className="text-stone-400 text-xs font-bold">No image selected</div>
              )}

              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="px-3.5 py-2 bg-white text-stone-900 text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-stone-50 flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Replace Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Direct Upload / URL Input */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-stone-600">
                Image Source URL or Path
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={config.imageUrl}
                  onChange={(e) => setConfig((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="/images/products/organic-onesie.jpg"
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
                <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer shrink-0">
                  <span>Browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Quick Select Presets */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Quick Baby Clothing Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.url}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, imageUrl: sample.url }))}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        config.imageUrl === sample.url
                          ? 'bg-pink-100 text-pink-700 border-pink-300'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Genuine Checkout Discount Rule Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-pink-600 flex items-center space-x-1.5">
                <Tag className="w-4 h-4" />
                <span>Synchronized Checkout Discount</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Server-Enforced
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Promo / Coupon Code
                </label>
                <input
                  type="text"
                  value={config.promoCode}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, promoCode: e.target.value.toUpperCase().replace(/\s+/g, '') }))
                  }
                  placeholder="e.g. LITTLE20"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-black text-pink-600 uppercase tracking-wider focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  This exact code is verified and applied automatically when copied from the popup.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Discount Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={config.discountPercentage}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, discountPercentage: Number(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-pink-300 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-stone-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Minimum Spend (LKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={config.minSpend}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, minSpend: Number(e.target.value) || 0 }))
                    }
                    placeholder="0 for all orders"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:ring-2 focus:ring-pink-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-pink-800 block">
                  Authoritative Discount Rule:
                </span>
                <p className="text-[11px] text-pink-700 leading-relaxed">
                  When a customer enters <strong>{config.promoCode || 'LITTLE20'}</strong> at checkout, the backend will verify validity and deduct <strong>{config.discountPercentage}%</strong> from product subtotal on orders over <strong>LKR {config.minSpend.toLocaleString()}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

