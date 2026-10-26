'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Check,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Smartphone,
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FolderTree,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Package,
  Globe,
  Lock,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { CategoryShoppingTemplate } from '../../../components/products/CategoryShoppingTemplate';
import { uploadService } from '../../../services/uploadService';
import { categoryService, CategoryTreeNode } from '../../../services/categoryService';
import { navigationService } from '../../../services/navigationService';
import { formatCurrency } from '../../../utils/formatCurrency';
import {
  NavItemConfig,
  NavSubGroup,
  NavSubItem,
  DestinationType,
  PublishStatus,
} from '../../../types/admin';

// Built-in categories and collections for destination pickers
const CATALOG_CATEGORIES = [
  { name: 'All Girls Fashion', slug: 'all-girls-fashion' },
  { name: 'Party Dresses', slug: 'party-dresses' },
  { name: 'Cashmere Cardigans', slug: 'cashmere-cardigans' },
  { name: 'Play Rompers', slug: 'play-rompers' },
  { name: 'All Boys Fashion', slug: 'all-boys-fashion' },
  { name: 'Organic Linen Outfits', slug: 'organic-linen-outfits' },
  { name: 'Durable Play Rompers', slug: 'durable-play-rompers' },
  { name: 'Coordinated Sets', slug: 'coordinated-sets' },
  { name: 'Hospital Bag Essentials', slug: 'hospital-bag' },
  { name: 'Organic Cotton Onesies', slug: 'organic-cotton-onesies' },
  { name: 'Breathable Swaddles', slug: 'breathable-swaddles' },
  { name: 'Newborn Gift Sets', slug: 'newborn-gift-sets' },
  { name: 'Baby Clothing', slug: 'baby-clothing' },
  { name: 'Nursery & Wooden Toys', slug: 'nursery-toys' },
  { name: 'Bedding & Swaddles', slug: 'bedding-swaddles' },
];

