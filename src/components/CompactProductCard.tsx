import React from 'react';
import { Product, User } from '../types';
import { Heart, MapPin } from 'lucide-react';

interface CompactProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onViewDetails: (product: Product) => void;
  currentUser: User | null;
}

export default function CompactProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  currentUser,
}: CompactProductCardProps) {
  return (
    <div
      onClick={() => onViewDetails(product)}
      className="w-32 sm:w-36 lg:w-40 shrink-0 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-2xs hover:shadow-md hover:border-amber-500/30 transition-all duration-300 flex flex-col group cursor-pointer select-none"
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden">
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80'
          }
          alt={product.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Sold Badge */}
        {product.status === 'sold' && (
          <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-xs z-10 select-none">
            تم البيع 🤝
          </span>
        )}

        {/* Favorite Button */}
        {currentUser && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 shadow-2xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer z-10"
            title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Heart
              className={`w-3 h-3 transition-transform active:scale-125 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Details Section */}
      <div className="p-2 flex-1 flex flex-col justify-between text-right font-sans">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[11px] line-clamp-2 leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-1 min-h-[26px]">
            {product.title}
          </h4>
        </div>

        <div className="pt-1 border-t border-slate-100 dark:border-slate-800/50 space-y-0.5">
          {/* Price */}
          <div className="text-amber-600 dark:text-amber-400 font-black text-xs flex items-baseline gap-1">
            <span>{product.price}</span>
            <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">
              {product.currency || 'ل.س'}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-0.5 text-[9px] text-slate-400 dark:text-slate-500">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{product.city || 'دمشق'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
