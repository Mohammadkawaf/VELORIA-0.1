import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-2xs flex flex-col animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-4/3 bg-slate-200 dark:bg-slate-800 relative w-full" />
      
      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Badge & Rating placeholder */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          {/* Title placeholder */}
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>

        {/* Footer Price & Seller */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CompactProductCardSkeleton() {
  return (
    <div className="w-32 sm:w-36 lg:w-40 shrink-0 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-2xs flex flex-col animate-pulse">
      <div className="aspect-4/3 bg-slate-200 dark:bg-slate-800 w-full" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
}
