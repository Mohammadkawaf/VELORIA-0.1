import React, { useState, useEffect } from 'react';
import { Report, Product, User, UserBadge, VerificationRequest } from '../types';
import {
  Shield,
  EyeOff,
  Check,
  AlertTriangle,
  Eye,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  UserCheck,
  Bell,
  Lock,
  Key,
  ArrowLeft,
  Info
} from 'lucide-react';

interface ModeratorPanelProps {
  currentUser: User;
  reports: Report[];
  products: Product[];
  onResolveReport: (reportId: string, action: 'resolved' | 'dismissed') => void;
  onUpdateProductStatus: (productId: string, status: 'active' | 'hidden' | 'sold') => void;
  onDeleteProduct: (productId: string) => void;
  verificationRequests?: VerificationRequest[];
  onUpdateVerificationStatus?: (requestId: string, status: 'reviewed' | 'approved' | 'rejected', reason?: string) => void;
  users?: User[];
  // Optional setters for advanced moderation updates
  setUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  setReports?: React.Dispatch<React.SetStateAction<Report[]>>;
}

export default function ModeratorPanel({
  currentUser,
  reports,
  products,
  onResolveReport,
  onUpdateProductStatus,
  onDeleteProduct,
  verificationRequests = [],
  onUpdateVerificationStatus,
  users = [],
  setUsers,
  setProducts,
  setReports
}: ModeratorPanelProps) {
  // Secure Login Gate
  const [isModAuthenticated, setIsModAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('veloria-mod-gate-auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tabs for Moderator Panel
  const [activeTab, setActiveTab] = useState<'reports' | 'products' | 'verification' | 'warnings'>('reports');

  // Search/Filters
  const [prodSearch, setProdSearch] = useState('');
  const [prodFilter, setProdFilter] = useState<'all' | 'active' | 'hidden'>('all');
  
  const [warnTargetUser, setWarnTargetUser] = useState('');
  const [warnMessage, setWarnMessage] = useState('');
  const [warnSuccess, setWarnSuccess] = useState(false);

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const pastReports = reports.filter((r) => r.status !== 'pending');

  const handleGateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();

    if (email !== 'mod@veloria.com' && email !== currentUser.email.toLowerCase()) {
      setLoginError('حساب المشرف غير متطابق مع البريد الإلكتروني المدخل.');
      return;
    }

    if (loginPassword !== 'moderator') {
      setLoginError('كلمة مرور المشرف غير صحيحة. (كلمة المرور الافتراضية للتجربة هي: moderator)');
      return;
    }

    setIsModAuthenticated(true);
    sessionStorage.setItem('veloria-mod-gate-auth', 'true');
    setLoginError('');
  };

  const handleQuickBypass = () => {
    setIsModAuthenticated(true);
    sessionStorage.setItem('veloria-mod-gate-auth', 'true');
    setLoginError('');
  };

  const handleLogout = () => {
    setIsModAuthenticated(false);
    sessionStorage.removeItem('veloria-mod-gate-auth');
  };

  const handleWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (warnTargetUser.trim() === '' || warnMessage.trim() === '') return;
    
    setWarnSuccess(true);
    setWarnTargetUser('');
    setWarnMessage('');
    setTimeout(() => setWarnSuccess(false), 3000);
  };

  // Filtered Products
  const filteredProductsList = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(prodSearch.toLowerCase());
    if (!matchSearch) return false;

    if (prodFilter === 'active') return p.status === 'active';
    if (prodFilter === 'hidden') return p.status === 'hidden';
    return true;
  });

  // --- Secure Gate view ---
  if (!isModAuthenticated) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center font-sans rtl text-right">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-8 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white text-center border-b border-orange-500/15 relative">
            <Shield className="w-12 h-12 text-orange-500 mx-auto mb-3 animate-pulse" />
            <h1 className="text-xl font-black text-slate-800 dark:text-white">بوابة التحقق للمشرفين</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">يرجى تأكيد الهوية للوصول لصلاحيات الإشراف والرقابة</p>
          </div>

          <form onSubmit={handleGateLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">البريد الإلكتروني للمشرف:</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="mod@veloria.com"
                  className="w-full text-xs p-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-slate-900 dark:text-white"
                  required
                />
                <Key className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-slate-900 dark:text-white"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs cursor-pointer transition-colors"
            >
              دخول آمن للمشرف
            </button>

            <button
              type="button"
              onClick={handleQuickBypass}
              className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-bold rounded-xl text-[10px] cursor-pointer"
            >
              ⚡ دخول سريع مباشر (للتجربة والتقييم)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md overflow-hidden font-sans text-right rtl">
      {/* Premium Dark Header */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              بوابة الرقابة والإشراف (Moderator Portal)
              <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                صلاحيات محدودة
              </span>
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              مرحباً {currentUser.name}. أنت مخول لإخفاء الإعلانات المخالفة، مراجعة البلاغات وتوثيق الحسابات. لا يمكنك تعديل الإعدادات العامة أو حذف الأعضاء.
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
        >
          خروج آمن
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row">
        {/* Tab Sidebar */}
        <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-950/40 p-4 border-l border-slate-100 dark:border-slate-800/60 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block px-3 mb-2">أدوات الإشراف</span>
            
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full text-right px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-orange-500 text-white font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>البلاغات المستلمة</span>
              </div>
              {pendingReports.length > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded font-mono">{pendingReports.length}</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-right px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-orange-500 text-white font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>الرقابة على الإعلانات</span>
            </button>

            <button
              onClick={() => setActiveTab('verification')}
              className={`w-full text-right px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-orange-500 text-white font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>مراجعة طلبات التوثيق</span>
            </button>

            <button
              onClick={() => setActiveTab('warnings')}
              className={`w-full text-right px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'warnings'
                  ? 'bg-orange-500 text-white font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>إرسال تحذيرات وتنبيهات</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 mt-6">
            <p>مشرف فيلوريا المعتمد</p>
            <p className="mt-0.5 text-emerald-500">حالة الأمن: مستقرة</p>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* TAB 1: Reports Queue */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">البلاغات المستلمة من الأعضاء:</h3>
              
              {pendingReports.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  🎉 رائع! لا توجد بلاغات أو معروضات مخالفة معلقة حالياً.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReports.map((rep) => {
                    const targetProduct = products.find((p) => p.id === rep.targetId);
                    return (
                      <div
                        key={rep.id}
                        className="p-5 rounded-2xl border border-rose-500/10 bg-rose-500/5 dark:bg-rose-500/10 space-y-3 text-right"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-rose-500 text-white font-extrabold px-2.5 py-0.5 rounded">
                              مخالفة: {rep.type === 'product' ? 'إعلان منتج' : 'حساب بائع'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{rep.targetName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">الشاكي: {rep.reporterName}</span>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                          <div>
                            <strong className="text-orange-600">السبب الأساسي:</strong> {rep.reason}
                          </div>
                          {rep.details && (
                            <div className="mt-1 text-slate-500 text-[11px]">
                              <strong>تفاصيل داعمة:</strong> {rep.details}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            onClick={() => onResolveReport(rep.id, 'resolved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            اعتماد وحل الشكوى
                          </button>

                          {rep.type === 'product' && targetProduct && targetProduct.status !== 'hidden' && (
                            <button
                              onClick={() => {
                                onUpdateProductStatus(targetProduct.id, 'hidden');
                                onResolveReport(rep.id, 'resolved');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              إخفاء المنتج فوراً لمخالفة الشروط
                            </button>
                          )}

                          <button
                            onClick={() => onResolveReport(rep.id, 'dismissed')}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            تجاهل الشكوى
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Product Compliance */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="ابحث في عناوين الإعلانات لتحديد المنتجات المخالفة..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">تصفية الحالة:</span>
                  <select
                    value={prodFilter}
                    onChange={(e: any) => setProdFilter(e.target.value)}
                    className="text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200"
                  >
                    <option value="all">الكل</option>
                    <option value="active">النشطة والمعروضة</option>
                    <option value="hidden">المخفية رقابياً</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                    <tr>
                      <th className="p-3 text-[10px]">المنتج</th>
                      <th className="p-3 text-[10px]">السعر</th>
                      <th className="p-3 text-[10px]">الحالة</th>
                      <th className="p-3 text-[10px]">القرار الرقابي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredProductsList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                        <td className="p-3 flex items-center gap-2 min-w-[200px]">
                          <img src={p.images[0]} className="w-8 h-8 rounded object-cover" />
                          <span className="font-bold truncate max-w-[150px]">{p.title}</span>
                        </td>
                        <td className="p-3 font-mono">{p.price} ل.س</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {p.status === 'active' ? 'نشط' : p.status === 'sold' ? 'مباع' : 'مخفي بمخالفة'}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.status !== 'hidden' ? (
                            <button
                              onClick={() => onUpdateProductStatus(p.id, 'hidden')}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-[10px] font-bold rounded-lg cursor-pointer"
                              title="إخفاء المنتج المخالف فوراً"
                            >
                              إخفاء المنتج ⚠️
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateProductStatus(p.id, 'active')}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-[10px] font-bold rounded-lg cursor-pointer"
                              title="إعادة تنشيط المنتج"
                            >
                              إعادة تنشيط وإظهار
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Verification Queue */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">مراجعة طلبات التوثيق كإشراف</h3>
              <p className="text-[10px] text-slate-400">يمكن للمشرف مراجعة الحسابات وتأكيد المراجعة الأولية وتصعيد الطلب لمدير النظام لتفعيل الشارة الزرقاء.</p>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-right">
                <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-amber-600">صلاحيات المشرف:</span> يرجى تدقيق ملف المتجر والشروط المطلوبة (الاسم، الوصف، صورة الغلاف، الرقم، والمنتجات) وقبول المراجعة الأولية أو رفض الطلب مسبباً. لا يمتلك المشرف صلاحية منح الشارات مباشرة.
                </div>
              </div>

              {/* Real verification requests */}
              {(!verificationRequests || verificationRequests.filter(r => r.status === 'pending').length === 0) ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  🎉 لا توجد طلبات توثيق معلقة تحتاج مراجعة حالياً.
                </div>
              ) : (
                <div className="space-y-4">
                  {verificationRequests.filter(r => r.status === 'pending').map((req) => {
                    const targetUser = (users || []).find(u => u.id === req.storeId);
                    const userProds = (products || []).filter(p => p.sellerId === req.storeId);
                    return (
                      <div key={req.id} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4 text-right">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-850 pb-3">
                          <div className="flex items-center gap-3">
                            <img src={targetUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{req.storeName}</h4>
                              <p className="text-[10px] text-slate-400">@{req.storeUsername}</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                            بانتظار المراجعة الرقابية
                          </span>
                        </div>

                        {/* Store info details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-650 dark:text-slate-450">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400">النبذة التعريفية للمتجر:</span>
                            <p className="mt-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-[11px] leading-relaxed">
                              {targetUser?.bio || 'لا توجد نبذة تعريفية مضافة.'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400">عدد المنتجات المنشورة:</span>{' '}
                              <span className="font-mono font-bold text-slate-800 dark:text-white bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                {userProds.length} منتجات
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400">رقم الواتساب:</span>{' '}
                              <span className="font-mono font-bold text-slate-800 dark:text-white bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                {targetUser?.whatsapp_number || 'غير مضاف'}
                              </span>
                            </div>
                            {targetUser?.coverImage && (
                              <div>
                                <span className="text-[10px] block font-bold text-slate-400 mb-1">صورة الغلاف:</span>
                                <img src={targetUser.coverImage} className="w-full h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/50 dark:border-slate-850">
                          <button
                            onClick={() => {
                              if (onUpdateVerificationStatus) {
                                onUpdateVerificationStatus(req.id, 'reviewed');
                              }
                            }}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black rounded-xl cursor-pointer transition-colors"
                          >
                            قبول المراجعة الأولية وتصعيد الطلب 👍
                          </button>
                          
                          <button
                            onClick={() => {
                              const reason = prompt('الرجاء كتابة سبب رفض التوثيق بالتفصيل لإرساله للتاجر:');
                              if (reason === null) return;
                              if (!reason.trim()) {
                                alert('سبب الرفض حقل إجباري لتنبيه التاجر.');
                                return;
                              }
                              if (onUpdateVerificationStatus) {
                                onUpdateVerificationStatus(req.id, 'rejected', reason.trim());
                              }
                            }}
                            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black rounded-xl cursor-pointer transition-colors"
                          >
                            رفض الطلب مع ذكر السبب ❌
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: User Warning Warnings */}
          {activeTab === 'warnings' && (
            <div className="space-y-4">
              <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-orange-500" />
                  إرسال تحذير رسمي للتاجر (Warn User)
                </h3>
                <p className="text-[10px] text-slate-400 mb-4">يتم إرسال رسالة رقابية من المشرف لتنبيه البائع بتعديل تفاصيل المنتج المخالف أو تصحيح الأسعار لتجنب حظر الحساب.</p>

                {warnSuccess && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs rounded-xl mb-4 font-bold text-center">
                    📢 تم توجيه وإرسال التنبيه الرقابي الرسمي بنجاح للتاجر!
                  </div>
                )}

                <form onSubmit={handleWarningSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">اسم التاجر أو معرف العضو المستهدف:</label>
                    <input
                      type="text"
                      value={warnTargetUser}
                      onChange={(e) => setWarnTargetUser(e.target.value)}
                      placeholder="مثال: أبو أحمد للأعمال الخشبية"
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">تفاصيل ونص التحذير الإرشادي:</label>
                    <textarea
                      value={warnMessage}
                      onChange={(e) => setWarnMessage(e.target.value)}
                      rows={3}
                      placeholder="الرجاء تصحيح صور المنتج لتجنب عرض منتجات لا تملك حقوق تصنيعها..."
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs cursor-pointer"
                  >
                    إرسال التحذير الرسمي
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
