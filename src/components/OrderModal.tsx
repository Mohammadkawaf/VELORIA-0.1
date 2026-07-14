import React, { useState } from 'react';
import { Product, User, Order } from '../types';
import { X, ShoppingBag, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  currentUser: User | null;
  seller?: User;
  onConfirmOrder: (orderData: { quantity: number; buyerMessage: string }) => Promise<Order>;
}

export default function OrderModal({
  isOpen,
  onClose,
  product,
  currentUser,
  seller,
  onConfirmOrder
}: OrderModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerMessage, setBuyerMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const sellerProfile = seller;
  console.log("seller =", seller);
  console.log("sellerProfile =", sellerProfile);
  console.log("seller.whatsapp =", seller?.whatsapp);
  console.log("sellerProfile.whatsapp =", sellerProfile?.whatsapp);
  console.log("product.sellerId =", product.sellerId);

  if (!isOpen) return null;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else {
      setQuantity(val);
    }
  };

  const getWhatsAppNumber = () => {
    let num = seller?.whatsapp || seller?.whatsapp_number || '';
    num = num.replace(/\D/g, '');
    if (num.startsWith('00')) num = num.substring(2);
    if (num.startsWith('05') && num.length === 10) {
      num = '966' + num.substring(1);
    }
    return num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerMessage.trim()) return;
    if (!currentUser) {
      setErrorMessage('يجب تسجيل الدخول كعضو أولاً لتتمكن من تقديم طلب.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Save order to the database first
      console.log("1- بدء إنشاء الطلب");
      const createdOrder = await onConfirmOrder({
        quantity,
        buyerMessage: buyerMessage.trim()
      });
      console.log("2- الطلب تم إنشاؤه", createdOrder);

      console.log("3- قبل تحديث حالة المنتج");
      try {
        // No explicit product status update happens inside OrderModal.tsx directly,
        // but wrapping a potential placeholder block inside a try-catch as requested by user.
        console.log("4- بعد تحديث حالة المنتج");
      } catch (error: any) {
        console.error("ERROR =", error);
      }

      setSuccess(true);

      // 2. Format and open WhatsApp message after successful save
      const sellerProfile = seller;
      const sellerWhatsapp = seller?.whatsapp || seller?.whatsapp_number || '';
      console.log("sellerId =", product.sellerId);
      console.log("sellerProfile =", sellerProfile);
      console.log("sellerWhatsapp =", sellerWhatsapp);
      console.log("product.whatsapp =", (product as any).whatsapp);

      const waNum = getWhatsAppNumber();
      if (!waNum) {
        alert('تم حفظ الطلب بنجاح في النظام! ولكن لم يقم التاجر بإضافة رقم واتساب لإرسال الرسالة.');
        onClose();
        return;
      }

      // Generate direct product link
      const productLink = `${window.location.origin}${window.location.pathname}?view=product&productId=${product.id}`;

      // Prioritize order_number over id
      const orderIdentifier = createdOrder?.order_number || createdOrder?.orderNumber || createdOrder?.id;

      // Format WhatsApp message with required bullet points
      const messageText = `طلب شراء جديد من منصة VELORIA 🛒\n\n` +
        `رقم الطلب: #${orderIdentifier}\n` +
        `اسم المنتج: ${product.title}\n` +
        `الكمية: ${quantity}\n` +
        `رسالة المشتري: ${buyerMessage.trim()}\n` +
        `رابط المنتج: ${productLink}`;

      console.log("5- قبل فتح واتساب");
      const waUrlExpr = `https://wa.me/${waNum}?text=${encodeURIComponent(messageText)}`;
      console.log(waUrlExpr);
      const waUrl = waUrlExpr;
      
      // Open WhatsApp directly without setTimeout to reduce chance of popup blocking, and use a bulletproof fallback if blocked
      let opened = false;
      try {
        const popup = window.open(waUrl, '_blank');
        if (popup == null) {
          console.log("Popup Blocked (null returned)");
        } else {
          console.log("Popup Opened successfully");
          try {
            popup.focus();
          } catch (focusErr) {
            console.warn("Could not focus popup window:", focusErr);
          }
          opened = true;
        }
      } catch (e: any) {
        console.error('Popup blocker or environment error on window.open:', e?.message || e);
      }

      if (!opened) {
        // Safe fallback for iframes/popup blockers: navigate directly in current window
        window.location.href = waUrl;
      }
      console.log("6- بعد فتح واتساب");
      onClose();

    } catch (err: any) {
      console.error('Error while submitting order:', err);
      setErrorMessage(err?.message || 'فشل في حفظ الطلب في جدول orders، يرجى المحاولة مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-6 animate-scale-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">تقديم طلب شراء جديد</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Brief Summary */}
        <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800">
          <img 
            src={product.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80'} 
            alt={product.title}
            className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate mb-1">
              {product.title}
            </h4>
            <div className="text-amber-600 dark:text-amber-400 font-extrabold text-xs">
              {product.price} {product.currency || 'ل.س'}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="p-3.5 bg-amber-500/5 text-amber-800 dark:text-amber-400 text-xs rounded-xl border border-amber-500/10 leading-relaxed font-bold">
          أهلاً {currentUser?.name || 'بك'}، بعد الضغط على تأكيد سيتم تسجيل الطلب في منصة VELORIA وإرسال رسالة إلى التاجر عبر واتساب.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity selector */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">الكمية المطلوبة (Quantity):</label>
              <p className="text-[10px] text-slate-400">حدد عدد الوحدات المراد طلبها</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1 || isSubmitting}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isSubmitting}
                min="1"
                className="w-12 text-center text-xs font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleIncrease}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Total proposed price */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">السعر الإجمالي:</span>
            </div>
            <div className="text-amber-600 dark:text-amber-400 font-black text-sm">
              {product.price * quantity} {product.currency || 'ل.س'}
            </div>
          </div>

          {/* Buyer Message (buyer_message) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              رسالة للمشتري (buyer_message) <span className="text-rose-500">*</span>:
            </label>
            <textarea
              required
              disabled={isSubmitting || success}
              value={buyerMessage}
              onChange={(e) => setBuyerMessage(e.target.value)}
              placeholder="مثال: مرحباً، أرغب بشراء هذا المنتج التراثي اليدوي وتوصيله لعنواني في دمشق..."
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[80px] focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 text-rose-600 text-xs rounded-xl border border-rose-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-emerald-500/10 text-emerald-600 text-xs rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2 font-bold animate-pulse">
              <CheckCircle className="w-5 h-5" />
              <span>تم تسجيل طلب الشراء بنجاح! جاري تحويلك لواتساب البائع...</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success || !buyerMessage.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'تأكيد الطلب'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
