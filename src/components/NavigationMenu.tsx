import React from 'react';
import { User, AppSettings } from '../types';
import { 
  X, Home, Layers, Store, LogIn, UserPlus, FileText, ShieldAlert, 
  User as UserIcon, PlusCircle, ShoppingBag, Heart, Users, Bell, LogOut, Settings, Mail 
} from 'lucide-react';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate: (view: 'market' | 'categories' | 'shops' | 'profile' | 'add-product' | 'orders' | 'favorites' | 'following' | 'notifications' | 'login' | 'register' | 'legal' | 'settings' | 'contact') => void;
  onLogout: () => void;
  onOpenContribution: () => void;
  settings?: AppSettings;
}

export default function NavigationMenu({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
  onLogout,
  onOpenContribution,
  settings
}: NavigationMenuProps) {
  if (!isOpen) return null;

  const handleLinkClick = (view: any) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-start font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-r border-slate-100 dark:border-slate-800 animate-slide-in-right">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <span className="text-lg font-black text-amber-500 flex items-center gap-1.5">
              {settings?.platformLogo && (settings.platformLogo.startsWith('data:image/') || settings.platformLogo.startsWith('http') || settings.platformLogo.includes('/')) ? (
                <img 
                  src={settings.platformLogo} 
                  alt={settings?.platformName || 'Logo'} 
                  className="w-6 h-6 object-contain rounded-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xl">{settings?.platformLogo || '🛍️'}</span>
              )}
              <span>{(settings?.platformName || 'VELORIA').toUpperCase()} MENU</span>
            </span>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Info Capsule */}
          {currentUser ? (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-amber-500/5">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-full object-cover border border-amber-500/20" />
              <div className="overflow-hidden">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-[8px] px-1.5 py-0.5 rounded">
                  {currentUser.role === 'admin' ? 'مدير النظام' : currentUser.role === 'moderator' ? 'مشرف محتوى' : 'تاجر / عضو'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                أهلاً بك زائرنا الكريم في سوق {settings?.platformName || 'فيلوريا'} الحر! سجل دخولك الآن لتتمكن من التفاعل والمراسلة وطلب المنتجات.
              </p>
            </div>
          )}

          {/* Links Section */}
          <div className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {!currentUser ? (
              /* Visitor Links */
              <>
                <button 
                  onClick={() => handleLinkClick('market')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Home className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>الرئيسية (تصفح الإعلانات)</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('categories')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>التصنيفات والاقسام</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('shops')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Store className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>دليل المتاجر والشركاء</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-850 my-2" />

                <button 
                  onClick={() => handleLinkClick('login')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-amber-600 hover:bg-amber-500/10 transition-colors text-right"
                >
                  <LogIn className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>تسجيل الدخول</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('register')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>إنشاء حساب جديد</span>
                </button>
              </>
            ) : (
              /* Registered User Links */
              <>
                <button 
                  onClick={() => handleLinkClick('market')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Home className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>الرئيسية</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('profile')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>ملفي الشخصي والمتجر</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('add-product')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>إضافة منتج جديد</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('orders')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>طلبات الشراء (الواردة والصادرة)</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('favorites')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>المنتجات المفضلة</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('following')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>المتاجر التي أتابعها</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('notifications')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>صندوق الإشعارات</span>
                </button>

                <button 
                  onClick={() => handleLinkClick('shops')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
                >
                  <Store className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>دليل كافة المتاجر</span>
                </button>
              </>
            )}

            <div className="h-px bg-slate-100 dark:bg-slate-850 my-2" />

            <button 
              onClick={() => handleLinkClick('settings')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>إعدادات المنصة والحساب</span>
            </button>

            <button 
              onClick={() => handleLinkClick('contact')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
            >
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>اتصل بنا</span>
            </button>

            {/* Legal Pages */}
            <button 
              onClick={() => handleLinkClick('legal')}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>الشروط والأحكام & الخصوصية</span>
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-850 my-2" />

            <button 
              onClick={() => {
                onOpenContribution();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-right cursor-pointer"
            >
              <span className="text-emerald-500 shrink-0">💚</span>
              <span>المساهمة ودعم فيلوريا</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          {currentUser ? (
            <button 
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          ) : (
            <p className="text-[9px] text-slate-400 text-center leading-normal">
              منصة فيلوريا المفتوحة 👑 جميع الحقوق محفوظة © ٢٠٢٦
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
