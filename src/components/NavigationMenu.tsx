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
      <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-100 dark:border-slate-800 animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
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
        <div className="shrink-0">
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
        </div>

        {/* Links Section */}
        <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
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
                onClick={() => handleLinkClick('categories')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right"
              >
                <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                <span>التصنيفات والاقسام</span>
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

          {settings?.donationEnabled !== false && (
            <>
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
            </>
          )}

          {/* Logout Button (Moved to body as the last element) */}
          {currentUser && (
            <>
              <div className="h-px bg-slate-100 dark:bg-slate-850 my-2" />
              <button 
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-right cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3 shrink-0">
          {/* Social Media Links */}
          {(() => {
            const formatUrl = (url?: string) => {
              if (!url) return '';
              const trimmed = url.trim();
              if (!trimmed) return '';
              if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
              if (trimmed.startsWith('@')) return `https://t.me/${trimmed.substring(1)}`;
              return `https://${trimmed}`;
            };

            const links = [
              { key: 'fb', name: 'Facebook', url: formatUrl(settings?.socialFacebook || settings?.facebookPage), icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              )},
              { key: 'insta', name: 'Instagram', url: formatUrl(settings?.socialInstagram || settings?.instagramPage), icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              )},
              { key: 'tg', name: 'Telegram', url: formatUrl(settings?.socialTelegram || settings?.telegramLink), icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1 .54-1.43.53-.47-.01-1.37-.27-2.04-.49-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.99-1.73 6.66-2.87 8.01-3.43 3.81-1.58 4.6-1.86 5.12-1.87.11 0 .37.03.54.17.14.12.18.28.2.4.02.07.03.22.01.35z"/></svg>
              )},
              { key: 'yt', name: 'Youtube', url: formatUrl(settings?.socialYoutube), icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              )},
              { key: 'tt', name: 'TikTok', url: formatUrl(settings?.socialTiktok), icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.31 1.56-1.28 2.55.02.83.43 1.64 1.11 2.1.84.58 1.97.62 2.87.16.81-.4 1.37-1.22 1.47-2.12.08-2.86.04-5.73.04-8.59V.02z"/></svg>
              )},
              { key: 'x', name: 'X', url: formatUrl(settings?.socialX), icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              )}
            ].filter(item => Boolean(item.url));

            if (links.length === 0) return null;

            return (
              <div className="flex items-center justify-center gap-2 pt-1 pb-1">
                {links.map(item => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.name}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all cursor-pointer shadow-2xs"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            );
          })()}

          <p className="text-[9px] text-slate-400 text-center leading-normal">
            منصة فيلوريا المفتوحة 👑 جميع الحقوق محفوظة © ٢٠٢٦
          </p>
        </div>
      </div>
    </div>
  );
}
