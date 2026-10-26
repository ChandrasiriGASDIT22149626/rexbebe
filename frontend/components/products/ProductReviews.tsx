'use client';

import React, { useState, useMemo } from 'react';
import { Star, CheckCircle, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Product, ProductReviewItem } from '../../types/product';
import { useAdminData } from '../../hooks/AdminContext';

export function ProductReviews({ product }: { product?: Product }) {
  const { updateProduct } = useAdminData();
  const [reviews, setReviews] = useState<ProductReviewItem[]>(
    product?.reviewsList && product.reviewsList.length > 0 ? product.reviewsList : []
  );

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newFit, setNewFit] = useState('True to Size');

  // Keep reviews synced if product changes
  React.useEffect(() => {
    if (product?.reviewsList) {
      setReviews(product.reviewsList);
    }
  }, [product?.reviewsList]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const created: ProductReviewItem = {
      id: `rev_${Date.now()}`,
      author: newAuthor.trim() || 'Happy Parent',
      location: 'Colombo, Sri Lanka 🇱🇰',
      rating: newRating,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      title: newTitle.trim(),
      content: newContent.trim(),
      verified: true,
      fit: newFit,
      helpfulCount: 0,
      status: 'approved',
    };

    const nextReviews = [created, ...reviews];
    setReviews(nextReviews);

    // Update parent product if available
    if (product) {
      const avg =
        nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextReviews.length;
      updateProduct({
        ...product,
        rating: Math.round(avg * 10) / 10,
        reviewCount: nextReviews.length,
        reviewsList: nextReviews,
      });
    }

    setIsWriteModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewAuthor('');
  };

  const reviewCount = reviews.length;
  const averageRating = useMemo(() => {
    if (reviewCount === 0) return product?.rating ? Number(product.rating).toFixed(1) : null;
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1);
  }, [reviews, reviewCount, product?.rating]);

  return (
    <div className="pt-12 border-t border-slate-200 space-y-8">
      {/* Review Summary Top Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-6 text-center md:text-left">
          {averageRating ? (
            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-heading">
                {averageRating}
              </span>
              <div className="flex items-center justify-center md:justify-start space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(Number(averageRating))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 font-bold block">
                Based on {reviewCount} verified {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-base font-extrabold text-slate-900 block">
                No customer ratings yet
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Be the first to share your thoughts on this boutique item.
              </span>
            </div>
          )}

          <div className="hidden sm:block h-16 w-px bg-slate-200" />

          <div className="hidden sm:space-y-1 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-800">Softness &amp; Comfort:</span>
              <span className="text-emerald-700 font-extrabold">5.0 / 5.0</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-800">Sizing Accuracy:</span>
              <span className="text-pink-700 font-extrabold">True to Size (100%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-800">Fabric Quality:</span>
              <span className="text-purple-700 font-extrabold">Certified Organic</span>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          className="btn-rexbebe-3d text-xs font-black tracking-wider uppercase w-full md:w-auto"
          onClick={() => setIsWriteModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5 inline" />
          Write a Parent Review
        </Button>
      </div>

      {/* Reviews List or Empty State */}
      {reviews.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-10 border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">No Customer Reviews Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Have you purchased this item? We'd love to hear your feedback on sizing, softness, and craftsmanship.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold mt-2"
            onClick={() => setIsWriteModalOpen(true)}
          >
            Leave the First Review
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-black text-sm">
                    {rev.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm">{rev.author}</span>
                      {rev.verified && (
                        <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    {rev.location && (
                      <span className="text-[11px] text-slate-400 font-medium">{rev.location}</span>
                    )}
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-medium">{rev.date}</span>
              </div>

              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
                {rev.fit && (
                  <span className="text-xs font-bold text-slate-500 ml-2">Fit: {rev.fit}</span>
                )}
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{rev.title}</h4>
              <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed">{rev.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleAddReview}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-white/80 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Write a Parent Review</h3>
                <p className="text-xs text-slate-400">Share your honest feedback on this item.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah M."
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-pink-300 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Star Rating</label>
                <div className="flex items-center space-x-1.5 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`w-7 h-7 transition-transform hover:scale-110 ${
                        star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">{newRating} of 5 stars</span>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Sizing Fit</label>
                <select
                  value={newFit}
                  onChange={(e) => setNewFit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-pink-300 outline-none"
                >
                  <option value="True to Size">True to Size (Recommended)</option>
                  <option value="Runs Slightly Small">Runs Slightly Small</option>
                  <option value="Runs Slightly Large">Runs Slightly Large</option>
                  <option value="Relaxed Fit">Relaxed Fit</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Review Headline</label>
                <input
                  type="text"
                  placeholder="Summarize your experience (e.g. Incredibly soft cashmere!)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-pink-300 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Detailed Review</label>
                <textarea
                  rows={4}
                  placeholder="Describe the fabric softness, baby comfort, stitching, and washing results..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-pink-300 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsWriteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" className="btn-rexbebe-3d">
                Submit Review
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