export default function AdminNavigationPage() {
  const {
    navigationConfig,
    updateNavigationConfig,
    resetNavigationConfig,
    refreshNavigationConfig,
    products: allProducts,
  } = useAdminData();

  // Search & Filter State
  const [expandedItemId, setExpandedItemId] = useState<string | null>('nav-girls');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Main Category / Subcategory Studio Editor Drawer State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'category' | 'subcategory'>('category');
  const [activeEditorTab, setActiveEditorTab] = useState<'basic' | 'products'>('basic');
  
  // Track what item is currently being edited
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [parentNavId, setParentNavId] = useState<string>('nav-girls');
  const [parentGroupId, setParentGroupId] = useState<string>('');

  // Phase 2: Canonical Recursive Category Tree State
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('root');

  const fetchCategoryTree = useCallback(async (): Promise<CategoryTreeNode[]> => {
    try {
      const tree = await categoryService.getCategoryTree();
      if (Array.isArray(tree)) {
        setCategoryTree(tree);
        return tree;
      }
      return [];
    } catch (err) {
      console.warn('Failed to load category tree:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCategoryTree();
    refreshNavigationConfig();
  }, [fetchCategoryTree, refreshNavigationConfig]);

  // Hierarchical flattened categories with visual indentation
  const flatCategoryOptions = useMemo(() => {
    const options: { id: string; name: string; depth: number; label: string }[] = [];

    const getDescendantIds = (nodes: CategoryTreeNode[], targetId: string): Set<string> => {
      const result = new Set<string>();
      const findAndCollect = (list: CategoryTreeNode[], collecting: boolean) => {
        for (const item of list) {
          const isTarget = item.id === targetId;
          if (collecting || isTarget) {
            result.add(item.id);
            if (item.children) findAndCollect(item.children, true);
          } else if (item.children) {
            findAndCollect(item.children, false);
          }
        }
      };
      findAndCollect(nodes, false);
      return result;
    };

    const excludedIds = editingTargetId ? getDescendantIds(categoryTree, editingTargetId) : new Set<string>();

    const traverse = (nodes: CategoryTreeNode[], depth: number) => {
      for (const node of nodes) {
        if (!excludedIds.has(node.id)) {
          const indent = depth > 0 ? `${'— '.repeat(depth)}` : '';
          options.push({
            id: node.id,
            name: node.name,
            depth,
            label: `${indent}${node.name}`,
          });
          if (node.children && node.children.length > 0) {
            traverse(node.children, depth + 1);
          }
        }
      }
    };

    traverse(categoryTree, 0);
    return options;
  }, [categoryTree, editingTargetId]);

  // Comprehensive Form State (Matches Sections 1, 4, 5, 6, 7, 9)
  const [formData, setFormData] = useState({
    name: '',
    pageTitle: '',
    shortDescription: '',
    detailedDescription: '',
    slug: '',
    parentCategory: 'girls',
    destinationType: 'CATEGORY_PAGE' as DestinationType,
    destinationReference: 'party-dresses',
    customHref: '',
    badge: '',
    order: 1,
    status: 'published' as PublishStatus,
    isActive: true,
    bannerImage: '',
    thumbnailImage: '',
    galleryImages: [] as string[],
    assignedProductIds: [] as string[],
    seoTitle: '',
    seoDescription: '',
  });

  // Image Uploading Loading Flags
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Product Selection Search within the editor
  const [productSearch, setProductSearch] = useState('');

  // Interactive Live Preview Modal State (Section 8: Mandatory Feature)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewDataPayload, setPreviewDataPayload] = useState<any>(null);

  // Pre-Publish Review Modal State (Section 11: Review content before publishing)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // File Input References
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Submission lock and loading state to prevent duplicate saves
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute destination href dynamically
  const computeDestinationHref = (type: DestinationType, parent: string, slug: string, ref: string, custom: string) => {
    if (type === 'HOMEPAGE') return '/';
    if (type === 'SHOP_PAGE') return '/shop';
    if (type === 'NEW_ARRIVALS') return '/new-in';
    if (type === 'SALE_PAGE') return '/sale';
    if (type === 'CUSTOM_PAGE') return custom.startsWith('/') ? custom : `/${custom}`;
    if (type === 'EXTERNAL_URL') return custom.startsWith('http') ? custom : `https://${custom}`;

    // Category page routing (Canonical /shop/[slug] route)
    const cleanSlug = slug || ref || 'collection';
    const parentClean = (parent || '').toLowerCase().replace('nav-', '');
    if (['girls', 'boys', 'baby', 'sale'].includes(parentClean)) {
      return `/${parentClean}/${cleanSlug}`;
    }
    return `/shop/${cleanSlug}`;
  };

  // Open Editor for ADD TOP-LEVEL CATEGORY
  const handleOpenAddCategory = () => {
    fetchCategoryTree();
    setEditorMode('category');
    setEditingTargetId(null);
    setSelectedParentId('root');
    setFormData({
      name: '',
      pageTitle: '',
      shortDescription: '',
      detailedDescription: '',
      slug: '',
      parentCategory: 'none',
      destinationType: 'CATEGORY_PAGE',
      destinationReference: 'party-dresses',
      customHref: '',
      badge: '',
      order: (navigationConfig?.items?.length || 0) + 1,
      status: 'published',
      isActive: true,
      bannerImage: '',
      thumbnailImage: '',
      galleryImages: [],
      assignedProductIds: [],
      seoTitle: '',
      seoDescription: '',
    });
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  // Open Editor for EDIT TOP-LEVEL CATEGORY
  const handleOpenEditCategory = (item: NavItemConfig) => {
    fetchCategoryTree();
    setEditorMode('category');
    setEditingTargetId(item.id);
    setSelectedParentId((item as any).parentId || 'root');
    const destType = (item.destinationType as DestinationType) || 'CATEGORY_PAGE';
    setFormData({
      name: item.name,
      pageTitle: item.pageTitle || item.name,
      shortDescription: item.shortDescription || item.description || '',
      detailedDescription: item.detailedDescription || '',
      slug: item.slug || item.id.replace('nav-', ''),
      parentCategory: 'none',
      destinationType: destType,
      destinationReference: item.destinationReference || item.slug || '',
      customHref: item.href,
      badge: item.badge || '',
      order: item.order || 1,
      status: (item.status as PublishStatus) || 'published',
      isActive: item.isActive !== false,
      bannerImage: item.bannerImage || '',
      thumbnailImage: item.thumbnailImage || '',
      galleryImages: item.galleryImages || [],
      assignedProductIds: item.assignedProductIds || [],
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
    });
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  // Open Editor for ADD SUBCATEGORY
  const handleOpenAddSubItem = (navId?: string, groupId?: string) => {
    fetchCategoryTree();
    setEditorMode('subcategory');
    setEditingTargetId(null);
    const validParentItems = (navigationConfig?.items || []).filter(
      (i) => i.id !== 'nav-home' && i.id !== 'nav-about' && i.id !== 'nav-contact'
    );
    const chosenNavId =
      navId ||
      validParentItems[0]?.id ||
      categoryTree[0]?.id ||
      'cat-1792556617917-72c7r7';
    setParentNavId(chosenNavId);
    setSelectedParentId(chosenNavId);
    
    const parentItem = navigationConfig?.items?.find((i) => i.id === chosenNavId);
    setParentGroupId(groupId || parentItem?.subGroups?.[0]?.id || '');

    setFormData({
      name: '',
      pageTitle: '',
      shortDescription: '',
      detailedDescription: '',
      slug: '',
      parentCategory: chosenNavId.replace('nav-', ''),
      destinationType: 'CATEGORY_PAGE',
      destinationReference: 'party-dresses',
      customHref: '',
      badge: '',
      order: 1,
      status: 'published',
      isActive: true,
      bannerImage: '',
      thumbnailImage: '',
      galleryImages: [],
      assignedProductIds: [],
      seoTitle: '',
      seoDescription: '',
    });
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  // Open Editor for EDIT SUBCATEGORY
  const handleOpenEditSubItem = (navId: string, groupId: string, sub: NavSubItem) => {
    fetchCategoryTree();
    setEditorMode('subcategory');
    setEditingTargetId(sub.id);
    setParentNavId(navId);
    setParentGroupId(groupId);

    const findNodeParent = (nodes: CategoryTreeNode[], id: string): string | null => {
      for (const n of nodes) {
        if (n.id === id) return n.parentId || 'root';
        if (n.children) {
          const found = findNodeParent(n.children, id);
          if (found !== null) return found;
        }
      }
      return null;
    };
    const resolvedParent = findNodeParent(categoryTree, sub.id);
    setSelectedParentId((sub as any).parentId || navId || resolvedParent || 'root');

    const destType = (sub.destinationType as DestinationType) || 'CATEGORY_PAGE';
    setFormData({
      name: sub.name,
      pageTitle: sub.pageTitle || sub.name,
      shortDescription: sub.shortDescription || sub.description || '',
      detailedDescription: sub.detailedDescription || '',
      slug: sub.slug || '',
      parentCategory: navId.replace('nav-', ''),
      destinationType: destType,
      destinationReference: sub.destinationReference || sub.slug || '',
      customHref: sub.href,
      badge: sub.badge || '',
      order: sub.order || 1,
      status: (sub.status as PublishStatus) || 'published',
      isActive: sub.isActive !== false,
      bannerImage: sub.bannerImage || '',
      thumbnailImage: sub.thumbnailImage || '',
      galleryImages: sub.galleryImages || [],
      assignedProductIds: sub.assignedProductIds || [],
      seoTitle: sub.seoTitle || '',
      seoDescription: sub.seoDescription || '',
    });
    setActiveEditorTab('basic');
    setIsEditorOpen(true);
  };

  // Handle Banner Image Upload
  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      const res = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, bannerImage: res.url }));
      showToast('Category banner uploaded successfully! 🌸');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload banner', 'error');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Handle Thumbnail Upload
  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingThumb(true);
      const res = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, thumbnailImage: res.url }));
      showToast('Thumbnail uploaded successfully! 🧸');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload thumbnail', 'error');
    } finally {
      setIsUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  // Handle Multiple Gallery Images Upload
  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingGallery(true);
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const res = await uploadService.uploadImage(f);
        uploadedUrls.push(res.url);
      }
      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...uploadedUrls],
      }));
      showToast(`Uploaded ${uploadedUrls.length} lookbook gallery images! ✨`);
    } catch (err: any) {
      showToast(err.message || 'Gallery upload failed', 'error');
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Toggle Assigned Product
  const handleToggleProduct = (productId: string) => {
    setFormData((prev) => {
      const exists = prev.assignedProductIds.includes(productId);
      return {
        ...prev,
        assignedProductIds: exists
          ? prev.assignedProductIds.filter((id) => id !== productId)
          : [...prev.assignedProductIds, productId],
      };
    });
  };

  // Move product order within assigned list
  const handleMoveProductOrder = (index: number, direction: 'up' | 'down') => {
    const list = [...formData.assignedProductIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setFormData((prev) => ({ ...prev, assignedProductIds: list }));
  };

  // SAVE OR PUBLISH ACTION
  const executeSave = async (statusToSet: PublishStatus) => {
    if (isSavingRef.current) return;

    if (!formData.name.trim()) {
      showToast('Category Name is required. Please check Basic Information.', 'error');
      setActiveEditorTab('basic');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const cleanName = formData.name.trim();
      const rawSlug = formData.slug.trim() || cleanName;
      const cleanSlug =
        rawSlug
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;
      const cleanPageTitle = formData.pageTitle.trim() || cleanName.toUpperCase();
      // Force isActive to true when publishing live, or false when saving draft
      const effectiveIsActive = statusToSet === 'published' ? true : false;

      const effectiveParentId =
        !selectedParentId ||
        selectedParentId === 'root' ||
        selectedParentId === 'none' ||
        selectedParentId === 'nav-home' ||
        selectedParentId === 'nav-about' ||
        selectedParentId === 'nav-contact'
          ? null
          : selectedParentId;

      // Find parent slug/route if nesting under a parent
      let parentSlug = '';
      if (effectiveParentId) {
        const findParent = (nodes: CategoryTreeNode[]): CategoryTreeNode | null => {
          for (const n of nodes) {
            if (n.id === effectiveParentId) return n;
            if (n.children) {
              const found = findParent(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        const pNode = findParent(categoryTree);
        if (pNode) parentSlug = pNode.slug;
      }

      const finalHref = computeDestinationHref(
        formData.destinationType,
        parentSlug || 'shop',
        cleanSlug,
        formData.destinationReference,
        formData.customHref
      );

      // 1. Call Canonical Recursive Category API
      const catPayload = {
        name: cleanName,
        pageTitle: cleanPageTitle,
        slug: cleanSlug,
        href: finalHref,
        parentId: effectiveParentId,
        order: Number(formData.order) || 1,
        status: statusToSet,
        isActive: effectiveIsActive,
        description: formData.shortDescription.trim() || undefined,
        shortDescription: formData.shortDescription.trim() || undefined,
        detailedDescription: formData.detailedDescription.trim() || undefined,
        bannerImage: formData.bannerImage || undefined,
        thumbnailImage: formData.thumbnailImage || undefined,
        galleryImages: formData.galleryImages || [],
        assignedProductIds: formData.assignedProductIds || [],
        badge: formData.badge.trim() || undefined,
        seoTitle: formData.seoTitle.trim() || undefined,
        seoDescription: formData.seoDescription.trim() || undefined,
        destinationType: formData.destinationType,
        destinationReference: formData.destinationReference || undefined,
      };

      // Check if this category already exists by slug or name in categoryTree to reuse and repair
      let targetId = editingTargetId;
      if (!targetId) {
        const findInTree = (nodes: CategoryTreeNode[]): CategoryTreeNode | null => {
          for (const n of nodes) {
            if (
              n.slug?.toLowerCase() === cleanSlug.toLowerCase() ||
              n.name?.trim().toLowerCase() === cleanName.toLowerCase()
            ) {
              return n;
            }
            if (n.children && n.children.length > 0) {
              const f = findInTree(n.children);
              if (f) return f;
            }
          }
          return null;
        };
        const existingNode = findInTree(categoryTree);
        if (existingNode) {
          targetId = existingNode.id;
        }
      }

      try {
        if (targetId) {
          await categoryService.updateCategory(targetId, catPayload);
        } else {
          await categoryService.createCategory(catPayload);
        }
      } catch (apiErr: any) {
        console.error('Category API save failed:', apiErr);
        showToast(apiErr.message || 'Failed to save category to database', 'error');
        return;
      }

      // 2. Synchronize navigation and category tree state across Admin
      try {
        await refreshNavigationConfig();
      } catch (navErr) {
        console.warn('Navigation refresh notice:', navErr);
      }
      try {
        await fetchCategoryTree();
      } catch (treeErr) {
        console.warn('Tree refresh notice:', treeErr);
      }

      showToast(
        statusToSet === 'published'
          ? `Category "${cleanName}" published live! 🌸`
          : `Category "${cleanName}" saved as Draft.`
      );

      setIsReviewModalOpen(false);
      setIsEditorOpen(false);
      setEditingTargetId(null);
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  // Launch live interactive preview modal
  const handleTriggerPreview = (dataToPreview?: any) => {
    const payload = dataToPreview || {
      name: formData.name || 'Sample Category',
      pageTitle: formData.pageTitle || formData.name || 'Sample Category',
      slug: formData.slug || 'sample',
      description: formData.shortDescription,
      shortDescription: formData.shortDescription,
      detailedDescription: formData.detailedDescription,
      bannerImage: formData.bannerImage,
      thumbnailImage: formData.thumbnailImage,
      galleryImages: formData.galleryImages,
      assignedProductIds: formData.assignedProductIds,
      badge: formData.badge,
      status: formData.status,
    };
    setPreviewDataPayload(payload);
    setIsPreviewModalOpen(true);
  };

  // Delete Category confirmation
  const handleDeleteCategory = async (item: NavItemConfig) => {
    if (item.id === 'nav-home' || item.href === '/' || item.name?.toUpperCase() === 'HOME') {
      showToast('The Home navigation item is permanent and cannot be deleted.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to delete category "${item.name}" and all its submenus?`)) {
      try {
        await categoryService.deleteCategory(item.id, true);
        await fetchCategoryTree();
      } catch (err) {
        console.warn('API delete error:', err);
      }
      const items = (navigationConfig?.items || []).filter((i) => i.id !== item.id);
      updateNavigationConfig({ items });
      showToast(`Deleted category "${item.name}".`);
    }
  };

  // Delete Subcategory confirmation
  const handleDeleteSubItem = async (navId: string, groupId: string, subId: string, subName: string) => {
    if (confirm(`Delete subcategory "${subName}"?`)) {
      try {
        await categoryService.deleteCategory(subId, true);
        await fetchCategoryTree();
      } catch (err) {
        console.warn('API delete error:', err);
      }
      const items = (navigationConfig?.items || []).map((it) => {
        if (it.id === navId) {
          const updatedGroups = (it.subGroups || []).map((grp) => {
            if (grp.id === groupId) {
              return {
                ...grp,
                subItems: grp.subItems.filter((s) => s.id !== subId),
              };
            }
            return grp;
          });
          return { ...it, subGroups: updatedGroups };
        }
        return it;
      });
      updateNavigationConfig({ items });
      showToast(`Deleted subcategory "${subName}".`);
    }
  };

  // Move category position
  const handleMoveCategoryOrder = (index: number, direction: 'up' | 'down') => {
    const items = [...(navigationConfig?.items || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    const reordered = items.map((it, idx) => ({ ...it, order: idx + 1 }));
    updateNavigationConfig({ items: reordered });
    showToast('Reordered category position 🧭');
  };

  // Unified navigation items combining local navigationConfig and root nodes from categoryTree
  const combinedNavItems = useMemo(() => {
    const navItems = [...(navigationConfig?.items || [])];
    const existingIds = new Set(navItems.map((i) => i.id));
    const existingSlugs = new Set(navItems.map((i) => (i.slug || '').toLowerCase()));

    // Ensure HOME is present in admin navigation
    const homeIndex = navItems.findIndex(
      (i) => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME'
    );
    if (homeIndex === -1) {
      navItems.unshift({
        id: 'nav-home',
        name: 'HOME',
        pageTitle: 'HOME',
        slug: 'home',
        href: '/',
        order: 1,
        status: 'published' as PublishStatus,
        isActive: true,
        destinationType: 'HOMEPAGE' as DestinationType,
        galleryImages: [],
        assignedProductIds: [],
        subGroups: [],
      });
    }

    for (const cat of categoryTree) {
      if (cat.parentId && cat.parentId !== 'root' && cat.parentId !== 'none') continue;
      const catSlug = (cat.slug || '').toLowerCase();
      if (!existingIds.has(cat.id) && !existingSlugs.has(catSlug)) {
        navItems.push({
          id: cat.id,
          name: cat.name.toUpperCase(),
          pageTitle: cat.pageTitle || cat.name,
          slug: cat.slug,
          href: cat.href || `/shop/${cat.slug}`,
          order: cat.order || navItems.length + 1,
          status: cat.status as PublishStatus,
          isActive: cat.isActive !== false,
          badge: cat.badge,
          description: cat.description,
          shortDescription: cat.shortDescription,
          detailedDescription: cat.detailedDescription,
          bannerImage: cat.bannerImage,
          thumbnailImage: cat.thumbnailImage,
          galleryImages: cat.galleryImages,
          assignedProductIds: cat.assignedProductIds,
          subGroups: [],
        });
      }
    }
    return navItems;
  }, [navigationConfig, categoryTree]);

  // Filtered List
  const filteredNavItems = useMemo(() => {
    return combinedNavItems
      .filter((item) => {
        if (activeTab === 'published') return item.status !== 'draft' && item.isActive;
        if (activeTab === 'draft') return item.status === 'draft' || !item.isActive;
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const inParent = item.name.toLowerCase().includes(q) || item.href.toLowerCase().includes(q);
        const inSub = item.subGroups?.some((g) =>
          g.subItems.some((s) => s.name.toLowerCase().includes(q) || s.href.toLowerCase().includes(q))
        );
        return inParent || inSub;
      })
      .sort((a, b) => a.order - b.order);
  }, [combinedNavItems, activeTab, searchQuery]);

  // Product selection filter list
  const selectableProducts = useMemo(() => {
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
    <div className="flex min-h-screen bg-[#F8F7F4]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Page Top Header with Clean Action Buttons */}
        <AdminHeader
          title="Categories & Menu"
          subtitle="Use this page to manage the categories customers see in the website menu. You can add new categories, create submenu items and choose where each item should go."
          actions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset navigation & categories to brand defaults?')) {
                    resetNavigationConfig();
                    showToast('Navigation reset to brand defaults! 🌸');
                  }
                }}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddSubItem()}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Add Submenu Item</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddCategory}
                className="h-9 inline-flex items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs shadow-md shadow-amber-800/20 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Add Main Category</span>
              </button>
            </div>
          }
        />

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-8 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-bold animate-fadeIn ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-200 border border-rose-500/40'
                : 'bg-stone-900 text-amber-400 border border-amber-500/30'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
          
          {/* Quick Guide & Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search category or submenu page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-stone-900"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: 'All Items', value: 'all' },
                { label: 'Published Live', value: 'published' },
                { label: 'Drafts & Hidden', value: 'draft' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.value
                      ? 'bg-amber-800 text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Hierarchy Card List */}
          <div className="space-y-4">
            {filteredNavItems.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-stone-200/80 text-center space-y-3">
                <FolderTree className="w-8 h-8 text-stone-400 mx-auto" />
                <h4 className="font-heading font-black text-base text-stone-800">
                  No categories found matching query
                </h4>
                <p className="text-xs text-stone-500">
                  Try clearing your search query or add a new category.
                </p>
              </div>
            ) : (
              filteredNavItems.map((cat, idx) => {
                const isExpanded = expandedItemId === cat.id;
                const subItemCount = (cat.subGroups || []).reduce(
                  (sum, g) => sum + (g.subItems?.length || 0),
                  0
                );

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-shadow overflow-hidden"
                  >
                    {/* Top Level Category Row */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Order Arrows */}
                        <div className="flex flex-col space-y-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveCategoryOrder(idx, 'up')}
                            className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-20 rounded"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredNavItems.length - 1}
                            onClick={() => handleMoveCategoryOrder(idx, 'down')}
                            className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-20 rounded"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Order Badge */}
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          #{cat.order}
                        </span>

                        {/* Name & Route */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-heading font-black text-sm text-stone-900 tracking-wider">
                              {cat.name}
                            </span>
                            {cat.badge && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-stone-950">
                                {cat.badge}
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-stone-400">
                              → {cat.href}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-stone-500 truncate max-w-lg">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for Category */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        
                        {/* Status Label */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            cat.status === 'draft' || !cat.isActive
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {cat.status === 'draft' || !cat.isActive ? 'Draft' : 'Published'}
                        </span>

                        {/* Preview Category Page (Section 8) */}
                        <button
                          type="button"
                          onClick={() => handleTriggerPreview(cat)}
                          className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center space-x-1"
                          title="Preview category page before publishing"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-500" />
                          <span>Preview</span>
                        </button>

                        {/* Add Subcategory under this parent */}
                        <button
                          type="button"
                          onClick={() => handleOpenAddSubItem(cat.id)}
                          className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/80 transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Subcategory</span>
                        </button>

                        {/* Expand/Collapse subitems */}
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : cat.id)}
                          className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center space-x-1"
                        >
                          <span>{subItemCount} items</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Edit Category */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-100/60 rounded-lg transition-colors"
                          title="Edit Category Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Category */}
                        {cat.id === 'nav-home' || cat.href === '/' ? (
                          <span
                            className="p-1.5 text-stone-300 cursor-not-allowed rounded-lg"
                            title="Home navigation item is a required core link"
                          >
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submenu Items Accordion Content */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 bg-stone-50/70 border-t border-stone-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-heading font-black text-stone-800 uppercase tracking-wider flex items-center space-x-1.5">
                            <Layers className="w-3.5 h-3.5 text-amber-600" />
                            <span>Submenu Pages under {cat.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddSubItem(cat.id)}
                            className="text-xs font-bold text-amber-800 hover:underline flex items-center space-x-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add new subcategory</span>
                          </button>
                        </div>

                        {/* Subitems List */}
                        {cat.subGroups?.map((group) => (
                          <div key={group.id} className="space-y-2">
                            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-widest px-1">
                              Column: {group.title}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {group.subItems.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-heading font-black text-xs text-stone-900">
                                        {sub.name}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                          sub.status === 'draft' || sub.isActive === false
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        }`}
                                      >
                                        {sub.status === 'draft' || sub.isActive === false ? 'Draft' : 'Live'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-stone-400 block truncate">
                                      {sub.href}
                                    </span>
                                    {sub.description && (
                                      <p className="text-[11px] text-stone-500 line-clamp-1">
                                        {sub.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerPreview(sub)}
                                      className="text-[11px] font-bold text-stone-600 hover:text-amber-800 flex items-center space-x-1"
                                    >
                                      <Eye className="w-3 h-3 text-stone-400" />
                                      <span>Preview Page</span>
                                    </button>

                                    <div className="flex items-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditSubItem(cat.id, group.id, sub)}
                                        className="p-1 text-stone-500 hover:text-amber-800 rounded"
                                        title="Edit Submenu Page"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubItem(cat.id, group.id, sub.id, sub.name)}
                                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                                        title="Delete Submenu Page"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* DRAWER / MODAL: CATEGORY & SUBCATEGORY STUDIO EDITOR           */}
      {/* ============================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-200 animate-scaleIn max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  {editorMode === 'category' ? 'Top-Level Navigation' : `Subcategory under ${parentNavId.replace('nav-', '').toUpperCase()}`}
                </span>
                <h3 className="font-heading font-black text-lg text-stone-900 tracking-wider uppercase">
                  {editingTargetId
                    ? `Edit ${editorMode === 'category' ? 'Category' : 'Submenu'} Page`
                    : `+ Add New ${editorMode === 'category' ? 'Category' : 'Submenu'} Page`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-stone-400 hover:text-stone-800 text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs (Step 1: Category Details, Step 2: Choose Products) */}
            <div className="flex items-center space-x-1.5 border-b border-stone-100 pb-2 overflow-x-auto text-xs font-bold">
              {[
                { id: 'basic', label: 'STEP 1 — Category Details', icon: FolderTree },
                { id: 'products', label: 'STEP 2 — Choose Products', icon: Package },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeEditorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEditorTab(tab.id as 'basic' | 'products')}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-amber-800 text-white shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs font-semibold">
              
              {/* TAB 1: BASIC INFORMATION */}
              {activeEditorTab === 'basic' && (
                <div className="space-y-4">
                  {/* Category Name */}
                  <div className="space-y-1">
                    <label className="text-stone-700 font-bold block">
                      Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PARTY DRESSES, CASHMERE CARDIGANS, PLAY ROMPERS"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-stone-900"
                    />
                    <p className="text-[11px] text-stone-500">
                      Enter the name customers will see in the menu.
                    </p>
                  </div>

                  {/* Page Title */}
                  <div className="space-y-1">
                    <label className="text-stone-700 font-bold block">Page Title</label>
                    <input
                      type="text"
                      placeholder="e.g. PARTY DRESSES COLLECTION"
                      value={formData.pageTitle}
                      onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-stone-900"
                    />
                    <p className="text-[11px] text-stone-500">
                      Enter the main heading displayed at the top of this page.
                    </p>
                  </div>

                  {/* URL Slug & Parent Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-stone-700 font-bold block">URL Slug</label>
                      <input
                        type="text"
                        placeholder="e.g. party-dresses"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono"
                      />
                      <p className="text-[11px] text-stone-500">
                        Use a short, readable URL. For example: party-dresses.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-stone-700 font-bold block">Parent Category</label>
                      <select
                        value={!selectedParentId || selectedParentId === 'none' ? 'root' : selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium"
                      >
                        <option value="root">None (Top-Level Category)</option>
                        {flatCategoryOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-stone-500">
                        Select any category at any nesting level to create children, grandchildren, etc.
                      </p>
                    </div>
                  </div>

                  {/* Display Order & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-stone-700 font-bold block">Display Order</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-700 font-bold block">Optional Badge</label>
                      <input
                        type="text"
                        placeholder="e.g. NEW, 20% OFF, LUXURY"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Destination Page Type Selector */}
                  <div className="space-y-1 pt-1">
                    <label className="text-stone-700 font-bold block">Destination Page Type</label>
                    <select
                      value={formData.destinationType}
                      onChange={(e) => setFormData({ ...formData, destinationType: e.target.value as DestinationType })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold"
                    >
                      <option value="CATEGORY_PAGE">Dedicated Category Shopping Page (using standard template)</option>
                      <option value="SHOP_PAGE">Main Shop Page (/shop)</option>
                      <option value="NEW_ARRIVALS">New Arrivals (/new-in)</option>
                      <option value="SALE_PAGE">Sale (/sale)</option>
                      <option value="CUSTOM_PAGE">Custom Internal Route</option>
                      <option value="EXTERNAL_URL">External Website URL</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 4: PRODUCTS ASSIGNMENT (Section 6) */}
              {activeEditorTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs">
                        Choose which products belong to this category
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Select catalog items to display. Selected products will be showcased exclusively on this category page.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200">
                      {formData.assignedProductIds.length} Products Selected
                    </span>
                  </div>

                  {/* Product Search Box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search catalog products by name or category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>

                  {/* Selectable Products Grid */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
                    {selectableProducts.map((prod) => {
                      const isSelected = formData.assignedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProduct(prod.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                              : 'bg-white border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                              <Image
                                src={prod.images[0]?.url || '/images/products/organic-onesie.jpg'}
                                alt={prod.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-stone-900 text-xs block line-clamp-1">
                                {prod.name}
                              </span>
                              <span className="text-[10px] text-stone-500">
                                {prod.category.name} • {formatCurrency(prod.price)}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Assigned
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Reorder Assigned Products List if any */}
                  {formData.assignedProductIds.length > 0 && (
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                        Assigned Products Display Order:
                      </span>
                      <div className="space-y-1">
                        {formData.assignedProductIds.map((id, index) => {
                          const p = allProducts.find((item) => item.id === id);
                          if (!p) return null;
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200 text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-stone-400 text-[10px]">#{index + 1}</span>
                                <span className="font-semibold text-stone-800">{p.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveProductOrder(index, 'up')}
                                  className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-20"
                                >
                                  <MoveUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === formData.assignedProductIds.length - 1}
                                  onClick={() => handleMoveProductOrder(index, 'down')}
                                  className="p-1 text-stone-400 hover:text-stone-800 disabled:opacity-20"
                                >
                                  <MoveDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProduct(id)}
                                  className="p-1 text-stone-400 hover:text-rose-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer Workflow Actions (Sections 9 & 10) */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleTriggerPreview()}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-600" />
                  <span>Preview Page</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {activeEditorTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => setActiveEditorTab('basic')}
                    className="px-3.5 py-2 text-stone-600 hover:text-stone-900 font-bold text-xs bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    ← Back
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => executeSave('draft')}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl text-stone-800 font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1.5 ${
                    isSaving
                      ? 'bg-stone-200 opacity-60 cursor-not-allowed'
                      : 'bg-stone-200 hover:bg-stone-300'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
                      <span>Saving Draft...</span>
                    </>
                  ) : (
                    <span>Save Draft</span>
                  )}
                </button>

                {activeEditorTab === 'basic' ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      if (!formData.name.trim()) {
                        showToast('Please enter a Category Name first', 'error');
                        return;
                      }
                      setActiveEditorTab('products');
                    }}
                    className={`px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-colors shadow-2xs flex items-center space-x-1 ${
                      isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <span>Save & Continue →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      if (!formData.name.trim()) {
                        showToast('Please enter a Category Name', 'error');
                        setActiveEditorTab('basic');
                        return;
                      }
                      setIsReviewModalOpen(true);
                    }}
                    className={`btn-rexbebe-3d btn-3d-pink px-5 py-2.5 text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 ${
                      isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    <span>Publish Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 11: PRE-PUBLISH REVIEW MODAL                           */}
      {/* ============================================================== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-200 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-heading font-black text-base text-stone-900 tracking-wider uppercase">
                  Review Before Publishing
                </h3>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsReviewModalOpen(false)}
                className={`text-stone-400 hover:text-stone-800 text-lg font-bold ${
                  isSaving ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Category Name:</span>
                  <span className="font-black text-stone-900">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Page Title:</span>
                  <span className="font-bold text-stone-900">{formData.pageTitle || formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Destination URL:</span>
                  <span className="font-mono text-amber-900 font-bold">
                    {computeDestinationHref(
                      formData.destinationType,
                      editorMode === 'subcategory' ? parentNavId : formData.parentCategory,
                      formData.slug,
                      formData.destinationReference,
                      formData.customHref
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Main Banner:</span>
                  <span className="font-bold text-stone-800">
                    {formData.bannerImage ? '✓ Uploaded' : 'Standard Atelier Banner'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Assigned Products:</span>
                  <span className="font-bold text-stone-900">
                    {formData.assignedProductIds.length > 0
                      ? `${formData.assignedProductIds.length} Products`
                      : 'Automatic Category Matching'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-bold">Publication Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Publish Live
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed">
                Publishing will make this page immediately accessible across the storefront navigation header and mobile menus.
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsReviewModalOpen(false)}
                className={`px-4 py-2 text-stone-600 hover:text-stone-900 font-bold text-xs ${
                  isSaving ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={() => executeSave('published')}
                disabled={isSaving}
                className={`btn-rexbebe-3d btn-3d-pink px-6 py-2.5 text-xs font-black tracking-wider uppercase flex items-center space-x-1.5 ${
                  isSaving ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Page Now 🌸</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 8: MANDATORY LIVE INTERACTIVE PREVIEW MODAL             */}
      {/* ============================================================== */}
      {isPreviewModalOpen && previewDataPayload && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 select-none">
          {/* Top Control Bar */}
          <div className="w-full max-w-6xl bg-stone-900 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between shadow-2xl border-b border-stone-800">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-mono text-stone-400 pl-2">
                Preview: {previewDataPayload.name}
              </span>
            </div>

            {/* Desktop vs Mobile Toggle */}
            <div className="flex items-center space-x-1.5 bg-stone-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile (390px)</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="text-stone-400 hover:text-white text-xs font-bold flex items-center space-x-1 px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
            >
              <span>Return to Editor</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview Viewport Frame */}
          <div
            className={`w-full bg-[#FAF9F6] overflow-y-auto max-h-[82vh] rounded-b-3xl shadow-2xl transition-all duration-300 ${
              previewDevice === 'mobile'
                ? 'max-w-[420px] border-x-8 border-b-8 border-stone-800'
                : 'max-w-6xl border border-stone-200'
            }`}
          >
            <CategoryShoppingTemplate
              slug={previewDataPayload.slug || 'preview'}
              customTitle={previewDataPayload.pageTitle || previewDataPayload.name}
              customDescription={previewDataPayload.description}
              customBadge={previewDataPayload.badge}
              previewData={previewDataPayload}
              isModalPreview={true}
            />
          </div>
        </div>
      )}

    </div>
  );
}
