import React, { useState } from 'react';
import { Product, User, Review, Order, Message, Report, UserBadge } from '../types';
import { 
  X, ChevronLeft, ChevronRight, Star, MapPin, Send, 
  AlertTriangle, Heart, Calendar, MessageSquare, ShoppingBag, 
  ShieldCheck, Award, Flame, Store, ShieldAlert, ArrowRight, Phone, Share2, Eye, Tag
} from 'lucide-react';
import ShareModal from './ShareModal';
import OrderModal from './OrderModal';
import CompactProductCard from './CompactProductCard';
import { supabaseService, isSupabaseConfigured, supabase } from '../lib/supabase';

interface ProductDetailsModalProps {
  product: Product;
  currentUser: User | null;
  onClose: () => void;
  onToggleFavorite: (productId: string) => void;
  isFavorite: boolean;
  reviews?: Review[];
  onAddReview: (productId: string, rating: number, comment: string) => void;
  onSendOrder: (order: Omit<Order, 'id' | 'createdAt' | 'buyerId' | 'buyerName'>) => Promise<Order>;
  onSendMessage: (receiverId: string, text: string) => void;
  onSendReport: (report: Omit<Report, 'id' | 'createdAt' | 'reporterId' | 'reporterName' | 'status'>) => void;
  onToggleFollow: (sellerId: string) => void;
  isFollowing: boolean;
  users?: User[];
  onVisitStore?: (seller: User) => void;
  allProducts?: Product[];
  favorites?: string[];
  onSelectProduct?: (product: Product) => void;
}

