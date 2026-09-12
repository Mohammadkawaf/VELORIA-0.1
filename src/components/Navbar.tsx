import { Category, User, Order, AppSettings } from '../types';
import { Search, Moon, Sun, Bell, Store, Heart, Menu, ArrowRight, LogIn } from 'lucide-react';
import Icon from './Icons';

interface NavbarProps {
  currentUser: User | null;
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  orders: Order[];
  onOpenSellerDashboard: () => void;
  favoritesCount: number;
  onShowFavoritesOnly: (show: boolean) => void;
  showFavoritesOnly: boolean;
  onOpenMenu: () => void;
  settings?: AppSettings;
  showSearchAndCategories?: boolean;
  canGoBack?: boolean;
  onNavigateBack?: () => void;
  onNavigateToLogin?: () => void;
}

export default function Navbar({
  currentUser,
  categories,
  activeCategoryId,
  onSelectCategory,
  searchTerm,
  onSearchChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenNotifications,
  unreadNotificationsCount,
  orders,
  onOpenSellerDashboard,
  favoritesCount,
  onShowFavoritesOnly,
  showFavoritesOnly,
  onOpenMenu,
  settings,
  showSearchAndCategories = true,
  canGoBack,
  onNavigateBack,
  onNavigateToLogin
}: NavbarProps) {
  // Calculate pending/new orders for seller
  const sellerOrdersCount = currentUser
    ? orders.filter((o) => o.sellerId === currentUser.id && o.status === 'pending').length
    : 0;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-40 transition-colors duration-200 font-sans shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-2">
        {/* Block 1: Action Buttons & Icons (Top-Left block, reversed visual order from Left to Right) */}
        <div className="flex items-center justify-between w-full" dir="ltr">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* 1. Back Button (within the buttons block, responsive and only when canGoBack is true) */}
            {canGoBack && onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800"
                title="الرجوع للصفحة السابقة"
                aria-label="الرجوع للصفحة السابقة"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-[11px] hidden xs:inline font-sans">رجوع</span>
              </button>
            )}

            {/* 2. Seller Dashboard / Store Icon */}
            {currentUser && (
              <button
                onClick={onOpenSellerDashboard}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative cursor-pointer"
                title="لوحة التاجر وإدارة المتجر"
                aria-label="لوحة التاجر وإدارة المتجر"
              >
                <Store className="w-4.5 h-4.5" />
                {sellerOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                    {sellerOrdersCount}
                  </span>
                )}
              </button>
            )}

            {/* 3. Notification Center Icon */}
            {currentUser && (
              <button
                onClick={onOpenNotifications}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative cursor-pointer"
                title="مركز الإشعارات"
                aria-label="مركز الإشعارات"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* 4. Favorites Icon */}
            {currentUser && (
              <button
                onClick={() => onShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-1.5 sm:p-2 rounded-xl transition-all relative cursor-pointer ${
                  showFavoritesOnly 
                    ? 'text-rose-500 bg-rose-500/10' 
                    : 'text-slate-500 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="المفضلة"
                aria-label="المفضلة"
              >
                <Heart className={`w-4.5 h-4.5 ${showFavoritesOnly ? 'fill-rose-500' : ''}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {/* 5. Dark Mode / Light Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="تغيير المظهر"
              aria-label="تغيير المظهر"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
            </button>

            {/* 6. Login Button (Visible only when user is not logged in) */}
            {!currentUser && onNavigateToLogin && (
              <button
                onClick={onNavigateToLogin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                title="تسجيل الدخول"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>
            )}
          </div>
        </div>

        {/* Block 2: Full-width Independent Logo, Menu & Slogan Block */}
        <div className="flex items-center justify-between gap-3 w-full" dir="rtl">
          {/* Logo, Hamburger Menu & Slogan */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Hamburger Button */}
            <button
              onClick={onOpenMenu}
              className="p-2 -mr-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="القائمة الجانبية"
              aria-label="القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div 
                className="flex items-baseline gap-2 cursor-pointer select-none" 
                onClick={() => { onSelectCategory(null); onShowFavoritesOnly(false); }}
              >
                <span className="text-xl md:text-2xl font-black tracking-wider text-amber-500 flex items-center gap-1.5 shrink-0">
                  {settings?.platformLogo && (settings.platformLogo.startsWith('data:image/') || settings.platformLogo.startsWith('http') || settings.platformLogo.includes('/')) ? (
                    <img 
                      src={settings.platformLogo} 
                      alt={settings?.platformName || 'Logo'} 
                      className="w-7 h-7 object-contain rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-lg md:text-xl">{settings?.platformLogo || '🛍️'}</span>
                  )}
                  <span className="truncate">{settings?.platformName || 'VELORIA'}</span>
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-medium border-r border-slate-200 dark:border-slate-700 pr-2 whitespace-nowrap">
                  حيث يلتقي البائع بالمشتري
                </span>
              </div>
            </div>
          </div>

          {/* Search Box (Desktop / Tablet) */}
          {showSearchAndCategories && (
            <div className="flex-1 max-w-md relative hidden md:block mx-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث عن طاولة، حلويات، سماعات، بائع..."
                className="w-full text-xs pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          )}
        </div>

        {/* Mobile Search Input */}
        {showSearchAndCategories && (
          <div className="relative md:hidden w-full" dir="rtl">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن منتجات، متاجر..."
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
        )}
      </div>
    </header>
  );
}
