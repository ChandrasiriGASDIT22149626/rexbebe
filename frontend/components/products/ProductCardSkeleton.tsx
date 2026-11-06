'use client';

import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col w-full bg-white dark:bg-slate-900 text-left animate-pulse">
      {/* 3:4 Aspect Ratio Container Matching Reference Product Card */}
      <div className="relative w-full aspect-[3/4] bg-neutral-200/60 dark:bg-slate-800" />

      {/* Card Info Skeleton */}
      <div className="pt-3 pb-1 space-y-2">
        {/* Title */}
        <div className="h-4 w-4/5 bg-neutral-200 dark:bg-slate-800 rounded-xs" />

        {/* Price */}
        <div className="h-4 w-24 bg-neutral-200 dark:bg-slate-800 rounded-xs" />

        {/* Installment line */}
        <div className="h-3 w-40 bg-neutral-100 dark:bg-slate-800/60 rounded-xs" />
        <div className="h-3 w-20 bg-neutral-100 dark:bg-slate-800/60 rounded-xs" />

        {/* Size boxes */}
        <div className="pt-1 flex gap-1.5">
          <div className="h-6 w-7 bg-neutral-100 dark:bg-slate-800/60 rounded-xs" />
          <div className="h-6 w-7 bg-neutral-100 dark:bg-slate-800/60 rounded-xs" />
          <div className="h-6 w-7 bg-neutral-100 dark:bg-slate-800/60 rounded-xs" />
          <div className="h-6 w-7 bg-neutral-100 dark:bg-slate-800/60 rounded-xs" />
        </div>
      </div>
    </div>
  );
}
