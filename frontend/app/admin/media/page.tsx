'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { AdminSidebar } from '../../../components/layout/AdminSidebar';
import { AdminHeader } from '../../../components/layout/AdminHeader';
import { mediaService, MediaItem } from '../../../services/mediaService';

export default function AdminMediaLibraryPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'products' | 'banners'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Safe Deletion Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    item: MediaItem | null;
    connections?: string[];
  }>({
    isOpen: false,
    item: null,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const items = await mediaService.getMediaItems();
      setMediaList(items);
    } catch (err: any) {
      showToast(err.message || 'Failed to load media assets from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const category = file.name.toLowerCase().includes('banner') ? 'banners' : 'products';
        await mediaService.uploadImage(file, category);
      }
      await fetchMedia();
      showToast('Changes saved successfully. Image(s) uploaded to database and disk.');
    } catch (err: any) {
      showToast(
        err.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    showToast('Image link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRequestDelete = async (item: MediaItem) => {
    // Attempt normal delete to test for dependency conflicts
    try {
      await mediaService.deleteMedia(item.id, false);
      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
      showToast('The item has been permanently deleted.');
    } catch (err: any) {
      if (err.data && err.data.connections) {
        setDeleteModalState({
          isOpen: true,
          item,
          connections: err.data.connections,
        });
      } else {
        // Normal confirmation dialog for confirmation
        setDeleteModalState({
          isOpen: true,
          item,
          connections: undefined,
        });
      }
    }
  };

  const handleConfirmPermanentDelete = async (force: boolean = false) => {
    if (!deleteModalState.item) return;
    const { id } = deleteModalState.item;

    try {
      await mediaService.deleteMedia(id, force);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      setDeleteModalState({ isOpen: false, item: null });
      showToast('The item has been permanently deleted.');
    } catch (err: any) {
      showToast(
        err.message ||
          "We couldn't save your changes. Your existing information has not been intentionally removed. Please try again."
      );
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.url.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (activeFilter === 'all') return true;
    return m.category === activeFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#FBF9F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Media Library"
          subtitle="Find and reuse uploaded images for your categories, pages and products. All assets are safely stored in the backend and database."
          actions={
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs shadow-md shadow-amber-900/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading Photos...' : 'Upload Images'}</span>
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
          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-amber-300/80 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50/60 transition-all rounded-3xl p-8 sm:p-10 text-center cursor-pointer space-y-3 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-black text-base text-stone-900">
                Upload New Baby Photos & Banners
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Drag and drop your JPEG, PNG, or WebP files here, or click to browse. Files persist in the backend database.
              </p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images by filename or URL..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex items-center space-x-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Assets ({mediaList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('products')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'products'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('banners')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'banners'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Banners
              </button>
            </div>
          </div>

          {/* Media Items Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-stone-500 text-xs font-bold">
              Loading persistent media records from database...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200/80 space-y-2">
              <ImageIcon className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">No media assets found</p>
              <p className="text-xs text-stone-500">Upload high-resolution photography above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-900/80 text-white backdrop-blur-xs uppercase">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div>
                      <p className="font-bold text-xs text-stone-900 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                        <span>{item.size}</span>
                        <span>{item.uploadedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
                        title="Copy direct image link"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                        title="Open full size"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleRequestDelete(item)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Permanently Delete Media Asset"
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

      {/* Safe Permanent Deletion Dependency Modal */}
      {deleteModalState.isOpen && deleteModalState.item && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-stone-200 animate-fadeIn space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-stone-900">
                  {deleteModalState.connections
                    ? 'Asset Connected to Existing Records'
                    : 'Permanently Delete Image?'}
                </h3>
                <span className="text-[11px] text-stone-500 font-semibold">
                  Safe Deletion Verification
                </span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3 text-xs">
              <p className="font-bold text-stone-800">
                Asset: <span className="text-amber-800 font-mono">{deleteModalState.item.name}</span>
              </p>

              {deleteModalState.connections && deleteModalState.connections.length > 0 ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium leading-relaxed">
                    This item is connected to other records. Please review these connections before deleting it:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-stone-700 font-semibold max-h-36 overflow-y-auto">
                    {deleteModalState.connections.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-stone-500 pt-1 font-normal">
                    Deleting this image will remove it from disk. Connected records may display broken images unless updated.
                  </p>
                </div>
              ) : (
                <p className="text-stone-600">
                  Are you sure you want to permanently delete this media asset? The database record and physical image file will be deleted.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalState({ isOpen: false, item: null })}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPermanentDelete(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Permanently Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
