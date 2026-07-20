import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Product, User, Category, Review, Order, Message, Report, UserBadge, Notification, Contribution, VerificationRequest, AppSettings, ProductFilterOptions } from './types';
import Navbar from './components/Navbar';
import HideProductModal from './components/HideProductModal';
import AdminPromptModal from './components/AdminPromptModal';
import RoleSwitcher from './components/RoleSwitcher';
import ProductCard from './components/ProductCard';
import ProductDetailsModal from './components/ProductDetailsModal';
import SellerDashboard from './components/SellerDashboard';
import ModeratorPanel from './components/ModeratorPanel';
import AdminPanel from './components/AdminPanel';
import ChatModal from './components/ChatModal';
import ContributionModal from './components/ContributionModal';
import { supabase, supabaseService, defaultAppSettings, isSupabaseConfigured } from './lib/supabase';
import ProductFilterPanel from './components/ProductFilterPanel';

// New subviews for Part 2 UI/UX completeness
import NavigationMenu from './components/NavigationMenu';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import LegalView from './components/LegalView';
import ContactView from './components/ContactView';
import { ContactMessage } from './types';
import CategoriesView from './components/CategoriesView';
import ShopsView from './components/ShopsView';
import SearchView from './components/SearchView';
import AddProductView from './components/AddProductView';
import ProfileView from './components/ProfileView';
import OrdersView from './components/OrdersView';
import NotificationsView from './components/NotificationsView';
import SettingsView from './components/SettingsView';
import ResetPasswordView from './components/ResetPasswordView';

import { Sparkles, ShoppingBag, Heart, MessageSquare, Shield, HelpCircle, SlidersHorizontal, ArrowLeft, Star, Store, PlusCircle, ShieldAlert, ChevronRight, Flame, Loader2, RotateCcw, MapPin, Coins, Check } from 'lucide-react';

