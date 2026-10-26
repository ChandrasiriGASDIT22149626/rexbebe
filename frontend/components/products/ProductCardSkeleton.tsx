'use client';

import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-xs h-full overflow-hidden animate-pulse">
      {/* 4:5 Aspect Ratio Container Matching Real Product Cards */}
      <div className="relative w-full aspect-[4/5] bg-[#FAF7F2] dark:bg-slate-800 flex items-center justify-center p-2 sm:p-2.5">
        <div className="w-full aspect-[1312/1199] bg-stone-200/50 dark:bg-slate-700/50 rounded-xl" />
      </div>

      {/* Card Info Skeleton */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-2">
          {/* Category Tag */}
          <div className="h-2.5 w-16 bg-stone-200 dark:bg-slate-700 rounded-full" />
          {/* Title */}
          <div className="h-4 w-3/4 bg-stone-200 dark:bg-slate-700 rounded-md" />
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-800">
          <div className="h-4 w-20 bg-stone-200 dark:bg-slate-700 rounded-md" />
          <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
