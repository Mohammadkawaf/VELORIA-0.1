import React, { useState } from 'react';
import { Bell, Heart, ShoppingBag, Star, UserPlus, ShieldCheck, Megaphone, Info, Check, Trash2, X } from 'lucide-react';
import { Notification, Order, User } from '../types';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  orders?: Order[];
  onUpdateOrderStatus?: (
    orderId: string,
    status: Order['status'],
    extraData?: {
      sellerRating?: number;
      productRating?: number;
      ratingComment?: string;
      cancellationReason?: string;
    }
  ) => void;
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  currentUser?: User | null;
}

type FilterType = 'all' | 'order' | 'follow' | 'review' | 'contribution' | 'admin' | 'announcement';

export default function NotificationsView({
  notifications,
  onMarkAllAsRead,
  orders = [],
  onUpdateOrderStatus,
  setNotifications,
  currentUser
}: NotificationsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // State for rating modal
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [productRating, setProductRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [showRatingSuccess, setShowRatingSuccess] = useState<boolean>(false);
  const [ratingError, setRatingError] = useState<string>('');

  // State for cancellation modal (rejection of receipt)
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [showCancellationSuccess, setShowCancellationSuccess] = useState<boolean>(false);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'review':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
      case 'contribution':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />;
      case 'admin':
      case 'system':
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryName = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return 'إشعار طلب 🛒';
      case 'follow':
        return 'متابعة جديدة 👥';
      case 'review':
        return 'تقييم جديد ⭐';
      case 'contribution':
        return 'مساهمة ماليّة 🤝';
      case 'admin':
      case 'system':
        return 'تنبيه إداري 🛡️';
      case 'announcement':
        return 'إعلان عام 📢';
      default:
        return 'إشعار النظام ⚙️';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      return `منذ ${diffDays} يوم`;
    } catch (e) {
      return 'قبل قليل';
    }
  };

  // Filter notifications based on tab
  const filteredNotifications = [...notifications]
    .filter(n => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'admin') {
        return n.type === 'admin' || n.type === 'system';
      }
      return n.type === activeFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const filterTabs: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'الكل', count: notifications.length },
    { id: 'order', label: 'الطلبات', count: notifications.filter(n => n.type === 'order').length },
    { id: 'follow', label: 'المتابعين', count: notifications.filter(n => n.type === 'follow').length },
    { id: 'review', label: 'التقييمات', count: notifications.filter(n => n.type === 'review').length },
    { id: 'contribution', label: 'المساهمات', count: notifications.filter(n => n.type === 'contribution').length },
    { id: 'admin', label: 'الإدارة', count: notifications.filter(n => n.type === 'admin' || n.type === 'system').length },
    { id: 'announcement', label: 'الإعلانات', count: notifications.filter(n => n.type === 'announcement').length },
  ];

  return (
    <div className="max-w-3xl mx-auto my-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md font-sans text-right space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-850 dark:text-slate-100">
              مركز الإشعارات والعمليات
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">تابع تحديثات حسابك، طلبياتك، وإعلانات الإدارة أولاً بأول</p>
          </div>
        </div>

        {notifications.some(n => !n.read) ? (
          <button
            onClick={onMarkAllAsRead}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-750 font-black cursor-pointer transition-all bg-amber-500/10 border border-amber-500/15 px-3 py-1.5 rounded-xl flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>تحديد الكل كمقروء</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 px-2.5 py-1.5 rounded-xl">جميع العمليات مقروءة ✓</span>
        )}
      </div>

      {/* Tabs / Filtering Category Selection */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
              activeFilter === tab.id
                ? 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFilter === tab.id 
                  ? 'bg-slate-950 text-amber-500 font-extrabold' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-3">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-750 stroke-[1.5]" />
          <span className="font-bold">لا يوجد أي إشعارات جديدة في هذا القسم حالياً.</span>
          <p className="text-[10px] text-slate-450 max-w-xs leading-normal mx-auto">سيتم إرسال إشعارات فورية لك حال حدوث أي عملية تطابق فلترة هذا القسم.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all text-right flex gap-3.5 items-start ${
                n.read
                  ? 'bg-slate-50/50 dark:bg-slate-950/25 border-slate-100 dark:border-slate-850/60 opacity-80 hover:opacity-100'
                  : 'bg-amber-500/5 border-amber-500/15 ring-1 ring-amber-500/10'
              }`}
            >
              <div className="p-2.5 rounded-full bg-white dark:bg-slate-950 h-fit border border-slate-100 dark:border-slate-850 shrink-0 shadow-3xs">
                {getIcon(n.type)}
              </div>

              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">{formatTime(n.createdAt)}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                      n.type === 'order' ? 'bg-emerald-500/10 text-emerald-600' :
                      n.type === 'follow' ? 'bg-blue-500/10 text-blue-600' :
                      n.type === 'review' ? 'bg-amber-500/10 text-amber-600' :
                      n.type === 'contribution' ? 'bg-rose-500/10 text-rose-600' :
                      'bg-purple-500/10 text-purple-600'
                    }`}>
                      {getCategoryName(n.type)}
                    </span>
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                      {n.title}
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed pt-0.5">{n.body}</p>
                 {n.title === 'قام التاجر بتأكيد تسليم طلبك' && (() => {
                  const orderId = n.id.startsWith('delivered-') 
                    ? n.id.substring('delivered-'.length) 
                    : (orders.find(o => o.status === 'delivered' && o.buyerId === n.userId)?.id || '');
                  if (!orderId) return null;
                  return (
                    <div className="flex gap-2 mt-3 justify-end">
                      <button
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                        onClick={async (e) => {
                          e.stopPropagation();

                          // Check if they already rated this product in Supabase
                          const order = orders.find(o => o.id === orderId);
                          if (order && currentUser) {
                            try {
                              const { supabaseService, isSupabaseConfigured } = await import('../lib/supabase');
                              if (isSupabaseConfigured) {
                                const exists = await supabaseService.checkProductRatingExists(order.productId, currentUser.id);
                                if (exists) {
                                  alert("لقد قمت بتقييم هذا المنتج سابقاً، شكراً لمشاركتك تجربتك");
                                  return; // Do not open rating window!
                                }
                              }
                            } catch (err) {
                              console.warn('Error checking product rating:', err);
                            }
                          }

                          // 1. Update order status to completed
                          if (onUpdateOrderStatus) {
                            onUpdateOrderStatus(orderId, 'completed');
                          }
                          // 2. Remove this notification
                          if (setNotifications) {
                            setNotifications(prev => prev.filter(item => item.id !== n.id));
                          }
                          // 3. Open simple rating popup
                          setRatingOrderId(orderId);
                          setSellerRating(0);
                          setProductRating(0);
                          setComment('');
                          setRatingError('');
                          setShowRatingSuccess(false);
                        }}
                      >
                        ✅ نعم، استلمت
                      </button>
                      <button
                        className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open cancellation reason modal
                          setCancellationOrderId(orderId);
                          setCancellationReason('');
                          setShowCancellationSuccess(false);
                        }}
                      >
                        ❌ لا، لم أستلم
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingOrderId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={() => setRatingOrderId(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 md:p-6 animate-scale-up space-y-5">
            {showRatingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100 font-sans">شكراً لك على تقييمك.</h3>
                <button
                  onClick={() => setRatingOrderId(null)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer font-sans"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">تقييم الطلب</h3>
                  </div>
                  <button 
                    onClick={() => setRatingOrderId(null)}
                    className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-center space-y-1">
                    <div className="text-amber-500 font-extrabold text-[11px]">🛍️ رسالة ترحيبية من VELORIA</div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                      أهلاً بك في فيلوريا! تقييمك الصادق يساعد في بناء مجتمع تسوق موثوق، ويدعم المشاريع السورية المحلية المتميزة لتحسين جودة خدماتهم ومنتجاتهم.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">⭐ تقييم التاجر</label>
                    <div className="flex gap-1.5 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setSellerRating(star);
                            setRatingError('');
                          }}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= sellerRating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">⭐ تقييم المنتج</label>
                    <div className="flex gap-1.5 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setProductRating(star);
                            setRatingError('');
                          }}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= productRating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">اكتب تعليقاً (اختياري)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="رأيك يهمنا ويساعد الآخرين..."
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-white text-right"
                      rows={3}
                    />
                  </div>

                  {ratingError && (
                    <p className="text-rose-500 text-[10px] font-bold text-center animate-pulse">{ratingError}</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      if (sellerRating === 0 || productRating === 0) {
                        setRatingError("الرجاء اختيار تقييم أولاً.");
                        return;
                      }
                      if (onUpdateOrderStatus) {
                        onUpdateOrderStatus(ratingOrderId, 'completed', {
                          sellerRating,
                          productRating,
                          ratingComment: comment
                        });
                        setShowRatingSuccess(true);
                      }
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    إرسال
                  </button>
                  <button
                    onClick={() => setRatingOrderId(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    تخطي
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancellationOrderId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={() => setCancellationOrderId(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 md:p-6 animate-scale-up space-y-5">
            {showCancellationSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">تم إرسال ملاحظتك بنجاح.</h3>
                <button
                  onClick={() => setCancellationOrderId(null)}
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">ما سبب عدم إتمام العملية؟</h3>
                  </div>
                  <button 
                    onClick={() => setCancellationOrderId(null)}
                    className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">يرجى توضيح سبب عدم استلام المنتج:</label>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="اكتب التفاصيل هنا..."
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 dark:text-white text-right"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      if (!cancellationReason.trim()) return;
                      if (onUpdateOrderStatus && cancellationOrderId) {
                        onUpdateOrderStatus(cancellationOrderId, 'cancelled', {
                          cancellationReason
                        });

                        const order = orders.find(o => o.id === cancellationOrderId);
                        if (order && setNotifications) {
                          const sellerNotif: Notification = {
                            id: `cancel-notif-${Date.now()}`,
                            userId: order.sellerId,
                            type: 'order',
                            title: `إلغاء الطلب لعدم الاستلام`,
                            body: `قام المشتري ${order.buyerName} بإلغاء طلب المنتج "${order.productTitle}" لعدم الاستلام. سبب عدم إتمام العملية: ${cancellationReason}`,
                            createdAt: new Date().toISOString(),
                            read: false
                          };
                          setNotifications(prev => [sellerNotif, ...prev]);
                          // Remove the delivered notification for the buyer
                          setNotifications(prev => prev.filter(item => item.id !== `delivered-${cancellationOrderId}`));
                        }
                        setShowCancellationSuccess(true);
                      }
                    }}
                    disabled={!cancellationReason.trim()}
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    إرسال
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
