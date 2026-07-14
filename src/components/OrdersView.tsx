import React, { useState } from 'react';
import { Order, User } from '../types';
import { ShoppingBag, ArrowUpRight, ArrowDownLeft, CheckCircle2, RefreshCw, Eye, MessageCircle, AlertCircle, Clock } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  currentUser: User | null;
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onStartChat: (userId: string) => void;
}

export default function OrdersView({
  orders,
  currentUser,
  onUpdateOrderStatus,
  onStartChat
}: OrdersViewProps) {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md font-sans text-right space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">يرجى تسجيل الدخول أولاً</h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          يتعين عليك تسجيل الدخول بحساب بائع أو مشترٍ لتتمكن من تتبع طلباتك، فحص الطلبات الواردة لورشك، وتحديث حالات البيع.
        </p>
      </div>
    );
  }

  // Outgoing orders (I am the buyer)
  const outgoingOrders = orders.filter((o) => o.buyerId === currentUser.id);
  // Incoming orders (I am the seller)
  const incomingOrders = orders.filter((o) => o.sellerId === currentUser.id);

  const translateStatus = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { text: 'بانتظار رد التاجر ⏳', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20' };
      case 'accepted':
        return { text: 'تم قبول الطلب 👍', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-450 border border-blue-500/20' };
      case 'rejected':
        return { text: 'تم رفض الطلب ❌', color: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' };
      case 'delivered':
        return { text: 'تم التسليم بواسطة التاجر 📦', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' };
      case 'completed':
        return { text: 'أكد المشتري الاستلام ✓', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
      case 'cancelled':
        return { text: 'ملغي 🗑️', color: 'bg-slate-500/10 text-slate-500 border border-slate-500/20' };
      case 'contacted':
        return { text: 'تم التواصل 📞', color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' };
      case 'processing':
        return { text: 'قيد التجهيز ⚙️', color: 'bg-blue-500/10 text-blue-600 border border-blue-500/20' };
      case 'ready':
        return { text: 'جاهز للاستلام 📦', color: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-700' };
    }
  };

  const renderOrderCard = (order: Order, type: 'incoming' | 'outgoing') => {
    const statusMeta = translateStatus(order.status);
    const orderPartnerName = type === 'incoming' ? order.buyerName : order.sellerName;
    const orderPartnerId = type === 'incoming' ? order.buyerId : order.sellerId;

    return (
      <div 
        key={order.id} 
        className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-amber-500/20 transition-all shadow-2xs flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-right"
      >
        <div className="flex gap-4 items-start md:items-center">
          {/* Product Image preview */}
          <img 
            src={order.productImage} 
            className="w-16 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0" 
          />

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                {statusMeta.text}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">رقم الطلب: #{order.id.split('-')[1] || order.id}</span>
            </div>

            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 leading-tight">
              {order.productTitle}
            </h4>

            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
              <span>السعر الإجمالي: <strong className="text-amber-600 dark:text-amber-400">{order.price * order.quantity} ل.س</strong></span>
              <span>•</span>
              <span>الكمية: {order.quantity}</span>
              <span>•</span>
              <span>{type === 'incoming' ? 'المشتري:' : 'البائع:'} <strong className="text-slate-700 dark:text-slate-300">{orderPartnerName}</strong></span>
            </div>

            {order.notes && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850/60 max-w-lg leading-relaxed">
                <span className="font-black text-amber-600 dark:text-amber-450 text-[9px] block mb-0.5">ملاحظات الطلب الخاصة:</span>
                {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Actions Panel */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-850/60 pt-3 md:pt-0">
          
          {/* Chat with buyer/seller */}
          <button
            onClick={() => onStartChat(orderPartnerId)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>مراسلة الطرف الآخر</span>
          </button>

          {/* Action buttons based on lifecycle */}
          <div className="flex gap-1.5 w-full sm:w-auto">
            {type === 'incoming' && (
              <>
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'accepted')}
                      className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer"
                    >
                      قبول الطلب 👍
                    </button>
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'rejected')}
                      className="flex-1 sm:flex-initial bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer"
                    >
                      رفض الطلب ❌
                    </button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <button
                    onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                    className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer"
                  >
                    🚚 تم تسليم الطلب
                  </button>
                )}
              </>
            )}

            {type === 'outgoing' && order.status === 'delivered' && (
              <button
                onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer"
              >
                تأكيد استلام الطلب ✓
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-right">
      {/* Top Banner */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 justify-end">
          <span className="text-[9px] uppercase font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            تتبع مبيعاتك ومشترياتك
          </span>
          <ShoppingBag className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-black leading-tight text-slate-800 dark:text-white">إدارة طلبات الشراء والعروض الفورية</h2>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-xl leading-normal mt-1">
          بصفتك وسيطاً دليلاً، تمكنك هذه الشاشة من متابعة طلبات المنتجات التي أرسلتها للتجار، أو طلبات الشراء التي وردتك من الزوار على منتجات ورشتك.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'outgoing'
              ? 'border-amber-500 text-amber-650 dark:text-amber-450 font-black bg-slate-50 dark:bg-slate-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            طلبات الشراء الصادرة مني ({outgoingOrders.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'incoming'
              ? 'border-amber-500 text-amber-650 dark:text-amber-450 font-black bg-slate-50 dark:bg-slate-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            الطلبات الواردة لمنتجاتي ({incomingOrders.length})
          </span>
        </button>
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {activeTab === 'outgoing' ? (
          outgoingOrders.length > 0 ? (
            outgoingOrders.map((order) => renderOrderCard(order, 'outgoing'))
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-slate-400 text-xs">
              لم تقم بإرسال أي طلبات شراء للتجار بعد. تصفح المعروضات واضغط على "اطلب الآن" للبدء!
            </div>
          )
        ) : (
          incomingOrders.length > 0 ? (
            incomingOrders.map((order) => renderOrderCard(order, 'incoming'))
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl text-slate-400 text-xs">
              لم تردك أي طلبات شراء لمنتجاتك بعد. احرص على تحسين صور إعلاناتك وتقديم أسعار عادلة ومناسبة لزيادة مبيعاتك.
            </div>
          )
        )}
      </div>
    </div>
  );
}
