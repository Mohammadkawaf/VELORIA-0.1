import React, { useState } from 'react';
import { Product, User, Review, Order, Message, Report, UserBadge } from '../types';
import { 
  X, ChevronLeft, ChevronRight, Star, MapPin, Send, 
  AlertTriangle, Heart, Calendar, MessageSquare, ShoppingBag, 
  ShieldCheck, Award, Flame, Store, ShieldAlert, Plus, CheckCircle, Phone, Share2, Eye
} from 'lucide-react';
import ShareModal from './ShareModal';
import OrderModal from './OrderModal';
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
  onVisitStore
}: ProductDetailsModalProps) {
  console.log("users length =", users?.length || 0);
  console.log("users ids =", (users || []).map(u => ({
    id: u.id,
    name: u.name,
    whatsapp: u.whatsapp
  })));
  console.log("product.sellerId =", product.sellerId);
  const seller = (users || []).find((u) => u.id === product.sellerId);
  console.log("seller after find =", seller);
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
  const [activeTab, setActiveTab] = useState<'info' | 'chat' | 'order' | 'reviews'>('info');

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Order states
  const [orderQty, setOrderQty] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

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

  console.log("Current productReviews state:", productReviews);

  const loadProductReviewsAndStats = async () => {
    if (isSupabaseConfigured) {
      try {
        const mappedReviews = await supabaseService.getProductRatings(product.id);
        setProductReviews(mappedReviews);
        console.log("Mapped Reviews:", mappedReviews);
        
        // Fetch the product's latest rating stats from the database directly
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

        // Add rating to database
        await supabaseService.addProductRating(product.id, currentUser.id, newRating, newComment);
        
        // Trigger parent state updates/notifications
        onAddReview(product.id, newRating, newComment);
        
        setCommentSubmitted();
        
        // Reload reviews list and rating stats directly to update UI instantly without reload
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

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!seller) return;
    try {
      await onSendOrder({
        productId: product.id,
        productTitle: product.title,
        productImage: product.images[0],
        sellerId: product.sellerId,
        sellerName: seller.name,
        price: product.price,
        quantity: orderQty,
        notes: orderNotes,
        status: 'pending'
      });
      setOrderSubmitted(true);
      setOrderNotes('');
      setTimeout(() => {
        setOrderSubmitted(false);
        setActiveTab('info');
      }, 3000);
    } catch (err) {
      console.error(err);
    }
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
    if (!currentUser) return;
    if (reportDetails.trim() === '') return;
    onSendReport({
      type: 'product',
      targetId: product.id,
      targetName: product.title,
      reason: reportReason,
      details: reportDetails
    });
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

  // Simulated premium custom shop styling
  const hasPremiumStyle = seller?.isPremium && seller.premiumConfig;
  const premiumStyles = hasPremiumStyle ? seller.premiumConfig : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative border border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image Gallery */}
        <div className="w-full md:w-1/2 bg-slate-100 dark:bg-slate-950 relative flex flex-col justify-center select-none min-h-[300px] md:min-h-0">
          <img
            src={product.images[activeImageIndex] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80'}
            alt={product.title}
            referrerPolicy="no-referrer"
            onClick={() => setIsLightboxOpen(true)}
            className="w-full h-full object-cover max-h-[45vh] md:max-h-full cursor-zoom-in hover:opacity-95 transition-opacity"
          />

          {product.status === 'sold' && (
            <span className="absolute top-4 right-4 bg-rose-600 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg z-10 select-none">
              تم البيع 🤝
            </span>
          )}

          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute right-3 p-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute left-3 p-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {/* Pagination Dots */}
              <div className="absolute bottom-4 right-1/2 translate-x-1/2 flex gap-1 bg-slate-900/40 px-2 py-1 rounded-full">
                {product.images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      idx === activeImageIndex ? 'bg-amber-500 w-3.5' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Location Badge */}
          <div className="absolute top-4 right-4 bg-slate-900/75 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{product.city || 'دمشق'}</span>
          </div>
        </div>

        {/* Column 2: Content & Tabs */}
        <div className="w-full md:w-1/2 flex flex-col h-[60vh] md:h-auto overflow-y-auto">
          {/* Custom Shop Header if Premium */}
          {premiumStyles ? (
            <div 
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.85)), url(${premiumStyles.coverImage})` }}
              onClick={() => {
                if (onVisitStore && seller) {
                  onVisitStore(seller);
                  onClose();
                }
              }}
              className="bg-cover bg-center h-24 p-4 flex items-end justify-between text-white cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{premiumStyles.logo}</span>
                <div>
                  <h4 className="font-bold text-xs text-amber-400">متجر مميز مخصص</h4>
                  <p className="text-[10px] text-slate-300">@{premiumStyles.customSlug}</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded">
                VELORIA GOLD
              </span>
            </div>
          ) : (
            <div className="h-4 bg-slate-50 dark:bg-slate-850"></div>
          )}

          {/* Tabs header */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0 font-sans">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 cursor-pointer ${
                activeTab === 'info'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              التفاصيل
            </button>
            <button
              onClick={() => {
                setActiveTab('reviews');
              }}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              التقييمات ({productReviews.length})
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6 flex-1 flex flex-col justify-between font-sans">
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Title & Price */}
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                    {product.title}
                  </h1>
                  <div className="flex items-center justify-between">
                    <div className="text-amber-600 dark:text-amber-400 text-xl font-black">
                      {product.price} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ل.س</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{product.viewsCount ?? 0}</span>
                      </div>
                      {reviewsCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="font-extrabold">{ratingAverage}</span>
                          <span className="text-slate-400">({reviewsCount} تقييم)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                 {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-1">وصف المنتج:</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                {/* Location Detail */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="text-right">
                      <h4 className="text-[10px] font-bold text-slate-400 mb-0.5">موقع المنتج:</h4>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {product.city || 'دمشق'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seller Profile Block */}
                {seller && (
                  <div className={`p-4 rounded-2xl border ${
                    premiumStyles 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800'
                    }`}
                  >
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
                          className={`w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity ${premiumStyles?.avatarBorder || ''}`}
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
                            className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate cursor-pointer hover:text-amber-500 hover:underline transition-all"
                          >
                            {seller.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {seller.bio || 'بائع متميز في منصة فيلوريا'}
                        </p>
                        {/* Badges list */}
                        {seller.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {seller.badges.map((b) => (
                              <React.Fragment key={b}>{renderSellerBadge(b)}</React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Follow Button */}
                      {currentUser && currentUser.id !== seller.id && (
                        <button
                          onClick={() => onToggleFollow(seller.id)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
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

                {/* WhatsApp & Order Direct Buttons */}
                {!isOwnProduct && (
                  product.status === 'sold' ? (
                    <button
                      disabled
                      className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed text-center border border-slate-100 dark:border-slate-850"
                    >
                      <Phone className="w-4 h-4 text-slate-405" />
                      <span>التواصل غير متاح (المنتج مباع)</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>اطلب الآن</span>
                      </button>
                    </div>
                  )
                )}

                {/* Policy Warning */}
                <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  📢 <strong className="text-slate-700 dark:text-slate-300">ملاحظة هامة حول سياسة فيلوريا:</strong> VELORIA لا تتدخل في الدفع أو التوصيل أو الشحن. تقع المسؤولية الكاملة في تحديد تفاصيل التسليم واستلام الأموال على البائع والمشتري مباشرة بما يضمن رضا الطرفين.
                </div>

                {/* Favorite Toggle & Report Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 gap-4">
                  <div className="flex items-center gap-4">
                    {currentUser && (
                      <button
                        onClick={() => onToggleFavorite(product.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
                        <span>{isFavorite ? 'محفوظ في المفضلة' : 'إضافة للمفضلة'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>مشاركة المنتج 📢</span>
                    </button>
                  </div>

                  {currentUser && !isOwnProduct && (
                    <button
                      onClick={() => setShowReportForm(!showReportForm)}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>أبلغ عن مخالفة</span>
                    </button>
                  )}
                </div>

                {/* Report Form Drawer */}
                {showReportForm && (
                  <form onSubmit={submitReport} className="mt-3 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 space-y-3">
                    <h5 className="font-extrabold text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4" />
                      الإبلاغ عن محتوى أو سلوك مخالف
                    </h5>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">سبب الإبلاغ:</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full text-xs p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
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
                      <label className="block text-[10px] text-slate-400 mb-1">تفاصيل إضافية مبرهنة:</label>
                      <textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="يرجى ذكر الوقائع والاتفاق لمساعدة المشرف على اتخاذ القرار السليم..."
                        className="w-full text-xs p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[60px]"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      {reportSubmitted ? 'تم إرسال البلاغ للمشرفين' : 'إرسال البلاغ للمراجعة'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab Chat */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-3 flex-1 overflow-y-auto">
                  <div className="p-3 bg-blue-500/5 text-blue-700 dark:text-blue-400 text-xs rounded-xl border border-blue-500/10 leading-relaxed">
                    💬 تواصل مباشرة مع البائع للاستفسار عن تفاصيل المنتج، طرق الشحن، والاتفاق النهائي على السعر. سيتم تسليم رسالتك إلى البائع في صندوق دردشته فوراً.
                  </div>

                  {chatSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 text-xs rounded-lg text-center flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>تم تسليم رسالتك للبائع بنجاح!</span>
                    </div>
                  )}

                  <div className="border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/30">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold">بخصوص المنتج:</p>
                    <div className="flex items-center gap-2">
                      <img src={product.images[0]} className="w-10 h-10 object-cover rounded-lg" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.title}</p>
                        <p className="text-[10px] text-amber-600">{product.price} {product.currency || 'ل.س'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={submitChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="اكتب رسالتك للبائع هنا..."
                    className="flex-1 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Tab Purchase Order */}
            {activeTab === 'order' && (
              <form onSubmit={submitOrder} className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl border border-emerald-500/10 leading-relaxed">
                    🛒 <strong>طلب الشراء المباشر:</strong> من خلال تقديم هذا الطلب، سيتلقى البائع في لوحته تفاصيل طلبك وعنوانك ونوتاتك، ليتمكن من مراجعة التوفر والتواصل معك للاتفاق على الدفع والاستلام.
                  </div>

                  {orderSubmitted && (
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 text-xs rounded-xl text-center flex items-center justify-center gap-1.5 font-bold animate-bounce">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span>تم تقديم طلب الشراء للبائع بنجاح! سيتم مراجعته فوراً.</span>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">الكمية المطلوبة:</h4>
                      <p className="text-[10px] text-slate-400">حدد عدد الوحدات التي ترغب بشرائها</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-sm">{orderQty}</span>
                      <button
                        type="button"
                        onClick={() => setOrderQty(orderQty + 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total Price preview */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">السعر الإجمالي المقترح:</h4>
                      <p className="text-[10px] text-slate-400">سعر المنتج × الكمية المطلوبة</p>
                    </div>
                    <div className="text-amber-600 dark:text-amber-400 font-black text-lg">
                      {product.price * orderQty} {product.currency || 'ل.س'}
                    </div>
                  </div>

                  {/* Custom Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      تفاصيل الشحن أو نوتة خاصة للبائع:
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="مثال: عنواني الرياض حي الياسمين، أرغب بالتوصيل يوم السبت القادم بعد العصر ومستعد للتحويل..."
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitted}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>تقديم طلب الشراء</span>
                </button>
              </form>
            )}

            {/* Tab Reviews */}
            {activeTab === 'reviews' && (
              <div className="flex flex-col h-full gap-4">
                {/* List of reviews */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[35vh]">
                  {productReviews.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      لا توجد تقييمات لهذا المنتج بعد. كن أول من يكتب تقييماً لبناء نظام الثقة!
                    </div>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <img src={rev.reviewerAvatar} className="w-6 h-6 rounded-full object-cover" />
                            <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200">{rev.reviewerName}</span>
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
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
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
                  <form onSubmit={submitReview} className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">إضافة تقييمك للمنتج:</h4>
                    {reviewSubmitted && (
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 text-[11px] rounded mb-2 text-center">
                        تم إضافة تقييمك بنجاح وتحديث سمعة البائع!
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-slate-400">التقييم بالنجوم:</span>
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
                        placeholder="اكتب تقييمك وصادقيتك في التعامل مع هذا البائع..."
                        className="flex-1 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        نشر التقييم
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    ⚠️ يرجى اختيار حساب عضو مسجل من شريط محاكاة الأدوار في الأعلى لتتمكن من إضافة تقييمك للمنتج.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Full-screen Image Viewer */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-55 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 font-sans select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 left-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Large Image */}
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

          {/* Bottom Indicators */}
          <div className="mt-6 text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
            <span>الصورة {activeImageIndex + 1} من {product.images.length}</span>
            <div className="flex gap-1.5">
              {product.images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === activeImageIndex ? 'bg-amber-500 w-5' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}${window.location.pathname}?view=product&productId=${product.id}`}
        title={`منتج رائع في فيلوريا: ${product.title}`}
        description={`شاهد "${product.title}" المعروض بسعر ${product.price} ${product.currency} في سوق فيلوريا الحر لتمكين المشاريع المنزلية والحرفية.`}
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
