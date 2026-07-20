import { Category, User, Order, AppSettings } from '../types';
import { Search, Moon, Sun, MessageSquare, Bell, Store, Heart, Compass, Menu, Database } from 'lucide-react';
import Icon from './Icons';
import { isSupabaseConfigured } from '../lib/supabase';

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
  showSearchAndCategories = true
}: NavbarProps) {
  // Calculate pending/new orders for seller
  const sellerOrdersCount = currentUser
    ? orders.filter((o) => o.sellerId === currentUser.id && o.status === 'pending').length
    : 0;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-40 transition-colors duration-200 font-sans shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
        {/* Top Row: Brand, Search & Tools */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo, Menu & Slogan */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={onOpenMenu}
              className="p-2 -mr-2 rounded-xl text-slate-600 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => { onSelectCategory(null); onShowFavoritesOnly(false); }}>
                <span className="text-xl md:text-2xl font-black tracking-wider text-amber-500 flex items-center gap-1.5">
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
                  <span>{settings?.platformName || 'VELORIA'}</span>
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-medium border-r border-slate-200 dark:border-slate-700 pr-2">
                  حيث يلتقي البائع بالمشتري
                </span>
              </div>

              {/* Database status pill */}
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`} title={isSupabaseConfigured ? 'قاعدة البيانات السحابية Supabase نشطة وموصلة' : 'التطبيق يعمل بوضع التخزين المحلي Offline-First'}>
                <Database className={`w-2.5 h-2.5 ${isSupabaseConfigured ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                {isSupabaseConfigured ? 'سحابي' : 'قاعدة محلية'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          {showSearchAndCategories ? (
            <div className="flex-1 max-w-md relative hidden md:block">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث عن طاولة، حلويات، سماعات، بائع..."
                className="w-full text-xs pr-10 pl-4 py-2.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Actions & Toggles */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="تغيير المظهر"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {currentUser && (
              <>
                {/* Favorites Switcher */}
                <button
                  onClick={() => onShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-2 rounded-xl transition-all relative cursor-pointer ${
                    showFavoritesOnly 
                      ? 'text-rose-500 bg-rose-500/10' 
                      : 'text-slate-500 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="المفضلة"
                >
                  <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-rose-500' : ''}`} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[9px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                {/* Notifications Icon (Notification Center) */}
                <button
                  onClick={onOpenNotifications}
                  className="p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative cursor-pointer"
                  title="مركز الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Seller Dashboard Quick Link */}
                <button
                  onClick={onOpenSellerDashboard}
                  className="p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative cursor-pointer"
                  title="لوحة التاجر وإدارة المتجر"
                >
                  <Store className="w-5 h-5" />
                  {sellerOrdersCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[9px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                      {sellerOrdersCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search Input */}
        {showSearchAndCategories && (
          <div className="relative md:hidden w-full">
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

        {/* Bottom Row: Category Pills */}
        {showSearchAndCategories && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none scroll-smooth">
            <button
              onClick={() => { onSelectCategory(null); onShowFavoritesOnly(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeCategoryId === null && !showFavoritesOnly
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>السوق بالكامل</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { onSelectCategory(cat.id); onShowFavoritesOnly(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  activeCategoryId === cat.id && !showFavoritesOnly
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Icon name={cat.icon} className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
