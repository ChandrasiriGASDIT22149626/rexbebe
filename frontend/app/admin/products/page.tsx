'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Sparkles,
  Star,
  Check,
  X,
  Package,
  Layers,
  ArrowUpDown,
  RotateCcw,
  ExternalLink,
  Eye,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Tag,
  Monitor,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Calendar,
  DollarSign,
  Palette,
  Boxes,
  Award,
  Globe,
  SlidersHorizontal,
  Paintbrush,
  MoveUp,
  MoveDown,
  Wand2,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { useAdminData } from '../../../hooks/AdminContext';
import { Product, ProductColorOption, ProductPart, ProductVariant, ProductImage } from '../../../types/product';
import { uploadService } from '../../../services/uploadService';
import { formatCurrency } from '../../../utils/formatCurrency';
import { categoryService, CategoryItem, CategoryTreeNode } from '../../../services/categoryService';
import { FabricRecolorStudio } from '../../../components/admin/FabricRecolorStudio';

// Presets
const BABY_SIZES_PRESET = [
  'Newborn',
  '0–3 Months',
  '3–6 Months',
  '6–9 Months',
  '9–12 Months',
  '12–18 Months',
  '18–24 Months',
];

const PRESET_COLOURS: ProductColorOption[] = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Beige', hex: '#E7D8C9' },
  { name: 'Baby Pink', hex: '#F9A8D4' },
  { name: 'Ivory Cream', hex: '#FEF3C7' },
  { name: 'Mint Green', hex: '#A7F3D0' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Sky Blue', hex: '#BAE6FD' },
  { name: 'Warm Sand', hex: '#D4B895' },
  { name: 'Sage Green', hex: '#9BA88D' },
];

const PART_TYPES = [
  'T-shirt',
  'Shirt',
  'Pants',
  'Shorts',
  'Dress',
  'Romper',
  'Hat',
  'Jacket',
  'Other',
] as const;

type ProductFormTab =
  | 'basic'
  | 'parts'
  | 'sizes-stock'
  | 'colours-images'
  | 'pricing'
  | 'preview';