export default function ProductDetailsModal({
  product,
  currentUser,
  onClose,
  onToggleFavorite,
  isFavorite,
  reviews,
  onAddReview,
  onSendOrder,
  onSendMessage,
  onSendReport,
  onToggleFollow,
  isFollowing,
  users,
  onVisitStore,
  allProducts = [],
  favorites = [],
  onSelectProduct
}: ProductDetailsModalProps) {
  const seller = (users || []).find((u) => u.id === product.sellerId);
  const isOwnProduct = currentUser?.id === product.sellerId;

  const getWhatsAppLink = () => {
    let num = seller?.whatsapp || seller?.whatsapp_number || '';
    num = num.replace(/\D/g, '');
    if (num.startsWith('00')) num = num.substring(2);
    if (num.startsWith('05') && num.length === 10) {
      num = '966' + num.substring(1);
    }
    return num;
  };

  const handleWhatsAppClick = () => {
    const num = getWhatsAppLink();
    if (!num) {
      alert('لم يقم البائع بإضافة رقم واتساب.');
      return;
    }
    const msg = encodeURIComponent(`مرحباً ${seller?.name || ''}، أود الاستفسار عن منتجك "${product.title}" المعروض في منصة فيلوريا بسعر ${product.price} ${product.currency || 'ل.س'}.\nرابط المنتج: ${window.location.origin}/store/${seller?.username || seller?.id || ''}`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  // States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'reviews'>('info');

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatSuccess, setChatSuccess] = useState(false);

  // Report states
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('سعر غير دقيق أو مضلل');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Order Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Filter reviews for this product
  const [productReviews, setProductReviews] = React.useState<Review[]>([]);
  const [reviewsCount, setReviewsCount] = React.useState(product.reviewsCount || 0);
  const [ratingAverage, setRatingAverage] = React.useState(product.rating !== undefined && product.rating !== null ? product.rating : 0);

  const loadProductReviewsAndStats = async () => {
    if (isSupabaseConfigured) {
      try {
        const mappedReviews = await supabaseService.getProductRatings(product.id);
        setProductReviews(mappedReviews);
        
        const { data, error } = await supabase
          ?.from('products')
          .select('rating_average, ratings_count')
          .eq('id', product.id)
          .maybeSingle() || { data: null, error: null };
          
        if (data && !error) {
          setReviewsCount(data.ratings_count !== undefined && data.ratings_count !== null ? Number(data.ratings_count) : 0);
          setRatingAverage(data.rating_average !== undefined && data.rating_average !== null ? Number(data.rating_average) : 5.0);
        } else {
          const count = mappedReviews.length;
          const sum = mappedReviews.reduce((acc, curr) => acc + curr.rating, 0);
          const avg = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;
          setReviewsCount(count);
          setRatingAverage(avg);
        }
      } catch (err) {
        console.warn('Error loading reviews or product stats:', err);
        setProductReviews([]);
        setReviewsCount(0);
        setRatingAverage(5.0);
      }
    } else {
      setProductReviews([]);
      setReviewsCount(0);
      setRatingAverage(5.0);
    }
  };

  React.useEffect(() => {
    loadProductReviewsAndStats();
  }, [product.id]);

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (newComment.trim() === '') return;

    if (isSupabaseConfigured) {
      try {
        const exists = await supabaseService.checkProductRatingExists(product.id, currentUser.id);
        if (exists) {
          alert("لقد قمت بتقييم هذا المنتج سابقاً، شكراً لمشاركتك تجربتك");
          return;
        }

        await supabaseService.addProductRating(product.id, currentUser.id, newRating, newComment);
        onAddReview(product.id, newRating, newComment);
        setCommentSubmitted();
        await loadProductReviewsAndStats();
      } catch (err) {
        console.error('Error checking or adding rating:', err);
      }
    } else {
      onAddReview(product.id, newRating, newComment);
      setCommentSubmitted();
    }
  };

  const setCommentSubmitted = () => {
    setReviewSubmitted(true);
    setNewComment('');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  const submitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (chatMessage.trim() === '') return;
    onSendMessage(product.sellerId, chatMessage);
    setChatSuccess(true);
    setChatMessage('');
    setTimeout(() => setChatSuccess(false), 3000);
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || reportDetails.trim() === '') return;
    
    const reportObj = {
      type: 'product' as const,
      targetId: product.id,
      targetName: product.title,
      reason: reportReason,
      details: reportDetails
    };
    onSendReport(reportObj);
    setReportSubmitted(true);
    setReportDetails('');
    setTimeout(() => {
      setReportSubmitted(false);
      setShowReportForm(false);
    }, 3000);
  };

  const renderSellerBadge = (badge: UserBadge) => {
    switch (badge) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            موثق ✔️
          </span>
        );
      case 'active_seller':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-500/20">
            <Flame className="w-3.5 h-3.5 shrink-0" />
            بائع نشط 🔥
          </span>
        );
      case 'featured_seller':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
            <Award className="w-3.5 h-3.5 shrink-0" />
            بائع مميز ⭐
          </span>
        );
      case 'official_store':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
            <Store className="w-3.5 h-3.5 shrink-0" />
            متجر رسمي 🏪
          </span>
        );
    }
  };

  const hasPremiumStyle = seller?.isPremium && seller.premiumConfig;
  const premiumStyles = hasPremiumStyle ? seller.premiumConfig : null;

  // Filter similar products (same category, different id)
  const similarProducts = allProducts.filter(
    (p) => p.id !== product.id && (product.categoryId ? p.categoryId === product.categoryId : true)
  ).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans select-none text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shrink-0"
            title="الرجوع"
          >
            <ArrowRight className="w-5 h-5 text-amber-500" />
          </button>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {product.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {currentUser && (
            <button
              onClick={() => onToggleFavorite(product.id)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 transition-colors cursor-pointer"
            title="مشاركة المنتج"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 space-y-5 pb-32">
        {/* Custom Premium Banner if Seller has Premium */}
        {premiumStyles && (
          <div 
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.85)), url(${premiumStyles.coverImage})` }}
            onClick={() => {
              if (onVisitStore && seller) {
                onVisitStore(seller);
                onClose();
              }
            }}
            className="bg-cover bg-center h-20 rounded-2xl p-4 flex items-end justify-between text-white cursor-pointer hover:opacity-95 transition-opacity shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{premiumStyles.logo}</span>
              <div>
                <h4 className="font-bold text-xs text-amber-400">متجر مميز مخصص</h4>
                <p className="text-[10px] text-slate-300">@{premiumStyles.customSlug}</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
              VELORIA GOLD
            </span>
          </div>
        )}

        {/* 2. Images Carousel (30-35% Height) */}
        <div className="relative w-full h-[32vh] min-h-[220px] max-h-[340px] bg-slate-900 rounded-3xl overflow-hidden shadow-sm group select-none">
          <img
            src={product.images[activeImageIndex] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            referrerPolicy="no-referrer"
            onClick={() => setIsLightboxOpen(true)}
            className="w-full h-full object-cover cursor-zoom-in group-hover:scale-102 transition-transform duration-300"
          />

          {/* Sold Badge Overlay */}
          {product.status === 'sold' && (
            <span className="absolute top-3 right-3 bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-lg z-10">
              تم البيع 🤝
            </span>
          )}

          {/* Location Tag */}
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">{product.city || 'دمشق'}</span>
          </div>

          {/* Nav Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-amber-400" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-amber-400" />
              </button>

              {/* Dots Pagination */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-full">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeImageIndex ? 'bg-amber-500 w-4' : 'bg-white/60 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. Product Title, Price & Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mb-2 leading-snug">
              {product.title}
            </h1>

            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="text-amber-600 dark:text-amber-400 text-2xl font-black">
                {product.price} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ل.س</span>
              </div>

              {reviewsCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{ratingAverage}</span>
                  <span className="text-slate-400 font-normal">({reviewsCount} تقييم)</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">المدينة</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{product.city || 'دمشق'}</p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">حالة المنتج</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {product.condition || 'جديد / ممتاز'}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">المشاهدات</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{product.viewsCount ?? 0}</p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold">تاريخ النشر</p>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {new Date(product.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">وصف المنتج:</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>

        {/* 4. Seller Card (معلومات البائع) */}
        {seller && (
          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs ${
            premiumStyles 
              ? 'bg-amber-500/5 border-amber-500/20' 
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  onClick={() => {
                    if (onVisitStore) {
                      onVisitStore(seller);
                      onClose();
                    }
                  }}
                  className={`w-14 h-14 rounded-full object-cover cursor-pointer hover:opacity-85 transition-opacity ${premiumStyles?.avatarBorder || ''}`}
                />
                {seller.isPremium && (
                  <span className="absolute -bottom-1 -right-1 text-xs bg-amber-500 rounded-full p-0.5">🌟</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 
                    onClick={() => {
                      if (onVisitStore) {
                        onVisitStore(seller);
                        onClose();
                      }
                    }}
                    className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate cursor-pointer hover:text-amber-500 transition-colors"
                  >
                    {seller.name}
                  </h4>
                  {seller.badges.includes('verified') && (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="متجر موثق" />
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {seller.bio || 'بائع متميز في منصة فيلوريا'}
                </p>

                {seller.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {seller.badges.map((b) => (
                      <React.Fragment key={b}>{renderSellerBadge(b)}</React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              {onVisitStore && (
                <button
                  onClick={() => {
                    onVisitStore(seller);
                    onClose();
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-extrabold text-xs py-2.5 px-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Store className="w-4 h-4 text-amber-500" />
                  <span>زيارة المتجر</span>
                </button>
              )}

              {currentUser && currentUser.id !== seller.id && (
                <button
                  onClick={() => onToggleFollow(seller.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {isFollowing ? 'متابع ✓' : 'متابعة المتجر'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. Tabs: Chat / Reviews / Report */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                activeTab === 'info'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              التقييمات والملاحظات ({productReviews.length})
            </button>
            {!isOwnProduct && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-center text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'chat'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                رسالة سريعة للبائع
              </button>
            )}
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Reviews List */}
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {productReviews.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      لا توجد تقييمات لهذا المنتج بعد. كن أول من يضيف تقييماً!
                    </p>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <img src={rev.reviewerAvatar} className="w-6 h-6 rounded-full object-cover" />
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{rev.reviewerName}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3 h-3 ${idx < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {rev.comment}
                        </p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(rev.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Review Form */}
                {currentUser ? (
                  <form onSubmit={submitReview} className="border-t border-slate-100 dark:border-slate-800 pt-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">إضافة تقييمك للمنتج:</h4>
                    {reviewSubmitted && (
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 text-[11px] rounded mb-2 text-center">
                        تم إضافة تقييمك بنجاح!
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-slate-400">التقييم:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-0.5 cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="اكتب تقييمك وصادقيتك في التعامل..."
                        className="flex-1 text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 rounded-2xl text-xs font-extrabold cursor-pointer"
                      >
                        نشر التقييم
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    ⚠️ يرجى تسجيل الدخول أو اختيار حساب عضو لإضافة تقييمك.
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-3">
                {chatSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 text-xs rounded-xl text-center">
                    تم تسليم رسالتك للبائع بنجاح!
                  </div>
                )}
                <form onSubmit={submitChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="اكتب استفسارك للبائع..."
                    className="flex-1 text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 rounded-2xl flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Report Link */}
        {currentUser && !isOwnProduct && (
          <div className="pt-1 text-center">
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>أبلغ عن مخالفة أو محتوى غير لائق</span>
            </button>

            {showReportForm && (
              <form onSubmit={submitReport} className="mt-3 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-3 text-right">
                <h5 className="font-extrabold text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" />
                  الإبلاغ عن محتوى أو سلوك مخالف
                </h5>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">سبب الإبلاغ:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <option>سعر غير دقيق أو مضلل</option>
                    <option>منتج مقلد أو غير مصرح</option>
                    <option>صور غير ملائمة أو غير لائقة</option>
                    <option>سلوك مسيء من البائع</option>
                    <option>احتيال أو محاولة تلاعب بالسمعة</option>
                    <option>آخر</option>
                  </select>
                </div>
                <div>
                  <textarea
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="يرجى ذكر الوقائع والاتفاق..."
                    className="w-full text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[70px]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                >
                  {reportSubmitted ? 'تم إرسال البلاغ للمشرفين' : 'إرسال البلاغ'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 6. Similar Products Section (منتجات مشابهة) */}
        {similarProducts.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>منتجات مشابهة</span>
              </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              {similarProducts.map((p) => (
                <CompactProductCard
                  key={p.id}
                  product={p}
                  isFavorite={favorites.includes(p.id)}
                  onToggleFavorite={onToggleFavorite}
                  onViewDetails={(selected) => {
                    if (onSelectProduct) {
                      onSelectProduct(selected);
                    }
                  }}
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 7. Fixed Bottom Action Bar (الشريط السفلي الثابت) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 p-3 shadow-xl">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {isOwnProduct ? (
            <div className="w-full text-center py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700">
              أنت صاحب هذا المنتج 👑
            </div>
          ) : product.status === 'sold' ? (
            <div className="w-full text-center py-2.5 bg-rose-500/10 text-rose-600 text-xs font-bold rounded-2xl border border-rose-500/20">
              المنتج مباع وغير متاح للطلب 🤝
            </div>
          ) : (
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>اطلب الآن</span>
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-55 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 left-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={product.images[activeImageIndex]}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute right-[-16px] md:right-[-60px] p-3 rounded-full bg-slate-800/80 hover:bg-slate-750 text-white hover:scale-105 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6 text-amber-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute left-[-16px] md:left-[-60px] p-3 rounded-full bg-slate-800/80 hover:bg-slate-750 text-white hover:scale-105 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 text-amber-500" />
                </button>
              </>
            )}
          </div>
          <div className="mt-6 text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
            <span>الصورة {activeImageIndex + 1} من {product.images.length}</span>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}${window.location.pathname}?view=product&productId=${product.id}`}
        title={`منتج رائع في فيلوريا: ${product.title}`}
        description={`شاهد "${product.title}" المعروض بسعر ${product.price} ${product.currency} في سوق فيلوريا.`}
      />

      {/* Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={product}
        currentUser={currentUser}
        seller={seller}
        onConfirmOrder={async (orderData) => {
          return await onSendOrder({
            productId: product.id,
            productTitle: product.title,
            productImage: product.images[0] || '',
            sellerId: product.sellerId,
            sellerName: seller?.name || 'بائع فيلوريا',
            price: product.price,
            quantity: orderData.quantity,
            buyerMessage: orderData.buyerMessage,
            status: 'pending'
          });
        }}
      />
    </div>
  );
}
