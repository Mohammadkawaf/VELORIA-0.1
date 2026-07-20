import React, { useState } from 'react';
import { Product, User, Category, Order, UserBadge } from '../types';
import { PlusCircle, ShoppingBag, Eye, EyeOff, CheckCircle, XCircle, Store, Sliders, Palette, Link, Image as ImageIcon } from 'lucide-react';
import AddProductView from './AddProductView';
import EditProductView from './EditProductView';

interface SellerDashboardProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  products: Product[];
  categories: Category[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'sellerId' | 'rating' | 'reviewsCount'>) => Promise<any> | void;
  onUpdateProductStatus: (productId: string, status: 'active' | 'hidden' | 'sold' | 'expired') => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateProduct: (product: Product) => void;
}

export default function SellerDashboard({
  currentUser,
  onUpdateUser,
  products,
  categories,
  orders,
  onAddProduct,
  onUpdateProductStatus,
  onDeleteProduct,
  onUpdateOrderStatus,
  onUpdateProduct
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'add-product' | 'my-products' | 'orders' | 'custom-shop'>('my-products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Legacy state removed

  // Custom shop customization states
  const [primaryColor, setPrimaryColor] = useState(currentUser.premiumConfig?.primaryColor || '#b45309');
  const [coverImage, setCoverImage] = useState(currentUser.premiumConfig?.coverImage || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&h=300&q=80');
  const [logo, setLogo] = useState(currentUser.premiumConfig?.logo || '🏪');
  const [customSlug, setCustomSlug] = useState(currentUser.premiumConfig?.customSlug || 'my-shop');
  const [avatarBorder, setAvatarBorder] = useState(currentUser.premiumConfig?.avatarBorder || 'ring-4 ring-amber-500 ring-offset-2');
  const [shopSaveSuccess, setShopSaveSuccess] = useState(false);

  // Filter products owned by this seller
  const myProducts = products.filter((p) => p.sellerId === currentUser.id);

  // Filter orders on products owned by this seller
  const myOrders = orders.filter((o) => o.sellerId === currentUser.id);

  // Legacy handleCreateProduct removed

  const handleSaveShopConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      isPremium: true,
      premiumConfig: {
        primaryColor,
        coverImage,
        logo,
        avatarBorder,
        customSlug
      }
    });
    setShopSaveSuccess(true);
    setTimeout(() => setShopSaveSuccess(false), 3000);
  };

  const simulateUpgradeToPremium = () => {
    onUpdateUser({
      ...currentUser,
      isPremium: true,
      premiumConfig: {
        primaryColor: '#b45309',
        coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&h=300&q=80',
        logo: '🏬',
        avatarBorder: 'ring-4 ring-amber-500 ring-offset-2',
        customSlug: 'my-custom-shop'
      }
    });
    setActiveTab('custom-shop');
  };

  if (editingProduct) {
    return (
      <EditProductView
        product={editingProduct}
        categories={categories}
        onCancel={() => setEditingProduct(null)}
        onSave={(updatedProduct) => {
          onUpdateProduct(updatedProduct);
          setEditingProduct(null);
        }}
        onDelete={() => {
          onDeleteProduct(editingProduct.id);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md overflow-hidden font-sans">
      {/* Dashboard Top Banner */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className={`w-14 h-14 rounded-full object-cover ${currentUser.premiumConfig?.avatarBorder || ''}`}
            />
            {currentUser.isPremium && (
              <span className="absolute -bottom-1 -right-1 text-base bg-amber-500 rounded-full p-0.5">🌟</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold">{currentUser.name}</h2>
              {currentUser.isPremium && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/20">
                  متجر ذهبي مخصص
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.bio || 'تعديل بيانات المحل والمنتجات متاح من هنا.'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <div className="text-amber-500 font-black text-sm">{myProducts.length}</div>
            <div className="text-[10px] text-slate-400">منتجات معروضة</div>
          </div>
          <div className="text-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <div className="text-emerald-500 font-black text-sm">{myOrders.length}</div>
            <div className="text-[10px] text-slate-400">طلبات واردة</div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs bar */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-850">
        <button
          onClick={() => setActiveTab('my-products')}
          className={`flex-1 md:flex-none px-6 py-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'my-products'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          منتجاتي المعروضة ({myProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('add-product')}
          className={`flex-1 md:flex-none px-6 py-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'add-product'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          إضافة منتج جديد +
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 md:flex-none px-6 py-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          الطلبات الواردة ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('custom-shop')}
          className={`flex-1 md:flex-none px-6 py-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'custom-shop'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          تخصيص المتجر ✨
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-6 min-h-[400px]">
        {/* Tab 1: My Products list */}
        {activeTab === 'my-products' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mb-3">قائمة منتجاتك الحالية:</h3>
            {myProducts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                لا تعرض أي منتجات حالياً. انقر على "إضافة منتج جديد" لعرض أول منتجاتك مجاناً!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myProducts.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-850/20">
                    <img src={p.images[0]} alt={p.title} className="w-16 h-16 object-cover rounded-xl" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{p.title}</h4>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mt-1">{p.price} ل.س</p>
                      </div>

                      {/* Status select/actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400">الحالة:</span>
                        <button
                          onClick={() => onUpdateProductStatus(p.id, 'active')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                            p.status === 'active'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          معروض
                        </button>
                        <button
                          onClick={() => onUpdateProductStatus(p.id, 'sold')}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                            p.status === 'sold'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          تم البيع
                        </button>
                        <button
                          onClick={() => {
                            console.log("Hide button clicked");
                            console.log("calling handleUpdateProductStatus");
                            onUpdateProductStatus(p.id, 'hidden');
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                            p.status === 'hidden'
                              ? 'bg-slate-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          مخفي
                        </button>

                        <button
                          onClick={() => setEditingProduct(p)}
                          className="mr-auto text-[9px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-bold cursor-pointer flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-1 rounded"
                        >
                          تعديل الإعلان ✏️
                        </button>

                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="text-[9px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded"
                        >
                          حذف
                        </button>

                        {p.status === 'expired' && (
                          <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] bg-rose-500/10 text-rose-500 font-extrabold px-1.5 py-0.5 rounded">
                              منتهي الصلاحية (مضى 90 يوماً) ⚠️
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateProductStatus(p.id, 'active')}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all"
                              title="تجديد النشر لمدة 90 يوماً إضافية"
                            >
                              تجديد النشر 🔄
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Add Product Form */}
        {activeTab === 'add-product' && (
          <div className="p-4">
            <AddProductView
              categories={categories}
              currentUser={currentUser}
              onAddProduct={(productData) => {
                onAddProduct(productData);
                setActiveTab('my-products');
              }}
            />
          </div>
        )}

        {/* Tab 3: Orders received */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">طلبات الشراء المستلمة من المشترين:</h3>
            {myOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                لم تتلق أي طلبات شراء على منتجاتك بعد. بمجرد أن يقدم مشترٍ طلباً، سيظهر هنا مع نوتاته!
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={ord.productImage} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{ord.productTitle}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span>المشتري: <strong className="text-slate-700 dark:text-slate-300">{ord.buyerName}</strong></span>
                          <span>•</span>
                          <span>الكمية: <strong>{ord.quantity}</strong></span>
                          <span>•</span>
                          <span>الإجمالي: <strong className="text-amber-600 font-extrabold">{ord.price * ord.quantity} ل.س</strong></span>
                        </div>
                        {ord.notes && (
                          <p className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded mt-1.5 italic">
                            💬 نوتة المشتري: {ord.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order action status */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <span className="text-[10px] text-slate-400">حالة الطلب:</span>
                      {ord.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'accepted')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            قبول الطلب
                          </button>
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'rejected')}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            رفض
                          </button>
                        </>
                      ) : ord.status === 'accepted' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                            تم قبول الطلب 👍
                          </span>
                          <button
                            onClick={() => onUpdateOrderStatus(ord.id, 'delivered')}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            🚚 تم تسليم الطلب
                          </button>
                        </div>
                      ) : ord.status === 'delivered' ? (
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                          تم التسليم بواسطة التاجر 📦
                        </span>
                      ) : ord.status === 'completed' ? (
                        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          أكد المشتري الاستلام ✓
                        </span>
                      ) : ord.status === 'rejected' ? (
                        <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                          تم رفض الطلب ❌
                        </span>
                      ) : ord.status === 'contacted' ? (
                        <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                          تم التواصل 📞
                        </span>
                      ) : ord.status === 'processing' ? (
                        <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded">
                          قيد التجهيز ⚙️
                        </span>
                      ) : ord.status === 'ready' ? (
                        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                          جاهز للاستلام 📦
                        </span>
                      ) : ord.status === 'cancelled' ? (
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-500/10 px-2 py-0.5 rounded">
                          ملغي 🗑️
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-500/10 px-2 py-0.5 rounded">
                          {ord.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Custom shop customization (Future paid service premium simulator) */}
        {activeTab === 'custom-shop' && (
          <div>
            {!currentUser.isPremium ? (
              <div className="p-8 text-center bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/30 max-w-xl mx-auto space-y-4">
                <Store className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">ميزة المتجر المخصص (خدمة مدفوعة مستقبلية)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  تتيح لك هذه الميزة الحصرية تزيين متجرك بصورة غلاف مخصصة وشعار ووسم برابط فريد ودرجات ألوان وهوية متميزة تعزز من سمعتك وجذب زوارك دون التأثير على عدالة الظهور للمشاريع الصغيرة.
                </p>
                <button
                  type="button"
                  onClick={simulateUpgradeToPremium}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer"
                >
                  تفعيل تجربة المتجر المخصص مجاناً الآن ✨
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveShopConfig} className="max-w-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">محرر هوية وتخصيص المتجر المتميز:</h3>
                </div>

                {shopSaveSuccess && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 text-xs rounded-xl text-center">
                    🎉 تم حفظ وتطبيق هوية متجرك المخصصة بنجاح! شاهد الإعلانات لترى الغلاف والهوية الجديدة.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">رابط خاص فريد (Slug):</label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2">
                      <span className="text-[10px] text-slate-400">veloria.com/</span>
                      <input
                        type="text"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value)}
                        className="flex-1 text-xs p-2 bg-transparent border-0 focus:ring-0 outline-hidden font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">أيقونة المتجر المميزة (رمز تعبيري Emoji):</label>
                    <input
                      type="text"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="🏪"
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">اللون الأساسي للهوية والبرواز:</label>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">تأثير إطار الصورة الشخصية:</label>
                    <select
                      value={avatarBorder}
                      onChange={(e) => setAvatarBorder(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <option value="ring-4 ring-amber-500 ring-offset-2">إطار ذهبي ناري 🌟</option>
                      <option value="ring-4 ring-blue-600 ring-offset-2">إطار كحلي رسمي 🏪</option>
                      <option value="ring-4 ring-emerald-500 ring-offset-2">إطار أخضر موثق ✔️</option>
                      <option value="ring-0">بدون إطار</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">رابط صورة غلاف المتجر الخاصة:</label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  حفظ وتطبيق هوية المتجر المخصصة
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