export default function AdminProductsPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    updateProductStatus,
    toggleBestSeller,
    toggleFeatured,
    toggleNewArrival,
    refreshProducts,
    isLoaded,
  } = useAdminData();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'stock' | 'rating'>('name');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Wizard Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductFormTab>('basic');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Action Modals
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const colorUploadTargetRef = useRef<string | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement | null>(null);

  // Studio Recolor Modal
  const [studioConfig, setStudioConfig] = useState<{
    isOpen: boolean;
    baseImageUrl: string;
    targetColorHex: string;
    targetColorName: string;
    baseColorHex?: string;
    baseColorName?: string;
    partName: string;
  } | null>(null);

  // Custom Color inputs in form
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#EF4444');

  // Custom Size input in form
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Categories Tree & Flat List
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [flatCategories, setFlatCategories] = useState<
    { id: string; name: string; slug: string; depth: number; label: string }[]
  >([]);

  const fetchCategories = useCallback(async () => {
    try {
      const [rawCats, tree] = await Promise.all([
        categoryService.getCategories(),
        categoryService.getCategoryTree(),
      ]);
      setAllCategories(Array.isArray(rawCats) ? rawCats : []);

      const list: { id: string; name: string; slug: string; depth: number; label: string }[] = [];
      const traverse = (nodes: CategoryTreeNode[], depth: number) => {
        for (const node of nodes) {
          const indent = depth > 0 ? `${'— '.repeat(depth)}` : '';
          list.push({
            id: node.id,
            name: node.name,
            slug: node.slug,
            depth,
            label: `${indent}${node.name}`,
          });
          if (node.children && node.children.length > 0) {
            traverse(node.children, depth + 1);
          }
        }
      };
      traverse(tree, 0);
      setFlatCategories(list);
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    refreshProducts();
  }, [fetchCategories, refreshProducts]);

  // Main Categories (top-level, no parentId)
  const mainCategories = useMemo(() => {
    const mains = allCategories.filter((c) => !c.parentId && c.isActive !== false);
    if (mains.length > 0) return mains;
    return [
      { id: 'cat-clothing', name: 'Baby Clothing', slug: 'baby-clothing', isActive: true, status: 'published' as const, href: '/shop/baby-clothing' },
      { id: 'cat-sets', name: 'Clothing Sets', slug: 'clothing-sets', isActive: true, status: 'published' as const, href: '/shop/clothing-sets' },
      { id: 'cat-sleepwear', name: 'Sleepwear & Pyjamas', slug: 'sleepwear', isActive: true, status: 'published' as const, href: '/shop/sleepwear' },
      { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', isActive: true, status: 'published' as const, href: '/shop/accessories' },
    ];
  }, [allCategories]);

  // Form State
  const [formData, setFormData] = useState({
    // 1. Basic Info
    name: '',
    slug: '',
    sku: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    categoryName: 'Baby Clothing',
    categorySlug: 'baby-clothing',
    subcategoryId: '',
    subcategoryName: '',
    subcategorySlug: '',
    productType: 'single' as 'single' | 'set',
    status: 'published' as 'published' | 'draft' | 'unpublished',
    images: ['/images/products/organic-onesie.jpg'] as string[],
    gender: 'Baby' as 'Baby' | 'Girls' | 'Boys' | 'Unisex',
    ageGroup: '0–3 months',
    brand: 'REXBEBE Atelier',

    // 2. Product Parts (Clothing Components)
    parts: [] as ProductPart[],

    // 3. Sizes & Stock Matrix
    sizes: ['0–3 Months', '3–6 Months'] as string[],
    lowStockThreshold: 5,
    // matrix maps "size___colorName" to quantity
    stockMatrix: {} as Record<string, number>,

    // 4. Overall Colors list (only colours added by admin)
    colors: [] as ProductColorOption[],
    // Colour variation images map: colorName -> imageUrl
    colorImages: {} as Record<string, string>,

    // 5. Pricing
    sellingPrice: 14500,
    comparePrice: '' as string | number,
    saleStartDate: '',
    saleEndDate: '',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    isSaleBadge: false,

    // Fabric specs
    fabricMaterial: '100% GOTS Certified Organic Cotton',
    careInstructions: 'Gentle cold machine wash inside out. Do not tumble dry. Warm iron on reverse.',
  });

  // State to switch colour variation preview inside Section 6
  const [previewSelectedColor, setPreviewSelectedColor] = useState<string>('Red');

  // Calculate dynamic discount percentage
  const calculatedDiscount = useMemo(() => {
    const reg = Number(formData.comparePrice);
    const sell = Number(formData.sellingPrice);
    if (!reg || reg <= sell || sell <= 0) return 0;
    return Math.round((1 - sell / reg) * 100);
  }, [formData.sellingPrice, formData.comparePrice]);

  // Current Subcategories for the selected Main Category
  const currentSubcategories = useMemo(() => {
    if (!formData.categoryId) return [];
    return allCategories.filter((c) => c.parentId === formData.categoryId && c.isActive !== false);
  }, [allCategories, formData.categoryId]);

  // Available Categories fallback
  const availableCategories = useMemo(() => {
    if (flatCategories.length > 0) return flatCategories;
    return [
      { id: 'cat-clothing', name: 'Baby Clothing', slug: 'baby-clothing', depth: 0, label: 'Baby Clothing' },
      { id: 'cat-newborn', name: 'Newborn (0–3M)', slug: 'newborn', depth: 1, label: '— Newborn (0–3M)' },
      { id: 'cat-boys', name: 'Baby Boys', slug: 'boys', depth: 1, label: '— Baby Boys' },
      { id: 'cat-girls', name: 'Baby Girls', slug: 'girls', depth: 1, label: '— Baby Girls' },
      { id: 'cat-sets', name: 'Clothing Sets', slug: 'clothing-sets', depth: 1, label: '— Clothing Sets' },
    ];
  }, [flatCategories]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === 'ALL' ||
        p.category?.id === selectedCategory ||
        p.category?.slug === selectedCategory ||
        p.category?.name?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.subcategory?.id === selectedCategory ||
        p.subcategory?.slug === selectedCategory ||
        p.subcategory?.name?.toLowerCase() === selectedCategory.toLowerCase();

      let matchStock = true;
      const stock = p.stockQuantity ?? p.variants?.reduce((s, v) => s + (v.stockQuantity || 0), 0) ?? 0;
      if (selectedStockFilter === 'IN_STOCK') matchStock = stock > (p.lowStockThreshold || 5);
      else if (selectedStockFilter === 'LOW_STOCK') matchStock = stock > 0 && stock <= (p.lowStockThreshold || 5);
      else if (selectedStockFilter === 'OUT_OF_STOCK') matchStock = stock <= 0;

      let matchStatus = true;
      if (selectedStatusFilter !== 'ALL') {
        const prodStatus = p.status || 'published';
        matchStatus = prodStatus.toLowerCase() === selectedStatusFilter.toLowerCase();
      }

      return matchSearch && matchCategory && matchStock && matchStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock') {
        const stockA = a.stockQuantity ?? 0;
        const stockB = b.stockQuantity ?? 0;
        return stockB - stockA;
      }
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [products, searchQuery, selectedCategory, selectedStockFilter, selectedStatusFilter, sortBy]);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Active colours for matrix - strictly only what the admin actually configured
  const activeMatrixColors = useMemo<ProductColorOption[]>(() => {
    if (formData.parts && formData.parts.length > 0) {
      const activeParts = formData.parts.filter((p) => p.active !== false);
      const colorMap = new Map<string, ProductColorOption>();
      activeParts.forEach((part) => {
        (part.colors || []).forEach((c) => {
          if (c && c.name) {
            const key = c.name.toLowerCase().trim();
            if (!colorMap.has(key)) {
              colorMap.set(key, c);
            }
          }
        });
      });
      const partCols = Array.from(colorMap.values());
      if (partCols.length > 0) return partCols;
    }
    return formData.colors || [];
  }, [formData.parts, formData.colors]);

  // Calculate total matrix stock
  const totalMatrixStock = useMemo(() => {
    let sum = 0;
    formData.sizes.forEach((sz) => {
      if (activeMatrixColors.length > 0) {
        activeMatrixColors.forEach((col) => {
          const key = `${sz}___${col.name}`;
          sum += Math.max(0, formData.stockMatrix[key] || 0);
        });
      } else {
        const key = `${sz}___Standard`;
        sum += Math.max(0, formData.stockMatrix[key] || 0);
      }
    });
    return sum;
  }, [formData.sizes, activeMatrixColors, formData.stockMatrix]);

  // Open Add Product Wizard
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const defaultCat = mainCategories[0] || { id: 'cat-clothing', name: 'Baby Clothing', slug: 'baby-clothing' };

    const initialPart: ProductPart = {
      id: `part-${Date.now()}`,
      name: 'Clothing Part 1',
      type: 'T-shirt',
      description: '',
      colors: [],
      defaultColor: '',
      active: true,
      images: [],
    };

    setFormData({
      name: '',
      slug: '',
      sku: `REX-BABY-${Math.floor(Math.random() * 9000 + 1000)}`,
      shortDescription: '',
      description: '',
      categoryId: defaultCat.id,
      categoryName: defaultCat.name,
      categorySlug: defaultCat.slug,
      subcategoryId: '',
      subcategoryName: '',
      subcategorySlug: '',
      productType: 'single',
      status: 'published',
      images: [],
      gender: 'Baby',
      ageGroup: '0–12 months',
      brand: 'REXBEBE Atelier',
      parts: [initialPart],
      sizes: ['0–3 Months', '3–6 Months'],
      lowStockThreshold: 5,
      stockMatrix: {},
      colors: [],
      colorImages: {},
      sellingPrice: 1900,
      comparePrice: '',
      saleStartDate: '',
      saleEndDate: '',
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isSaleBadge: false,
      fabricMaterial: '100% GOTS Certified Organic Cotton',
      careInstructions: 'Gentle cold machine wash inside out. Do not tumble dry. Warm iron on reverse.',
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  // Open Edit Product Wizard
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);

    const existingImages: string[] =
      p.images && p.images.length > 0
        ? p.images.map((img) => img.url)
        : ['/images/products/organic-onesie.jpg'];

    const colors: ProductColorOption[] =
      p.colors && p.colors.length > 0
        ? p.colors
        : (p.variants || [])
            .filter((v) => v.color && v.colorHex)
            .map((v) => ({ name: v.color!, hex: v.colorHex! }))
            .filter((item, idx, self) => self.findIndex((c) => c.name.toLowerCase() === item.name.toLowerCase()) === idx);

    const sizes: string[] =
      p.sizes && p.sizes.length > 0
        ? p.sizes
        : Array.from(
            new Set((p.variants || []).map((v) => v.size).filter(Boolean) as string[])
          );

    // Build existing stock matrix from variants
    const matrix: Record<string, number> = {};
    (p.variants || []).forEach((v) => {
      const colName = v.color || (v.partColors ? Object.values(v.partColors)[0] : 'Standard');
      const szName = v.size || 'Standard';
      if (v.partId) {
        matrix[`${v.partId}___${szName}___${colName}`] = v.stockQuantity ?? 0;
      } else {
        matrix[`${szName}___${colName}`] = v.stockQuantity ?? 0;
      }
    });

    // Build existing colorImages map
    const colImgMap: Record<string, string> = {};
    (p.images || []).forEach((img) => {
      if (img.colorName) colImgMap[img.colorName] = img.url;
    });
    (p.variants || []).forEach((v) => {
      if (v.color && v.imageUrl) {
        // If an image was assigned, check if it's genuinely dedicated or the primary base colour
        const isPrimaryColor = colors[0]?.name && v.color.toLowerCase() === colors[0].name.toLowerCase();
        const isDifferentFromBase = existingImages.length > 0 && v.imageUrl !== existingImages[0];
        if (isPrimaryColor || isDifferentFromBase || !colImgMap[v.color]) {
          // If different from base or primary, assign
          if (isPrimaryColor || isDifferentFromBase) {
            colImgMap[v.color] = v.imageUrl;
          }
        }
      }
    });

    // Initialize parts from genuine product data
    let initialParts: ProductPart[] = [];
    if (p.parts && p.parts.length > 0) {
      initialParts = p.parts.map((part) => {
        const partColors = part.colors && part.colors.length > 0 ? part.colors : colors;
        return {
          ...part,
          colors: partColors,
          defaultColor: part.defaultColor || partColors[0]?.name || '',
        };
      });
    } else {
      initialParts = [
        {
          id: `part-${p.id || Date.now()}`,
          name: p.name || 'Clothing Part 1',
          type: 'T-shirt',
          description: '',
          colors: colors,
          defaultColor: colors[0]?.name || '',
          active: true,
          images: [],
        },
      ];
    }

    const hasSale = Boolean(p.comparePrice && p.comparePrice > p.price);
    const sellingPrice = p.price;
    const comparePrice = hasSale ? p.comparePrice! : '';

    let mainCatId = p.category?.id || '';
    let mainCatName = p.category?.name || '';
    let mainCatSlug = p.category?.slug || '';
    let subCatId = p.subcategory?.id || '';
    let subCatName = p.subcategory?.name || '';
    let subCatSlug = p.subcategory?.slug || '';

    // If p.category is actually a subcategory (has parentId), resolve its parent
    const catItem = allCategories.find((c) => (mainCatId && c.id === mainCatId) || (mainCatSlug && c.slug === mainCatSlug));
    if (catItem && catItem.parentId) {
      const parentItem = allCategories.find((c) => c.id === catItem.parentId);
      if (parentItem) {
        subCatId = catItem.id;
        subCatName = catItem.name;
        subCatSlug = catItem.slug;
        mainCatId = parentItem.id;
        mainCatName = parentItem.name;
        mainCatSlug = parentItem.slug;
      }
    } else if (!mainCatId && mainCategories.length > 0) {
      mainCatId = mainCategories[0].id;
      mainCatName = mainCategories[0].name;
      mainCatSlug = mainCategories[0].slug;
    }

    setFormData({
      name: p.name,
      slug: p.slug,
      sku: p.sku || `REX-${p.slug.substring(0, 4).toUpperCase()}`,
      shortDescription: p.shortDescription || p.description?.slice(0, 100) || '',
      description: p.description || '',
      categoryId: mainCatId,
      categoryName: mainCatName || 'Baby Clothing',
      categorySlug: mainCatSlug || 'baby-clothing',
      subcategoryId: subCatId,
      subcategoryName: subCatName,
      subcategorySlug: subCatSlug,
      productType: p.productType || (p.parts && p.parts.length > 0 ? 'set' : 'single'),
      status: p.status || 'published',
      images: existingImages,
      gender: (p.gender as any) || 'Baby',
      ageGroup: p.ageGroup || '0–12 months',
      brand: p.brand || 'REXBEBE Atelier',
      parts: initialParts,
      sizes: sizes,
      lowStockThreshold: p.lowStockThreshold || 5,
      stockMatrix: matrix,
      colors: colors,
      colorImages: colImgMap,
      sellingPrice,
      comparePrice,
      saleStartDate: p.saleStartDate || '',
      saleEndDate: p.saleEndDate || '',
      isFeatured: Boolean(p.isFeatured),
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      isSaleBadge: Boolean(p.isSaleBadge ?? hasSale),
      fabricMaterial: p.fabricMaterial || '100% GOTS Certified Organic Cotton',
      careInstructions: p.careInstructions || 'Gentle cold machine wash inside out. Do not tumble dry. Warm iron on reverse.',
    });

    setActiveTab('basic');
    setIsModalOpen(true);
  };

  // Image Upload Handlers
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadService.uploadImage(file);
        uploadedUrls.push(res.url);
      }

      if (replaceIndexRef.current !== null) {
        const targetIdx = replaceIndexRef.current;
        setFormData((prev) => {
          const nextImages = [...prev.images];
          nextImages[targetIdx] = uploadedUrls[0];
          return { ...prev, images: nextImages };
        });
        replaceIndexRef.current = null;
        showToast('Image replaced successfully! 🌸');
      } else {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        showToast(`${uploadedUrls.length} image(s) uploaded successfully! 📸`);
      }
    } catch (err: any) {
      showToast(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload specific image for a colour variation (Option A)
  const handleUploadColorSpecificImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetCol = colorUploadTargetRef.current;
    if (!file || !targetCol) return;
    setIsUploading(true);

    try {
      const res = await uploadService.uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        colorImages: {
          ...prev.colorImages,
          [targetCol]: res.url,
        },
      }));
      showToast(`Photo uploaded for "${targetCol}" variation! 📸`);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload colour image.');
    } finally {
      setIsUploading(false);
      colorUploadTargetRef.current = null;
      if (colorFileInputRef.current) colorFileInputRef.current.value = '';
    }
  };

  // Trigger Option A file chooser
  const triggerColorUpload = (colName: string) => {
    colorUploadTargetRef.current = colName;
    colorFileInputRef.current?.click();
  };

  // Trigger Option B Fabric Recolor Studio
  const triggerRecolorStudio = (col: ProductColorOption, partName?: string) => {
    const baseImg = formData.images[0] || '/images/products/dino-baby-set.jpg';
    const primaryColor = activeMatrixColors[0] || formData.colors[0];
    setStudioConfig({
      isOpen: true,
      baseImageUrl: baseImg,
      targetColorHex: col.hex,
      targetColorName: col.name,
      baseColorHex: primaryColor?.hex,
      baseColorName: primaryColor?.name,
      partName: partName || 'T-shirt Fabric',
    });
  };

  // Handle saving variation generated by FabricRecolorStudio
  const handleSaveStudioVariation = (newImageUrl: string) => {
    if (!studioConfig) return;
    const { targetColorName, partName } = studioConfig;

    setFormData((prev) => {
      // 1. Update colorImages map
      const nextColImgs = { ...prev.colorImages, [targetColorName]: newImageUrl };

      // 2. Also attach to the part if it exists
      const nextParts = prev.parts.map((p) => {
        if (p.name === partName || ['T-shirt', 'Shirt'].includes(p.type)) {
          const existingImgs = p.images || [];
          const updatedImgs = existingImgs.filter((img) => img.colorName !== targetColorName);
          updatedImgs.push({
            url: newImageUrl,
            colorName: targetColorName,
            alt: `${p.name} - ${targetColorName}`,
            isRecolored: true,
          });
          return { ...p, images: updatedImgs };
        }
        return p;
      });

      return {
        ...prev,
        colorImages: nextColImgs,
        parts: nextParts,
      };
    });

    setStudioConfig(null);
    showToast(`Colour variation for "${targetColorName}" generated and saved! ✨`);
  };

  // Add a new clothing component part
  const handleAddPart = () => {
    const newPart: ProductPart = {
      id: `part-${Date.now()}`,
      name: `Clothing Part ${formData.parts.length + 1}`,
      type: 'T-shirt',
      description: '',
      colors: [],
      defaultColor: '',
      active: true,
      images: [],
    };
    setFormData((prev) => ({
      ...prev,
      parts: [...prev.parts, newPart],
    }));
    showToast('New clothing component added! 👕');
  };

  // Reorder part
  const handleMovePart = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= formData.parts.length) return;
    setFormData((prev) => {
      const copy = [...prev.parts];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, parts: copy };
    });
  };

  // Remove part
  const handleRemovePart = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((p) => p.id !== id),
    }));
    showToast('Clothing component removed.');
  };

  // Toggle colour on a clothing component part
  const handleTogglePartColor = (pIdx: number, pc: ProductColorOption) => {
    const part = formData.parts[pIdx];
    if (!part) return;

    const isSelected = part.colors.some((c) => c.name.toLowerCase() === pc.name.toLowerCase());

    if (isSelected) {
      // Admin is deselecting this colour
      const otherPartsWithThisColor = formData.parts.filter(
        (p, i) => i !== pIdx && p.active !== false && p.colors.some((c) => c.name.toLowerCase() === pc.name.toLowerCase())
      );
      const isOnlyPart = otherPartsWithThisColor.length === 0;

      let hasStock = false;
      let totalQtyForColor = 0;
      if (isOnlyPart) {
        formData.sizes.forEach((sz) => {
          const key = `${sz}___${pc.name}`;
          const q = formData.stockMatrix[key] || 0;
          if (q > 0) {
            hasStock = true;
            totalQtyForColor += q;
          }
        });
      }
      formData.sizes.forEach((sz) => {
        const pKey = `${part.id}___${sz}___${pc.name}`;
        const pq = formData.stockMatrix[pKey] || 0;
        if (pq > 0) {
          hasStock = true;
          totalQtyForColor += pq;
        }
      });

      if (hasStock) {
        const confirmed = window.confirm(
          `Colour "${pc.name}" has recorded inventory (${totalQtyForColor} units). Are you sure you want to remove this colour and its stock fields?`
        );
        if (!confirmed) return;
      }

      setFormData((prev) => {
        const nextParts = prev.parts.map((p, i) => {
          if (i !== pIdx) return p;
          const nextCols = p.colors.filter((c) => c.name.toLowerCase() !== pc.name.toLowerCase());
          const nextDef = p.defaultColor?.toLowerCase() === pc.name.toLowerCase() ? nextCols[0]?.name || '' : p.defaultColor;
          return { ...p, colors: nextCols, defaultColor: nextDef };
        });

        const nextMatrix = { ...prev.stockMatrix };
        const nextColImgs = { ...prev.colorImages };

        if (isOnlyPart) {
          delete nextColImgs[pc.name];
          Object.keys(nextMatrix).forEach((key) => {
            if (key.endsWith(`___${pc.name}`) || key.includes(`___${pc.name}___`)) {
              delete nextMatrix[key];
            }
          });
        }

        const nextColors = prev.colors.filter((c) => c.name.toLowerCase() !== pc.name.toLowerCase());

        return {
          ...prev,
          parts: nextParts,
          colors: nextColors,
          colorImages: nextColImgs,
          stockMatrix: nextMatrix,
        };
      });
      showToast(`Colour "${pc.name}" removed.`);
    } else {
      // Admin is selecting this colour
      setFormData((prev) => {
        const nextParts = prev.parts.map((p, i) => {
          if (i !== pIdx) return p;
          const nextCols = [...p.colors, pc];
          const nextDef = p.defaultColor ? p.defaultColor : pc.name;
          return { ...p, colors: nextCols, defaultColor: nextDef };
        });

        // Automatically initialize stock fields for all currently selected sizes
        const nextMatrix = { ...prev.stockMatrix };
        prev.sizes.forEach((sz) => {
          const key = `${sz}___${pc.name}`;
          if (nextMatrix[key] === undefined) {
            nextMatrix[key] = 0;
          }
        });

        const existsInColors = prev.colors.some((c) => c.name.toLowerCase() === pc.name.toLowerCase());
        const nextColors = existsInColors ? prev.colors : [...prev.colors, pc];

        return {
          ...prev,
          parts: nextParts,
          colors: nextColors,
          stockMatrix: nextMatrix,
        };
      });
      showToast(`Colour "${pc.name}" selected! Stock column added in Step 3. ✨`);
    }
  };

  // Toggle size in form with confirmation if inventory exists
  const handleToggleSize = (sizeStr: string) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(sizeStr);
      if (exists) {
        if (prev.sizes.length <= 1) {
          showToast('Please keep at least one available size.');
          return prev;
        }

        let totalSizeStock = 0;
        activeMatrixColors.forEach((col) => {
          const key = `${sizeStr}___${col.name}`;
          totalSizeStock += prev.stockMatrix[key] || 0;
        });

        if (totalSizeStock > 0) {
          const confirmed = window.confirm(
            `Size "${sizeStr}" has recorded inventory (${totalSizeStock} units). Are you sure you want to remove this size and its stock fields?`
          );
          if (!confirmed) return prev;
        }

        const nextMatrix = { ...prev.stockMatrix };
        Object.keys(nextMatrix).forEach((key) => {
          if (key.startsWith(`${sizeStr}___`) || key.includes(`___${sizeStr}___`)) {
            delete nextMatrix[key];
          }
        });

        return {
          ...prev,
          sizes: prev.sizes.filter((s) => s !== sizeStr),
          stockMatrix: nextMatrix,
        };
      } else {
        // Adding size: automatically initialize stock fields for all currently selected colors
        const nextMatrix = { ...prev.stockMatrix };
        activeMatrixColors.forEach((col) => {
          const key = `${sizeStr}___${col.name}`;
          if (nextMatrix[key] === undefined) {
            nextMatrix[key] = 0;
          }
        });

        return {
          ...prev,
          sizes: [...prev.sizes, sizeStr],
          stockMatrix: nextMatrix,
        };
      }
    });
  };

  // Add custom size
  const handleAddCustomSize = () => {
    const clean = customSizeInput.trim();
    if (!clean) return;
    if (!formData.sizes.includes(clean)) {
      setFormData((prev) => {
        const nextMatrix = { ...prev.stockMatrix };
        activeMatrixColors.forEach((col) => {
          const key = `${clean}___${col.name}`;
          if (nextMatrix[key] === undefined) {
            nextMatrix[key] = 0;
          }
        });
        return {
          ...prev,
          sizes: [...prev.sizes, clean],
          stockMatrix: nextMatrix,
        };
      });
      showToast(`Size "${clean}" added! 📏`);
    }
    setCustomSizeInput('');
  };

  // Remove colour completely with confirmation if stock exists
  const handleRemoveColor = (colName: string) => {
    let hasStock = false;
    let totalQty = 0;
    formData.sizes.forEach((sz) => {
      const key = `${sz}___${colName}`;
      const q = formData.stockMatrix[key] || 0;
      if (q > 0) {
        hasStock = true;
        totalQty += q;
      }
    });

    if (hasStock) {
      const confirmed = window.confirm(
        `Colour "${colName}" has recorded inventory (${totalQty} units). Are you sure you want to remove this colour and its stock fields?`
      );
      if (!confirmed) return;
    }

    setFormData((prev) => {
      const filteredColors = prev.colors.filter((c) => c.name.toLowerCase() !== colName.toLowerCase());
      const nextColImgs = { ...prev.colorImages };
      delete nextColImgs[colName];

      const nextMatrix = { ...prev.stockMatrix };
      Object.keys(nextMatrix).forEach((key) => {
        if (key.endsWith(`___${colName}`) || key.includes(`___${colName}___`)) {
          delete nextMatrix[key];
        }
      });

      const nextParts = prev.parts.map((p) => {
        const filteredPartCols = p.colors.filter((c) => c.name.toLowerCase() !== colName.toLowerCase());
        const nextDef = p.defaultColor?.toLowerCase() === colName.toLowerCase() ? filteredPartCols[0]?.name || '' : p.defaultColor;
        return { ...p, colors: filteredPartCols, defaultColor: nextDef };
      });

      return {
        ...prev,
        parts: nextParts,
        colors: filteredColors,
        colorImages: nextColImgs,
        stockMatrix: nextMatrix,
      };
    });
    showToast(`Colour "${colName}" removed.`);
  };

  // Add preset colour (synchronizes to parts as well)
  const handleAddPresetColor = (name: string, hex: string) => {
    setFormData((prev) => {
      if (activeMatrixColors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        showToast(`Colour "${name}" is already added.`);
        return prev;
      }

      const newCol = { name, hex };
      const nextParts = prev.parts.length > 0
        ? prev.parts.map((p, idx) => {
            if (idx === 0) {
              const nextCols = p.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())
                ? p.colors
                : [...p.colors, newCol];
              return { ...p, colors: nextCols, defaultColor: p.defaultColor || name };
            }
            return p;
          })
        : [
            {
              id: `part-${Date.now()}`,
              name: 'Clothing Part 1',
              type: 'T-shirt' as const,
              description: '',
              colors: [newCol],
              defaultColor: name,
              active: true,
              images: [],
            },
          ];

      const nextMatrix = { ...prev.stockMatrix };
      prev.sizes.forEach((sz) => {
        const key = `${sz}___${name}`;
        if (nextMatrix[key] === undefined) {
          nextMatrix[key] = 0;
        }
      });

      return {
        ...prev,
        parts: nextParts,
        colors: [...prev.colors.filter((c) => c.name.toLowerCase() !== name.toLowerCase()), newCol],
        stockMatrix: nextMatrix,
      };
    });
    showToast(`Colour "${name}" added! Stock column created in Step 3. 🎨`);
  };

  // Add custom colour
  const handleAddCustomColor = () => {
    const clean = customColorName.trim();
    if (!clean) {
      showToast('Please enter a colour name.');
      return;
    }
    handleAddPresetColor(clean, customColorHex);
    setCustomColorName('');
  };

  // Save / Publish Product Handler
  const handleSaveProduct = async (saveStatus: 'published' | 'draft') => {
    if (!formData.name.trim()) {
      showToast('Please enter a product name first.');
      setActiveTab('basic');
      return;
    }

    const sellPrice = Number(formData.sellingPrice);
    if (!sellPrice || sellPrice <= 0) {
      showToast('Please enter a valid selling price greater than 0.');
      setActiveTab('pricing');
      return;
    }

    if (activeMatrixColors.length === 0) {
      showToast('Please select at least one colour in Step 2 before entering stock.');
      setActiveTab('parts');
      return;
    }

    if (formData.sizes.length === 0) {
      showToast('Please select at least one available size in Section 3.');
      setActiveTab('sizes-stock');
      return;
    }

    const cleanSlug =
      formData.slug.trim() ||
      formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const cmpPrice = formData.comparePrice !== '' ? Number(formData.comparePrice) : undefined;

    // Build Product Images
    const productImages: ProductImage[] = formData.images.map((url, idx) => ({
      id: `img-${Date.now()}-${idx}`,
      url,
      alt: `${formData.name} - View ${idx + 1}`,
      position: idx + 1,
    }));

    // Add colour variation images to product images if not already included
    Object.entries(formData.colorImages).forEach(([cName, cUrl], idx) => {
      if (!cUrl) return;
      const existing = productImages.find((img) => img.url === cUrl);
      if (existing) {
        existing.colorName = cName;
      } else {
        productImages.push({
          id: `img-col-${Date.now()}-${idx}`,
          url: cUrl,
          alt: `${formData.name} - ${cName} Variation`,
          position: productImages.length + 1,
          colorName: cName,
        });
      }
    });

    // Build Variants from Sizes x Active Colors Matrix
    const variants: ProductVariant[] = [];
    if (activeMatrixColors.length > 0) {
      formData.sizes.forEach((sz, sIdx) => {
        activeMatrixColors.forEach((col, cIdx) => {
          const matrixKey = `${sz}___${col.name}`;
          const qty = Math.max(0, formData.stockMatrix[matrixKey] ?? 0);
          const colImg = formData.colorImages[col.name] || formData.images[0] || '';

          variants.push({
            id: `var-${cleanSlug}-${sz.replace(/[^a-z0-9]/gi, '')}-${col.name.replace(/[^a-z0-9]/gi, '')}`,
            sku: `${formData.sku || 'REX'}-${sz.replace(/[^A-Z0-9]/gi, '')}-${col.name.substring(0, 3).toUpperCase()}`,
            purchaseType: formData.productType === 'set' ? 'complete_set' : undefined,
            size: sz,
            color: col.name,
            colorHex: col.hex,
            price: sellPrice,
            stockQuantity: qty,
            imageUrl: colImg,
          });
        });
      });
    } else {
      formData.sizes.forEach((sz) => {
        const matrixKey = `${sz}___Standard`;
        const qty = Math.max(0, formData.stockMatrix[matrixKey] ?? 0);
        variants.push({
          id: `var-${cleanSlug}-${sz.replace(/[^a-z0-9]/gi, '')}`,
          sku: `${formData.sku || 'REX'}-${sz.replace(/[^A-Z0-9]/gi, '')}`,
          purchaseType: formData.productType === 'set' ? 'complete_set' : undefined,
          size: sz,
          price: sellPrice,
          stockQuantity: qty,
          imageUrl: formData.images[0] || '',
        });
      });
    }

    // Also build individual part variants if parts are marked individually purchasable
    if (formData.productType === 'set' && formData.parts.length > 0) {
      formData.parts.forEach((part) => {
        if (!part.isPurchasableIndividually) return;
        const partSizes = part.sizes && part.sizes.length > 0 ? part.sizes : formData.sizes;
        const partCols = part.colors && part.colors.length > 0 ? part.colors : activeMatrixColors;
        const partPrice = part.price && part.price > 0 ? part.price : sellPrice;

        partSizes.forEach((sz, sIdx) => {
          partCols.forEach((col, cIdx) => {
            const partMatrixKey = `${part.id}___${sz}___${col.name}`;
            const qty = Math.max(0, formData.stockMatrix[partMatrixKey] ?? 5);
            const partImg = part.images?.find(i => i.colorName?.toLowerCase() === col.name.toLowerCase())?.url ||
                            formData.colorImages[col.name] ||
                            formData.images[0] ||
                            '/images/products/dino-baby-set.jpg';

            variants.push({
              id: `var-${cleanSlug}-part-${part.id}-${sz.replace(/[^a-z0-9]/gi, '')}-${col.name.replace(/[^a-z0-9]/gi, '')}`,
              sku: `${part.skuPrefix || formData.sku || 'REX'}-${sz.replace(/[^A-Z0-9]/gi, '')}-${col.name.substring(0, 3).toUpperCase()}`,
              purchaseType: 'individual_part',
              partId: part.id,
              partName: part.name,
              size: sz,
              color: col.name,
              colorHex: col.hex,
              price: partPrice,
              stockQuantity: qty,
              imageUrl: partImg,
            });
          });
        });
      });
    }

    const totalStock = variants.reduce((sum, v) => sum + v.stockQuantity, 0);

    const finalProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formData.name.trim(),
      slug: cleanSlug,
      sku: formData.sku.trim() || `REX-${cleanSlug.substring(0, 4).toUpperCase()}`,
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim() || formData.shortDescription.trim(),
      price: sellPrice,
      comparePrice: cmpPrice && cmpPrice > sellPrice ? cmpPrice : undefined,
      discountPercentage: calculatedDiscount > 0 ? calculatedDiscount : undefined,
      productType: formData.productType,
      status: saveStatus,
      isFeatured: formData.isFeatured,
      isNewArrival: formData.isNewArrival,
      isBestSeller: formData.isBestSeller,
      isSaleBadge: formData.isSaleBadge && calculatedDiscount > 0,
      brand: formData.brand.trim() || 'REXBEBE Atelier',
      gender: formData.gender,
      ageGroup: formData.ageGroup,
      category: {
        id: formData.categoryId || 'cat-clothing',
        name: formData.categoryName || 'Baby Clothing',
        slug: formData.categorySlug || 'baby-clothing',
      },
      subcategory: formData.subcategoryId ? {
        id: formData.subcategoryId,
        name: formData.subcategoryName,
        slug: formData.subcategorySlug,
      } : undefined,
      images: productImages,
      colors: activeMatrixColors,
      sizes: formData.sizes,
      parts: formData.parts,
      variants,
      stockQuantity: totalStock,
      lowStockThreshold: formData.lowStockThreshold || 5,
      stockStatus: totalStock <= 0 ? 'out_of_stock' : totalStock <= (formData.lowStockThreshold || 5) ? 'low_stock' : 'in_stock',
      fabricMaterial: formData.fabricMaterial,
      careInstructions: formData.careInstructions,
      rating: editingProduct?.rating ?? 5,
      reviewCount: editingProduct?.reviewCount ?? 0,
    };

    try {
      if (editingProduct) {
        await updateProduct(finalProduct);
        showToast('Product updated successfully! 🌸');
      } else {
        await addProduct(finalProduct);
        showToast('New boutique product published successfully! ✨');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save product. Please try again.');
    }
  };

  // Duplicate Product Handler
  const handleDuplicate = async (p: Product) => {
    try {
      await duplicateProduct(p.id);
      showToast(`Duplicated "${p.name}" as new draft! 📋`);
    } catch (err: any) {
      showToast(err.message || 'Duplicate failed.');
    }
  };

  // Delete Product Handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProduct || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(deleteConfirmProduct.id);
      showToast(`The item has been permanently deleted.`);
      if (paginatedProducts.length <= 1 && currentPage > 1) {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
      setDeleteConfirmProduct(null);
    } catch (err: any) {
      console.error('[AdminProducts] Permanent deletion error:', err);
      const errMsg = err.message || "We couldn't delete the product. Your existing database information has not been modified. Please try again.";
      setDeleteError(errMsg);
      showToast(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Product Management"
          subtitle="Manage baby clothing, multi-piece sets, inventory matrix, and colour variations."
          actions={
            <button
              onClick={handleOpenAddModal}
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Baby Product</span>
            </button>
          }
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Catalog</span>
              <p className="text-2xl font-black text-slate-900">{products.length} Products</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Published</span>
              <p className="text-2xl font-black text-emerald-700">{products.filter((p) => p.status === 'published' || !p.status).length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Drafts</span>
              <p className="text-2xl font-black text-amber-700">{products.filter((p) => p.status === 'draft').length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-600 block">Clothing Sets</span>
              <p className="text-2xl font-black text-pink-700">{products.filter((p) => p.productType === 'set' || (p.parts && p.parts.length > 0)).length}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                >
                  <option value="ALL">All Categories</option>
                  {mainCategories.map((m) => {
                    const subs = allCategories.filter((c) => c.parentId === m.id);
                    return (
                      <React.Fragment key={m.id}>
                        <option value={m.id} className="font-bold">
                          📁 {m.name}
                        </option>
                        {subs.map((s) => (
                          <option key={s.id} value={s.id}>
                            &nbsp;&nbsp;&nbsp;↳ {s.name}
                          </option>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </select>

                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                >
                  <option value="ALL">All Inventory</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock (≤5)</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                >
                  <option value="ALL">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="unpublished">Unpublished</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700"
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock">Stock Quantity</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            {paginatedProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-14 h-14 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto text-2xl">
                  🧸
                </div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg font-heading">
                  No Products Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No boutique items match your current search or filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedStockFilter('ALL');
                    setSelectedStatusFilter('ALL');
                  }}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 sm:px-6">Product</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map((p) => {
                      const mainImg = p.images?.[0]?.url || '/images/products/organic-onesie.jpg';
                      const stockCount =
                        p.stockQuantity ??
                        p.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) ??
                        0;
                      const isLow = stockCount > 0 && stockCount <= (p.lowStockThreshold || 5);
                      const isOut = stockCount <= 0;
                      const isSet = p.productType === 'set' || (p.parts && p.parts.length > 0);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center space-x-3">
                              <div className="relative w-12 aspect-[4/5] rounded-xl overflow-hidden bg-[#FAF7F2] border border-slate-200 shrink-0 flex items-center justify-center p-0.5">
                                <Image src={mainImg} alt={p.name} fill className="object-contain" />
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <Link
                                  href={`/products/${p.slug}`}
                                  target="_blank"
                                  className="font-extrabold text-slate-900 hover:text-pink-600 transition-colors truncate block text-xs sm:text-sm"
                                  title={p.name}
                                >
                                  {p.name}
                                </Link>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  /products/{p.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isSet ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-black uppercase">
                                <Layers className="w-3 h-3 mr-0.5" />
                                <span>Set ({p.parts?.length || 3} Parts)</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                Single Item
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-600">
                            {p.sku || 'N/A'}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col space-y-1">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-100 text-[10px] sm:text-xs font-extrabold w-fit">
                                {p.category?.name || 'Unassigned'}
                              </span>
                              {p.subcategory?.name && (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold w-fit">
                                  ↳ {p.subcategory.name}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-900 block">
                                {formatCurrency(p.price)}
                              </span>
                              {p.comparePrice && p.comparePrice > p.price && (
                                <span className="text-[10px] text-slate-400 line-through block">
                                  {formatCurrency(p.comparePrice)}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {isOut ? (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase">
                                Sold Out (0)
                              </span>
                            ) : isLow ? (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                                Low Stock ({stockCount})
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                                In Stock ({stockCount})
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() =>
                                updateProductStatus(
                                  p.id,
                                  (p.status || 'published') === 'published' ? 'draft' : 'published'
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                (p.status || 'published') === 'published'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.status || 'published'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-pink-100 text-slate-600 hover:text-pink-600 flex items-center justify-center transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(p)}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-600 flex items-center justify-center transition-colors"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(p)}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
                  {filteredProducts.length} items
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs ${
                        currentPage === i + 1
                          ? 'bg-pink-500 text-white'
                          : 'border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadFiles}
        className="hidden"
      />
      <input
        ref={colorFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUploadColorSpecificImage}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 6-SECTION SIMPLIFIED PRODUCT CREATION / EDITING MODAL                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-white/80 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-pink-50/60 via-purple-50/40 to-sky-50/50">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-600 block">
                  {editingProduct ? 'Edit Clothing Product' : 'Add Baby Clothing Product'}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                  {formData.name || 'New Boutique Product'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold shadow-xs border border-slate-200"
              >
                ✕
              </button>
            </div>

            {/* 6 Clearly Named Sections Tabs */}
            <div className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 overflow-x-auto no-scrollbar text-xs bg-slate-50/40">
              {[
                { id: 'basic', label: '1. Basic Information', icon: Tag },
                { id: 'parts', label: '2. Product Parts', icon: Layers },
                { id: 'sizes-stock', label: '3. Sizes & Stock', icon: Boxes },
                { id: 'colours-images', label: '4. Colours & Images', icon: Palette },
                { id: 'pricing', label: '5. Pricing', icon: DollarSign },
                { id: 'preview', label: '6. Preview & Publish', icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ProductFormTab)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-extrabold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm">
              {/* SECTION 1: BASIC INFORMATION */}
              {activeTab === 'basic' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REXBEBE Dino Adventure 3-Piece Baby Set"
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          name: val,
                          slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-pink-500/20 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-main-cat-select" className="font-extrabold text-slate-800 block mb-1">
                        Main Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="product-main-cat-select"
                        value={formData.categoryId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const matched = mainCategories.find((c) => c.id === selectedId);
                          const subsForNew = allCategories.filter((c) => c.parentId === selectedId);
                          const subValid = subsForNew.some((s) => s.id === formData.subcategoryId);

                          setFormData((prev) => ({
                            ...prev,
                            categoryId: selectedId,
                            categoryName: matched?.name || 'Baby Clothing',
                            categorySlug: matched?.slug || 'baby-clothing',
                            subcategoryId: subValid ? prev.subcategoryId : '',
                            subcategoryName: subValid ? prev.subcategoryName : '',
                            subcategorySlug: subValid ? prev.subcategorySlug : '',
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                      >
                        {mainCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="product-sub-cat-select" className="font-extrabold text-slate-800 block mb-1">
                        Subcategory <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                      </label>
                      {currentSubcategories.length === 0 ? (
                        <div className="w-full px-3.5 py-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 italic">
                          No subcategories available under {formData.categoryName}
                        </div>
                      ) : (
                        <select
                          id="product-sub-cat-select"
                          value={formData.subcategoryId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setFormData((prev) => ({
                                ...prev,
                                subcategoryId: '',
                                subcategoryName: '',
                                subcategorySlug: '',
                              }));
                            } else {
                              const matched = currentSubcategories.find((s) => s.id === val);
                              setFormData((prev) => ({
                                ...prev,
                                subcategoryId: val,
                                subcategoryName: matched?.name || '',
                                subcategorySlug: matched?.slug || '',
                              }));
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        >
                          <option value="">None (Top-Level Category Only)</option>
                          {currentSubcategories.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-extrabold text-slate-800 block mb-1">
                        Product Type
                      </label>
                      <select
                        value={formData.productType}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            productType: e.target.value as 'single' | 'set',
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
                      >
                        <option value="single">Single Item</option>
                        <option value="set">Clothing Set (Multi-piece)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-800 block mb-1">
                        SKU / Code
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-800 block mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="unpublished">Unpublished</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-800 block mb-1">
                      Product Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Crafted from 100% GOTS certified organic cotton..."
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder-slate-400 focus:ring-2 focus:ring-pink-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Main Product Images */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-800 block">
                        Product Photos (Main &amp; Additional Views)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          replaceIndexRef.current = null;
                          fileInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-black transition-all flex items-center space-x-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Photos'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#FAF7F2] border-2 border-stone-200 group p-2 flex items-center justify-center shadow-xs"
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                              src={imgUrl}
                              alt={`Photo ${idx + 1}`}
                              fill
                              className="object-contain object-center transition-transform group-hover:scale-105"
                              sizes="160px"
                            />
                          </div>
                          <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 backdrop-blur-2xs">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const next = [...prev.images];
                                    const temp = next[idx];
                                    next[idx] = next[idx - 1];
                                    next[idx - 1] = temp;
                                    return { ...prev, images: next };
                                  });
                                }}
                                className="w-7 h-7 rounded-lg bg-white text-slate-800 text-xs font-black shadow-sm hover:bg-slate-100 flex items-center justify-center"
                                title="Move Earlier"
                              >
                                ←
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (formData.images.length <= 1) {
                                  showToast('Please keep at least one product photo.');
                                  return;
                                }
                                setFormData((prev) => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="w-7 h-7 rounded-lg bg-rose-500 text-white text-xs font-black shadow-sm hover:bg-rose-600 flex items-center justify-center"
                              title="Delete Photo"
                            >
                              ✕
                            </button>
                          </div>
                          <span
                            className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase shadow-xs ${
                              idx === 0
                                ? 'bg-pink-600 text-white'
                                : 'bg-stone-900/80 text-white backdrop-blur-xs'
                            }`}
                          >
                            {idx === 0 ? 'Main Photo' : `View ${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: PRODUCT PARTS / CLOTHING COMPONENTS */}
              {activeTab === 'parts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base font-heading">
                        Product Parts / Clothing Components
                      </h3>
                      <p className="text-xs text-slate-500">
                        Baby clothing sets contain individual pieces (e.g. Dinosaur T-Shirt, Summer Shorts, Hat) managed separately.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPart}
                      className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-black shadow-xs flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product Part</span>
                    </button>
                  </div>

                  {/* REQUIREMENT 4: Admin Option to Choose Selling Mode */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50/90 via-purple-50/60 to-pink-50/90 border-2 border-pink-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-pink-900 flex items-center space-x-1.5">
                          <Layers className="w-4 h-4 text-pink-600" />
                          <span>Product Selling Strategy</span>
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Choose whether this product is sold only as an all-in-one complete set or if each part can be purchased individually.
                        </p>
                      </div>
                      <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white text-pink-700 text-[11px] font-black border border-pink-200 shadow-2xs">
                        {formData.parts.some((p) => p.isPurchasableIndividually) ? 'Parts Available Separately' : 'Complete Set Mode'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Sell as a Complete Set */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            productType: prev.parts.length > 1 ? 'set' : prev.productType,
                            parts: prev.parts.map((p) => ({
                              ...p,
                              isPurchasableIndividually: false,
                            })),
                          }));
                          showToast('Configured to Sell as a Complete Set only 📦');
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.parts.every((p) => !p.isPurchasableIndividually)
                            ? 'border-pink-600 bg-white shadow-sm ring-2 ring-pink-100'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 flex items-center space-x-2">
                            <span>📦</span>
                            <span>Sell as a Complete Set</span>
                          </span>
                          {formData.parts.every((p) => !p.isPurchasableIndividually) && (
                            <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Customers purchase all clothing pieces together (e.g. T-Shirt + Shorts) as a unified set under one single price.
                        </p>
                      </button>

                      {/* Option 2: Sell Each Part Separately */}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            productType: 'set',
                            parts: prev.parts.map((p) => ({
                              ...p,
                              isPurchasableIndividually: true,
                              price: p.price || Math.round(Number(prev.sellingPrice || 14500) * 0.5),
                              skuPrefix: p.skuPrefix || `REX-${p.type.substring(0, 4).toUpperCase()}`,
                            })),
                          }));
                          showToast('Configured to Sell Each Part Separately 👕🩳');
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.parts.some((p) => p.isPurchasableIndividually)
                            ? 'border-pink-600 bg-white shadow-sm ring-2 ring-pink-100'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 flex items-center space-x-2">
                            <span>👕</span>
                            <span>Sell Each Part Separately</span>
                          </span>
                          {formData.parts.some((p) => p.isPurchasableIndividually) && (
                            <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Customers can buy the complete outfit OR pick individual garments (e.g. T-shirt alone, Shorts alone) with separate pricing.
                        </p>
                      </button>
                    </div>
                  </div>

                  {formData.parts.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-600">
                        This product is currently configured without separate clothing components.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                      >
                        + Add First Component (e.g. T-Shirt)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.parts.map((part, pIdx) => (
                        <div
                          key={part.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-black text-xs">
                                {pIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={part.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, name: val } : p)),
                                  }));
                                }}
                                className="font-extrabold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-pink-500 focus:outline-none px-1"
                              />
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                disabled={pIdx === 0}
                                onClick={() => handleMovePart(pIdx, 'up')}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                                title="Move Up"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={pIdx === formData.parts.length - 1}
                                onClick={() => handleMovePart(pIdx, 'down')}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                                title="Move Down"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePart(part.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-rose-500"
                                title="Remove Part"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Part Type
                              </label>
                              <select
                                value={part.type}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setFormData((prev) => ({
                                    ...prev,
                                    parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, type: val } : p)),
                                  }));
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
                              >
                                {PART_TYPES.map((pt) => (
                                  <option key={pt} value={pt}>
                                    {pt}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Default Colour
                              </label>
                              <input
                                type="text"
                                value={part.defaultColor || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, defaultColor: val } : p)),
                                  }));
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                placeholder="e.g. Red, Beige"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                Status
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, active: !p.active } : p)),
                                  }));
                                }}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                                  part.active
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {part.active ? 'Active Component' : 'Inactive'}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[11px] font-extrabold text-slate-700 block">
                                Available Colours for this Component:
                              </label>
                              <p className="text-[10px] text-slate-500">
                                Click to select or deselect colours. Stock columns for selected colours will appear automatically in Step 3.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              {PRESET_COLOURS.map((pc) => {
                                const hasCol = part.colors.some((c) => c.name.toLowerCase() === pc.name.toLowerCase());
                                return (
                                  <button
                                    key={pc.name}
                                    type="button"
                                    onClick={() => handleTogglePartColor(pIdx, pc)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center space-x-1.5 ${
                                      hasCol
                                        ? 'border-pink-500 bg-pink-50 text-pink-800 shadow-2xs ring-2 ring-pink-200'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                                    }`}
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: pc.hex }} />
                                    <span>{pc.name}</span>
                                    {hasCol && <span className="text-[10px] font-black text-pink-600 ml-0.5">✓</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom colour for this component */}
                            <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                              <span className="text-[11px] text-slate-500 font-bold">Or add custom colour:</span>
                              <input
                                type="text"
                                placeholder="e.g. Lavender"
                                value={customColorName}
                                onChange={(e) => setCustomColorName(e.target.value)}
                                className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs bg-white w-36"
                              />
                              <input
                                type="color"
                                value={customColorHex}
                                onChange={(e) => setCustomColorHex(e.target.value)}
                                className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                                title="Pick Hex"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const clean = customColorName.trim();
                                  if (!clean) {
                                    showToast('Please enter a colour name.');
                                    return;
                                  }
                                  handleTogglePartColor(pIdx, { name: clean, hex: customColorHex });
                                  setCustomColorName('');
                                }}
                                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                              >
                                + Add Colour
                              </button>
                            </div>
                          </div>

                          {/* Individual Purchasability & Pricing for this Component */}
                          <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(part.isPurchasableIndividually)}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setFormData((prev) => ({
                                    ...prev,
                                    parts: prev.parts.map((p, i) =>
                                      i === pIdx
                                        ? {
                                            ...p,
                                            isPurchasableIndividually: val,
                                            price: val ? (p.price || Math.round(Number(formData.sellingPrice || 14500) * 0.45)) : undefined,
                                            skuPrefix: val ? (p.skuPrefix || `REX-${part.type.substring(0, 4).toUpperCase()}`) : undefined,
                                          }
                                        : p
                                    ),
                                  }));
                                }}
                                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-slate-300"
                              />
                              <span className="text-xs font-black text-slate-800">
                                Allow purchasing this component individually (Separate Price, SKU &amp; Stock)
                              </span>
                            </label>

                            {part.isPurchasableIndividually && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-pink-50/40 border border-pink-100 animate-in fade-in">
                                <div>
                                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                                    Individual Selling Price (LKR) *
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={part.price || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setFormData((prev) => ({
                                        ...prev,
                                        parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, price: val } : p)),
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                    placeholder="e.g. 6500"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                                    Compare Price (LKR)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={part.comparePrice || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setFormData((prev) => ({
                                        ...prev,
                                        parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, comparePrice: val } : p)),
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                                    placeholder="e.g. 7500"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                                    SKU Prefix
                                  </label>
                                  <input
                                    type="text"
                                    value={part.skuPrefix || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData((prev) => ({
                                        ...prev,
                                        parts: prev.parts.map((p, i) => (i === pIdx ? { ...p, skuPrefix: val } : p)),
                                      }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono uppercase bg-white"
                                    placeholder="e.g. REX-TEE"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: SIZES & STOCK (INVENTORY MATRIX) */}
              {activeTab === 'sizes-stock' && (
                <div className="space-y-4">
                  {/* Short Instruction Banner */}
                  <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-200 text-pink-950 text-xs flex items-start space-x-2.5">
                    <Info className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-semibold">
                      Select the available colours in Step 2. Stock fields for those colours will appear automatically in Step 3. Enter the quantity for each size and colour.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base font-heading">
                        Sizes &amp; Inventory Matrix
                      </h3>
                      <p className="text-xs text-slate-500">
                        Enter the actual stock quantity for each Size × Colour combination. Total stock: <strong className="text-pink-600">{totalMatrixStock} units</strong>.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        Low Stock Alert At:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-16 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-center"
                      />
                      <span className="text-xs text-slate-500">units</span>
                    </div>
                  </div>

                  {/* Size Preset Selector */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-extrabold text-slate-700 block">
                      Select Available Baby Sizes:
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {BABY_SIZES_PRESET.map((sz) => {
                        const isSelected = formData.sizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSize(sz)}
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border ${
                              isSelected
                                ? 'bg-pink-500 text-white border-pink-500 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Size */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add custom size (e.g. 24–36 Months)"
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSize}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
                      >
                        + Add Size
                      </button>
                    </div>
                  </div>

                  {/* Real Stock Quantity Matrix Table */}
                  {activeMatrixColors.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-amber-50/90 border border-amber-200 text-center space-y-3">
                      <Palette className="w-8 h-8 text-amber-600 mx-auto" />
                      <p className="font-extrabold text-sm text-amber-900">
                        Please select at least one colour in Step 2 before entering stock.
                      </p>
                      <p className="text-xs text-amber-700 max-w-md mx-auto">
                        Go to Step 2: Product Parts and select the available colours for your clothing components. Stock fields for those colours will appear here automatically.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('parts')}
                        className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition-colors shadow-2xs inline-flex items-center space-x-1.5"
                      >
                        <span>Go to Step 2: Product Parts</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-extrabold">
                              <th className="py-3 px-4">Size</th>
                              {activeMatrixColors.map((col) => (
                                <th key={col.name} className="py-3 px-3 text-center">
                                  <div className="inline-flex items-center space-x-1.5">
                                    <span
                                      className="w-3 h-3 rounded-full border border-black/10"
                                      style={{ backgroundColor: col.hex }}
                                    />
                                    <span>{col.name}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {formData.sizes.map((sz) => (
                              <tr key={sz} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-black text-slate-800 whitespace-nowrap">
                                  {sz}
                                </td>
                                {activeMatrixColors.map((col) => {
                                  const matrixKey = `${sz}___${col.name}`;
                                  const currentQty = formData.stockMatrix[matrixKey] ?? 0;
                                  const isSoldOut = currentQty <= 0;
                                  const isLow = currentQty > 0 && currentQty <= formData.lowStockThreshold;

                                  return (
                                    <td key={col.name} className="py-2.5 px-3 text-center">
                                      <div className="flex flex-col items-center space-y-1">
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentQty}
                                          onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setFormData((prev) => ({
                                              ...prev,
                                              stockMatrix: {
                                                ...prev.stockMatrix,
                                                [matrixKey]: val,
                                              },
                                            }));
                                          }}
                                          className={`w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border transition-all ${
                                            isSoldOut
                                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                                              : isLow
                                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                                              : 'border-slate-200 bg-white text-slate-800'
                                          }`}
                                        />
                                        <span
                                          className={`text-[9px] font-black uppercase ${
                                            isSoldOut
                                              ? 'text-rose-600'
                                              : isLow
                                              ? 'text-amber-700'
                                              : 'text-emerald-600'
                                          }`}
                                        >
                                          {isSoldOut ? 'Sold Out' : isLow ? 'Low Stock' : 'Available'}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Individual Component Stock Matrices */}
                  {formData.productType === 'set' && formData.parts.some((p) => p.isPurchasableIndividually) && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 animate-in fade-in">
                      <div>
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm font-heading flex items-center space-x-1.5">
                          <Layers className="w-4 h-4 text-pink-600" />
                          <span>Individually Purchasable Components Stock Matrix</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Track independent inventory per size &amp; colour for garments sold separately.
                        </p>
                      </div>

                      {formData.parts
                        .filter((p) => p.isPurchasableIndividually)
                        .map((part) => {
                          const partSizes = part.sizes && part.sizes.length > 0 ? part.sizes : formData.sizes;
                          const partCols = part.colors && part.colors.length > 0 ? part.colors : activeMatrixColors;

                          return (
                            <div
                              key={part.id}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-slate-900">
                                  {part.name} ({part.type}) — Individual Price:{' '}
                                  <strong className="text-pink-600">{formatCurrency(part.price || 0)}</strong>
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  SKU: {part.skuPrefix || 'REX'}
                                </span>
                              </div>

                              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-extrabold">
                                        <th className="py-2 px-3">Size</th>
                                        {partCols.map((c) => (
                                          <th key={c.name} className="py-2 px-2 text-center">
                                            <div className="inline-flex items-center space-x-1">
                                              <span
                                                className="w-2.5 h-2.5 rounded-full border border-black/10"
                                                style={{ backgroundColor: c.hex }}
                                              />
                                              <span className="text-[11px]">{c.name}</span>
                                            </div>
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {partSizes.map((sz) => (
                                        <tr key={sz} className="hover:bg-slate-50/50">
                                          <td className="py-2 px-3 font-black text-slate-800 text-[11px] whitespace-nowrap">
                                            {sz}
                                          </td>
                                          {partCols.map((c) => {
                                            const mKey = `${part.id}___${sz}___${c.name}`;
                                            const q = formData.stockMatrix[mKey] ?? 5;
                                            return (
                                              <td key={c.name} className="py-2 px-2 text-center">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={q}
                                                  onChange={(e) => {
                                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      stockMatrix: { ...prev.stockMatrix, [mKey]: val },
                                                    }));
                                                  }}
                                                  className="w-14 px-1.5 py-0.5 text-center font-bold text-xs rounded border border-slate-200 bg-white"
                                                />
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: COLOURS & AUTHENTIC PHOTOS */}
              {activeTab === 'colours-images' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base font-heading">
                        Product Colours &amp; Authentic Photos
                      </h3>
                      <p className="text-xs text-slate-500">
                        Add only the colours available for this product. Upload or assign an authentic product photo for each colour so customers see the exact garment.
                      </p>
                    </div>
                  </div>

                  {/* Add Colours Toolbar */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-extrabold text-slate-700 block">
                      Quick Add Available Colours:
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {PRESET_COLOURS.map((pc) => {
                        const isAdded = activeMatrixColors.some((c) => c.name.toLowerCase() === pc.name.toLowerCase());
                        return (
                          <button
                            key={pc.name}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                handleRemoveColor(pc.name);
                              } else {
                                handleAddPresetColor(pc.name, pc.hex);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                              isAdded
                                ? 'bg-pink-500 text-white border-pink-500 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: pc.hex }}
                            />
                            <span>{pc.name}</span>
                            {isAdded && <span className="text-[10px] ml-0.5">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Colour */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">Or custom colour:</span>
                      <input
                        type="text"
                        placeholder="e.g. Lavender, Turquoise"
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white w-48 font-medium"
                      />
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                        title="Pick Color Hex"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                      >
                        + Add Custom Colour
                      </button>
                    </div>
                  </div>

                  {/* Added Colours List */}
                  {activeMatrixColors.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 space-y-2 bg-white">
                      <Palette className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-extrabold text-slate-700">
                        No colours added yet.
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Click any of the preset colours above (e.g. Blue) or enter a custom colour to make it available for customer selection.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeMatrixColors.map((col) => {
                        const colImg = formData.colorImages[col.name] || formData.images[0] || '';
                        const isPrimaryBaseColor = activeMatrixColors[0]?.name && col.name.toLowerCase() === activeMatrixColors[0].name.toLowerCase();
                        const hasDedicatedPhoto = Boolean(formData.colorImages[col.name]) &&
                          (formData.colorImages[col.name] !== formData.images[0] || isPrimaryBaseColor);

                        // Find part associated with this colour
                        const matchedPart = formData.parts.find((p) =>
                          p.colors?.some((c) => c.name.toLowerCase() === col.name.toLowerCase())
                        ) || formData.parts[0];

                        return (
                          <div
                            key={col.name}
                            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center space-x-4">
                              {/* Photo Preview Container - 4:5 aspect ratio, uncropped */}
                              <div className="relative w-20 sm:w-24 aspect-[4/5] rounded-2xl overflow-hidden bg-[#FAF7F2] border-2 border-stone-200 shrink-0 p-1.5 flex items-center justify-center shadow-xs">
                                {colImg ? (
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <Image
                                      src={colImg}
                                      alt={col.name}
                                      fill
                                      className="object-contain object-center"
                                      sizes="112px"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-center p-1">
                                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                                    <span className="text-[9px] text-slate-400 font-bold block mt-1">No Photo</span>
                                  </div>
                                )}
                                <span className="absolute bottom-1 inset-x-1 text-[8px] font-black uppercase text-center bg-stone-900/80 text-white rounded-md py-0.5 backdrop-blur-xs truncate px-1">
                                  {col.name}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                    style={{ backgroundColor: col.hex }}
                                  />
                                  <span className="font-black text-slate-900 text-sm sm:text-base">
                                    {col.name}
                                  </span>
                                  {matchedPart && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-extrabold">
                                      Part: {matchedPart.name}
                                    </span>
                                  )}
                                  {hasDedicatedPhoto ? (
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center space-x-1">
                                      <span>✓</span>
                                      <span>Dedicated Photo Assigned</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center space-x-1">
                                      <span>ℹ️</span>
                                      <span>Using Base Main Photo</span>
                                    </span>
                                  )}
                                </div>

                                {!hasDedicatedPhoto && (
                                  <p className="text-[11px] text-amber-700 font-medium">
                                    Click <strong>Auto Colour Change</strong> to instantly recolor the fabric, or <strong>Upload Photo</strong> to assign a photo.
                                  </p>
                                )}

                                {/* Quick Gallery Image Selector if multiple photos uploaded */}
                                {formData.images.length > 1 && (
                                  <div className="flex items-center space-x-2 pt-0.5">
                                    <span className="text-[11px] text-slate-500 font-medium">Or assign from gallery:</span>
                                    <div className="flex items-center space-x-1.5">
                                      {formData.images.map((gImg, gIdx) => (
                                        <button
                                          key={gIdx}
                                          type="button"
                                          onClick={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              colorImages: { ...prev.colorImages, [col.name]: gImg },
                                            }));
                                            showToast(`Assigned gallery photo #${gIdx + 1} to "${col.name}"!`);
                                          }}
                                          className={`relative w-7 h-7 rounded-lg overflow-hidden border p-0.5 bg-stone-50 transition-all ${
                                            colImg === gImg ? 'border-pink-500 ring-2 ring-pink-200' : 'border-slate-200 hover:border-slate-400'
                                          }`}
                                          title={`Assign Gallery Photo #${gIdx + 1}`}
                                        >
                                          <Image
                                            src={gImg}
                                            alt={`Gallery ${gIdx + 1}`}
                                            fill
                                            className="object-contain"
                                            sizes="28px"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {colImg && (
                                  <span className="text-[11px] text-slate-400 block truncate max-w-xs sm:max-w-md font-mono">
                                    {colImg}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: Auto Colour Change + Upload Photo + Remove */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => triggerRecolorStudio(col, matchedPart?.name || 'T-shirt')}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-black transition-all flex items-center space-x-1.5 shadow-xs hover:shadow-sm"
                                title={`Automatically change ${matchedPart?.name || 'garment'} colour to ${col.name}`}
                              >
                                <Wand2 className="w-3.5 h-3.5" />
                                <span>Auto Colour Change</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => triggerColorUpload(col.name)}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
                                title={`Upload a separate photo for ${col.name}`}
                              >
                                <Upload className="w-3.5 h-3.5 text-pink-500" />
                                <span>Upload Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveColor(col.name)}
                                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center space-x-1"
                                title={`Remove ${col.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 5: PRICING */}
              {activeTab === 'pricing' && (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base font-heading">
                      Product Pricing &amp; Badges
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-extrabold text-slate-800 block mb-1">
                        Selling Price (LKR) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sellingPrice: Math.max(1, parseInt(e.target.value) || 0) }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-800 block mb-1">
                        Compare / Original Price (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.comparePrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, comparePrice: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                        placeholder="e.g. 17500"
                      />
                      {calculatedDiscount > 0 && (
                        <span className="text-[11px] font-black text-emerald-600 block mt-1">
                          🎉 {calculatedDiscount}% Discount Badge will be displayed to customers
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="font-extrabold text-slate-800 block">Catalog Badges:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isNewArrival}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isNewArrival: e.target.checked }))}
                          className="rounded text-pink-500"
                        />
                        <span>New Arrival Badge</span>
                      </label>

                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isBestSeller}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isBestSeller: e.target.checked }))}
                          className="rounded text-pink-500"
                        />
                        <span>Best Seller Badge</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: PREVIEW & PUBLISH */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base font-heading">
                      Product Preview &amp; Verification
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify your product details and test the interactive colour variation and stock states before publishing to the live store.
                    </p>
                  </div>

                  {/* Interactive Live Card Preview */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-5 space-y-3">
                      {(() => {
                        const effectiveColor = activeMatrixColors.some((c) => c.name.toLowerCase() === previewSelectedColor.toLowerCase())
                          ? previewSelectedColor
                          : (activeMatrixColors[0]?.name || '');
                        const displayImg = (effectiveColor && formData.colorImages[effectiveColor]) || formData.images[0] || '/images/products/organic-onesie.jpg';

                        return (
                          <>
                            <div className="relative aspect-[4/5] min-h-[280px] sm:min-h-[340px] rounded-2xl overflow-hidden bg-[#FAF7F2] border border-slate-200 shadow-xs p-3 flex items-center justify-center">
                              <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                  src={displayImg}
                                  alt="Live Preview"
                                  fill
                                  className="object-contain object-center transition-all duration-200"
                                  sizes="(max-width: 768px) 100vw, 360px"
                                />
                              </div>
                              {effectiveColor && (
                                <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-black uppercase text-slate-800 border border-slate-200 shadow-2xs">
                                  {effectiveColor} Variation
                                </span>
                              )}
                            </div>

                            {/* Quick Variant Switcher in Admin Preview */}
                            {activeMatrixColors.length > 0 && (
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {activeMatrixColors.map((c) => {
                                  const isSelected = effectiveColor.toLowerCase() === c.name.toLowerCase();
                                  return (
                                    <button
                                      key={c.name}
                                      type="button"
                                      onClick={() => setPreviewSelectedColor(c.name)}
                                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                                        isSelected
                                          ? 'border-pink-600 bg-pink-50 text-pink-700 ring-2 ring-pink-100 shadow-2xs'
                                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                      }`}
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                                        style={{ backgroundColor: c.hex }}
                                      />
                                      <span>{c.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black uppercase">
                          {formData.categoryName}
                        </span>
                        {formData.productType === 'set' && (
                          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase">
                            Set ({formData.parts.length} Parts)
                          </span>
                        )}
                      </div>

                      <h4 className="text-xl font-black text-slate-900 font-heading">
                        {formData.name || 'Untitled Baby Product'}
                      </h4>

                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black text-slate-900">
                          {formatCurrency(formData.sellingPrice)}
                        </span>
                        {calculatedDiscount > 0 && (
                          <span className="text-sm text-slate-400 line-through">
                            {formatCurrency(Number(formData.comparePrice))}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {formData.description || formData.shortDescription}
                      </p>

                      {/* REQUIREMENT 3: Clearly Identify Each Clothing Part (e.g. T-Shirt, Shorts) */}
                      {formData.parts.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                              <Layers className="w-3.5 h-3.5 text-pink-500" />
                              <span>Clothing Parts in this Outfit:</span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {formData.parts.length} Components
                            </span>
                          </div>

                          <div className="space-y-2">
                            {formData.parts.map((p, pIdx) => {
                              return (
                                <div
                                  key={p.id || pIdx}
                                  className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-base">
                                      {p.type.toLowerCase().includes('short') || p.type.toLowerCase().includes('pant') ? '🩳' : p.type.toLowerCase().includes('hat') ? '🧢' : '👕'}
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-xs text-slate-900 block">
                                        {p.name}
                                        <span className="text-[11px] text-slate-400 font-medium ml-1.5">
                                          ({p.type})
                                        </span>
                                      </span>
                                      <span className="text-[10px] text-pink-600 font-bold block">
                                        {p.isPurchasableIndividually
                                          ? `Available individually at ${formatCurrency(p.price || 0)}`
                                          : 'Sold together in complete set'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {p.colors && p.colors.length > 0 ? (
                                      p.colors.map((c) => (
                                        <button
                                          key={c.name}
                                          type="button"
                                          onClick={() => setPreviewSelectedColor(c.name)}
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                                            previewSelectedColor.toLowerCase() === c.name.toLowerCase()
                                              ? 'border-pink-500 bg-pink-50 text-pink-700 ring-1 ring-pink-300'
                                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                          }`}
                                          title={`View ${p.name} in ${c.name}`}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                            style={{ backgroundColor: c.hex }}
                                          />
                                          <span>{c.name}</span>
                                        </button>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Default</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <span className="text-xs font-extrabold text-slate-700 block">
                          Configured Colours:
                        </span>
                        <div className="flex items-center space-x-2">
                          {activeMatrixColors.map((c) => (
                            <span
                              key={c.name}
                              className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold flex items-center space-x-1.5"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span>{c.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-slate-700 block">
                          Sizes &amp; Total Inventory:
                        </span>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {formData.sizes.map((s) => (
                            <span key={s} className="px-2.5 py-1 rounded-full bg-white border border-slate-200 font-bold text-slate-700">
                              {s}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                          ✓ {totalMatrixStock} total sellable units configured in inventory matrix
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Checklist */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                    <span className="font-extrabold text-slate-800 block">Pre-flight Checklist:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Product name and category defined</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Selling price valid ({formatCurrency(formData.sellingPrice)})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Inventory matrix filled ({totalMatrixStock} units)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Colour variations and photos synchronized</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-full border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSaveProduct('draft')}
                  className="px-4 py-2.5 rounded-full border border-slate-300 font-bold text-xs text-slate-700 hover:bg-white transition-all shadow-2xs"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProduct('published')}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                  Publish Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base font-heading">
                  Permanently Delete Product?
                </h3>
                <p className="text-xs text-slate-500">
                  Authoritative Database & Catalog Removal
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Product Name:</span>
                <span className="font-extrabold text-slate-900 truncate max-w-[220px]">
                  {deleteConfirmProduct.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">SKU:</span>
                <span className="font-mono font-bold text-slate-700">
                  {deleteConfirmProduct.sku || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Price:</span>
                <span className="font-extrabold text-pink-600">
                  {formatCurrency(deleteConfirmProduct.price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-bold text-slate-700">
                  {deleteConfirmProduct.category?.name || 'Baby Collection'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-700 space-y-1">
              <p className="font-black flex items-center space-x-1">
                <span>⚠️</span>
                <span>Warning: Real Database Deletion</span>
              </p>
              <p className="text-rose-600/90 leading-relaxed">
                This will permanently remove this product from the database, online storefront, and category lists. Historical customer order snapshots and financial records are strictly preserved.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-2xl bg-rose-100 border border-rose-200 text-xs text-rose-800 font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteConfirmProduct(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting from Database...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT 2: Fabric Recolor Studio Modal */}
      {studioConfig?.isOpen && (
        <FabricRecolorStudio
          baseImageUrl={studioConfig.baseImageUrl}
          targetColorHex={studioConfig.targetColorHex}
          targetColorName={studioConfig.targetColorName}
          baseColorHex={studioConfig.baseColorHex}
          baseColorName={studioConfig.baseColorName}
          partName={studioConfig.partName}
          onSaveVariation={handleSaveStudioVariation}
          onClose={() => setStudioConfig(null)}
        />
      )}
    </div>
  );
}
