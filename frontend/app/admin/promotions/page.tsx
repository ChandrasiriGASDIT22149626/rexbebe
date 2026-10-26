'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Ticket,
  Sparkles,
  Star,
  Check,
  X,
  Search,
  ExternalLink,
  Tag,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { Product } from '../../../types/product';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function AdminPromotionsPage() {
  const {
    products,
    updateProduct,
    toggleNewArrival,
    toggleBestSeller,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<'sale' | 'new-in' | 'best-sellers'>('sale');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Price Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (activeTab === 'sale') {
      return Boolean(p.comparePrice && p.comparePrice > p.price);
    }
    if (activeTab === 'new-in') {
      return Boolean(p.isNewArrival);
    }
    if (activeTab === 'best-sellers') {
      return Boolean(p.isBestSeller);
    }
    return true;
  });

  const allFilteredForManagement = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.name.toLowerCase().includes(q)
    );
  });

  const handleOpenPriceEdit = (p: Product) => {
    setEditingProduct(p);
    setSalePrice(p.price);
    setOriginalPrice(p.comparePrice || Math.round(p.price * 1.25));
  };

  const handleSavePriceEdit = () => {
    if (!editingProduct) return;
    if (salePrice <= 0) {
      showToast('Please enter a valid selling price greater than 0');
      return;
    }

    const updated: Product = {
      ...editingProduct,
      price: salePrice,
      comparePrice: originalPrice > salePrice ? originalPrice : undefined,
    };

    updateProduct(updated);
    setEditingProduct(null);
    showToast(`Updated pricing for ${updated.name}! 🏷️`);
  };

  const handleToggleSaleOnProduct = (p: Product) => {
    const isOnSale = Boolean(p.comparePrice && p.comparePrice > p.price);
    if (isOnSale) {
      // Remove sale
      const updated: Product = { ...p, comparePrice: undefined };
      updateProduct(updated);
      showToast(`${p.name} removed from Sale.`);
    } else {
      // Enable sale: original price becomes 20% higher
      const updated: Product = {
        ...p,
        comparePrice: Math.round(p.price * 1.25),
      };
      updateProduct(updated);
      showToast(`${p.name} is now on Sale! 🏷️`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Promotions & Sale"
          subtitle="Manage discounts, sale prices, and choose which baby clothes appear in the New In and Sale sections."
          actions={
            <div className="flex items-center space-x-2">
              <Link
                href="/sale"
                target="_blank"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all"
              >
                <span>View Sale Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/new-in"
                target="_blank"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-all"
              >
                <span>View New In Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          }
        />

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 px-5 py-3 rounded-2xl bg-stone-900 text-amber-400 border border-amber-500/30 text-xs font-bold shadow-xl animate-fadeIn flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Instructions Card (Section 16) */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
              <Tag className="w-4 h-4" />
              <span>DISCOUNTS & PROMOTIONS MANAGEMENT</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
              <strong>Sale Products:</strong> Set a valid sale price and make sure the sale status
              is enabled to display a product on the Sale page.
              <br />
              <strong>New Arrivals:</strong> Mark products as New Arrivals to display them on the
              New In page.
            </p>
          </div>

          {/* Tab Selector & Search */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('sale')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'sale'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>
                  Sale Products ({products.filter((p) => p.comparePrice && p.comparePrice > p.price).length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new-in')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'new-in'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  New Arrivals ({products.filter((p) => p.isNewArrival).length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('best-sellers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'best-sellers'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>
                  Best Sellers ({products.filter((p) => p.isBestSeller).length})
                </span>
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search baby outfit name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider font-extrabold select-none">
                  <tr>
                    <th className="p-4">Item & Image</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Original Price</th>
                    <th className="p-4 text-center">Discount</th>
                    <th className="p-4 text-center">New Arrival</th>
                    <th className="p-4 text-center">Best Seller</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {allFilteredForManagement.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        No products match your search.
                      </td>
                    </tr>
                  ) : (
                    allFilteredForManagement.map((p) => {
                      const isOnSale = Boolean(p.comparePrice && p.comparePrice > p.price);
                      const discountPercent = isOnSale
                        ? Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100)
                        : 0;

                      return (
                        <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* Item & Image */}
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-14 rounded-xl relative overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                <Image
                                  src={p.images[0]?.url || '/images/products/organic-onesie.jpg'}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <Link
                                  href={`/products/${p.slug}`}
                                  target="_blank"
                                  className="font-bold text-stone-900 hover:text-amber-800 transition-colors block truncate"
                                >
                                  {p.name}
                                </Link>
                                <span className="text-[10px] text-stone-400 block mt-0.5">
                                  SKU: {p.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold border border-stone-200">
                              {p.category.name}
                            </span>
                          </td>

                          {/* Selling Price */}
                          <td className="p-4 font-black text-stone-900">
                            {formatCurrency(p.price)}
                          </td>

                          {/* Original Price */}
                          <td className="p-4 text-stone-500">
                            {p.comparePrice ? (
                              <span className="line-through">{formatCurrency(p.comparePrice)}</span>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>

                          {/* Discount Status Badge */}
                          <td className="p-4 text-center">
                            {isOnSale ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300 inline-block">
                                {discountPercent}% OFF
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSaleOnProduct(p)}
                                className="text-[10px] text-stone-500 hover:text-rose-700 underline font-semibold"
                              >
                                Put on Sale
                              </button>
                            )}
                          </td>

                          {/* New Arrival 1-Click Toggle */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                toggleNewArrival(p.id);
                                showToast(
                                  p.isNewArrival
                                    ? `Removed ${p.name} from New In.`
                                    : `Marked ${p.name} as New Arrival! 🌸`
                                );
                              }}
                              className={`p-1.5 rounded-xl transition-all ${
                                p.isNewArrival
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-stone-100 text-stone-400 hover:text-stone-700'
                              }`}
                              title={p.isNewArrival ? 'Shown on New In page' : 'Not marked as New'}
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </td>

                          {/* Best Seller 1-Click Toggle */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                toggleBestSeller(p.id);
                                showToast(
                                  p.isBestSeller
                                    ? `Removed ${p.name} from Best Sellers.`
                                    : `Marked ${p.name} as Best Seller! ⭐`
                                );
                              }}
                              className={`p-1.5 rounded-xl transition-all ${
                                p.isBestSeller
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-stone-100 text-stone-400 hover:text-stone-700'
                              }`}
                              title={
                                p.isBestSeller
                                  ? 'Featured as Parent Favorite'
                                  : 'Not marked as Best Seller'
                              }
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleOpenPriceEdit(p)}
                                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs"
                              >
                                Edit Price
                              </button>
                              {isOnSale && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSaleOnProduct(p)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                                  title="End sale on this product"
                                >
                                  End Sale
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Quick Price & Discount Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800">
                  Update Prices & Sale
                </span>
                <h3 className="font-heading font-black text-base text-stone-900">
                  {editingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">
                  Selling Price (LKR) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold text-sm"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  Enter the price customers will pay.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">
                  Original Price (LKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  Enter the previous price if this product is on sale. Leave equal or lower to disable sale.
                </p>
              </div>

              {originalPrice > salePrice && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center justify-between">
                  <span>Customer Savings:</span>
                  <span>
                    {Math.round(((originalPrice - salePrice) / originalPrice) * 100)}% DISCOUNT (Save {formatCurrency(originalPrice - salePrice)})
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePriceEdit}
                className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all"
              >
                Save Prices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
