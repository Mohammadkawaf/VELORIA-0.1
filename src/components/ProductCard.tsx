import { Product, User, UserBadge } from '../types';
import { Star, MapPin, Heart, Flame, ShieldCheck, Award, Store, Eye } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onViewDetails: (product: Product) => void;
  currentUser: User | null;
  users?: User[];
  onVisitStore?: (seller: User) => void;
}

export default function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  currentUser,
  users,
  onVisitStore
}: ProductCardProps) {
  // Find seller dynamically
  const seller = (users || []).find((u) => u.id === product.sellerId);

  // Helper to render badge UI
  const renderBadge = (badge: UserBadge) => {
    switch (badge) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            موثق
          </span>
        );
      case 'active_seller':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
            <Flame className="w-3 h-3 text-orange-500" />
            نشط
          </span>
        );
      case 'featured_seller':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
            <Award className="w-3 h-3 text-amber-500" />
            مميز
          </span>
        );
      case 'official_store':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
            <Store className="w-3 h-3 text-blue-500" />
            متجر رسمي
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-300 flex flex-col group h-full">
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80'}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Sold Badge */}
        {product.status === 'sold' && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-md z-10 select-none">
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
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 shadow-sm text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        )}

        {/* Seller Info Quick Tag */}
        <div 
          onClick={(e) => {
            if (onVisitStore && seller) {
              e.stopPropagation();
              onVisitStore(seller);
            }
          }}
          className={`absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1 ${onVisitStore ? 'cursor-pointer hover:bg-slate-800' : ''}`}
        >
          <img
            src={seller?.avatar}
            alt={seller?.name}
            className="w-4.5 h-4.5 rounded-full object-cover"
          />
          <span className="truncate max-w-[100px] hover:underline">{seller?.name}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between font-sans">
        <div>
          {/* Badges container */}
          {seller && seller.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {seller.badges.map((b) => (
                <div key={b}>{renderBadge(b)}</div>
              ))}
            </div>
          )}

          {/* Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 mb-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            {product.title}
          </h3>
        </div>

        {/* Price, rating, and location */}
        <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Price */}
            <div className="text-amber-600 dark:text-amber-400 font-extrabold text-base flex items-baseline gap-1">
              <span>{product.price}</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {product.currency || 'ل.س'}
              </span>
            </div>

            {/* Rating */}
            {product.reviewsCount > 0 ? (
              <div className="flex items-center gap-0.5 text-xs text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                <Star className="w-3 h-3 fill-amber-500" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-[10px] text-slate-400">({product.reviewsCount})</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400">لا تقييمات</div>
            )}
          </div>

          {/* Location and Date */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-0.5 truncate max-w-[100px]">
              <MapPin className="w-3 h-3 shrink-0" />
              {product.city || 'دمشق'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                <Eye className="w-3 h-3" />
                <span>{product.viewsCount ?? 0}</span>
              </span>
              <span>
                {new Date(product.createdAt).toLocaleDateString('ar-SA', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
