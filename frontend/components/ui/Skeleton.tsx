import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-stone-200 animate-pulse rounded ${className}`} />;
}
