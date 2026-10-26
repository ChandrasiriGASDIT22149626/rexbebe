'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Warehouse,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Edit2,
  History,
  RotateCcw,
  Sparkles,
  Package,
  Layers,
  ArrowUpDown,
  Save,
  X,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { InventoryItemView } from '../../../services/inventoryService';

export default function AdminInventoryPage() {
  const { inventoryItems, stockAdjustments, updateInventoryStock, refreshInventory } = useAdminData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemView | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach((i) => set.add(i.categoryName));
    return Array.from(set);
  }, [inventoryItems]);

  // Filtered inventory list
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.color && item.color.toLowerCase().includes(q)) ||
        (item.size && item.size.toLowerCase().includes(q));

      const matchCategory = categoryFilter === 'ALL' || item.categoryName === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.stockStatus === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [inventoryItems, searchQuery, categoryFilter, statusFilter]);

  // Quick increment/decrement stock
  const handleQuickAdjust = async (item: InventoryItemView, delta: number) => {
    const nextQty = Math.max(0, item.quantity + delta);
    const reason = delta > 0 ? `Quick restock (+${delta})` : `Quick deduction (${delta})`;
    try {
      await updateInventoryStock(item.variantId, nextQty, reason);
      showToast('Changes saved successfully.');
    } catch (e) {
      showToast("We couldn't save your changes. Your existing information has not been intentionally removed. Please try again.");
    }
  };

  // Open custom edit modal
  const handleOpenEdit = (item: InventoryItemView) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditReason('Manual inventory count reconciliation');
  };

  // Save custom stock edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (editQty < 0) {
      alert('Stock quantity cannot be negative.');
      return;
    }
    try {
      await updateInventoryStock(editingItem.variantId, editQty, editReason || 'Staff stock adjustment');
      showToast('Changes saved successfully.');
      setEditingItem(null);
    } catch (e) {
      showToast("We couldn't save your changes. Your existing information has not been intentionally removed. Please try again.");
    }
  };

  // Metric counts
  const totalUnits = useMemo(() => inventoryItems.reduce((s, i) => s + i.quantity, 0), [inventoryItems]);
  const lowStockCount = useMemo(() => inventoryItems.filter((i) => i.stockStatus === 'LOW_STOCK').length, [inventoryItems]);
  const outOfStockCount = useMemo(() => inventoryItems.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length, [inventoryItems]);

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Inventory Management"
          subtitle="Check available stock, update quantities and identify products that need restocking."
          actions={
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold transition-all shadow-2xs"
              >
                <History className="w-3.5 h-3.5 text-amber-700" />
                <span>Adjustment History ({stockAdjustments.length})</span>
              </button>
            </div>
          }
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Total Stock In Store
              </span>
              <p className="text-2xl sm:text-3xl font-black text-stone-900">{totalUnits} Units</p>
              <span className="text-[10px] text-stone-500">{inventoryItems.length} Tracked Variants</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Healthy Stock
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800">
                {inventoryItems.filter((i) => i.stockStatus === 'IN_STOCK').length} Variants
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">Ready for customer orders</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                Low Stock Alert
              </span>
              <p className="text-2xl sm:text-3xl font-black text-orange-800">{lowStockCount} Variants</p>
              <span className="text-[10px] text-orange-600 font-semibold">Below restock threshold</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Out of Stock
              </span>
              <p className="text-2xl sm:text-3xl font-black text-rose-800">{outOfStockCount} Variants</p>
              <span className="text-[10px] text-rose-600 font-semibold">Immediate reorder required</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, color or size..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock Only</option>
                  <option value="LOW_STOCK">Low Stock Only</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Product & Variant</th>
                    <th className="p-4">SKU Code</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Color</th>
                    <th className="p-4">Size</th>
                    <th className="p-4 text-center">Available Stock</th>
                    <th className="p-4">Threshold</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Quick Stock Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.variantId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4 flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                            <Image
                              src={item.image || '/images/products/organic-onesie.jpg'}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-xs">{item.productName}</p>
                            <span className="text-[10px] text-stone-400">
                              Updated {new Date(item.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-stone-700">{item.sku}</td>
                        <td className="p-4 text-stone-600 font-medium">{item.categoryName}</td>
                        <td className="p-4 text-stone-700 font-medium">{item.color || 'Standard'}</td>
                        <td className="p-4 text-stone-700 font-medium">{item.size || 'One Size'}</td>
                        <td className="p-4 text-center">
                          <span className="font-black text-sm text-stone-900">{item.quantity}</span>
                          <span className="text-[10px] text-stone-400 block">units</span>
                        </td>
                        <td className="p-4 text-stone-500 font-semibold">{item.lowStockThreshold} units</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 ${
                              item.stockStatus === 'IN_STOCK'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.stockStatus === 'LOW_STOCK'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span>
                              {item.stockStatus === 'IN_STOCK'
                                ? 'IN STOCK'
                                : item.stockStatus === 'LOW_STOCK'
                                ? 'LOW STOCK'
                                : 'OUT OF STOCK'}
                            </span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleQuickAdjust(item, -1)}
                              disabled={item.quantity <= 0}
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 disabled:opacity-30 transition-all"
                              title="Decrease by 1"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(item, 1)}
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-all"
                              title="Increase by 1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="ml-1 inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-800 text-[11px] font-bold transition-all shadow-2xs"
                            >
                              <Edit2 className="w-3 h-3 text-amber-700" />
                              <span>Set Exact Qty</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-stone-400 font-bold">
                        No inventory records match your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* EDIT EXACT QUANTITY MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-stone-900">
                  Update Stock Quantity
                </h3>
                <p className="text-xs text-stone-500 font-mono">{editingItem.sku}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">New Available Quantity (Units)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold bg-stone-50 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-stone-400">Current available stock: {editingItem.quantity} units</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Received new stock delivery, Inventory count check"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition-all"
                >
                  Save Stock Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT AUDIT TRAIL MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 border border-stone-200 shadow-2xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-heading font-black text-stone-900 flex items-center space-x-2">
                  <History className="w-4 h-4 text-amber-700" />
                  <span>Stock Adjustment History</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Audit log of inventory updates, manual adjustments and automated order deductions.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
              {stockAdjustments.length > 0 ? (
                stockAdjustments.map((adj) => (
                  <div key={adj.id} className="p-4 bg-white hover:bg-stone-50/50 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900">{adj.productName}</span>
                        <span className="font-mono text-stone-500">({adj.sku})</span>
                      </div>
                      <p className="text-[11px] text-stone-600">{adj.reason}</p>
                      <p className="text-[10px] text-stone-400">
                        Adjusted by {adj.adjustedBy} on {new Date(adj.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          adj.change > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {adj.change > 0 ? `+${adj.change}` : adj.change} units
                      </span>
                      <p className="text-[10px] text-stone-400">
                        {adj.previousQuantity} → {adj.newQuantity} units
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-stone-400 font-bold">
                  No stock adjustments recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
