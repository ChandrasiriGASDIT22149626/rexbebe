'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  RotateCcw,
  Smartphone,
  Monitor,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { collectionService, CollectionItem } from '../../../services/collectionService';
import { uploadService } from '../../../services/uploadService';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function AdminCollectionsPage() {
  const { products: allProducts } = useAdminData();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Safe Permanent Deletion confirmation state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    collection: CollectionItem | null;
    warningMessage?: string;
    hasDependencies: boolean;
  }>({
    isOpen: false,
    collection: null,
    hasDependencies: false,
  });

  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const data = await collectionService.getCollections();
      setCollections(data);
    } catch (err: any) {
      showToast(err.message || 'Error loading collections from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    const newCol: CollectionItem = {
      id: '',
      name: '',
      slug: '',
      description: '',
      bannerImage: '/images/products/organic-onesie.jpg',
      bannerImageAlt: '',
      assignedProductIds: [],
      order: collections.length + 1,
      status: 'published',
      badge: '',
      seoTitle: '',
      seoDescription: '',
    };
    setEditingCollection(newCol);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (col: CollectionItem) => {
    setEditingCollection({
      ...col,
      bannerImageAlt: col.bannerImageAlt || `${col.name} Collection Banner`,
      seoTitle: col.seoTitle || '',
      seoDescription: col.seoDescription || '',
    });
    setIsEditorOpen(true);
  };

  const handleTogglePublish = async (col: CollectionItem) => {
    const newStatus: 'published' | 'draft' = col.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await collectionService.updateCollectionStatus(col.id, newStatus);
      setCollections((prev) => prev.map((c) => (c.id === col.id ? updated : c)));
      showToast(
        newStatus === 'published'
          ? `Collection "${col.name}" is now Published live!`
          : `Collection "${col.name}" is now moved to Draft.`
      );
    } catch (err: any) {
      showToast(err.message || "We couldn't save your changes. Please try again.");
    }
  };

  const handleRequestDelete = (col: CollectionItem) => {
    const count = col.assignedProductIds?.length || 0;
    if (count > 0) {
      setDeleteModalState({
        isOpen: true,
        collection: col,
        hasDependencies: true,
        warningMessage: `This collection contains ${count} assigned product${
          count > 1 ? 's' : ''
        }. Choose whether to unassign these products before deleting the collection. All individual products will remain safely in the store catalog.`,
      });
    } else {
      setDeleteModalState({
        isOpen: true,
        collection: col,
        hasDependencies: false,
        warningMessage: undefined,
      });
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteModalState.collection) return;
    const { id, name } = deleteModalState.collection;

    try {
      await collectionService.deleteCollection(id, true);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      setDeleteModalState({ isOpen: false, collection: null, hasDependencies: false });
      showToast('The item has been permanently deleted.');
    } catch (err: any) {
      showToast(
        err.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCollection) return;
    setIsUploadingBanner(true);
    try {
      const res = await uploadService.uploadImage(file);
      setEditingCollection({ ...editingCollection, bannerImage: res.url });
      showToast('Banner image uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'Could not upload image');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleToggleProduct = (productId: string) => {
    if (!editingCollection) return;
    const current = editingCollection.assignedProductIds || [];
    const exists = current.includes(productId);
    const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
    setEditingCollection({ ...editingCollection, assignedProductIds: updated });
  };

  const handleSaveCollection = async (status: 'published' | 'draft') => {
    if (!editingCollection) return;
    if (!editingCollection.name.trim()) {
      showToast('Please enter a Collection Title');
      return;
    }

    setIsSaving(true);
    const cleanSlug =
      editingCollection.slug.trim() ||
      editingCollection.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      if (editingCollection.id) {
        // Edit existing
        const updated = await collectionService.updateCollection(editingCollection.id, {
          ...editingCollection,
          slug: cleanSlug,
          status,
        });
        setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast('Changes saved successfully.');
      } else {
        // Create new
        const created = await collectionService.createCollection({
          ...editingCollection,
          slug: cleanSlug,
          status,
        });
        setCollections((prev) => [...prev, created]);
        showToast('Changes saved successfully.');
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      showToast(
        err.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Collections"
          subtitle="Create groups of products that belong together, such as Everyday Essentials or Festive Collection."
          actions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="h-9 inline-flex items-center gap-1.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md shadow-amber-900/10 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Collection</span>
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
              <Compass className="w-4 h-4" />
              <span>PRODUCT CAPSULE GROUPS (DATABASE PERSISTENT)</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              Collections group matching baby clothes into beautiful themes. Each published
              collection automatically gets its own shopping page (for example:{' '}
              <code className="text-stone-800 font-bold bg-stone-100 px-1.5 py-0.5 rounded">
                /collections/everyday-essentials
              </code>
              ). All modifications are saved directly to the database.
            </p>
          </div>

          {/* Collections Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-stone-500 text-xs font-bold">
              Loading collections from database...
            </div>
          ) : collections.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200/80 space-y-3">
              <Package className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">No collections found in database</p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-bold"
              >
                Create your first collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-44 w-full relative bg-stone-100 overflow-hidden">
                      <Image
                        src={col.bannerImage || '/images/products/organic-onesie.jpg'}
                        alt={col.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(col)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs transition-colors ${
                            col.status === 'published'
                              ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-amber-100/90 text-amber-800 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title="Click to toggle publication status"
                        >
                          {col.status === 'published' ? '● Published' : '● Draft'}
                        </button>
                        {col.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-amber-900 border border-amber-200 shadow-2xs">
                            {col.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-black text-base text-stone-900">{col.name}</h3>
                        <Link
                          href={`/collections/${col.slug}`}
                          target="_blank"
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {col.description}
                      </p>

                      <div className="pt-2 flex items-center space-x-2 text-xs text-stone-600 font-bold">
                        <Package className="w-3.5 h-3.5 text-stone-400" />
                        <span>{col.assignedProductIds?.length || 0} Products Assigned</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between border-t border-stone-100 mt-2">
                    <span className="text-[11px] font-mono font-bold text-stone-400">
                      Order #{col.order}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(col)}
                        className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-2xs flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(col)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Permanently Delete Collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Safe Permanent Delete Confirmation Modal */}
      {deleteModalState.isOpen && deleteModalState.collection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-stone-200 animate-fadeIn space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-stone-900">
                  Permanently Delete Collection?
                </h3>
                <span className="text-[11px] text-stone-500 font-semibold">
                  This action permanently removes the record from the database.
                </span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
              <p className="font-bold text-stone-800">
                Collection: <span className="text-amber-800">{deleteModalState.collection.name}</span>
              </p>
              {deleteModalState.warningMessage ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed font-medium">
                  {deleteModalState.warningMessage}
                </div>
              ) : (
                <p className="text-stone-600">
                  Are you sure you want to delete this collection? This action cannot be undone.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalState({ isOpen: false, collection: null, hasDependencies: false })}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Permanently Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection Editor Drawer */}
      {isEditorOpen && editingCollection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slideLeft overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Collection Studio (Database Backed)
                </span>
                <h3 className="text-lg font-heading font-black text-stone-900">
                  {editingCollection.id ? `Edit: ${editingCollection.name}` : '+ Add New Collection'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-semibold">
              {/* Collection Title */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">
                  Collection Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCollection.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setEditingCollection({ ...editingCollection, name, slug });
                  }}
                  placeholder="e.g. Everyday Essentials, Festive Collection"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">URL Slug</label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl text-stone-500 font-mono text-xs">
                    /collections/
                  </span>
                  <input
                    type="text"
                    value={editingCollection.slug}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-r-xl text-stone-900 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold"
                  />
                </div>
              </div>

              {/* Tag / Badge */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">Hero Badge (Optional)</label>
                <input
                  type="text"
                  value={editingCollection.badge || ''}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, badge: e.target.value })
                  }
                  placeholder="e.g. ROYAL PARTY 👑, HEIRLOOM KNITS, ESSENTIALS"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-bold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-stone-700 font-bold block">Editorial Description</label>
                <textarea
                  rows={3}
                  value={editingCollection.description}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, description: e.target.value })
                  }
                  placeholder="Describe this product collection for mothers and gift shoppers..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-medium"
                />
              </div>

              {/* Banner Image */}
              <div className="space-y-2">
                <label className="text-stone-700 font-bold block">Collection Banner</label>
                <div className="flex items-center space-x-4">
                  <div className="w-28 h-20 rounded-xl border border-stone-200 overflow-hidden relative bg-stone-100 flex-shrink-0">
                    <Image
                      src={editingCollection.bannerImage || '/images/products/organic-onesie.jpg'}
                      alt="Banner Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      ref={bannerInputRef}
                      onChange={handleBannerUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs inline-flex items-center space-x-1.5 border border-stone-200 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                      <span>{isUploadingBanner ? 'Uploading to Server...' : 'Change Banner'}</span>
                    </button>
                    <p className="text-[11px] text-stone-500">
                      Recommended: 1200 x 480px horizontal image.
                    </p>
                  </div>
                </div>

                {/* Banner Alt Text */}
                <div className="pt-2">
                  <label className="text-stone-700 font-bold block mb-1">
                    Banner Image Alt Text (SEO & Accessibility)
                  </label>
                  <input
                    type="text"
                    value={editingCollection.bannerImageAlt || ''}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        bannerImageAlt: e.target.value,
                      })
                    }
                    placeholder="e.g. Everyday baby essentials and organic rompers collection banner"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-medium"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Descriptive text for image search indexing and screen readers.
                  </p>
                </div>
              </div>

              {/* Dedicated SEO Settings Card */}
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 p-4 space-y-3.5">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
                    🔍
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                      Collection SEO Metadata
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Configure title and description tags for Google search results.
                    </p>
                  </div>
                </div>

                {/* SEO Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      Custom SEO Title
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        (editingCollection.seoTitle?.length || 0) > 60
                          ? 'text-amber-600'
                          : 'text-stone-400'
                      }`}
                    >
                      {editingCollection.seoTitle?.length || 0}/60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editingCollection.seoTitle || ''}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        seoTitle: e.target.value,
                      })
                    }
                    placeholder={
                      editingCollection.name
                        ? `${editingCollection.name} Capsule Collection | REXBEBE`
                        : 'Everyday Essentials | Luxury Baby Boutique Sri Lanka'
                    }
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                {/* SEO Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      Meta Description
                    </label>
                    <span
                      className={`text-[10px] font-bold ${
                        (editingCollection.seoDescription?.length || 0) > 160
                          ? 'text-amber-600'
                          : 'text-stone-400'
                      }`}
                    >
                      {editingCollection.seoDescription?.length || 0}/160 chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={editingCollection.seoDescription || ''}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        seoDescription: e.target.value,
                      })
                    }
                    placeholder={`Explore the ${editingCollection.name || 'baby collection'} at REXBEBE Sri Lanka. Handcrafted pure fabrics, heirloom details, and islandwide delivery.`}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>

                {/* Google Search Result Preview */}
                <div className="bg-white p-3 rounded-xl border border-stone-200/90 shadow-2xs space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                    Google Search Result Preview
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 font-mono truncate">
                    <span>https://rexbebe.com</span>
                    <span>›</span>
                    <span>collections</span>
                    <span>›</span>
                    <span className="font-bold">
                      {editingCollection.slug || 'collection-slug'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-blue-700 hover:underline truncate">
                    {editingCollection.seoTitle?.trim() ||
                      `${editingCollection.name || 'Collection Title'} Capsule Collection | REXBEBE`}
                  </div>
                  <div className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                    {editingCollection.seoDescription?.trim() ||
                      editingCollection.description?.trim() ||
                      `Discover the ${editingCollection.name || 'exclusive'} capsule collection at REXBEBE Sri Lanka. Pure organic cashmere, handcrafted wooden nursery gym sets, and timeless Scandinavian aesthetics.`}
                  </div>
                </div>
              </div>

              {/* Assign Products */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-stone-700 font-bold block">
                      Assign Products ({editingCollection.assignedProductIds.length} Selected)
                    </label>
                    <span className="text-[11px] text-stone-500">
                      Select all products that should be displayed inside this collection page.
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search catalog products..."
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-xs font-semibold"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-stone-200 rounded-xl p-2 bg-stone-50/50">
                  {filteredProducts.map((p) => {
                    const isSelected = editingCollection.assignedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleProduct(p.id)}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100/70 border border-amber-300'
                            : 'bg-white border border-stone-200/70 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 aspect-[4/5] rounded-lg overflow-hidden relative flex-shrink-0 bg-[#FAF7F2] p-0.5 flex items-center justify-center">
                            <Image
                              src={p.images[0]?.url || '/images/products/organic-onesie.jpg'}
                              alt={p.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 text-xs truncate">{p.name}</p>
                            <span className="text-[10px] text-stone-500 font-normal">
                              {p.category.name} • {formatCurrency(p.price)}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-800 border-amber-800 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-stone-100 bg-[#FAF9F6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-200 font-bold text-xs"
              >
                Preview Collection
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveCollection('draft')}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-200 font-bold text-xs disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveCollection('published')}
                  className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md shadow-amber-900/10 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Publish to Storefront 🌸'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Live Preview Modal */}
      {isPreviewOpen && editingCollection && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold font-mono">
                  Previewing: {editingCollection.name} (/collections/{editingCollection.slug})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-stone-400 hover:text-white font-bold text-xs"
              >
                ✕ Close Preview
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-[#FAF9F6]">
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                {editingCollection.bannerImage && (
                  <div className="h-56 relative w-full bg-stone-100">
                    <Image
                      src={editingCollection.bannerImage}
                      alt={editingCollection.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                      COLLECTION
                    </span>
                    <h1 className="text-2xl font-heading font-black text-stone-900">
                      {editingCollection.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-stone-600 font-medium">
                      {editingCollection.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold text-stone-700 mb-3">
                      Products in this collection ({editingCollection.assignedProductIds?.length || 0}):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {editingCollection.assignedProductIds?.map((pid) => {
                        const p = allProducts.find((item) => item.id === pid);
                        if (!p) return null;
                        return (
                          <div
                            key={pid}
                            className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5"
                          >
                            <div className="w-full aspect-[4/5] relative rounded-lg overflow-hidden bg-[#FAF7F2] p-1 flex items-center justify-center">
                              <Image
                                src={p.images[0]?.url || '/images/products/organic-onesie.jpg'}
                                alt={p.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="font-bold text-stone-900 text-[11px] truncate">{p.name}</p>
                            <p className="text-[10px] font-black text-amber-800">
                              {formatCurrency(p.price)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
