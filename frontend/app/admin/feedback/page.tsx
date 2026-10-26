'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  UserCheck,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Send,
  FileText,
  X,
  ThumbsUp,
  Inbox,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { FeedbackRecord } from '../../../services/adminService';

export default function AdminFeedbackPage() {
  const { feedbackItems, updateFeedbackStatus, addFeedbackNote, deleteFeedback } = useAdminData();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PRODUCT_REVIEW' | 'WEBSITE_FEEDBACK' | 'CUSTOMER_SUGGESTION' | 'SUPPORT_FEEDBACK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REVIEWED' | 'HIDDEN'>('ALL');
  const [selectedItem, setSelectedItem] = useState<FeedbackRecord | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered feedback
  const filteredFeedback = useMemo(() => {
    return feedbackItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.authorName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.message && item.message.toLowerCase().includes(q)) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q));

      const matchTab = activeTab === 'ALL' || item.type === activeTab;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchTab && matchStatus;
    });
  }, [feedbackItems, searchQuery, activeTab, statusFilter]);

  const handleUpdateStatus = async (item: FeedbackRecord, status: FeedbackRecord['status']) => {
    try {
      await updateFeedbackStatus(item.id, status);
      showToast(`Feedback status updated to ${status}.`);
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem({ ...selectedItem, status });
      }
    } catch (e) {
      showToast('Could not update status.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !noteInput.trim()) return;
    try {
      await addFeedbackNote(selectedItem.id, noteInput.trim());
      showToast('Internal note saved to record. ✍️');
      setSelectedItem({
        ...selectedItem,
        internalNotes: selectedItem.internalNotes ? `${selectedItem.internalNotes}\n${noteInput.trim()}` : noteInput.trim(),
      });
      setNoteInput('');
    } catch (e) {
      showToast('Could not save internal note.');
    }
  };

  const handleDelete = async (item: FeedbackRecord) => {
    if (confirm(`Are you sure you want to permanently delete this feedback from ${item.authorName}? This record will be permanently deleted from the database.`)) {
      try {
        await deleteFeedback(item.id);
        showToast('The item has been permanently deleted.');
        if (selectedItem?.id === item.id) setSelectedItem(null);
      } catch (e: any) {
        showToast(
          e.message ||
            "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
        );
      }
    }
  };

  // Type badge label
  const renderTypeBadge = (type: FeedbackRecord['type']) => {
    switch (type) {
      case 'PRODUCT_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[10px] font-black">PRODUCT REVIEW</span>;
      case 'WEBSITE_FEEDBACK':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black">WEBSITE FEEDBACK</span>;
      case 'CUSTOMER_SUGGESTION':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">SUGGESTION</span>;
      case 'SUPPORT_FEEDBACK':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">SUPPORT MESSAGE</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Customer Feedback & Reviews"
          subtitle="Read customer feedback and manage reviews displayed on your website."
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Quick Notice */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <p className="font-bold">Authentic Review Policy</p>
              <p className="text-amber-800">
                Customer ratings and review counts come strictly from genuine customer feedback.
                REXBEBE strictly prohibits fabricated testimonials or artificial ratings.
              </p>
            </div>
          </div>

          {/* Top Filter & Search Bar */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search feedback by customer, product, email or text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-800"
                >
                  <option value="ALL">All Moderation Statuses</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
            </div>

            {/* Feedback Type Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
              {[
                { label: 'All Feedback', value: 'ALL' },
                { label: 'Product Reviews', value: 'PRODUCT_REVIEW' },
                { label: 'Website Feedback', value: 'WEBSITE_FEEDBACK' },
                { label: 'Customer Suggestions', value: 'CUSTOMER_SUGGESTION' },
                { label: 'Support Inquiries', value: 'SUPPORT_FEEDBACK' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.value
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedback.length > 0 ? (
              filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {renderTypeBadge(item.type)}
                          {item.isVerifiedBuyer && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-stone-900 text-sm">{item.authorName}</h4>
                        <p className="text-[10px] text-stone-400">
                          {item.location || 'Boutique Visitor'} • {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {item.rating && (
                        <div className="flex items-center space-x-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-black text-xs text-stone-900">{item.rating}.0</span>
                        </div>
                      )}
                    </div>

                    {item.productName && (
                      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase text-stone-500">Product:</span>
                        <span className="font-bold text-stone-800 truncate">{item.productName}</span>
                      </div>
                    )}

                    {item.subject && (
                      <p className="text-xs font-bold text-stone-800">"{item.subject}"</p>
                    )}

                    <p className="text-xs text-stone-600 leading-relaxed italic bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                      "{item.message}"
                    </p>
                  </div>

                  {/* Actions & Status Toolbar */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-stone-500">Status:</span>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item, e.target.value as any)}
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border cursor-pointer ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'HIDDEN'
                            ? 'bg-stone-100 text-stone-600 border-stone-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="HIDDEN">HIDDEN</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                      >
                        Details & Notes
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 font-bold">
                No feedback items found matching current filters.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FEEDBACK DETAILS & INTERNAL NOTES MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-black text-stone-900">
                  Feedback from {selectedItem.authorName}
                </h3>
                <p className="text-xs text-stone-500">{selectedItem.email}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  {renderTypeBadge(selectedItem.type)}
                  {selectedItem.rating && (
                    <div className="flex items-center space-x-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{selectedItem.rating} Stars</span>
                    </div>
                  )}
                </div>
                {selectedItem.productName && (
                  <p className="text-stone-500">
                    Product: <span className="font-bold text-stone-900">{selectedItem.productName}</span>
                  </p>
                )}
                <p className="text-stone-800 leading-relaxed font-medium">"{selectedItem.message}"</p>
              </div>

              {/* Internal Staff Notes */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Internal Staff Notes</span>
                </h4>
                {selectedItem.internalNotes && (
                  <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-950 whitespace-pre-line border border-amber-200/70 font-mono">
                    {selectedItem.internalNotes}
                  </div>
                )}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an internal note or action..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-all"
                  >
                    Save Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
