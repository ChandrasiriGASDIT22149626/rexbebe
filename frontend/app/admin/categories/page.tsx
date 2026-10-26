'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderPlus,
  Edit,
  Trash2,
  Package,
  Upload,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  ExternalLink,
  Tag,
  Menu as MenuIcon,
  Eye,
  EyeOff,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { uploadService } from '../../../services/uploadService';
import { categoryService, CategoryItem, CategoryTreeNode } from '../../../services/categoryService';

export default function AdminCategoriesPage() {
  const { products: adminProducts, refreshNavigationConfig, refreshProducts } = useAdminData();

  // Data state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary View Navigation: 'main' vs 'subcategories'
  const [activeTab, setActiveTab] = useState<'main' | 'subcategories'>('main');

  // Filter for Subcategories tab: which Main Category to focus on
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('all');

  // Status Filter: 'all' | 'active' | 'inactive'
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'main' | 'sub'>('main');
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CategoryItem | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Friendly toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form input fields - strictly essential fields, zero SEO
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formDisplayInNav, setFormDisplayInNav] = useState<boolean>(true);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formImage, setFormImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Authoritative load from backend database
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      showToast('Could not load categories from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Product count map per category ID, slug, and name
  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    adminProducts.forEach((p) => {
      const catId = p.category?.id?.toLowerCase();
      const catSlug = p.category?.slug?.toLowerCase();
      const catName = p.category?.name?.toLowerCase();
      const subId = p.subcategory?.id?.toLowerCase();
      const subSlug = p.subcategory?.slug?.toLowerCase();
      const subName = p.subcategory?.name?.toLowerCase();

      [catId, catSlug, catName, subId, subSlug, subName].forEach((key) => {
        if (key) map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return map;
  }, [adminProducts]);

  // Main Categories (Top-level, parentId is null or empty)
  const mainCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories]);

  // All Subcategories (has a parentId)
  const allSubcategories = useMemo(() => {
    return categories
      .filter((c) => Boolean(c.parentId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories]);

  // Subcategories grouped by parent ID
  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, CategoryItem[]>();
    allSubcategories.forEach((sub) => {
      const pId = sub.parentId!;
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(sub);
    });
    return map;
  }, [allSubcategories]);

  // Filtered Main Categories for Tab 1
  const filteredMainCategories = useMemo(() => {
    return mainCategories.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.slug?.toLowerCase().includes(q);
      const isActive = item.isActive !== false && item.status !== 'unpublished' && item.status !== 'draft';
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? isActive
          : !isActive;
      return matchSearch && matchStatus;
    });
  }, [mainCategories, searchQuery, statusFilter]);

  // Filtered Subcategories for Tab 2
  const filteredSubcategories = useMemo(() => {
    return allSubcategories.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.slug?.toLowerCase().includes(q);
      const matchParent = selectedParentFilter === 'all' || item.parentId === selectedParentFilter;
      const isActive = item.isActive !== false && item.status !== 'unpublished' && item.status !== 'draft';
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? isActive
          : !isActive;
      return matchSearch && matchParent && matchStatus;
    });
  }, [allSubcategories, searchQuery, selectedParentFilter, statusFilter]);

  // -------------------------------------------------------------
  // OPEN MODAL ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingItem(null);
    setFormMode('main');
    setFormName('');
    setFormParentId('');
    setFormDisplayInNav(true);
    setFormOrder(mainCategories.length + 1);
    setFormIsActive(true);
    setFormImage('');
    setIsFormOpen(true);
  };

  const handleOpenAddSubcategory = (presetParentId?: string) => {
    setEditingItem(null);
    setFormMode('sub');
    setFormName('');
    const defaultParent =
      presetParentId ||
      (selectedParentFilter !== 'all' ? selectedParentFilter : mainCategories[0]?.id || '');
    setFormParentId(defaultParent);
    setFormDisplayInNav(true);
    const existingCount = defaultParent ? (subcategoriesByParent.get(defaultParent)?.length || 0) : 0;
    setFormOrder(existingCount + 1);
    setFormIsActive(true);
    setFormImage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: CategoryItem) => {
    setEditingItem(item);
    const isSub = Boolean(item.parentId);
    setFormMode(isSub ? 'sub' : 'main');
    setFormName(item.name || '');
    setFormParentId(item.parentId || '');
    setFormDisplayInNav(item.badge !== 'HIDDEN' && item.badge !== 'CATALOG_ONLY');
    setFormOrder(item.order ?? 1);
    setFormIsActive(item.isActive !== false && item.status !== 'unpublished' && item.status !== 'draft');
    setFormImage(item.thumbnailImage || item.bannerImage || '');
    setIsFormOpen(true);
  };

  // Quick toggle Display in Navigation
  const handleToggleDisplayInNav = async (item: CategoryItem) => {
    const isCurrentlyInNav = item.badge !== 'HIDDEN' && item.badge !== 'CATALOG_ONLY';
    const nextBadge = isCurrentlyInNav ? 'HIDDEN' : undefined;

    try {
      await categoryService.updateCategory(item.id, { badge: nextBadge });
      setCategories((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, badge: nextBadge } : c))
      );
      showToast(
        `"${item.name}" ${!isCurrentlyInNav ? 'will now appear in navigation bar.' : 'is now hidden from navigation bar.'}`
      );
    } catch (err: any) {
      showToast('Failed to update navigation visibility.', 'error');
    }
  };

  // Quick toggle Active/Inactive
  const handleToggleActive = async (item: CategoryItem) => {
    const isCurrentlyActive = item.isActive !== false && item.status !== 'unpublished' && item.status !== 'draft';
    const nextStatus = isCurrentlyActive ? 'draft' : 'published';
    const nextActive = !isCurrentlyActive;

    try {
      await categoryService.updateCategory(item.id, {
        isActive: nextActive,
        status: nextStatus,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isActive: nextActive, status: nextStatus } : c))
      );
      showToast(`"${item.name}" is now ${nextActive ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      showToast('Failed to update status.', 'error');
    }
  };

  // Quick Reorder
  const handleQuickReorder = async (item: CategoryItem, direction: 'up' | 'down') => {
    const currentOrder = item.order || 1;
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    if (newOrder === currentOrder) return;

    try {
      await categoryService.updateCategory(item.id, { order: newOrder });
      setCategories((prev) =>
        prev
          .map((c) => (c.id === item.id ? { ...c, order: newOrder } : c))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      );
      showToast(`Order updated for "${item.name}".`);
    } catch (err) {
      showToast('Failed to update display order.', 'error');
    }
  };

  // Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds maximum limit of 8MB.', 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploaded = await uploadService.uploadImage(file);
      setFormImage(uploaded.url);
      showToast('Category image uploaded successfully.');
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showToast('Failed to upload image. Please try again.', 'error');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Save changes (Create or Update)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }

    if (formMode === 'sub' && !formParentId) {
      showToast('Please select a Parent Category for this subcategory.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const cleanSlug = formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const parentItem = formMode === 'sub' ? mainCategories.find((c) => c.id === formParentId) : null;

      const payload: Partial<CategoryItem> = {
        name: formName.trim(),
        slug: cleanSlug,
        parentId: formMode === 'sub' ? formParentId : null,
        order: Number(formOrder) || 1,
        isActive: formIsActive,
        status: formIsActive ? 'published' : 'draft',
        badge: formDisplayInNav ? undefined : 'HIDDEN',
        thumbnailImage: formImage || undefined,
        bannerImage: formImage || undefined,
        // Automatically create canonical routing link
        href: `/shop/${cleanSlug}`,
      };

      const existing =
        editingItem ||
        categories.find(
          (c) =>
            c.slug.toLowerCase() === cleanSlug.toLowerCase() ||
            c.name.trim().toLowerCase() === formName.trim().toLowerCase()
        );

      if (existing) {
        await categoryService.updateCategory(existing.id, payload);
        showToast(`"${formName}" updated successfully.`);
      } else {
        await categoryService.createCategory(payload);
        showToast(`"${formName}" created successfully.`);
      }

      setIsFormOpen(false);
      await loadCategories();
      await refreshNavigationConfig();
      await refreshProducts();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      showToast(err.message || 'Error saving category. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete flow
  const handleOpenDelete = (item: CategoryItem) => {
    setItemToDelete(item);
    setReassignTargetId('none');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(
        itemToDelete.id,
        true,
        reassignTargetId !== 'none' ? reassignTargetId : undefined
      );

      showToast(`"${itemToDelete.name}" was permanently deleted.`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      await loadCategories();
      await refreshNavigationConfig();
      await refreshProducts();
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      showToast(err.message || 'Failed to delete category.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFBF9] overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Categories & Menu Management" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Toast Alert */}
          {toast && (
            <div
              className={`p-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
                toast.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : toast.type === 'info'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          {/* Top Header Card with primary actions */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="p-2.5 rounded-2xl bg-pink-100 text-pink-700">
                  <FolderTree className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-heading">
                    Categories &amp; Menu
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Manage store main categories, subcategories, and header navigation links.
                  </p>
                </div>
              </div>
            </div>

            {/* Clear, distinct Add Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={loadCategories}
                disabled={isLoading}
                className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                title="Refresh list from server"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="inline-flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-pink-400" />
                <span>Add Category</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddSubcategory()}
                className="inline-flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subcategory</span>
              </button>
            </div>
          </div>

          {/* Navigation Mode Tabs: Main Categories vs Subcategories */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-2">
            <div className="flex items-center space-x-2 bg-stone-200/60 p-1 rounded-2xl text-xs font-bold w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('main')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
                  activeTab === 'main'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FolderTree className="w-4 h-4 text-pink-600" />
                <span>Main Categories</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono">
                  {mainCategories.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('subcategories')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
                  activeTab === 'subcategories'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Subcategories</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono">
                  {allSubcategories.length}
                </span>
              </button>
            </div>

            {/* Search Bar & Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {activeTab === 'subcategories' && (
                <div className="flex items-center space-x-1.5">
                  <label htmlFor="parent-category-filter" className="text-xs font-bold text-stone-600 whitespace-nowrap">
                    Parent:
                  </label>
                  <select
                    id="parent-category-filter"
                    value={selectedParentFilter}
                    onChange={(e) => setSelectedParentFilter(e.target.value)}
                    aria-label="Filter subcategories by parent category"
                    className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 focus:outline-none"
                  >
                    <option value="all">All Main Categories ({allSubcategories.length})</option>
                    {mainCategories.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({subcategoriesByParent.get(m.id)?.length || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter by active status"
                className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* TAB 1: MAIN CATEGORIES TABLE                                */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'main' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-stone-400">
                  Loading categories from database...
                </div>
              ) : filteredMainCategories.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FolderTree className="w-10 h-10 text-stone-300 mx-auto" />
                  <h3 className="text-base font-bold text-stone-800">No main categories found</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {searchQuery ? 'No categories match your search.' : 'Create your first main category to organise your boutique.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddCategory}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-28">Display Order</th>
                        <th className="py-3.5 px-4 w-16">Image</th>
                        <th className="py-3.5 px-4">Main Category</th>
                        <th className="py-3.5 px-4">Subcategories</th>
                        <th className="py-3.5 px-4">Display in Navigation</th>
                        <th className="py-3.5 px-4">Active / Inactive</th>
                        <th className="py-3.5 px-4">Products</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredMainCategories.map((item) => {
                        const subs = subcategoriesByParent.get(item.id) || [];
                        const prodCount =
                          productCountMap.get(item.id.toLowerCase()) ||
                          productCountMap.get(item.slug.toLowerCase()) ||
                          0;
                        const isActive = item.isActive !== false && item.status !== 'unpublished' && item.status !== 'draft';
                        const isDisplayInNav = item.badge !== 'HIDDEN' && item.badge !== 'CATALOG_ONLY';

                        return (
                          <tr key={item.id} className="hover:bg-stone-50/80 transition-colors group">
                            {/* Order */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-1">
                                <span className="w-7 text-center font-mono text-xs font-bold text-stone-700 bg-stone-100 py-1 rounded-lg">
                                  {item.order ?? 1}
                                </span>
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReorder(item, 'up')}
                                    title="Move Up"
                                    className="p-0.5 text-stone-400 hover:text-stone-800 transition-colors"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReorder(item, 'down')}
                                    title="Move Down"
                                    className="p-0.5 text-stone-400 hover:text-stone-800 transition-colors"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Image */}
                            <td className="py-3.5 px-4">
                              {item.thumbnailImage || item.bannerImage ? (
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                                  <Image
                                    src={item.thumbnailImage || item.bannerImage || ''}
                                    alt={item.name}
                                    fill
                                    className="object-contain"
                                    sizes="40px"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                                  <FolderTree className="w-4 h-4" />
                                </div>
                              )}
                            </td>

                            {/* Name */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-stone-900 group-hover:text-pink-600 transition-colors text-sm sm:text-base">
                                {item.name}
                              </div>
                              <span className="text-[11px] text-stone-400 font-mono">
                                /categories/{item.slug}
                              </span>
                            </td>

                            {/* Subcategories count badge & link */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedParentFilter(item.id);
                                  setActiveTab('subcategories');
                                }}
                                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                                title="View subcategories"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>{subs.length} Subcategor{subs.length === 1 ? 'y' : 'ies'}</span>
                              </button>
                            </td>

                            {/* Display in Navigation Toggle */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleDisplayInNav(item)}
                                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                  isDisplayInNav
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                }`}
                                title="Click to toggle navigation bar visibility"
                              >
                                {isDisplayInNav ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Visible in Nav</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                                    <span>Hidden from Nav</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Active / Inactive Toggle */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(item)}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                                  isActive
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-sky-600' : 'bg-stone-400'
                                  }`}
                                />
                                <span>{isActive ? 'Active' : 'Inactive'}</span>
                              </button>
                            </td>

                            {/* Products count */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                                <Package className="w-3 h-3 text-stone-400" />
                                <span>{prodCount} products</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddSubcategory(item.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs transition-colors flex items-center space-x-1"
                                  title="Add Subcategory under this Main Category"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Subcategory</span>
                                </button>
                                <Link
                                  href={`/categories/${item.slug}`}
                                  target="_blank"
                                  title="View on storefront"
                                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  title="Edit Category"
                                  className="p-2 rounded-xl text-stone-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(item)}
                                  title="Delete Category"
                                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------- */}
          {/* TAB 2: SUBCATEGORIES TABLE                                  */}
          {/* ----------------------------------------------------------- */}
          {activeTab === 'subcategories' && (
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden space-y-4">
              {/* Context Banner */}
              <div className="p-4 bg-stone-50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-stone-600">
                  {selectedParentFilter === 'all' ? (
                    <span>
                      Showing all subcategories across <strong>{mainCategories.length} Main Categories</strong>.
                    </span>
                  ) : (
                    <span>
                      Showing subcategories under parent category:{' '}
                      <strong className="text-pink-700">
                        {mainCategories.find((m) => m.id === selectedParentFilter)?.name || 'Selected Category'}
                      </strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddSubcategory(selectedParentFilter !== 'all' ? selectedParentFilter : undefined)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    Add Subcategory {selectedParentFilter !== 'all' ? `to ${mainCategories.find((m) => m.id === selectedParentFilter)?.name || ''}` : ''}
                  </span>
                </button>
              </div>

              {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-stone-400">
                  Loading subcategories...
                </div>
              ) : filteredSubcategories.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Layers className="w-10 h-10 text-stone-300 mx-auto" />
                  <h3 className="text-base font-bold text-stone-800">
                    {selectedParentFilter !== 'all'
                      ? `No subcategories under "${mainCategories.find((m) => m.id === selectedParentFilter)?.name || 'this category'}" yet.`
                      : 'No subcategories found.'}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Subcategories let shoppers find specific clothing types (like Rompers, T-Shirts, Dresses, or Blankets).
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddSubcategory(selectedParentFilter !== 'all' ? selectedParentFilter : undefined)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Subcategory</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-600">
                    <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 w-28">Display Order</th>
                        <th className="py-3.5 px-4">Subcategory Name</th>
                        <th className="py-3.5 px-4">Parent Category</th>
                        <th className="py-3.5 px-4">Display in Navigation</th>
                        <th className="py-3.5 px-4">Active / Inactive</th>
                        <th className="py-3.5 px-4">Products</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredSubcategories.map((item) => {
                        const parent = mainCategories.find((m) => m.id === item.parentId);
                        const prodCount =
                          productCountMap.get(item.id.toLowerCase()) ||
                          productCountMap.get(item.slug.toLowerCase()) ||
                          0;
                        const isActive = item.isActive !== false && item.status !== 'unpublished' && item.status !== 'draft';
                        const isDisplayInNav = item.badge !== 'HIDDEN' && item.badge !== 'CATALOG_ONLY';

                        return (
                          <tr key={item.id} className="hover:bg-stone-50/80 transition-colors group">
                            {/* Order */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-1">
                                <span className="w-7 text-center font-mono text-xs font-bold text-stone-700 bg-stone-100 py-1 rounded-lg">
                                  {item.order ?? 1}
                                </span>
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReorder(item, 'up')}
                                    title="Move Up"
                                    className="p-0.5 text-stone-400 hover:text-stone-800 transition-colors"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReorder(item, 'down')}
                                    title="Move Down"
                                    className="p-0.5 text-stone-400 hover:text-stone-800 transition-colors"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Name */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-stone-900 group-hover:text-pink-600 transition-colors text-sm">
                                {item.name}
                              </div>
                              <span className="text-[11px] text-stone-400 font-mono">
                                /categories/{item.slug}
                              </span>
                            </td>

                            {/* Parent Category Badge */}
                            <td className="py-3.5 px-4">
                              {parent ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedParentFilter(parent.id)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors"
                                  title="Filter to this parent category"
                                >
                                  <FolderTree className="w-3.5 h-3.5" />
                                  <span>{parent.name}</span>
                                </button>
                              ) : (
                                <span className="text-xs text-stone-400 italic">No Parent</span>
                              )}
                            </td>

                            {/* Display in Navigation */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleDisplayInNav(item)}
                                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                  isDisplayInNav
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                }`}
                              >
                                {isDisplayInNav ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Visible in Nav</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                                    <span>Hidden from Nav</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Active / Inactive */}
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(item)}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                                  isActive
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-sky-600' : 'bg-stone-400'
                                  }`}
                                />
                                <span>{isActive ? 'Active' : 'Inactive'}</span>
                              </button>
                            </td>

                            {/* Products count */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                                <Package className="w-3 h-3 text-stone-400" />
                                <span>{prodCount} products</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <Link
                                  href={`/categories/${item.slug}`}
                                  target="_blank"
                                  title="View subcategory page"
                                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  title="Edit Subcategory"
                                  className="p-2 rounded-xl text-stone-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(item)}
                                  title="Delete Subcategory"
                                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SIMPLIFIED ADD / EDIT MODAL (ZERO SEO FIELDS)                   */}
      {/* ------------------------------------------------------------- */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-pink-100 text-pink-700">
                  {formMode === 'main' ? <FolderTree className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                </span>
                <div>
                  <h2 className="text-lg font-black text-stone-900 font-heading">
                    {editingItem
                      ? `Edit ${formMode === 'main' ? 'Main Category' : 'Subcategory'}`
                      : formMode === 'main'
                      ? 'Add Category'
                      : 'Add Subcategory'}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {formMode === 'main'
                      ? 'Top-level boutique category'
                      : 'Subcategory nested under a parent main category'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* If Subcategory: Parent Category Selection */}
              {formMode === 'sub' && (
                <div>
                  <label htmlFor="form-parent-category-select" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    Parent Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="form-parent-category-select"
                    required
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="" disabled>Select Parent Category...</option>
                    {mainCategories.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-400 mt-1">
                    This subcategory will appear grouped under this main category.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  {formMode === 'main' ? 'Main Category Name' : 'Subcategory Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formMode === 'main' ? 'e.g. Baby Clothing, Nursery' : 'e.g. Rompers, Blankets, T-Shirts'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* Display in Navigation (Yes / No) */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Display in Navigation
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {formDisplayInNav
                      ? 'Visible in header menu and dropdown links'
                      : 'Hidden from navigation menu (accessible via catalog only)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormDisplayInNav(!formDisplayInNav)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formDisplayInNav ? 'bg-pink-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      formDisplayInNav ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Position number (1 = appears first in menu and lists).
                </p>
              </div>

              {/* Active / Inactive */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Active / Inactive
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {formIsActive
                      ? 'Active on storefront and catalog'
                      : 'Inactive / draft mode (hidden from customers)'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formIsActive ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      formIsActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Category Image (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Category Photo (Optional)
                </label>

                {formImage ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center group p-2">
                    <Image
                      src={formImage}
                      alt="Category preview"
                      fill
                      className="object-contain"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 rounded-xl bg-white text-stone-700 font-bold text-xs shadow-md hover:bg-stone-100"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="p-2 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md hover:bg-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-stone-300 hover:border-pink-400 p-5 rounded-2xl text-center space-y-1.5 bg-stone-50 hover:bg-pink-50/20 transition-all"
                  >
                    <Upload className="w-5 h-5 text-stone-400 mx-auto" />
                    <div className="text-xs font-bold text-stone-700">
                      {isUploadingImage ? 'Uploading photo...' : 'Click to upload category photo'}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      PNG, JPG, or WebP up to 8MB
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : formMode === 'main' ? 'Add Category' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SAFE DELETE CONFIRMATION MODAL WITH REASSIGNMENT                */}
      {/* ------------------------------------------------------------- */}
      {isDeleteModalOpen && itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-100 p-6 space-y-5">
            <div className="flex items-center space-x-3 text-rose-600">
              <span className="p-2.5 rounded-2xl bg-rose-50">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-stone-900 font-heading">
                  Delete Category?
                </h3>
                <p className="text-xs text-stone-500 font-bold">
                  {itemToDelete.name}
                </p>
              </div>
            </div>

            {/* Check for subcategories or assigned products */}
            {(() => {
              const assignedSubs = subcategoriesByParent.get(itemToDelete.id) || [];
              const count =
                productCountMap.get(itemToDelete.id.toLowerCase()) ||
                productCountMap.get(itemToDelete.slug.toLowerCase()) ||
                0;

              return (
                <div className="space-y-3">
                  {assignedSubs.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                      <p className="font-bold">
                        ⚠️ Notice: This main category has {assignedSubs.length} subcategor{assignedSubs.length === 1 ? 'y' : 'ies'}.
                      </p>
                      <p className="text-[11px] text-purple-800 mt-0.5">
                        Deleting it will also safely update these subcategories.
                      </p>
                    </div>
                  )}

                  {count > 0 ? (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <p className="font-bold">
                        ⚠️ Notice: {count} product{count > 1 ? 's are' : ' is'} currently assigned to this category.
                      </p>
                      <label htmlFor="reassign-category-select" className="text-[11px] text-amber-800 block">
                        Reassign associated products to an alternative category:
                      </label>
                      <select
                        id="reassign-category-select"
                        value={reassignTargetId}
                        onChange={(e) => setReassignTargetId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-stone-800 focus:outline-none"
                      >
                        <option value="none">Keep in general catalog (No category)</option>
                        {categories
                          .filter((c) => c.id !== itemToDelete.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              Reassign to: {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-600">
                      Are you sure you want to permanently delete this category? This action will safely remove its navigation link.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