// Syrian Governorates & Cities mapping
const GOVERNORATES_CITIES: Record<string, string[]> = {
  "دمشق": ["دمشق المدينة", "مشروع دمر", "المزة", "المالكي", "أبو رمانة", "البرامكة", "القصاع", "الميدان", "التجارة", "ركن الدين", "كفرسوسة", "المهاجرين", "شاغور"],
  "ريف دمشق": ["جرمانا", "قدسيا", "ضاحية قدسيا", "التل", "الكسوة", "صحنايا", "أشرفية صحنايا", "ضاحية الأسد", "يبرود", "النبك", "قطنا", "الزبداني", "صيدنايا"],
  "حلب": ["حلب المدينة", "منبج", "الباب", "عفرين", "نبل", "أعزاز", "الزهراء", "السفيرة", "الجميلية", "الشهباء", "الفرقان", "حلب الجديدة", "الموكامبو"],
  "حمص": ["حمص المدينة", "الرستن", "تدمر", "القصير", "تلكلخ", "المشرفة", "الإنشاءات", "الوعر", "الحمراء", "الغوطة", "المحطة"],
  "حماة": ["حماة المدينة", "سلمية", "مصياف", "السقيلبية", "محردة", "الغاب", "العاصي", "طريق حلب"],
  "اللاذقية": ["اللاذقية المدينة", "جبلة", "القرداحة", "الحفة", "صلنفة", "الرمل الشمالي", "المشروع الأول", "الأوقاف", "الزراعة"],
  "طرطوس": ["طرطوس المدينة", "بانياس", "صافيتا", "الدريكيش", "الشيخ بدر", "القدموس", "مشتى الحلو"],
  "السويداء": ["السويداء المدينة", "شهبا", "صلخد", "القريا"],
  "درعا": ["درعا المدينة", "طفس", "نوى", "بصرى الشام", "الصنمين", "ازرع", "داعل"],
  "دير الزور": ["دير الزور المدينة", "الميادين", "البوكمال"],
  "الحسكة": ["الحسكة المدينة", "القامشلي", "رأس العين", "عامودا", "المالكية", "الدرباسية"]
};

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('veloria-dark') === 'true';
  });

  // Hide product modal state
  const [hideProductModal, setHideProductModal] = useState<{
    isOpen: boolean;
    productId: string;
    status: 'active' | 'hidden' | 'sold' | 'expired';
  }>({
    isOpen: false,
    productId: '',
    status: 'hidden'
  });

  // Delete product modal state
  const [deleteProductModal, setDeleteProductModal] = useState<{
    isOpen: boolean;
    productId: string;
  }>({
    isOpen: false,
    productId: ''
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('veloria-dark', String(isDarkMode));
  }, [isDarkMode]);

  // Comparison helper functions for stable references
  const areUsersEqual = useCallback((u1: User | null, u2: User | null): boolean => {
    if (u1 === u2) return true;
    if (!u1 || !u2) return false;
    return (
      u1.id === u2.id &&
      u1.name === u2.name &&
      u1.email === u2.email &&
      u1.role === u2.role &&
      u1.avatar === u2.avatar &&
      u1.bio === u2.bio &&
      u1.isPremium === u2.isPremium &&
      u1.followersCount === u2.followersCount &&
      u1.ratingAverage === u2.ratingAverage &&
      u1.ratingsCount === u2.ratingsCount &&
      u1.username === u2.username &&
      u1.city === u2.city &&
      u1.phone === u2.phone &&
      u1.whatsapp === u2.whatsapp &&
      u1.whatsapp_number === u2.whatsapp_number &&
      u1.coverImage === u2.coverImage &&
      u1.salesCount === u2.salesCount &&
      u1.trustLevel === u2.trustLevel &&
      u1.status === u2.status &&
      JSON.stringify(u1.badges) === JSON.stringify(u2.badges)
    );
  }, []);

  const areUserArraysEqual = useCallback((arr1: User[], arr2: User[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((u, i) => areUsersEqual(u, arr2[i]));
  }, [areUsersEqual]);

  const areProductsEqual = useCallback((p1: Product, p2: Product): boolean => {
    return (
      p1.id === p2.id &&
      p1.title === p2.title &&
      p1.description === p2.description &&
      p1.price === p2.price &&
      p1.currency === p2.currency &&
      p1.categoryId === p2.categoryId &&
      p1.sellerId === p2.sellerId &&
      p1.status === p2.status &&
      p1.city === p2.city &&
      p1.createdAt === p2.createdAt &&
      p1.rating === p2.rating &&
      p1.reviewsCount === p2.reviewsCount &&
      p1.viewsCount === p2.viewsCount &&
      JSON.stringify(p1.images) === JSON.stringify(p2.images)
    );
  }, []);

  const areProductArraysEqual = useCallback((arr1: Product[], arr2: Product[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((p, i) => areProductsEqual(p, arr2[i]));
  }, [areProductsEqual]);

  const areReviewsEqual = useCallback((r1: Review, r2: Review): boolean => {
    return (
      r1.id === r2.id &&
      r1.productId === r2.productId &&
      r1.reviewerId === r2.reviewerId &&
      r1.rating === r2.rating &&
      r1.comment === r2.comment &&
      r1.createdAt === r2.createdAt
    );
  }, []);

  const areReviewArraysEqual = useCallback((arr1: Review[], arr2: Review[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((r, i) => areReviewsEqual(r, arr2[i]));
  }, [areReviewsEqual]);

  // Reviews state (to calculate real rating averages and counts)
  const [allReviews, setAllReviewsRaw] = useState<Review[]>([]);
  const setAllReviews = useCallback((value: React.SetStateAction<Review[]>) => {
    setAllReviewsRaw(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (areReviewArraysEqual(prev, next)) {
        return prev;
      }
      return next;
    });
  }, [areReviewArraysEqual]);

  // Lists persistence states
  const [rawUsers, setRawUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('veloria-users');
    return saved ? JSON.parse(saved) : [];
  });

  const setUsers = useCallback((value: React.SetStateAction<User[]>) => {
    setRawUsers(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (areUserArraysEqual(prev, next)) {
        return prev;
      }
      return next;
    });
  }, [areUserArraysEqual]);

  const [rawCurrentUser, setRawCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('veloria-current-user-id');
    if (saved === 'null' || !saved) return null;
    const found = rawUsers.find((u) => u.id === saved);
    return found || null;
  });

  const setCurrentUser = useCallback((value: React.SetStateAction<User | null>) => {
    setRawCurrentUser(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (areUsersEqual(prev, next)) {
        return prev;
      }
      return next;
    });
  }, [areUsersEqual]);

  const [products, setProductsRaw] = useState<Product[]>(() => {
    const saved = localStorage.getItem('veloria-products');
    return saved ? JSON.parse(saved) : [];
  });

  const setProducts = useCallback((value: React.SetStateAction<Product[]>) => {
    setProductsRaw(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (areProductArraysEqual(prev, next)) {
        return prev;
      }
      return next;
    });
  }, [areProductArraysEqual]);

  const usersRef = useRef<User[]>([]);
  const users = useMemo(() => {
    const nextUsers = rawUsers.map(user => {
      // Find all products owned by this seller
      const sellerProducts = products.filter(p => p.sellerId === user.id);
      const sellerProductIds = sellerProducts.map(p => p.id);
      
      // Find all reviews for these products
      const sellerReviews = allReviews.filter(r => sellerProductIds.includes(r.productId));
      
      if (sellerReviews.length === 0) {
        return {
          ...user,
          ratingAverage: 0,
          ratingsCount: 0
        };
      }
      
      const sum = sellerReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const average = Number((sum / sellerReviews.length).toFixed(1));
      
      return {
        ...user,
        ratingAverage: average,
        ratingsCount: sellerReviews.length
      };
    });

    if (areUserArraysEqual(usersRef.current, nextUsers)) {
      return usersRef.current;
    }
    usersRef.current = nextUsers;
    return nextUsers;
  }, [rawUsers, products, allReviews, areUserArraysEqual]);

  const currentUserRef = useRef<User | null>(null);
  const currentUser = useMemo(() => {
    if (!rawCurrentUser) {
      currentUserRef.current = null;
      return null;
    }
    const found = users.find(u => u.id === rawCurrentUser.id);
    const nextUser = found 
      ? { ...rawCurrentUser, ratingAverage: found.ratingAverage, ratingsCount: found.ratingsCount } 
      : rawCurrentUser;
    
    if (areUsersEqual(currentUserRef.current, nextUser)) {
      return currentUserRef.current;
    }
    currentUserRef.current = nextUser;
    return nextUser;
  }, [rawCurrentUser, users, areUsersEqual]);

  const [allActiveProducts, setAllActiveProducts] = useState<Product[]>([]);

  const [categories, setCategoriesRaw] = useState<Category[]>(() => {
    const saved = localStorage.getItem('veloria-categories');
    return saved ? JSON.parse(saved) : [];
  });

  const setCategories = useCallback((value: React.SetStateAction<Category[]>) => {
    setCategoriesRaw(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (prev.length === next.length && prev.every((c, i) => c.id === next[i].id && c.name === next[i].name && c.icon === next[i].icon && c.slug === next[i].slug)) {
        return prev;
      }
      return next;
    });
  }, []);

  const [orders, setOrdersRaw] = useState<Order[]>(() => {
    const saved = localStorage.getItem('veloria-orders');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  });

  const areOrdersEqual = useCallback((o1: Order, o2: Order): boolean => {
    return (
      o1.id === o2.id &&
      o1.productId === o2.productId &&
      o1.productTitle === o2.productTitle &&
      o1.productImage === o2.productImage &&
      o1.buyerId === o2.buyerId &&
      o1.buyerName === o2.buyerName &&
      o1.sellerId === o2.sellerId &&
      o1.sellerName === o2.sellerName &&
      o1.price === o2.price &&
      o1.quantity === o2.quantity &&
      o1.status === o2.status &&
      o1.notes === o2.notes &&
      o1.buyerMessage === o2.buyerMessage &&
      o1.productPrice === o2.productPrice &&
      o1.createdAt === o2.createdAt &&
      o1.updatedAt === o2.updatedAt &&
      o1.order_number === o2.order_number &&
      o1.orderNumber === o2.orderNumber &&
      o1.sellerRating === o2.sellerRating &&
      o1.productRating === o2.productRating &&
      o1.ratingComment === o2.ratingComment &&
      o1.cancellationReason === o2.cancellationReason
    );
  }, []);

  const areOrderArraysEqual = useCallback((arr1: Order[], arr2: Order[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((o, i) => areOrdersEqual(o, arr2[i]));
  }, [areOrdersEqual]);

  const setOrders = useCallback((value: React.SetStateAction<Order[]>) => {
    setOrdersRaw(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      const sortedNext = [...next].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      if (areOrderArraysEqual(prev, sortedNext)) {
        return prev;
      }
      return sortedNext;
    });
  }, [areOrderArraysEqual]);

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('veloria-messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('veloria-reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavoritesRaw] = useState<string[]>(() => {
    const userId = localStorage.getItem('veloria-current-user-id');
    if (userId && userId !== 'null') {
      const saved = localStorage.getItem(`veloria-favorites-${userId}`);
      if (saved) return JSON.parse(saved);
    }
    const saved = localStorage.getItem('veloria-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const setFavorites = useCallback((value: React.SetStateAction<string[]>) => {
    setFavoritesRaw(prev => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (prev.length === next.length && prev.every((v, i) => v === next[i])) {
        return prev;
      }
      return next;
    });
  }, []);

  const [followedSellers, setFollowedSellers] = useState<string[]>(() => {
    const saved = localStorage.getItem('veloria-followed-sellers');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotificationsRaw] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('veloria-notifications');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  });

  const setNotifications = (
    value: Notification[] | ((prev: Notification[]) => Notification[])
  ) => {
    setNotificationsRaw((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      return [...next].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    });
  };

  // UI state
  const [currentView, setCurrentView] = useState<string>('market');
  const [activeMarketTab, setActiveMarketTab] = useState<string>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [rawSelectedProfileUser, setRawSelectedProfileUser] = useState<User | null>(null);
  const selectedProfileUser = useMemo(() => {
    if (!rawSelectedProfileUser) return null;
    const found = users.find(u => u.id === rawSelectedProfileUser.id);
    return found ? { ...rawSelectedProfileUser, ratingAverage: found.ratingAverage, ratingsCount: found.ratingsCount } : rawSelectedProfileUser;
  }, [rawSelectedProfileUser, users]);
  const setSelectedProfileUser = setRawSelectedProfileUser;
  const [viewHistory, setViewHistory] = useState<{ view: string; profileUser: User | null }[]>([]);

  const navigateTo = (view: string, profileUser: User | null = null) => {
    setViewHistory((prev) => [...prev, { view: currentView, profileUser: selectedProfileUser }]);
    setCurrentView(view);
    setSelectedProfileUser(profileUser);
  };

  const navigateBack = () => {
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory((prevHistory) => prevHistory.slice(0, -1));
      setCurrentView(prev.view);
      setSelectedProfileUser(prev.profileUser);
    } else {
      setCurrentView('market');
      setSelectedProfileUser(null);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Advanced Filtering States
  const [filterPriceMin, setFilterPriceMin] = useState<number | ''>('');
  const [filterPriceMax, setFilterPriceMax] = useState<number | ''>('');
  const [filterProvince, setFilterProvince] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [filterDelivery, setFilterDelivery] = useState<boolean | 'all'>('all');
  const [filterFeatured, setFilterFeatured] = useState<boolean>(false);
  const [filterVerified, setFilterVerified] = useState<boolean>(false);
  const [filterHasOffer, setFilterHasOffer] = useState<boolean>(false);
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState<boolean>(false);

  // Platform Centralized Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('veloria-app-settings');
    return saved ? JSON.parse(saved) : defaultAppSettings;
  });

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await supabaseService.getAppSettings();
        setAppSettings(settings);
        setShamCashAccount(settings.shamCashAccount || 'XXXXXXXXXX');
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem('veloria-app-settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Sync to local storage
  const [contributions, setContributions] = useState<Contribution[]>(() => {
    const saved = localStorage.getItem('veloria-contributions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [shamCashAccount, setShamCashAccount] = useState<string>(() => {
    const saved = localStorage.getItem('veloria-app-settings');
    const settings = saved ? JSON.parse(saved) : defaultAppSettings;
    return settings.shamCashAccount || 'XXXXXXXXXX';
  });

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(() => {
    const saved = localStorage.getItem('veloria-verification-requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    const saved = localStorage.getItem('veloria-contact-messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('veloria-users', JSON.stringify(rawUsers)); }, [rawUsers]);
  useEffect(() => { localStorage.setItem('veloria-current-user-id', currentUser ? currentUser.id : 'null'); }, [currentUser]);
  useEffect(() => { localStorage.setItem('veloria-products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('veloria-categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => {
    const sorted = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    localStorage.setItem('veloria-orders', JSON.stringify(sorted));
  }, [orders]);
  useEffect(() => { localStorage.setItem('veloria-messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('veloria-reports', JSON.stringify(reports)); }, [reports]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`veloria-favorites-${currentUser.id}`, JSON.stringify(favorites));
    } else {
      localStorage.setItem('veloria-favorites', JSON.stringify(favorites));
    }
  }, [favorites, currentUser]);
  useEffect(() => { localStorage.setItem('veloria-followed-sellers', JSON.stringify(followedSellers)); }, [followedSellers]);
  useEffect(() => {
    const sorted = [...notifications].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    localStorage.setItem('veloria-notifications', JSON.stringify(sorted));
  }, [notifications]);
  useEffect(() => { localStorage.setItem('veloria-contributions', JSON.stringify(contributions)); }, [contributions]);
  useEffect(() => { localStorage.setItem('veloria-sham-cash-account', shamCashAccount); }, [shamCashAccount]);
  useEffect(() => { localStorage.setItem('veloria-verification-requests', JSON.stringify(verificationRequests)); }, [verificationRequests]);
  useEffect(() => { localStorage.setItem('veloria-contact-messages', JSON.stringify(contactMessages)); }, [contactMessages]);

  // Deep linking to shared items on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') || params.get('v');
    const storeIdParam = params.get('storeId') || params.get('s');
    const productIdParam = params.get('productId') || params.get('p');

    if (viewParam === 'profile' && storeIdParam) {
      const matchedUser = users.find(u => u.id === storeIdParam || u.username === storeIdParam);
      if (matchedUser) {
        setSelectedProfileUser(matchedUser);
        setCurrentView('profile');
      }
    } else if (viewParam === 'product' && productIdParam) {
      const matchedProduct = products.find(p => p.id === productIdParam);
      if (matchedProduct) {
        setSelectedProduct(matchedProduct);
        setCurrentView('market');
      }
    }
  }, [users, products]);

  // Auto-expire products older than 90 days on mount
  useEffect(() => {
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    let updated = false;
    const checkedProducts = products.map((p) => {
      const createdTime = new Date(p.createdAt).getTime();
      if (p.status === 'active' && (now - createdTime) > NINETY_DAYS_MS) {
        updated = true;
        return { ...p, status: 'expired' as const };
      }
      return p;
    });
    if (updated) {
      setProducts(checkedProducts);
    }
  }, []);

  const isPasswordRecovery = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    return hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('recovery');
  };

  // Check on mount and listen to hash change for password recovery flow
  useEffect(() => {
    const handleUrlCheck = () => {
      if (isPasswordRecovery()) {
        setCurrentView('reset-password');
      }
    };
    handleUrlCheck();
    window.addEventListener('hashchange', handleUrlCheck);
    return () => window.removeEventListener('hashchange', handleUrlCheck);
  }, []);

  // Load current session, profiles, and products from Supabase if configured on mount
  useEffect(() => {
    const loadSession = async () => {
      if (isSupabaseConfigured) {
        try {
          if (isPasswordRecovery()) {
            setCurrentView('reset-password');
            return; // Do NOT log them in as a normal user directly
          }
          
          let sessionUser = null;
          try {
            sessionUser = await supabaseService.getCurrentSessionUser();
          } catch (sessionErr) {
            console.warn('Could not load current session user from Supabase:', sessionErr);
          }
          
          if (sessionUser) {
            setRawCurrentUser(prev => {
              if (!prev || !areUsersEqual(prev, sessionUser)) {
                return sessionUser;
              }
              return prev;
            });
          }

          // Fetch categories from Supabase
          try {
            const dbCategories = await supabaseService.getCategories();
            console.log("dbCategories =", dbCategories);
            if (dbCategories) {
              setCategories(dbCategories);
              console.log("categories state =", dbCategories);
            }
          } catch (catErr) {
            console.warn('Could not sync categories from Supabase:', catErr);
          }

          // Fetch real profiles/sellers from Supabase so the users list is synchronized
          try {
            const dbProfiles = await supabaseService.getProfiles();
            if (dbProfiles) {
              setUsers(dbProfiles);
            }
          } catch (profileErr) {
            console.warn('Could not sync profiles from Supabase:', profileErr);
          }

          // Fetch all reviews from Supabase
          try {
            const dbReviews = await supabaseService.getAllProductRatings();
            if (dbReviews) {
              setAllReviews(dbReviews);
            }
          } catch (rErr) {
            console.warn('Could not sync reviews from Supabase:', rErr);
          }

          // Fetch all active products once to calculate category & shop counts
          try {
            const dbAllProducts = await supabaseService.getProducts({ status: 'active' });
            if (dbAllProducts) {
              setAllActiveProducts(dbAllProducts);
            }
          } catch (pErr) {
            console.warn('Could not sync all products for counts:', pErr);
          }
        } catch (err) {
          console.warn('Gracefully handled Supabase load session fallback:', err);
        }
      }
    };
    loadSession();
  }, [areUsersEqual]);

  // Dynamic unified loader for products (from Supabase queries)
  useEffect(() => {
    const fetchFilteredAndSortedProducts = async () => {
      if (!isSupabaseConfigured) {
        console.log("Market returned early because: isSupabaseConfigured is false");
        return;
      }
      
      try {
        setIsLoadingProducts(true);
        
        // Build options based on our unified engine
        const options: ProductFilterOptions = {
          status: 'active' // Show active products by default in the market
        };

        if (activeMarketTab === 'all') {
          if (activeCategoryId) {
            options.categoryId = activeCategoryId;
          }

          if (searchTerm && searchTerm.trim() !== '') {
            options.searchTerm = searchTerm;
          }

          if (showFavoritesOnly) {
            options.productIds = favorites;
          }

          // Apply advanced filters
          if (filterPriceMin !== '') {
            options.priceMin = Number(filterPriceMin);
          }
          if (filterPriceMax !== '') {
            options.priceMax = Number(filterPriceMax);
          }

          options.sortBy = sortBy;
        } else {
          // For pages other than the general market, do not use user dropdown sorting
          // or category/search filters, and instead use their fixed sorting criteria
          options.sortBy = activeMarketTab; // 'top-rated', 'most-viewed', 'newest'
        }

        console.log(`Current Sort = ${sortBy}`);
        console.log("Options object:", options);

        const dbProducts = await supabaseService.getProducts(options);
        console.log("===== FETCH RESULT =====");
        console.log("currentUser =", currentUser);
        console.log("dbProducts.length =", dbProducts?.length);
        console.log("dbProducts =", dbProducts);
        if (dbProducts) {
          setProducts(dbProducts);
          console.log("products were sent to state");

          // Extract unique seller IDs from loaded products and fetch their profiles individually
          const sellerIds = Array.from(new Set(dbProducts.map(p => p.sellerId))).filter(Boolean);
          if (sellerIds.length > 0) {
            try {
              const sellerProfiles = await Promise.all(
                sellerIds.map(id => supabaseService.getProfile(id))
              );
              const validProfiles = sellerProfiles.filter(Boolean) as User[];
              if (validProfiles.length > 0) {
                setUsers(prev => {
                  const merged = [...prev];
                  validProfiles.forEach(p => {
                    const idx = merged.findIndex(u => u.id === p.id);
                    if (idx !== -1) {
                      merged[idx] = p;
                    } else {
                      merged.push(p);
                    }
                  });
                  return merged;
                });
              }
            } catch (sellerErr) {
              console.warn('Could not load specific seller profiles for queried products:', sellerErr);
            }
          }
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn('Error loading products from Supabase Query Builder:', err);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchFilteredAndSortedProducts();
  }, [
    activeMarketTab, 
    activeCategoryId, 
    searchTerm, 
    sortBy, 
    showFavoritesOnly, 
    favorites,
    filterPriceMin,
    filterPriceMax,
    filterProvince,
    filterCity,
    filterCondition,
    filterDelivery,
    filterFeatured,
    filterVerified,
    filterHasOffer
  ]);

  // Load favorites dynamically from database when currentUser changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser) {
        setFavorites([]);
        return;
      }
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);
      if (isSupabaseConfigured && isUUID) {
        try {
          const dbFavs = await supabaseService.getFavorites(currentUser.id);
          setFavorites(dbFavs);
          return;
        } catch (err) {
          console.warn('Failed to load favorites from Supabase, loading from localStorage:', err);
        }
      }

      // Local storage fallback for local/mock users
      const saved = localStorage.getItem(`veloria-favorites-${currentUser.id}`);
      setFavorites(saved ? JSON.parse(saved) : []);
    };
    loadFavorites();
  }, [currentUser]);

  const loadOrders = async () => {
    if (!currentUser) {
      const saved = localStorage.getItem('veloria-orders');
      setOrders(saved ? JSON.parse(saved) : []);
      return;
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);
    if (isSupabaseConfigured && isUUID) {
      try {
        const dbOrders = await supabaseService.getOrders(currentUser.id);
        if (dbOrders) {
          setOrders(dbOrders);
          return;
        }
      } catch (err) {
        console.warn('Failed to load orders from Supabase, loading from localStorage:', err);
      }
    }

    const saved = localStorage.getItem('veloria-orders');
    setOrders(saved ? JSON.parse(saved) : []);
  };

  // Load orders dynamically from database when currentUser changes
  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.signOut();
      } catch (err) {
        console.error('Failed to sign out from Supabase:', err);
      }
    }
    setCurrentUser(null);
    setCurrentView('market');
    setIsChatOpen(false);
    setSelectedProduct(null);
    setSelectedProfileUser(null);
  };

  // Adjust active view on user change
  const handleUserChange = (newUser: User | null) => {
    if (newUser === null) {
      handleLogout();
    } else {
      setCurrentUser(newUser);
      setCurrentView('market');
      setIsChatOpen(false);
      setSelectedProduct(null);
      setSelectedProfileUser(null);
    }
  };

  const handleSubmitContactMessage = async (msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setContactMessages(prev => [newMsg, ...prev]);

    try {
      const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
      if (isSupabaseConfigured && supabase) {
        await supabase.from('contact_messages').insert({
          id: newMsg.id,
          name: newMsg.name,
          email: newMsg.email,
          type: newMsg.type,
          subject: newMsg.subject,
          message: newMsg.message,
          status: newMsg.status,
          created_at: newMsg.createdAt
        });
      }
    } catch (err) {
      console.warn('Failed to persist contact message to Supabase:', err);
    }
  };

  // State handlers
  const handleToggleFavorite = async (productId: string) => {
    if (!currentUser) return;
    
    const isFav = favorites.includes(productId);
    const nextFavState = isFav ? favorites.filter((id) => id !== productId) : [...favorites, productId];
    setFavorites(nextFavState);

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);
    if (isSupabaseConfigured && isUUID) {
      try {
        await supabaseService.toggleFavorite(currentUser.id, productId, !isFav);
      } catch (err) {
        console.error('Failed to toggle favorite in Supabase:', err);
      }
    }
  };

  const handleViewProduct = async (p: Product) => {
    // Increment views count locally for instant UI update
    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, viewsCount: (item.viewsCount || 0) + 1 } : item));
    setSelectedProduct({ ...p, viewsCount: (p.viewsCount || 0) + 1 });

    // Call Supabase RPC in the background to update the atomic counter
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
    
    if (isSupabaseConfigured && isUUID) {
      try {
        await supabaseService.incrementProductViews(p.id);
      } catch (err) {
        console.error('Error incrementing views on Supabase:', err);
      }
    }
  };

  const handleToggleFollow = (sellerId: string) => {
    if (!currentUser) return;
    setFollowedSellers((prev) =>
      prev.includes(sellerId) ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]
    );
  };

  const handleSendMessage = (receiverId: string, text: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser?.id || 'visitor',
      receiverId,
      text,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleSendOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'buyerId' | 'buyerName'>): Promise<Order> => {
    if (!currentUser) throw new Error('يجب تسجيل الدخول كعضو أولاً لتتمكن من تقديم طلب.');
    
    let savedOrder: Order;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);

    if (isSupabaseConfigured && isUUID) {
      try {
        const product = { id: orderData.productId };
        console.log(product.id)
        console.log(typeof product.id)

        savedOrder = await supabaseService.createOrder({
          productId: orderData.productId,
          productTitle: orderData.productTitle,
          productImage: orderData.productImage,
          sellerId: orderData.sellerId,
          sellerName: orderData.sellerName,
          buyerId: currentUser.id,
          buyerName: currentUser.name,
          price: orderData.price,
          quantity: orderData.quantity,
          buyerMessage: orderData.buyerMessage,
          status: 'pending'
        });
      } catch (dbErr: any) {
        console.error('Error saving order to Supabase:', dbErr);
        throw new Error(dbErr?.message || 'فشل حفظ الطلب في قاعدة البيانات، يرجى التحقق من الاتصال بالإنترنت.');
      }
    } else {
      // Local fallback
      savedOrder = {
        ...orderData,
        id: `ord-${Date.now()}`,
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
    }

    setOrders((prev) => [savedOrder, ...prev]);

    // Send Notification to the seller
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: orderData.sellerId,
      type: 'order',
      title: 'طلب شراء جديد وارد! 🛍️',
      body: `قام العضو ${currentUser.name} بتقديم طلب شراء على منتجك "${orderData.productTitle}". يرجى مراجعة صفحة الطلبات للتواصل وإتمام البيع.`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Open communication (send automated message from buyer to seller)
    const productItem = products.find(p => p.id === orderData.productId);
    const currencyStr = productItem?.currency || 'ل.س';
    const autoMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      senderId: currentUser.id,
      receiverId: orderData.sellerId,
      text: `مرحباً، أود شراء منتجك "${orderData.productTitle}" المعروض بسعر ${orderData.price} ${currencyStr}. لقد أرسلت لك طلباً رسمياً عبر النظام.`,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, autoMessage]);

    return savedOrder;
  };

  const handleSendReport = (reportData: Omit<Report, 'id' | 'createdAt' | 'reporterId' | 'reporterName' | 'status'>) => {
    if (!currentUser) return;
    const newRep: Report = {
      ...reportData,
      id: `rep-${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setReports((prev) => [newRep, ...prev]);
  };

  const executeUpdateProductStatus = async (productId: string, status: 'active' | 'hidden' | 'sold' | 'expired', reason: string = '') => {
    console.log("executeUpdateProductStatus started");
    const currentProd = products.find((p) => p.id === productId);
    if (!currentProd) return;

    let targetStatus: 'active' | 'hidden' | 'sold' | 'expired' = status;

    if (status === 'active') {
      if (currentProd.status === 'hidden') {
        targetStatus = currentProd.isSold ? 'sold' : 'active';
      } else {
        targetStatus = 'active';
      }
    }

    const isManagerAction = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator') && (currentProd.sellerId !== currentUser.id);

    if (targetStatus === 'hidden') {
      console.log('Hide button clicked');
      try {
        console.log('Updating database...');
        if (isSupabaseConfigured && supabaseService) {
          await supabaseService.updateProductStatus(productId, 'hidden');
        }
        console.log('Database updated successfully');

        // Send notifications on success
        if (isManagerAction) {
          const bodyText = reason 
            ? `قام فريق الإدارة بإخفاء منتجك مؤقتاً بسبب مخالفة سياسات المنصة.\nالسبب: ${reason}`
            : `قام فريق الإدارة بإخفاء منتجك مؤقتاً بسبب مخالفة سياسات المنصة.`;
          
          const newNotif: Notification = {
            id: `notif-hide-${Date.now()}-${Math.random()}`,
            userId: currentProd.sellerId,
            type: 'admin',
            title: 'تم إخفاء أحد منتجاتك',
            body: bodyText,
            createdAt: new Date().toISOString(),
            read: false
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
        console.log('Notification sent');

        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                status: 'hidden'
              };
            }
            return p;
          })
        );
        console.log('Local state updated');
        console.log('Hide العملية انتهت');
      } catch (err: any) {
        console.error('Failed to hide product:', err);
      }
    } else {
      try {
        if (isSupabaseConfigured && supabaseService) {
          await supabaseService.updateProductStatus(productId, targetStatus);
        }

        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              const isRenewing = p.status === 'expired' && targetStatus === 'active';
              return {
                ...p,
                status: targetStatus,
                isSold: targetStatus === 'sold' ? true : (targetStatus === 'active' ? false : p.isSold),
                createdAt: isRenewing ? new Date().toISOString() : p.createdAt
              };
            }
            return p;
          })
        );

        // Send notifications on success
        if (isManagerAction) {
          if (currentProd.status === 'hidden') {
            const newNotif: Notification = {
              id: `notif-unhide-${Date.now()}-${Math.random()}`,
              userId: currentProd.sellerId,
              type: 'admin',
              title: 'تمت إعادة نشر منتجك',
              body: 'بعد مراجعة المنتج تمت إعادة نشره داخل السوق.',
              createdAt: new Date().toISOString(),
              read: false
            };
            setNotifications((prev) => [newNotif, ...prev]);
          }
        }
      } catch (err) {
        console.warn('Failed to update product status in Supabase:', err);
      }
    }
  };

  const handleUpdateProductStatus = async (productId: string, status: 'active' | 'hidden' | 'sold' | 'expired') => {
    console.log("handleUpdateProductStatus started");
    const currentProd = products.find((p) => p.id === productId);
    if (!currentProd) return;

    let targetStatus: 'active' | 'hidden' | 'sold' | 'expired' = status;

    if (status === 'active') {
      if (currentProd.status === 'hidden') {
        targetStatus = currentProd.isSold ? 'sold' : 'active';
      } else {
        targetStatus = 'active';
      }
    }

    const isManagerAction = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator') && (currentProd.sellerId !== currentUser.id);

    if (targetStatus === 'hidden' && currentProd.status !== 'hidden' && isManagerAction) {
      setHideProductModal({
        isOpen: true,
        productId,
        status
      });
      return;
    }

    await executeUpdateProductStatus(productId, status, '');
  };

  const executeDeleteProduct = async (productId: string, reason: string = '') => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const isManagerAction = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator') && (targetProduct.sellerId !== currentUser.id);

    // 1. Storage cleanup and database delete for Supabase
    try {
      const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
      if (isSupabaseConfigured && supabase) {
        if (targetProduct.images && targetProduct.images.length > 0) {
          const paths = targetProduct.images
            .map((url) => {
              const parts = url.split('/product-images/');
              return parts.length > 1 ? parts[1] : null;
            })
            .filter(Boolean) as string[];

          if (paths.length > 0) {
            await supabase.storage.from('product-images').remove(paths);
          }
        }

        // Delete from database
        await supabase.from('product_images').delete().eq('product_id', productId);
        await supabase.from('favorites').delete().eq('product_id', productId);
        await supabase.from('products').delete().eq('id', productId);
      }

      // 2. Keep local state sync on success
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setFavorites((prev) => prev.filter((id) => id !== productId));
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }

      // Send deletion notification on success
      if (isManagerAction) {
        const bodyText = reason 
          ? `تم حذف المنتج من المنصة.\nالسبب: ${reason}`
          : `تم حذف المنتج من المنصة.`;

        const newNotif: Notification = {
          id: `notif-delete-${Date.now()}-${Math.random()}`,
          userId: targetProduct.sellerId,
          type: 'admin',
          title: 'تم حذف أحد منتجاتك',
          body: bodyText,
          createdAt: new Date().toISOString(),
          read: false
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }

    } catch (err) {
      console.warn('Supabase automatic storage cleanup or DB deletion failed:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const isManagerAction = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator') && (targetProduct.sellerId !== currentUser.id);

    if (isManagerAction) {
      setDeleteProductModal({
        isOpen: true,
        productId
      });
      return;
    }

    // If it is the seller themselves deleting, do it directly
    await executeDeleteProduct(productId, '');
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    if (selectedProduct?.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }

    try {
      const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
      if (isSupabaseConfigured && supabase) {
        console.log("updatedProduct.categoryId:", updatedProduct.categoryId);
        console.log("typeof updatedProduct.categoryId:", typeof updatedProduct.categoryId);

        const finalCategoryId =
          typeof updatedProduct.categoryId === 'string' &&
          updatedProduct.categoryId.startsWith('cat-')
            ? parseInt(updatedProduct.categoryId.replace('cat-', ''), 10)
            : (typeof updatedProduct.categoryId === 'string' ? parseInt(updatedProduct.categoryId, 10) : updatedProduct.categoryId);

        const { error: prodError } = await supabase
          .from('products')
          .update({
            title: updatedProduct.title,
            description: updatedProduct.description,
            price: updatedProduct.price,
            category_id: finalCategoryId,
            status: updatedProduct.status,
            is_sold: updatedProduct.status === 'sold',
            updated_at: new Date().toISOString(),
            currency: updatedProduct.currency || 'ل.س',
            city: updatedProduct.city || null
          })
          .eq('id', updatedProduct.id);

        if (prodError) throw prodError;

        // Re-insert product images metadata
        await supabase.from('product_images').delete().eq('product_id', updatedProduct.id);

        if (updatedProduct.images && updatedProduct.images.length > 0) {
          const imagePayloads = updatedProduct.images.map((url, idx) => ({
            product_id: updatedProduct.id,
            image_url: url,
            sort_order: idx
          }));

          const { error: imgError } = await supabase
            .from('product_images')
            .insert(imagePayloads);

          if (imgError) console.error('Error updating product images metadata:', imgError);
        }
      }
    } catch (err) {
      console.warn('Supabase product edit sync failed:', err);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string, 
    status: Order['status'],
    extraData?: {
      sellerRating?: number;
      productRating?: number;
      ratingComment?: string;
      cancellationReason?: string;
    }
  ) => {
    const order = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, ...(extraData || {}) } : o))
    );

    if (status === 'delivered' && order) {
      const buyerNotif: Notification = {
        id: `delivered-${orderId}`,
        userId: order.buyerId,
        type: 'order',
        title: 'قام التاجر بتأكيد تسليم طلبك',
        body: 'هل استلمت المنتج بالفعل؟',
        createdAt: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [buyerNotif, ...prev]);
    }

    if (status === 'completed' && order && extraData?.sellerRating !== undefined) {
      const sellerId = order.sellerId;
      const productId = order.productId;
      const buyerName = order.buyerName;
      const buyerId = order.buyerId;

      // 1. Send store rating notification to seller
      const sellerNotif: Notification = {
        id: `notif-seller-${Date.now()}`,
        userId: sellerId,
        type: 'review',
        title: `تقييم جديد لمتجرك بـ ${extraData.sellerRating} نجوم ⭐`,
        body: `قام العضو ${buyerName} بتقييم متجرك بـ ${extraData.sellerRating} نجوم. التعليق: "${extraData.ratingComment || 'لا يوجد تعليق'}"`,
        createdAt: new Date().toISOString(),
        read: false
      };

      // 2. Send product rating notification to seller (if productRating was provided)
      const productNotif: Notification = extraData.productRating ? {
        id: `notif-product-${Date.now()}`,
        userId: sellerId,
        type: 'review',
        title: `تقييم جديد لمنتجك بـ ${extraData.productRating} نجوم ⭐`,
        body: `قام العضو ${buyerName} بتقييم منتجك "${order.productTitle}" بـ ${extraData.productRating} نجوم. التعليق: "${extraData.ratingComment || 'لا يوجد تعليق'}"`,
        createdAt: new Date().toISOString(),
        read: false
      } : null;

      const newNotifs = [sellerNotif];
      if (productNotif) {
        newNotifs.push(productNotif);
      }
      setNotifications((prev) => [...newNotifs, ...prev]);

      // 3. Save to Supabase or fallback
      if (isSupabaseConfigured) {
        try {
          if (extraData.productRating) {
            // Save inside product_ratings table
            await supabaseService.addProductRating(
              productId,
              buyerId,
              extraData.productRating,
              extraData.ratingComment || ''
            );
            // Recalculate and update products table stats
            const stats = await supabaseService.updateProductRatingStats(productId);
            // Sync local state for this product with the new average and count
            setProducts((prev) =>
              prev.map((p) =>
                p.id === productId ? { ...p, rating: stats.average, reviewsCount: stats.count } : p
              )
            );
          }
        } catch (err) {
          console.warn('Error syncing product rating to Supabase:', err);
        }
      } else {
        // Local storage fallback: do nothing
        console.warn('Supabase not configured, skipping rating persistence.');
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseService.updateOrderStatus(orderId, status, extraData);
        // Force update the local state immediately after success
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status, ...(extraData || {}) } : o))
        );
        // Re-load the list of orders from the DB to guarantee absolute synchronization
        await loadOrders();
      } catch (err) {
        console.warn('Failed to update order status in Supabase:', err);
      }
    }
  };

  // Contribution System Handlers & Auto-trigger Hook
  const handleConfirmTransfer = async () => {
    if (!currentUser) {
      alert('يرجى تسجيل الدخول أولاً لتتمكن من تقديم مساهمة ودعم المنصة.');
      return;
    }

    const newContribution: Contribution = {
      id: 'contrib-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      user_id: currentUser.id,
      status: 'Pending',
      payment_method: 'Sham Cash',
      account_number: shamCashAccount,
      created_at: new Date().toISOString()
    };

    setContributions((prev) => [...prev, newContribution]);
    setIsContributionModalOpen(false);

    // Add a system notification to user
    const sysNotif: Notification = {
      id: 'notif-contrib-' + Date.now(),
      userId: currentUser.id,
      type: 'system',
      title: 'تم استلام طلب المساهمة! 💚',
      body: 'نشكرك جزيل الشكر على دعمك ومبادرتك الكريمة. يقوم مشرفو فيلوريا الآن بمراجعة التحويل المالي وسنقوم بإخطارك فور اعتماده.',
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications((prev) => [sysNotif, ...prev]);

    // Optional database write (Supabase)
    try {
      const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
      if (supabase && isSupabaseConfigured) {
        await supabase.from('contributions').insert({
          id: newContribution.id,
          user_id: newContribution.user_id,
          status: newContribution.status,
          payment_method: newContribution.payment_method,
          account_number: newContribution.account_number,
          created_at: newContribution.created_at
        });
      }
    } catch (err) {
      console.warn('Optional Supabase contribution write failed:', err);
    }
  };

  const handleReviewContribution = async (id: string, action: 'Completed' | 'Rejected') => {
    if (!currentUser) return;

    setContributions((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: action,
              reviewed_at: new Date().toISOString(),
              reviewed_by: currentUser.id
            }
          : c
       )
    );

    const targetContrib = contributions.find((c) => c.id === id);
    if (targetContrib) {
      const targetUserId = targetContrib.user_id;
      const timestamp = new Date().toISOString();
      let notifTitle = '';
      let notifBody = '';

      if (action === 'Completed') {
        notifTitle = 'شكراً لك على دعم فيلوريا! 💚';
        notifBody = `Thank you 💚\n\nYour contribution has been received successfully.\n\nYour support helps improve VELORIA and add new features for everyone.`;
      } else {
        notifTitle = 'فشل في تأكيد المساهمة ⚠️';
        notifBody = `We could not verify your contribution because no payment was received.\n\nIf you believe this is an error, please contact VELORIA Support.`;
      }

      const reviewNotif: Notification = {
        id: 'notif-review-' + Date.now(),
        userId: targetUserId,
        type: 'system',
        title: notifTitle,
        body: notifBody,
        createdAt: timestamp,
        read: false
      };
      setNotifications((prev) => [reviewNotif, ...prev]);

      // Optional database update (Supabase)
      try {
        const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
        if (supabase && isSupabaseConfigured) {
          await supabase
            .from('contributions')
            .update({
              status: action,
              reviewed_at: timestamp,
              reviewed_by: currentUser.id
            })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('Optional Supabase contribution update failed:', err);
      }
    }
  };

  const handleUpdateAppSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    setShamCashAccount(newSettings.shamCashAccount || 'XXXXXXXXXX');
    try {
      await supabaseService.updateAppSettings(newSettings);
    } catch (err) {
      console.error('Failed to update application settings in database:', err);
    }
  };

  const handleUpdateShamCashAccount = async (account: string) => {
    setShamCashAccount(account);
    const updated = { ...appSettings, shamCashAccount: account };
    setAppSettings(updated);
    try {
      await supabaseService.updateAppSettings(updated);
    } catch (err) {
      console.error('Failed to update sham cash account in database:', err);
    }
  };

  // Auto-prompt rules effect for Contribution Popups
  useEffect(() => {
    if (!currentUser) return;

    // Successful transactions count where current user is buyer or seller
    const completedCount = orders.filter(
      (o) => o.status === 'completed' && (o.buyerId === currentUser.id || o.sellerId === currentUser.id)
    ).length;

    if (completedCount > 0 && completedCount % 10 === 0) {
      // Don't show if we already prompted the user for this specific multiples of 10 count
      const lastPrompted = Number(localStorage.getItem(`veloria-last-prompt-tx-${currentUser.id}`));
      if (lastPrompted === completedCount) return;

      // Rule: Do NOT show if another contribution request is Pending for this user
      const hasPending = contributions.some((c) => c.user_id === currentUser.id && c.status === 'Pending');
      if (hasPending) return;

      // Rule: Do NOT show if user already contributed within the last 6 months (status = Completed)
      const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
      const hasContributedRecently = contributions.some(
        (c) =>
          c.user_id === currentUser.id &&
          c.status === 'Completed' &&
          c.reviewed_at &&
          new Date(c.reviewed_at).getTime() + SIX_MONTHS_MS > Date.now()
      );
      if (hasContributedRecently) return;

      // All checks passed! Display the dialog automatically
      setIsContributionModalOpen(true);

      // Save last prompted count to prevent continuous prompts for the same count
      localStorage.setItem(`veloria-last-prompt-tx-${currentUser.id}`, String(completedCount));
    }
  }, [orders, currentUser, contributions]);

  const handleResolveReport = (reportId: string, action: 'resolved' | 'dismissed') => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
    );
  };

  const handleUpdateUserBadges = (userId: string, badges: UserBadge[]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, badges } : u))
    );
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (isSupabaseConfigured) {
      supabaseService.updateProfile(updatedUser).catch((err) => {
        console.error('Error persisting profile update to Supabase:', err);
      });
    }
  };

  const handleSubmitVerification = (storeId: string) => {
    const storeUser = users.find(u => u.id === storeId);
    if (!storeUser) return;

    // Check if there's already an active request (pending or reviewed)
    const hasActive = verificationRequests.some(r => r.storeId === storeId && (r.status === 'pending' || r.status === 'reviewed'));
    if (hasActive) {
      alert('يوجد لديك طلب توثيق نشط بالفعل قيد المراجعة حالياً.');
      return;
    }

    const newRequest: VerificationRequest = {
      id: `vr-${Date.now()}`,
      storeId,
      storeName: storeUser.name,
      storeUsername: storeUser.username || storeId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setVerificationRequests(prev => [newRequest, ...prev]);

    // Send notification to store owner
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: storeId,
      type: 'system',
      title: '⏳ تم إرسال طلب توثيق متجرك بنجاح',
      body: 'نشكرك على تقديم طلب توثيق متجرك في منصة فيلوريا الحرة. سيقوم فريق الإشراف بمراجعة طلبك ومطابقته للشروط بأقرب وقت ممكن.',
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    alert('🎉 تم تقديم طلب توثيق متجرك بنجاح! سيتم فرز ومراجعة طلبك بواسطة فريق الإشراف قريباً جداً.');
  };

  const handleUpdateVerificationStatus = (requestId: string, status: 'pending' | 'reviewed' | 'approved' | 'rejected', rejectionReason?: string) => {
    setVerificationRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const updated = { ...r, status, rejectionReason };

        // Create status change notification for the store owner
        let title = '';
        let body = '';
        if (status === 'reviewed') {
          title = '✔️ تمت المراجعة الأولية لطلب التوثيق الخاص بك';
          body = 'لقد وافق المشرفون على طلب توثيق متجرك مبدئياً. تم تصعيد طلبك الآن إلى إدارة المنصة للموافقة النهائية ومنح الشارة.';
        } else if (status === 'approved') {
          title = '🎉 مبارك! تم توثيق متجرك رسمياً ✔️';
          body = 'لقد تمت الموافقة النهائية على طلب توثيق متجرك من قبل الإدارة. تم منحك شارة التوثيق الرسمية وعلامة التوثيق المعتمدة لتظهر بجانب اسم متجرك لجميع زوار المنصة!';
          
          // Also update user's badges to include 'verified'
          setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === r.storeId) {
              const updatedBadges = u.badges.includes('verified') ? u.badges : [...u.badges, 'verified' as any];
              const updatedU = { ...u, badges: updatedBadges };
              // Also update current user if it is them
              if (currentUser && currentUser.id === u.id) {
                setCurrentUser(updatedU);
              }
              if (selectedProfileUser && selectedProfileUser.id === u.id) {
                setSelectedProfileUser(updatedU);
              }
              return updatedU;
            }
            return u;
          }));
        } else if (status === 'rejected') {
          title = '❌ عذراً، تم رفض طلب توثيق متجرك';
          body = `تمت مراجعة طلب توثيق متجرك ولم تتم الموافقة عليه للسبب التالي: "${rejectionReason || 'عدم استيفاء الشروط'}"\nيمكنك معالجة السبب وإعادة التقديم بكل سهولة.`;
        }

        if (title && body) {
          const newNotif: Notification = {
            id: `notif-${Date.now()}-${Math.random()}`,
            userId: r.storeId,
            type: status === 'approved' ? 'admin' : 'system',
            title,
            body,
            createdAt: new Date().toISOString(),
            read: false
          };
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
        }

        return updated;
      }
      return r;
    }));
  };

  const handleAddProduct = async (productData: any): Promise<Product> => {
    if (!currentUser) throw new Error('يجب تسجيل الدخول أولاً لإضافة منتج.');
    
    let savedProd: Product;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id);

    if (isSupabaseConfigured && isUUID) {
      try {
        const { id, createdAt, sellerId, rating, reviewsCount, ...cleanData } = productData;
        savedProd = await supabaseService.createProduct({
          ...cleanData,
          sellerId: currentUser.id,
          status: productData.status || 'active'
        });
      } catch (err) {
        console.error('Error creating product in Supabase:', err);
        // Local fallback if saving to Supabase fails
        savedProd = {
          ...productData,
          id: productData.id && String(productData.id).startsWith('prod-') ? productData.id : `prod-${Date.now()}`,
          sellerId: currentUser.id,
          createdAt: productData.createdAt || new Date().toISOString(),
          rating: productData.rating || 0,
          reviewsCount: productData.reviewsCount || 0
        };
      }
    } else {
      savedProd = {
        ...productData,
        id: productData.id && String(productData.id).startsWith('prod-') ? productData.id : `prod-${Date.now()}`,
        sellerId: currentUser.id,
        createdAt: productData.createdAt || new Date().toISOString(),
        rating: productData.rating || 0,
        reviewsCount: productData.reviewsCount || 0
      };
    }

    setProducts((prev) => [savedProd, ...prev]);
    return savedProd;
  };

  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleAddReview = async (productId: string, rating: number, comment: string) => {
    if (!currentUser) return;

    // Send Notification to the seller
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      const reviewNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: targetProduct.sellerId,
        type: 'review',
        title: `تقييم جديد بـ ${rating} نجوم ⭐`,
        body: `قام العضو ${currentUser.name} بإضافة تقييم لمنتجك "${targetProduct.title}": "${comment.length > 50 ? comment.substring(0, 50) + '...' : comment}"`,
        createdAt: new Date().toISOString(),
        read: false
      };
      setNotifications((prev) => [reviewNotif, ...prev]);
    }

    if (isSupabaseConfigured) {
      try {
        const stats = await supabaseService.updateProductRatingStats(productId);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, rating: stats.average, reviewsCount: stats.count } : p
          )
        );
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct((prev) => prev ? { ...prev, rating: stats.average, reviewsCount: stats.count } : null);
        }
        // Fetch updated reviews list
        const dbReviews = await supabaseService.getAllProductRatings();
        if (dbReviews) {
          setAllReviews(dbReviews);
        }
      } catch (err) {
        console.error('Error updating rating stats on review:', err);
      }
    }
  };

  // Filters logic - now fully delegating to Supabase queries
  const filteredProducts = products;

  const isAdvancedFilteringActive = 
    filterPriceMin !== '' || 
    filterPriceMax !== '';

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation Drawer */}
      <NavigationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentUser={currentUser}
        onOpenContribution={() => setIsContributionModalOpen(true)}
        onNavigate={(view) => {
          navigateTo(view, view === 'profile' ? currentUser : null);
        }}
        onLogout={() => {
          handleUserChange(null);
          setCurrentView('market');
        }}
        settings={appSettings}
      />

      {/* Role and Account Selector Panel */}
      <RoleSwitcher currentUser={currentUser} users={users} onUserChange={handleUserChange} />

      {/* Primary Navigation Header */}
      <Navbar
        currentUser={currentUser}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={(id) => {
          setActiveCategoryId(id);
          setCurrentView('market');
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenNotifications={() => navigateTo('notifications')}
        unreadNotificationsCount={notifications.filter((n) => currentUser && n.userId === currentUser.id && !n.read).length}
        orders={orders}
        onOpenSellerDashboard={() => navigateTo('seller-dashboard')}
        favoritesCount={favorites.length}
        onShowFavoritesOnly={(show) => {
          setShowFavoritesOnly(show);
          setCurrentView('market');
        }}
        showFavoritesOnly={showFavoritesOnly}
        onOpenMenu={() => setIsMenuOpen(true)}
        settings={appSettings}
        showSearchAndCategories={currentView === 'market' && activeMarketTab === 'all'}
      />

      {/* Dynamic Back Button Indicator */}
      {viewHistory.length > 0 && (
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 sticky top-[60px] z-20 font-sans">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
            >
              <ChevronRight className="w-4 h-4 text-amber-500" />
              <span>🔙 العودة للصفحة السابقة</span>
            </button>
            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
              تصفح مرن دون فقدان المسار في سوق فيلوريا
            </span>
          </div>
        </div>
      )}

      {/* Role Navigation Dashboard Subbar */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 shrink-0 font-sans">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => navigateTo('market')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                currentView === 'market'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300'
              }`}
            >
              🛍️ تصفح السوق العام
            </button>

            <button
              onClick={() => navigateTo('seller-dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                currentView === 'seller-dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300'
              }`}
            >
              🏪 لوحة إدارة متجري ومبيعاتي
            </button>

            {(currentUser.role === 'moderator' || currentUser.role === 'admin') && (
              <button
                onClick={() => navigateTo('moderator-panel')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  currentView === 'moderator-panel'
                    ? 'bg-orange-500 text-white font-black shadow-xs'
                    : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                }`}
              >
                🛡️ لوحة المشرفين
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin-panel')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  currentView === 'admin-panel'
                    ? 'bg-indigo-600 text-white font-black shadow-xs'
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                👑 بوابة الإدارة الشاملة
              </button>
            )}
          </div>
        </div>
      )}

      {/* Market Tabs Sub-navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 shrink-0 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs justify-start md:justify-center scrollbar-none">
          <button
            onClick={() => {
              setActiveMarketTab('all');
              setCurrentView('market');
            }}
            className={`px-4 py-2 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'market' && activeMarketTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
            }`}
          >
            🛍️ السوق العام
          </button>

          <button
            onClick={() => {
              setActiveMarketTab('top-rated');
              setCurrentView('market');
            }}
            className={`px-4 py-2 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'market' && activeMarketTab === 'top-rated'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
            }`}
          >
            ⭐ الأعلى تقييماً
          </button>

          <button
            onClick={() => {
              setActiveMarketTab('newest');
              setCurrentView('market');
            }}
            className={`px-4 py-2 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'market' && activeMarketTab === 'newest'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
            }`}
          >
            🆕 المضافة حديثاً
          </button>

          <button
            onClick={() => {
              setActiveMarketTab('most-viewed');
              setCurrentView('market');
            }}
            className={`px-4 py-2 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'market' && activeMarketTab === 'most-viewed'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
            }`}
          >
            🔥 الأكثر مشاهدة
          </button>

          {/* Reserved space for Offers button in the future */}
          <button
            disabled
            className="px-4 py-2 rounded-xl font-extrabold transition-all shrink-0 opacity-40 cursor-not-allowed flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850/50 text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800"
          >
            🏷️ العروض (قريباً)
          </button>
        </div>
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 font-sans">
        {currentUser && (currentUser.status === 'suspended' || currentUser.status === 'banned') ? (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 text-right rtl">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-black text-rose-600">عذراً، تم تعديل حالة حسابك</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                قام مشرف أو مدير نظام منصة <strong>VELORIA</strong> بوضع حسابك في حالة{' '}
                <strong className="text-rose-600">
                  {currentUser.status === 'suspended' ? 'تعليق مؤقت' : 'حظر دائم'}
                </strong>{' '}
                بسبب ارتكاب مخالفة لشروط الاستخدام والبيع العادل.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-extrabold text-slate-800 dark:text-white">تفاصيل الإجراء:</span>
              <p className="mt-1">
                {currentUser.status === 'suspended'
                  ? 'تم تعليق الحساب لمراجعة النشاط والتحقق من شكاوى العملاء المرفوعة ضد متجرك.'
                  : 'تم حظر الحساب بشكل كامل ونهائي لانتهاك قواعد النزاهة وحماية المشترين.'}
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                تسجيل الخروج للتصفح كزائر
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 1: Market (Home & Browse) */}
            {currentView === 'market' && (
              (() => {
                console.log("===== RENDER MARKET =====");
                console.log("products state =", products.length);
                console.log(products);
                console.log("currentView =", currentView);
                console.log("activeMarketTab =", activeMarketTab);
                console.log("currentUser =", currentUser);
                return null;
              })() || (
          <div className="space-y-8">
            {/* Slogan Banner */}
            <div className="bg-slate-100 dark:bg-slate-900/40 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Background geometric flare */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

              <div className="space-y-2 text-right">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full tracking-wider border border-amber-500/15">
                  <Sparkles className="w-3 h-3" />
                  منصة مجانية ومفتوحة للجميع
                </span>
                <h2 className="text-xl md:text-2xl font-black leading-tight text-slate-800 dark:text-white">
                  فيلوريا (VELORIA) — حيث يلتقي البائع بالمشتري ✨
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  أنشئ متجرك واعرض منتجاتك مجاناً وبدون أي عمولات على المبيعات. نحن نوفر بيئة عادلة تضمن للجميع تكافؤ الفرص وتبني الثقة من خلال تقييمات العملاء والسمعة الطيبة.
                </p>
              </div>

              {/* Quick stats on banner */}
              <div className="grid grid-cols-2 gap-4 shrink-0 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {products.filter((p) => p.status === 'active' || p.status === 'sold').length}
                  </span>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">المنتجات (نشطة ومباعة)</p>
                </div>
                <div className="text-center">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{users.length}</span>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">تجار موثوقين</p>
                </div>
              </div>
            </div>

            {/* Toolbar: Products Count & Sort Selector */}
            {activeMarketTab === 'all' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 font-sans shadow-2xs">
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold">المنتجات المعروضة:</span>
                    <span className="text-xs font-black text-amber-500 mr-1.5">
                      {products.filter((p) => p.status === 'active').length} نشط 
                      {products.filter((p) => p.status === 'sold').length > 0 && ` (${products.filter((p) => p.status === 'sold').length} مباع)`}
                    </span>
                  </div>
                  {isLoadingProducts && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      <span>جاري التحديث...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {/* Advanced Filters Button */}
                  <button
                    id="btn-toggle-filter-panel"
                    onClick={() => setIsFilterPanelExpanded(!isFilterPanelExpanded)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isFilterPanelExpanded 
                        ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm font-black' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>فلاتر متقدمة</span>
                    {isAdvancedFilteringActive && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>

                  <span className="text-xs text-slate-500 font-bold shrink-0">ترتيب حسب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer w-full sm:w-44"
                  >
                    <option value="newest">الأحدث (الافتراضي)</option>
                    <option value="oldest">الأقدم</option>
                    <option value="price-desc">الأعلى سعراً</option>
                    <option value="price-asc">الأقل سعراً</option>
                    <option value="top-rated">الأعلى تقييماً</option>
                    <option value="most-viewed">الأكثر مشاهدة</option>
                  </select>
                </div>
              </div>
            )}

            {/* Advanced Product Filter Panel */}
            {activeMarketTab === 'all' && isFilterPanelExpanded && (
              <ProductFilterPanel
                priceMin={filterPriceMin}
                setPriceMin={setFilterPriceMin}
                priceMax={filterPriceMax}
                setPriceMax={setFilterPriceMax}
                onClearAll={() => {
                  setFilterPriceMin('');
                  setFilterPriceMax('');
                }}
              />
            )}

            {/* Active Filters Bar */}
            {activeMarketTab === 'all' && (activeCategoryId || searchTerm.trim() !== '' || showFavoritesOnly || isAdvancedFilteringActive) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs text-right shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-slate-500 font-bold ml-1">الفلاتر النشطة:</span>
                  
                  {activeCategoryId && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full text-[10px]">
                      <span>قسم: {categories.find((c) => c.id === activeCategoryId)?.name}</span>
                      <button onClick={() => setActiveCategoryId(null)} className="hover:text-rose-500 font-bold font-mono text-[11px] cursor-pointer">×</button>
                    </span>
                  )}
                  {searchTerm.trim() !== '' && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 rounded-full text-[10px]">
                      <span>بحث عن: "{searchTerm}"</span>
                      <button onClick={() => setSearchTerm('')} className="hover:text-rose-500 font-bold font-mono text-[11px] cursor-pointer">×</button>
                    </span>
                  )}
                  {showFavoritesOnly && (
                    <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 font-bold px-2.5 py-1 rounded-full text-[10px]">
                      <span>المفضلة فقط ❤️</span>
                      <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-rose-500 font-bold font-mono text-[11px] cursor-pointer">×</button>
                    </span>
                  )}

                  {/* Advanced Filters badges with individual close button */}
                  {filterPriceMin !== '' && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full text-[10px]">
                      <span>السعر من: {filterPriceMin} ل.س</span>
                      <button onClick={() => setFilterPriceMin('')} className="hover:text-rose-500 font-bold font-mono text-[11px] cursor-pointer">×</button>
                    </span>
                  )}
                  {filterPriceMax !== '' && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full text-[10px]">
                      <span>السعر إلى: {filterPriceMax} ل.س</span>
                      <button onClick={() => setFilterPriceMax('')} className="hover:text-rose-500 font-bold font-mono text-[11px] cursor-pointer">×</button>
                    </span>
                  )}

                </div>

                <button
                  onClick={() => {
                    setActiveCategoryId(null);
                    setSearchTerm('');
                    setShowFavoritesOnly(false);
                    setFilterPriceMin('');
                    setFilterPriceMax('');
                    setFilterProvince('');
                    setFilterCity('');
                    setFilterCondition('');
                    setFilterDelivery('all');
                    setFilterFeatured(false);
                    setFilterVerified(false);
                    setFilterHasOffer(false);
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-[11px] cursor-pointer shrink-0"
                >
                  إعادة تعيين الكل ×
                </button>
              </div>
            )}

            {/* View Dispatcher inside Market */}
            {activeMarketTab === 'all' && (activeCategoryId || searchTerm.trim() !== '' || showFavoritesOnly || isAdvancedFilteringActive) ? (
              // Search / Categorized product list
              filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-6 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-extrabold text-slate-700 dark:text-slate-300">لم يتم العثور على نتائج</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    لم نجد أي منتجات تطابق معايير البحث أو الفلتر النشط حالياً. جرب البحث عن كلمة أخرى أو تصفح الأقسام الأخرى.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategoryId(null);
                      setSearchTerm('');
                      setShowFavoritesOnly(false);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    العودة للسوق بالكامل
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      isFavorite={favorites.includes(prod.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onViewDetails={handleViewProduct}
                      currentUser={currentUser}
                      users={users}
                      onVisitStore={(seller) => navigateTo('profile', seller)}
                    />
                  ))}
                </div>
              )
            ) : (
              // Default Homepage Layout (with required sections)
              <div className="space-y-10 text-right">
                
                {/* Tab: السوق العام */}
                {activeMarketTab === 'all' && (
                  <>
                    {/* 1. Suggested Stores Section (المتاجر المقترحة) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setCurrentView('shops')}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold"
                        >
                          تصفح دليل المتاجر كاملة ←
                        </button>
                        <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                          متاجر مقترحة وموثوقة
                          <Store className="w-4.5 h-4.5 text-amber-500" />
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {users.slice(0, 3).map((seller) => {
                          const sellerProdsCount = products.filter(p => p.sellerId === seller.id).length;
                          return (
                            <div 
                              key={seller.id}
                              className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/80 rounded-2xl hover:border-amber-500/20 transition-all flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <img src={seller.avatar} className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800" />
                                <div className="space-y-1 text-right">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">{seller.name}</h4>
                                    {seller.badges.includes('verified') && (
                                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.2 rounded-full font-bold">موثوق</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400">المنتجات النشطة: {sellerProdsCount} إعلان</p>
                                  <div className="text-[10px] text-amber-500 font-bold">⭐ {seller.ratingAverage || '4.9'} ({seller.ratingsCount || '15'})</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedProfileUser(seller);
                                  setCurrentView('profile');
                                }}
                                className="text-[10px] font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl cursor-pointer shrink-0 transition-colors"
                              >
                                زيارة المتجر
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. All Active Products Section (سوق فيلوريا العام) */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold">تصفح التشكيلة الكاملة من المعروضات</span>
                        <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                          سوق فيلوريا العام
                          <ShoppingBag className="w-4.5 h-4.5 text-amber-500" />
                        </h3>
                      </div>

                      {products.length === 0 ? (
                        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                          لا توجد منتجات نشطة حالياً في السوق.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {products.map((prod) => (
                            <ProductCard
                              key={`market-all-${prod.id}`}
                              product={prod}
                              isFavorite={favorites.includes(prod.id)}
                              onToggleFavorite={handleToggleFavorite}
                              onViewDetails={handleViewProduct}
                              currentUser={currentUser}
                              users={users}
                              onVisitStore={(seller) => navigateTo('profile', seller)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Tab: الأعلى تقييماً */}
                {activeMarketTab === 'top-rated' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">المنتجات الأكثر مصداقية وثقة من العملاء</span>
                      <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                        الأعلى تقييماً في السوق
                        <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500/20" />
                      </h3>
                    </div>

                    {products.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                        لا توجد منتجات نشطة حالياً.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((prod) => (
                          <ProductCard
                            key={`tab-rated-${prod.id}`}
                            product={prod}
                            isFavorite={favorites.includes(prod.id)}
                            onToggleFavorite={handleToggleFavorite}
                            onViewDetails={handleViewProduct}
                            currentUser={currentUser}
                            users={users}
                            onVisitStore={(seller) => navigateTo('profile', seller)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: المضافة حديثاً */}
                {activeMarketTab === 'newest' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">أحدث الإعلانات والمنتجات المضافة حديثاً</span>
                      <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                        المضافة حديثاً
                        <PlusCircle className="w-4.5 h-4.5 text-amber-500" />
                      </h3>
                    </div>

                    {products.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                        لا توجد منتجات نشطة حالياً.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((prod) => (
                          <ProductCard
                            key={`tab-newest-${prod.id}`}
                            product={prod}
                            isFavorite={favorites.includes(prod.id)}
                            onToggleFavorite={handleToggleFavorite}
                            onViewDetails={handleViewProduct}
                            currentUser={currentUser}
                            users={users}
                            onVisitStore={(seller) => navigateTo('profile', seller)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: الأكثر مشاهدة */}
                {activeMarketTab === 'most-viewed' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">المنتجات النشطة الأكثر رواجاً وزيارة</span>
                      <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                        الأكثر مشاهدة وتفاعلاً
                        <Flame className="w-4.5 h-4.5 text-amber-500 fill-amber-500/20" />
                      </h3>
                    </div>

                    {products.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                        لا توجد منتجات نشطة حالياً.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((prod) => (
                          <ProductCard
                            key={`tab-most-viewed-${prod.id}`}
                            product={prod}
                            isFavorite={favorites.includes(prod.id)}
                            onToggleFavorite={handleToggleFavorite}
                            onViewDetails={handleViewProduct}
                            currentUser={currentUser}
                            users={users}
                            onVisitStore={(seller) => navigateTo('profile', seller)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        ))}

        {/* VIEW 2: Categories view listing */}
        {currentView === 'categories' && (
          <CategoriesView
            categories={categories}
            onSelectCategory={(id) => {
              setActiveCategoryId(id);
              setCurrentView('market');
            }}
            productsCountByCategory={(catId) => allActiveProducts.filter((p) => p.categoryId === catId).length}
          />
        )}

        {/* VIEW 3: Shops directory list */}
        {currentView === 'shops' && (
          <ShopsView
            users={users}
            products={allActiveProducts}
            currentUser={currentUser}
            onFollow={handleToggleFollow}
            followedSellers={followedSellers}
            onVisitShop={(seller) => {
              setSelectedProfileUser(seller);
              setCurrentView('profile');
            }}
            onStartChat={(sellerId) => {
              setIsChatOpen(true);
            }}
          />
        )}

        {/* VIEW 4: Search View */}
        {currentView === 'search' && (
          <SearchView
            products={products}
            categories={categories}
            users={users}
            currentUser={currentUser}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onViewProduct={handleViewProduct}
            initialCategoryId={activeCategoryId || 'all'}
            initialQuery={searchTerm}
            onVisitStore={(seller) => navigateTo('profile', seller)}
          />
        )}

        {/* VIEW 5: Add Product Form */}
        {currentView === 'add-product' && (
          <AddProductView
            categories={categories}
            currentUser={currentUser}
            onAddProduct={async (productData) => {
              await handleAddProduct(productData);
              setCurrentView('market');
            }}
          />
        )}

        {/* VIEW 6: Profile & Store View */}
        {currentView === 'profile' && (
          <ProfileView
            profileUser={selectedProfileUser || currentUser || users[0]}
            products={products}
            currentUser={currentUser}
            onFollow={handleToggleFollow}
            followedSellers={followedSellers}
            onStartChat={(sellerId) => {
              setIsChatOpen(true);
            }}
            onUpdateProfile={(updatedUser) => {
              handleUpdateUser(updatedUser);
              if (currentUser && currentUser.id === updatedUser.id) {
                if (updatedUser.status === 'deactivated') {
                  setCurrentUser(null);
                  setCurrentView('market');
                  setSelectedProfileUser(null);
                  return;
                }
                setCurrentUser(updatedUser);
              }
              setSelectedProfileUser(updatedUser);
            }}
            onViewProduct={handleViewProduct}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
            users={users}
            reports={reports}
            verificationRequests={verificationRequests}
            onSubmitVerification={handleSubmitVerification}
          />
        )}

        {/* VIEW 7: Orders Page */}
        {currentView === 'orders' && (
          <OrdersView
            orders={orders}
            currentUser={currentUser}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onStartChat={(userId) => {
              setIsChatOpen(true);
            }}
          />
        )}

        {/* VIEW 8: Favorites View */}
        {currentView === 'favorites' && (
          <div className="space-y-6 text-right">
            <h2 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center justify-end gap-2">
              المنتجات المفضلة لديك ❤️
            </h2>
            {favorites.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                قائمتك المفضلة فارغة حالياً. اضغط على أيقونة القلب على المنتجات لإضافتها هنا.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.filter(p => favorites.includes(p.id)).map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    onViewDetails={handleViewProduct}
                    currentUser={currentUser}
                    users={users}
                    onVisitStore={(seller) => navigateTo('profile', seller)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 9: Following Shops */}
        {currentView === 'following' && (
          <div className="space-y-6 text-right font-sans">
            <h2 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center justify-end gap-2">
              المتاجر التي تتابعها 🏪
            </h2>
            {followedSellers.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                لم تقم بمتابعة أي متاجر بعد. تصفح ملفات التجار واضغط على "متابعة المتجر" ليصلك كل جديد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.filter(u => followedSellers.includes(u.id)).map(seller => {
                  const sellerProdsCount = products.filter(p => p.sellerId === seller.id).length;
                  return (
                    <div 
                      key={seller.id} 
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img src={seller.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" />
                        <div className="space-y-0.5 text-right">
                          <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">{seller.name}</h3>
                          <p className="text-[10px] text-slate-400">@{seller.username || seller.id}</p>
                          <p className="text-[10px] text-amber-500 font-bold">⭐ {seller.ratingAverage} • {sellerProdsCount} منتج نشط</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProfileUser(seller);
                          setCurrentView('profile');
                        }}
                        className="bg-amber-500 hover:bg-amber-650 text-slate-950 text-[10px] font-black px-3.5 py-2 rounded-xl cursor-pointer"
                      >
                        عرض المتجر الكامل
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 10: Notifications feed */}
        {currentView === 'notifications' && (
          <NotificationsView
            notifications={notifications.filter(n => n.userId === (currentUser?.id || 'visitor'))}
            onMarkAllAsRead={() => {
              const currentUserId = currentUser?.id || 'visitor';
              setNotifications(prev =>
                prev.map(n => n.userId === currentUserId ? { ...n, read: true } : n)
              );
            }}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            setNotifications={setNotifications}
            currentUser={currentUser}
          />
        )}

        {/* VIEW 13: Settings View */}
        {currentView === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            onUpdateProfile={(updatedUser) => {
              handleUpdateUser(updatedUser);
              if (currentUser && currentUser.id === updatedUser.id) {
                setCurrentUser(updatedUser);
              }
            }}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        )}

        {/* VIEW 11: Login View */}
        {currentView === 'login' && (
          <LoginView
            onLogin={(user) => {
              setCurrentUser(user);
              setCurrentView('market');
            }}
            onNavigateToRegister={() => {
              setCurrentView('register');
            }}
          />
        )}

        {/* VIEW 11.5: Reset Password View */}
        {currentView === 'reset-password' && (
          <ResetPasswordView
            onComplete={async () => {
              if (isSupabaseConfigured) {
                await supabaseService.signOut();
              }
              setCurrentUser(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.origin + window.location.pathname);
              }
              setCurrentView('login');
            }}
            onNavigateToLogin={async () => {
              if (isSupabaseConfigured) {
                await supabaseService.signOut();
              }
              setCurrentUser(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.origin + window.location.pathname);
              }
              setCurrentView('login');
            }}
          />
        )}

        {/* VIEW 12: Register View */}
        {currentView === 'register' && (
          <RegisterView
            onRegister={(newUser) => {
              setUsers((prev) => [...prev, newUser]);
              setCurrentUser(newUser);
              setCurrentView('market');
            }}
            onNavigateToLogin={() => {
              setCurrentView('login');
            }}
            onViewLegal={() => {
              setCurrentView('legal');
            }}
          />
        )}

        {/* VIEW 13: Legal Pages View */}
        {currentView === 'legal' && (
          <LegalView settings={appSettings} />
        )}

        {/* VIEW 13.5: Contact Us View */}
        {currentView === 'contact' && (
          <ContactView
            currentUser={currentUser}
            onSubmitMessage={handleSubmitContactMessage}
            onNavigateToLegal={() => setCurrentView('legal')}
            settings={appSettings}
          />
        )}

        {/* VIEW 14: Seller Dashboard */}
        {currentView === 'seller-dashboard' && currentUser && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('market')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
              <span>العودة للتصفح الرئيسي</span>
            </button>
            <SellerDashboard
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              products={products}
              categories={categories}
              orders={orders}
              onAddProduct={handleAddProduct}
              onUpdateProductStatus={handleUpdateProductStatus}
              onDeleteProduct={handleDeleteProduct}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateProduct={handleUpdateProduct}
            />
          </div>
        )}

        {/* VIEW 15: Moderator Panel */}
        {currentView === 'moderator-panel' && currentUser && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('market')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
              <span>العودة للتصفح الرئيسي</span>
            </button>
            <ModeratorPanel
              currentUser={currentUser}
              reports={reports}
              products={products}
              onResolveReport={handleResolveReport}
              onUpdateProductStatus={handleUpdateProductStatus}
              onDeleteProduct={handleDeleteProduct}
              setUsers={setUsers}
              setProducts={setProducts}
              setReports={setReports}
              verificationRequests={verificationRequests}
              onUpdateVerificationStatus={handleUpdateVerificationStatus}
              users={users}
            />
          </div>
        )}

        {/* VIEW 16: Admin Panel */}
        {currentView === 'admin-panel' && currentUser && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('market')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
              <span>العودة للتصفح الرئيسي</span>
            </button>
            <AdminPanel
              currentUser={currentUser}
              users={users}
              categories={categories}
              products={products}
              reports={reports}
              contributions={contributions}
              onReviewContribution={handleReviewContribution}
              onUpdateUserBadges={handleUpdateUserBadges}
              onAddCategory={handleAddCategory}
              setUsers={setUsers}
              setProducts={setProducts}
              setCategories={setCategories}
              setReports={setReports}
              setOrders={setOrders}
              shamCashAccount={shamCashAccount}
              onUpdateShamCashAccount={handleUpdateShamCashAccount}
              verificationRequests={verificationRequests}
              onUpdateVerificationStatus={handleUpdateVerificationStatus}
              contactMessages={contactMessages}
              setContactMessages={setContactMessages}
              appSettings={appSettings}
              onUpdateAppSettings={handleUpdateAppSettings}
              orders={orders}
              messages={messages}
              setMessages={setMessages}
              notifications={notifications}
              setNotifications={setNotifications}
              setContributions={setContributions}
              setVerificationRequests={setVerificationRequests}
              onSelectProduct={setSelectedProduct}
              onSelectSeller={(seller) => navigateTo('profile', seller)}
            />
          </div>
        )}
          </>
        )}
      </main>

      {/* Floating Footer Philosophy */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 py-8 px-4 text-center mt-12 text-xs text-slate-400 leading-relaxed shrink-0 font-sans">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="font-extrabold text-slate-700 dark:text-slate-300">
            🛡️ فيلوريا (VELORIA) — منصة ربط حر ومفتوح بين البائع والمشتري
          </p>
          <p className="max-w-2xl mx-auto">
            تعتمد المنصة على السمعة والثقة وبناء علاقات تجارية صحيحة ومتبادلة. لا يتم خصم أي عمولات على عمليات البيع، ولا تتدخل المنصة في آليات الدفع أو التوصيل أو تتبع الشحنات حفاظاً على اللامركزية وتخفيف التكاليف عن أصحاب المهن اليدوية والمشاريع المنزلية.
          </p>
          <div className="text-[10px] text-amber-500 font-bold">
            جميع الحقوق محفوظة © {new Date().getFullYear()} VELORIA
          </div>
        </div>
      </footer>

      {/* MODAL: Product Details Expanded view */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          currentUser={currentUser}
          onClose={() => setSelectedProduct(null)}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={favorites.includes(selectedProduct.id)}
          onAddReview={handleAddReview}
          onSendOrder={handleSendOrder}
          onSendMessage={handleSendMessage}
          onSendReport={handleSendReport}
          onToggleFollow={handleToggleFollow}
          isFollowing={followedSellers.includes(selectedProduct.sellerId)}
          users={users}
          onVisitStore={(seller) => navigateTo('profile', seller)}
        />
      )}

      {/* MODAL / DRAWER: P2P Chat System */}
      {isChatOpen && currentUser && (
        <ChatModal
          currentUser={currentUser}
          messages={messages}
          users={users}
          onSendMessage={handleSendMessage}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* MODAL: Contribution system popup */}
      {isContributionModalOpen && (
        <ContributionModal
          isOpen={isContributionModalOpen}
          onClose={() => setIsContributionModalOpen(false)}
          onConfirmTransfer={handleConfirmTransfer}
          accountNumber={shamCashAccount}
        />
      )}

      {/* Hide Product Modal */}
      <HideProductModal
        isOpen={hideProductModal.isOpen}
        onClose={() => setHideProductModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={(reason) => {
          executeUpdateProductStatus(hideProductModal.productId, hideProductModal.status, reason);
        }}
      />

      {/* Delete Product Modal */}
      <AdminPromptModal
        isOpen={deleteProductModal.isOpen}
        title="حذف المنتج"
        description="يرجى كتابة سبب حذف المنتج. سيتم إرسال هذا السبب إلى التاجر ضمن الإشعار."
        placeholder="مثال: انتهاك شروط البيع، منتج مكرر..."
        cancelLabel="إلغاء"
        confirmLabel="تأكيد الحذف"
        onClose={() => setDeleteProductModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={(reason) => {
          executeDeleteProduct(deleteProductModal.productId, reason);
        }}
      />
    </div>
  );
}
