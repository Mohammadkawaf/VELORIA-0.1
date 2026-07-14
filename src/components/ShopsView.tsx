import React from 'react';
import { User, Product } from '../types';
import { Store, Check, Flame, Star, Award, ShieldCheck, ArrowLeft, Heart, Sparkles, MessageCircle } from 'lucide-react';

interface ShopsViewProps {
  users: User[];
  products: Product[];
  currentUser: User | null;
  onFollow: (userId: string) => void;
  followedSellers: string[];
  onVisitShop: (user: User) => void;
  onStartChat: (userId: string) => void;
}

export default function ShopsView({
  users,
  products,
  currentUser,
  onFollow,
  followedSellers,
  onVisitShop,
  onStartChat
}: ShopsViewProps) {
  // Only users who have some products, or are premium, or are designated sellers (e.g. seller-1, seller-2, seller-3)
  const sellers = users.filter((u) => u.id.startsWith('seller-') || u.role === 'user');

  // Categorizations
  const verifiedShops = sellers.filter((s) => s.badges.includes('verified'));
  const activeSellers = sellers.filter((s) => s.badges.includes('active_seller'));
  const featuredSellers = sellers.filter((s) => s.badges.includes('featured_seller'));
  const officialStores = sellers.filter((s) => s.badges.includes('official_store'));

  // Suggested stores (Premium or highest rating first)
  const suggestedSellers = [...sellers].sort((a, b) => b.ratingAverage - a.ratingAverage);

  const getProductsCount = (sellerId: string) => {
    return products.filter((p) => p.sellerId === sellerId && p.status === 'active').length;
  };

  const renderSellerCard = (seller: User) => {
    const isFollowing = followedSellers.includes(seller.id);
    const prodCount = getProductsCount(seller.id);

    return (
      <div 
        key={seller.id} 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 flex flex-col justify-between hover:border-amber-500/25 transition-all shadow-xs relative overflow-hidden group"
      >
        {/* If premium, show beautiful ambient banner background */}
        {seller.isPremium && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
        )}

        <div>
          {/* Cover Header simulation */}
          <div className="h-14 -mx-5 -mt-5 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end px-3 relative overflow-hidden">
            {seller.coverImage ? (
              <img src={seller.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-20" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-slate-500/5" />
            )}
            {seller.isPremium && (
              <span className="relative z-10 text-[8px] bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-450 font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5" />
                متجر مخصص
              </span>
            )}
          </div>

          {/* Avatar and Info */}
          <div className="flex items-start gap-3 mt-3">
            <img 
              src={seller.avatar} 
              className={`w-12 h-12 rounded-full object-cover shrink-0 relative -mt-6 border-2 border-white dark:border-slate-900 ${
                seller.isPremium ? 'ring-2 ring-amber-500' : 'ring-1 ring-slate-200'
              }`} 
            />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1 flex-wrap">
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-450 transition-colors truncate">
                  {seller.name}
                </h3>
                {seller.badges.includes('verified') && (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" title="موثق ✔️" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">@{seller.username || seller.id}</p>
            </div>
          </div>

          {/* Badges strip */}
          <div className="flex flex-wrap gap-1 mt-3">
            {seller.badges.includes('active_seller') && (
              <span className="text-[8px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" />
                بائع نشط
              </span>
            )}
            {seller.badges.includes('featured_seller') && (
              <span className="text-[8px] bg-amber-500/10 text-amber-650 dark:text-amber-450 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-500/20" />
                مميز
              </span>
            )}
            {seller.badges.includes('official_store') && (
              <span className="text-[8px] bg-blue-500/10 text-blue-600 dark:text-blue-450 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                <Store className="w-2.5 h-2.5" />
                متجر رسمي
              </span>
            )}
            {seller.trustLevel && (
              <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-black">
                {seller.trustLevel}
              </span>
            )}
          </div>

          {/* Short Bio */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed text-right">
            {seller.bio || 'لا يوجد نبذة تعريفية.'}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-950/30 p-2 rounded-xl mt-3 text-center text-[9px] border border-slate-100 dark:border-slate-850/60">
            <div>
              <span className="font-extrabold text-slate-850 dark:text-white block">{seller.ratingAverage} ⭐</span>
              <span className="text-slate-400">({seller.ratingsCount} تقييم)</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-850 dark:text-white block">{prodCount}</span>
              <span className="text-slate-400">إعلان نشط</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-850 dark:text-white block">{seller.followersCount}</span>
              <span className="text-slate-400">متابع</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => onVisitShop(seller)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-1.5 rounded-xl text-[10px] cursor-pointer text-center flex items-center justify-center gap-1 transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>زيارة المتجر</span>
          </button>

          {currentUser && currentUser.id !== seller.id ? (
            <button
              onClick={() => onFollow(seller.id)}
              className={`font-bold py-1.5 rounded-xl text-[10px] cursor-pointer text-center transition-all ${
                isFollowing
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isFollowing ? 'إلغاء المتابعة' : 'متابعة المتجر'}
            </button>
          ) : !currentUser ? (
            <button
              onClick={() => alert('الرجاء تسجيل الدخول لتتمكن من متابعة المتاجر وحفظ الإشعارات!')}
              className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold py-1.5 rounded-xl text-[10px]"
            >
              متابعة
            </button>
          ) : (
            <span className="text-[9px] text-slate-400 font-bold text-center flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl">
              متجري الخاص
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-sans text-right">
      {/* Page Hero Banner */}
      <div className="bg-slate-100 dark:bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full tracking-wider border border-amber-500/15">
            <Store className="w-3 h-3" />
            دليل الشركاء وأصحاب المشاريع
          </span>
          <h2 className="text-xl md:text-2xl font-black leading-tight text-slate-800 dark:text-white">
            المتاجر المحلية والأعمال المستقلة (VELORIA Stores)
          </h2>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            تصفح ملفات التجار الحرفيين، والأسر المنتجة، ومحلات التكنولوجيا الرسمية. تواصل معهم مباشرة لمراجعة المعروضات والاتفاق مجاناً ودون قيود أو حواجز.
          </p>
        </div>
        <div className="shrink-0 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">{sellers.length}</span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">متجر نشط حالياً</span>
        </div>
      </div>

      {/* Suggested Stores (المتاجر المقترحة) */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          متاجر مقترحة وموصى بها بالسوق:
        </h3>
        <p className="text-[10px] text-slate-400">متاجر تتميز بنشاطها المستمر، وتقييماتها الإيجابية الفائقة وثقة المشترين المتبادلة.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {suggestedSellers.slice(0, 3).map((seller) => renderSellerCard(seller))}
        </div>
      </div>

      {/* All Verified and Listed Shops */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
            كافة المتاجر والأسر المنتجة النشطة:
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => renderSellerCard(seller))}
        </div>
      </div>
    </div>
  );
}
