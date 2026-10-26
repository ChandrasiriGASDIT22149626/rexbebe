'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Edit2,
  Eye,
  Check,
  Upload,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Globe2,
  X,
  RotateCcw,
  Smartphone,
  Monitor,
  AlertTriangle,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { uploadService } from '../../../services/uploadService';
import { pageService, WebsitePageData } from '../../../services/pageService';

export default function AdminWebsitePagesPage() {
  const [pages, setPages] = useState<WebsitePageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePageData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<WebsitePageData | null>(null);

  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load pages from persistent database API
  const fetchPages = async () => {
    try {
      setIsLoading(true);
      const data = await pageService.getPages();
      if (Array.isArray(data)) {
        setPages(data);
      }
    } catch (err: any) {
      console.error('Error fetching website pages:', err);
      showToast("We couldn't load saved pages from the database. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenEdit = (page: WebsitePageData) => {
    setEditingPage({ ...page });
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleOpenCreate = () => {
    setEditingPage({
      id: `page-${Date.now()}`,
      name: '',
      slug: '',
      url: '',
      heading: '',
      shortDescription: '',
      detailedDescription: '',
      bannerImage: '/images/products/editorial-baby-lifestyle.jpg',
      status: 'draft',
      isVisible: false,
      seoTitle: '',
      seoDescription: '',
      lastUpdated: new Date().toISOString(),
    });
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPage) return;
    setIsUploadingBanner(true);
    try {
      const res = await uploadService.uploadImage(file);
      setEditingPage({ ...editingPage, bannerImage: res.url });
      showToast('Banner image uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'Could not upload image');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSavePage = async (status: 'published' | 'draft') => {
    if (!editingPage) return;
    if (!editingPage.name.trim()) {
      showToast('Please enter a Page Name');
      return;
    }
    if (!editingPage.heading.trim()) {
      showToast('Please enter a Main Heading for this page');
      return;
    }

    const finalSlug = (editingPage.slug || editingPage.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');

    const payload: Partial<WebsitePageData> = {
      ...editingPage,
      slug: finalSlug,
      url: `/${finalSlug}`,
      status,
      isVisible: status === 'published',
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (isCreating) {
        const created = await pageService.createPage(payload);
        setPages(prev => [...prev, created]);
        showToast('Changes saved successfully.');
      } else {
        const updated = await pageService.updatePage(editingPage.id, payload);
        setPages(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        showToast('Changes saved successfully.');
      }
      setIsEditing(false);
      setEditingPage(null);
    } catch (err: any) {
      showToast(err.message || "We couldn't save your changes. Please try again.");
    }
  };

  const handleTogglePublish = async (page: WebsitePageData) => {
    const nextStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await pageService.updatePageStatus(page.id, nextStatus);
      setPages(prev => prev.map(p => (p.id === page.id ? updated : p)));
      showToast(`Page "${page.name}" is now ${nextStatus === 'published' ? 'Published Live' : 'Draft'}.`);
    } catch (err: any) {
      showToast(err.message || 'Could not update publication status.');
    }
  };

  const handleExecuteDelete = async () => {
    if (!pageToDelete) return;
    try {
      await pageService.deletePage(pageToDelete.id);
      setPages(prev => prev.filter(p => p.id !== pageToDelete.id));
      showToast('The item has been permanently deleted.');
      setPageToDelete(null);
    } catch (err: any) {
      showToast(err.message || "We couldn't delete this page.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Website Pages"
          subtitle="Edit the text, banners, and information customers see across your storefront pages."
          actions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Page</span>
              </button>
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
          {/* Introduction Card */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
              <FileText className="w-4 h-4" />
              <span>PERSISTENT STOREFRONT PAGES (DATABASE-BACKED)</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              Customers read these pages to learn about your boutique heritage, delivery speeds,
              sizing advice and customer care. All edits and status updates save directly to the database.
            </p>
          </div>

          {/* List of Pages */}
          {isLoading ? (
            <div className="p-12 text-center text-stone-500 text-xs font-bold">
              Loading pages from database...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Banner Image Preview */}
                    <div className="h-40 w-full relative bg-stone-100 overflow-hidden">
                      <Image
                        src={p.bannerImage || '/images/products/organic-onesie.jpg'}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(p)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs transition-colors ${
                            p.status === 'published'
                              ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-amber-100/90 text-amber-800 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {p.status === 'published' ? '● Published Live' : '● Draft'}
                        </button>
                      </div>

                      <div className="absolute top-3 right-3">
                        <button
                          type="button"
                          onClick={() => setPageToDelete(p)}
                          className="w-7 h-7 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shadow-2xs"
                          title="Permanently Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-black text-base text-stone-900">{p.name}</h3>
                        <Link
                          href={p.url}
                          target="_blank"
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
                          title="View page on website"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <p className="text-xs font-bold text-stone-800 line-clamp-1">{p.heading}</p>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {p.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-stone-100 mt-2">
                    <span className="text-[10px] text-stone-400">
                      {p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : 'Active'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-2xs transition-colors flex items-center space-x-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Page</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Page Edit / Create Drawer */}
      {isEditing && editingPage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slideLeft overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  {isCreating ? 'Creating New Website Page' : 'Editing Website Page'}
                </span>
                <h3 className="text-lg font-heading font-black text-stone-900">
                  {editingPage.name || 'Untitled Page'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-semibold">
              {/* Page Name */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">Page Name *</label>
                <input
                  type="text"
                  required
                  value={editingPage.name}
                  onChange={(e) => setEditingPage({ ...editingPage, name: e.target.value })}
                  placeholder="e.g. Atelier Heritage"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  The label displayed in headers, footers and navigation.
                </p>
              </div>

              {/* URL Slug */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">URL Slug</label>
                <input
                  type="text"
                  value={editingPage.slug}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  placeholder="e.g. atelier-heritage"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  Public address: /{(editingPage.slug || 'page-name').toLowerCase()}
                </p>
              </div>

              {/* Main Heading */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">
                  Main Heading <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingPage.heading}
                  onChange={(e) => setEditingPage({ ...editingPage, heading: e.target.value })}
                  placeholder="e.g. The REXBEBE Heritage & Atelier Story"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  The primary banner headline customers see on this page.
                </p>
              </div>

              {/* Short Description */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">Short Description</label>
                <input
                  type="text"
                  value={editingPage.shortDescription}
                  onChange={(e) => setEditingPage({ ...editingPage, shortDescription: e.target.value })}
                  placeholder="e.g. Dedicated to the softest beginnings and timeless heirloom craftsmanship."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  One friendly summary sentence shown below the main heading.
                </p>
              </div>

              {/* Banner Image */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-stone-800 font-bold text-xs block">
                      Banner Image
                    </label>
                    <p className="text-[11px] text-stone-500 font-normal">
                      Upload a photo that represents this page.
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <button
                    type="button"
                    disabled={isUploadingBanner}
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-2xs transition-colors flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingBanner ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                </div>

                {editingPage.bannerImage && (
                  <div className="h-40 w-full relative rounded-xl overflow-hidden border border-stone-300">
                    <Image
                      src={editingPage.bannerImage}
                      alt="Banner Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Detailed Description */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">Detailed Description</label>
                <textarea
                  rows={6}
                  value={editingPage.detailedDescription}
                  onChange={(e) =>
                    setEditingPage({ ...editingPage, detailedDescription: e.target.value })
                  }
                  placeholder="Write the full content customers will read on this page..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 leading-relaxed font-normal"
                />
                <p className="text-[11px] text-stone-500 font-normal">
                  Use everyday English. You do not need to write HTML or code.
                </p>
              </div>

              {/* SEO Title & Description */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center space-x-2 text-stone-800 font-bold">
                  <Globe2 className="w-4 h-4 text-sky-600" />
                  <span>Search Engine Information (Google & WhatsApp)</span>
                </div>
                <div className="space-y-1">
                  <label className="text-stone-700 font-bold block">SEO Page Title</label>
                  <input
                    type="text"
                    value={editingPage.seoTitle}
                    onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-700 font-bold block">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    value={editingPage.seoDescription}
                    onChange={(e) =>
                      setEditingPage({ ...editingPage, seoDescription: e.target.value })
                    }
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-stone-900 font-normal"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-stone-100 bg-[#FAF9F6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Eye className="w-4 h-4 text-stone-600" />
                <span>Preview Page</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePage('draft')}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePage('published')}
                  className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-stone-900 text-lg font-heading">
                Permanently Delete "{pageToDelete.name}"?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                This action cannot be undone. The page record and its URL will be completely removed from the database.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <p className="font-extrabold">Permanent Deletion Notice:</p>
              <p>
                Essential published pages must be unpublished to draft before deletion. Removing this page deletes it from public routes.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 rounded-full border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold"
              >
                Yes, Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Live Preview Modal */}
      {isPreviewOpen && editingPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-300">
            {/* Preview Toolbar */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold">Live Storefront Preview</span>
                <span className="text-xs text-stone-400">({editingPage.url})</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 ${
                    previewDevice === 'desktop' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs flex items-center space-x-1 ${
                    previewDevice === 'mobile' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 overflow-y-auto bg-[#FAF9F6] p-6 flex justify-center">
              <div
                className={`transition-all duration-300 bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden ${
                  previewDevice === 'mobile' ? 'w-[375px]' : 'w-full'
                }`}
              >
                <div className="h-48 sm:h-64 relative w-full bg-stone-100">
                  <Image
                    src={editingPage.bannerImage || '/images/products/editorial-baby-lifestyle.jpg'}
                    alt={editingPage.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 mb-1">
                      REXBEBE LUXURY BOUTIQUE
                    </span>
                    <h1 className="text-xl sm:text-2xl font-heading font-black">{editingPage.heading}</h1>
                    <p className="text-xs text-white/90 font-medium max-w-xl mt-1">
                      {editingPage.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                    {editingPage.detailedDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
