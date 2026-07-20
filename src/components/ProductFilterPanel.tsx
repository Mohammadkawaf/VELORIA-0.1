import React from 'react';
import { SlidersHorizontal, RotateCcw, Coins } from 'lucide-react';

interface ProductFilterPanelProps {
  priceMin: number | '';
  setPriceMin: (v: number | '') => void;
  priceMax: number | '';
  setPriceMax: (v: number | '') => void;
  onClearAll: () => void;
}

export default function ProductFilterPanel({
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  onClearAll,
}: ProductFilterPanelProps) {
  
  const hasAnyActiveFilter = priceMin !== '' || priceMax !== '';

  return (
    <div 
      id="veloria-product-filter-panel"
      className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md space-y-4 text-right rtl animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-black text-slate-800 dark:text-white">تصفية السعر</span>
        </div>
        
        {hasAnyActiveFilter && (
          <button
            id="btn-clear-all-filters"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مسح الفلاتر</span>
          </button>
        )}
      </div>

      <div className="max-w-md">
        {/* Price Range */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>نطاق السعر (ل.س):</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                id="filter-price-min"
                type="number"
                placeholder="من"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-amber-500 text-center text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <input
                id="filter-price-max"
                type="number"
                placeholder="إلى"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-amber-500 text-center text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
