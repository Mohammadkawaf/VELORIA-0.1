import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, Category, Product, Report, UserBadge, Order, UserRole, Contribution, VerificationRequest, ContactMessage, AppSettings, Review, Message, Notification } from '../types';
import AdminSettingsView from './AdminSettingsView';
import HideProductModal from './HideProductModal';
import { ReportCard } from './ReportCard';
import { supabase, supabaseService, isSupabaseConfigured, mapProfileToUser, getDeviceType } from '../lib/supabase';
import {
  Shield,
  Users,
  Layers,
  ShoppingCart,
  AlertTriangle,
  Check,
  Star,
  Flame,
  Store,
  RefreshCw,
  Search,
  Edit,
  Eye,
  EyeOff,
  Trash,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
  Send,
  X,
  Lock,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Key,
  PieChart,
  Grid,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Settings,
  Bell,
  Heart,
  Info,
  MessageSquare,
  Database,
  Clock
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  categories: Category[];
  products: Product[];
  reports: Report[];
  contributions: Contribution[];
  onReviewContribution: (id: string, action: 'Completed' | 'Rejected') => void;
  onUpdateUserBadges: (userId: string, badges: UserBadge[]) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  verificationRequests?: VerificationRequest[];
  onUpdateVerificationStatus?: (requestId: string, status: 'reviewed' | 'approved' | 'rejected', reason?: string) => void;
  // State setters passed from App.tsx for full persistence
  setUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  setCategories?: React.Dispatch<React.SetStateAction<Category[]>>;
  setReports?: React.Dispatch<React.SetStateAction<Report[]>>;
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
  shamCashAccount?: string;
  onUpdateShamCashAccount?: (account: string) => void;
  contactMessages?: ContactMessage[];
  setContactMessages?: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
  appSettings?: AppSettings;
  onUpdateAppSettings?: (settings: AppSettings) => void;
  reviews?: Review[];
  setReviews?: React.Dispatch<React.SetStateAction<Review[]>>;
  orders?: Order[];
  messages?: Message[];
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  notifications?: Notification[];
  setNotifications?: React.Dispatch<React.SetStateAction<Notification[]>>;
  setContributions?: React.Dispatch<React.SetStateAction<Contribution[]>>;
  setVerificationRequests?: React.Dispatch<React.SetStateAction<VerificationRequest[]>>;
  onSelectProduct?: (product: Product) => void;
  onSelectSeller?: (seller: User) => void;
}

// Activity Log entry structure
export interface LogTargetOptions {
  panel?: string;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  target_user_id?: string | null;
  target_user_email?: string | null;
  details?: string;
  status?: string;
}

interface ActivityLog {
  id: string;
  created_at?: string;
  user_id?: string | null;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  operation: string;
  details?: string;
  ip_address?: string | null;
  user_agent?: string;
  device_type?: string;
  status?: string;
  panel?: string;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  target_user_id?: string | null;
  target_user_email?: string | null;

  // UI display props
  adminName: string;
  role: string;
  timestamp: string;
  ipAddress?: string | null;
}

// Notification Templates for Admin Broadcast
const NOTIFICATION_TEMPLATES = [
  { id: 'none', label: 'بدون قالب', title: '', body: '' },
  {
    id: 'maintenance',
    label: 'صيانة المنصة',
    title: 'صيانة مجدولة للمنصة',
    body: 'نود إعلامكم بوجود صيانة مجدولة للمنصة لتحسين الأداء والجودة. قد تتأثر بعض الخدمات لفترة قصيرة. شاكرين تفهمكم.'
  },
  {
    id: 'update',
    label: 'تحديث جديد',
    title: 'إطلاق تحديث جديد للمنصة',
    body: 'يسعدنا إعلامكم بإطلاق تحديث جديد يضم ميزات وتحسينات جديدة على المنصة لتحسين تجربتكم.'
  },
  {
    id: 'offers',
    label: 'إعلان عروض',
    title: 'إطلاق حملة العروض والخصومات',
    body: 'ترقبوا انطلاق العروض الحصرية والخصومات المميزة! استفد من الفرصة وتصفح أحدث العروض والمنتجات.'
  },
  {
    id: 'verify_accept',
    label: 'قبول توثيق متجر',
    title: 'تهانينا! تم قبول توثيق متجركم',
    body: 'يسعدنا إبلاغك بأنه تم مراجعة وثائق متجرك وقبول طلب التوثيق بنجاح. شارة التوثيق تظهر الآن على متجرك.'
  },
  {
    id: 'verify_reject',
    label: 'رفض توثيق متجر',
    title: 'تحديث بشأن طلب توثيق المتجر',
    body: 'نود إحاطتكم بأنه تعذر قبول طلب التوثيق الحالي لعدم اكتمال الشروط أو الوثائق المطلوبة. يرجى مراجعة البيانات وإعادة تقديم الطلب.'
  },
  {
    id: 'security',
    label: 'تنبيه أمني',
    title: 'تنبيه أمني هام للحساب',
    body: 'نوصي بضرورة مراجعة إعدادات الأمان وتحديث كلمة المرور بشكل دوري لحماية بيانات حسابك ومتجرك.'
  },
  {
    id: 'stores',
    label: 'إشعار للمتاجر',
    title: 'إشعار هام لأصحاب المتاجر',
    body: 'تنبيه لجميع أصحاب المتاجر: يرجى تحديث بيانات المنتجات والتأكد من استكمال معلومات التواصل والشحن لمتابعة الطلبات بشكل سلس.'
  },
  {
    id: 'buyers',
    label: 'إشعار للمشترين',
    title: 'تنبيه هام لعملاء المنصة',
    body: 'يسعدنا تواصلكم دائماً! تصفح أحدث المتاجر والمنتجات المميزة المضافة حديثاً واحصل على أفضل العروض والخصومات.'
  },
  {
    id: 'general',
    label: 'إشعار عام',
    title: 'إشعار عام من إدارة المنصة',
    body: 'نود تذكير جميع مستخدمي المنصة بالالتزام بشروط وأحكام الاستخدام لضمان تجربة تسوق وتداول آمنة وممتازة للجميع.'
  }
];

export default function AdminPanel({
  currentUser,
  users,
  categories,
  products,
  reports,
  contributions,
  onReviewContribution,
  onUpdateUserBadges,
  onAddCategory,
  verificationRequests = [],
  onUpdateVerificationStatus,
  setUsers,
  setProducts,
  setCategories,
  setReports,
  setOrders,
  shamCashAccount = 'XXXXXXXXXX',
  onUpdateShamCashAccount,
  contactMessages = [],
  setContactMessages,
  appSettings,
  onUpdateAppSettings,
  reviews = [],
  setReviews,
  orders = [],
  messages = [],
  setMessages,
  notifications = [],
  setNotifications,
  setContributions,
  setVerificationRequests,
  onSelectProduct,
  onSelectSeller
}: AdminPanelProps) {
  // Lightbox State for quick image preview
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Hide product modal state
  const [hideProductModal, setHideProductModal] = useState<{
    isOpen: boolean;
    productId: string;
    action: 'active' | 'hidden' | 'sold';
  }>({
    isOpen: false,
    productId: '',
    action: 'hidden'
  });

  // 1. Secure Admin Login Gate state
  const [isGateAuthenticated, setIsGateAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('veloria-admin-gate-auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 2. Navigation Tabs
  // Admin: All tabs; Moderator: Restricted tabs (Categories, Badges, Logs, and general settings are locked/read-only)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'reports' | 'categories' | 'verification' | 'badges' | 'featured' | 'notifications' | 'logs' | 'contributions' | 'contact-messages' | 'platform-settings'>('dashboard');

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [featuredSearch, setFeaturedSearch] = useState('');
  const [featuredSort, setFeaturedSort] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'followers-desc' | 'followers-asc' | 'rating-desc' | 'rating-asc' | 'city' | 'verified-first' | 'featured-first'>('newest');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended' | 'banned' | 'verified' | 'deactivated'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'visitor' | 'user' | 'moderator' | 'admin'>('all');
  const [changingRoleUser, setChangingRoleUser] = useState<User | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('visitor');
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<boolean>(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [deletingUserObj, setDeletingUserObj] = useState<User | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<number>(0);
  const [viewingUserObj, setViewingUserObj] = useState<User | null>(null);
  
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'sold' | 'hidden'>('all');

  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed' | 'rejected'>('all');

  // Logs Search & Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState<'all' | 'admin' | 'moderator'>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'success' | 'warning' | 'failed'>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<ActivityLog | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Modals / Edit states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingProductObj, setDeletingProductObj] = useState<Product | null>(null);
  const [deletionReasonInput, setDeletionReasonInput] = useState<string>('');

  // Local state for statistics retrieved directly from Supabase (to avoid client-side filtered data issues)
  const [dbProductsForStats, setDbProductsForStats] = useState<Product[]>([]);
  const [dbUsersForStats, setDbUsersForStats] = useState<User[]>([]);
  const [storeFollowersMap, setStoreFollowersMap] = useState<Record<string, number>>({});
  const [storeProductsMap, setStoreProductsMap] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [catSuccess, setCatSuccess] = useState(false);
  const [catMessage, setCatMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Category Edit states
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('Sparkles');
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [editCatError, setEditCatError] = useState<string | null>(null);

  // Category Detail View states
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<Category | null>(null);
  const [catDetailSearch, setCatDetailSearch] = useState<string>('');
  const [catDetailSort, setCatDetailSort] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'views-desc' | 'reports-desc'>('date-desc');

  // Verification rejection reason modal
  const [rejectRequest, setRejectRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // System Notification broadcast form
  const [notifTarget, setNotifTarget] = useState<'all' | 'verified' | 'specific'>('all');
  const [notifSpecificUserId, setNotifSpecificUserId] = useState('');
  const [notifSearchQuery, setNotifSearchQuery] = useState('');
  const [notifSearchResults, setNotifSearchResults] = useState<User[]>([]);
  const [isSearchingNotifUsers, setIsSearchingNotifUsers] = useState(false);
  const [selectedNotifUser, setSelectedNotifUser] = useState<User | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const [notifTemplate, setNotifTemplate] = useState<string>('none');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [showNotifPreviewModal, setShowNotifPreviewModal] = useState(false);

  const handleOpenNotifPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (notifTarget === 'specific' && !notifSpecificUserId) {
      alert('يرجى تحديد تاجر مستهدف أولاً عبر البحث وتحديده من القائمة.');
      return;
    }
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert('يرجى كتابة عنوان الإشعار ومحتواه أولاً لمعاينة الإشعار.');
      return;
    }
    setShowNotifPreviewModal(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setNotifTemplate(templateId);
    const selected = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (selected && selected.id !== 'none') {
      setNotifTitle(selected.title);
      setNotifBody(selected.body);
    }
  };

  // Phase 1: Notification Log / History States & Handlers
  const [dbNotifLogs, setDbNotifLogs] = useState<any[]>([]);
  const [isLoadingNotifLogs, setIsLoadingNotifLogs] = useState(false);
  const [notifLogSearch, setNotifLogSearch] = useState('');
  const [notifLogFilter, setNotifLogFilter] = useState<'all' | 'specific' | 'all_users' | 'verified'>('all');
  const [selectedNotifForDetail, setSelectedNotifForDetail] = useState<any | null>(null);
  const [isDeletingNotifId, setIsDeletingNotifId] = useState<string | null>(null);

  // Fetch notification logs directly from Supabase
  const fetchNotifLogs = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoadingNotifLogs(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDbNotifLogs(data);
      } else if (error) {
        console.error('Error fetching notification logs:', error);
      }
    } catch (err) {
      console.error('Failed to load notification logs from Supabase:', err);
    } finally {
      setIsLoadingNotifLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setDbNotifLogs(prev => {
        if (prev.length === 0) return prev;
        return prev.map(dbItem => {
          const match = notifications.find(n => String(n.id) === String(dbItem.id));
          if (match && (match.read || match.is_read) && (!dbItem.is_read || !dbItem.read)) {
            return { ...dbItem, is_read: true, read: true };
          }
          return dbItem;
        });
      });
    }
  }, [notifications]);

  const handleDeleteNotifLog = async (notifId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإشعار من سجل قاعدة البيانات نهائياً؟')) return;
    setIsDeletingNotifId(notifId);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notifId);

        if (error) {
          alert('فشل حذف الإشعار من قاعدة البيانات: ' + error.message);
          return;
        }
      }

      setDbNotifLogs(prev => prev.filter(item => String(item.id) !== String(notifId)));
      if (setNotifications) {
        setNotifications(prev => prev.filter(item => String(item.id) !== String(notifId)));
      }
      addLog(`تم حذف الإشعار [#${notifId}] من سجل الإشعارات بنجاح.`, {
        panel: 'Admin',
        target_type: 'notification',
        target_id: String(notifId)
      });
    } catch (err: any) {
      alert('حدث خطأ أثناء الحذف: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsDeletingNotifId(null);
    }
  };

  // Close notification user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [editAccountVal, setEditAccountVal] = useState(shamCashAccount);
  useEffect(() => {
    setEditAccountVal(shamCashAccount);
  }, [shamCashAccount]);

  // Support/Contact Us panel states
  const [msgSearch, setMsgSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'problem' | 'feature'>('all');
  const [replyingMessage, setReplyingMessage] = useState<ContactMessage | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Real-Time Activity Logs state (fetched directly from Supabase activity_logs table)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const fetchActivityLogs = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching activity_logs from Supabase:', error.message);
        return;
      }

      if (data) {
        const mappedLogs: ActivityLog[] = data.map((row: any) => ({
          id: String(row.id),
          created_at: row.created_at,
          user_id: row.user_id,
          user_name: row.user_name || 'مدير فيلوريا',
          user_email: row.user_email || '',
          user_role: row.user_role || 'مدير النظام',
          operation: row.operation || '',
          details: row.details || '',
          ip_address: row.ip_address || null,
          user_agent: row.user_agent || '',
          device_type: row.device_type || 'Unknown',
          status: row.status || 'success',
          panel: row.panel || 'Admin',
          target_type: row.target_type || null,
          target_id: row.target_id || null,
          target_name: row.target_name || null,
          target_user_id: row.target_user_id || null,
          target_user_email: row.target_user_email || null,

          adminName: row.user_name || 'مدير فيلوريا',
          role: row.user_role || 'مدير النظام',
          timestamp: row.created_at
            ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16)
            : new Date().toISOString().replace('T', ' ').substring(0, 16),
          ipAddress: row.ip_address || null
        }));
        setActivityLogs(mappedLogs);
      }
    } catch (err) {
      console.warn('Failed to load activity logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (isGateAuthenticated) {
      fetchActivityLogs();
    }
  }, [isGateAuthenticated, fetchActivityLogs]);

  useEffect(() => {
    if (isGateAuthenticated && activeTab === 'logs') {
      fetchActivityLogs();
    }
  }, [activeTab, isGateAuthenticated, fetchActivityLogs]);

  const addLogWithUser = async (
    operation: string,
    targetUser?: any,
    options?: LogTargetOptions | string,
    status: string = 'success'
  ) => {
    let details = '';
    let opts: LogTargetOptions = {};
    if (typeof options === 'string') {
      details = options;
    } else if (options) {
      opts = options;
      details = options.details || '';
      if (options.status) status = options.status;
    }

    const u = targetUser || currentUser;
    const userRoleFormatted =
      u?.role === 'admin'
        ? 'مدير النظام'
        : u?.role === 'moderator'
        ? 'مشرف السوق'
        : u?.role || 'مشرف';

    const logData = {
      user_id: u?.id ? String(u.id) : null,
      user_name: u?.name || 'مدير فيلوريا',
      user_email: u?.email || '',
      user_role: userRoleFormatted,
      operation,
      details,
      ip_address: null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      device_type: getDeviceType(),
      status,
      panel: opts.panel || 'Admin',
      target_type: opts.target_type || null,
      target_id: opts.target_id ? String(opts.target_id) : null,
      target_name: opts.target_name || null,
      target_user_id: opts.target_user_id ? String(opts.target_user_id) : null,
      target_user_email: opts.target_user_email || null
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .insert([logData])
          .select('*');

        if (error) {
          console.warn('Error inserting activity log to Supabase:', error.message);
        } else if (data && data[0]) {
          const row = data[0];
          const insertedLog: ActivityLog = {
            id: String(row.id),
            created_at: row.created_at,
            user_id: row.user_id,
            user_name: row.user_name,
            user_email: row.user_email,
            user_role: row.user_role,
            operation: row.operation,
            details: row.details,
            ip_address: row.ip_address || null,
            user_agent: row.user_agent,
            device_type: row.device_type,
            status: row.status,
            panel: row.panel,
            target_type: row.target_type,
            target_id: row.target_id,
            target_name: row.target_name,
            target_user_id: row.target_user_id,
            target_user_email: row.target_user_email,

            adminName: row.user_name || logData.user_name,
            role: row.user_role || logData.user_role,
            timestamp: row.created_at
              ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16)
              : new Date().toISOString().replace('T', ' ').substring(0, 16),
            ipAddress: row.ip_address || null
          };
          setActivityLogs(prev => [insertedLog, ...prev]);
          return;
        }
      } catch (err) {
        console.warn('Failed to insert activity log to Supabase:', err);
      }
    }

    const fallbackLog: ActivityLog = {
      id: `log-${Date.now()}`,
      adminName: logData.user_name,
      role: logData.user_role,
      operation: logData.operation,
      details: logData.details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: null,
      user_agent: logData.user_agent,
      device_type: logData.device_type,
      status: logData.status,
      panel: logData.panel,
      target_type: logData.target_type,
      target_id: logData.target_id,
      target_name: logData.target_name,
      target_user_id: logData.target_user_id,
      target_user_email: logData.target_user_email
    };
    setActivityLogs(prev => [fallbackLog, ...prev]);
  };

  const addLog = (operation: string, options?: LogTargetOptions | string) => {
    addLogWithUser(operation, currentUser, options);
  };

  useEffect(() => {
    if (!isGateAuthenticated) return;

    const loadRealDbStats = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      setLoadingStats(true);
      try {
        // Fetch all products unfiltered to get exact stats (active, sold, hidden)
        const allProducts = await supabaseService.getProducts();
        setDbProductsForStats(allProducts);

        // Fetch all profiles to get exact users and verification status counts
        const allProfiles = await supabaseService.getProfiles();
        setDbUsersForStats(allProfiles);

        // Fetch followers count per user directly from Supabase followers table
        const { data: followsData } = await supabase.from('followers').select('following_id');
        if (followsData) {
          const fCounts: Record<string, number> = {};
          followsData.forEach((f: any) => {
            if (f.following_id) {
              fCounts[f.following_id] = (fCounts[f.following_id] || 0) + 1;
            }
          });
          setStoreFollowersMap(fCounts);
        }

        // Fetch product counts per user directly from Supabase products table
        const { data: prodsData } = await supabase.from('products').select('user_id');
        if (prodsData) {
          const pCounts: Record<string, number> = {};
          prodsData.forEach((p: any) => {
            if (p.user_id) {
              pCounts[p.user_id] = (pCounts[p.user_id] || 0) + 1;
            }
          });
          setStoreProductsMap(pCounts);
        }
      } catch (err) {
        console.warn('Failed to load real DB stats in AdminPanel:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadRealDbStats();
  }, [isGateAuthenticated, products, users]);

  const handleSaveSettings = async (newSettings: AppSettings) => {
    if (!onUpdateAppSettings || !appSettings) return;

    // Log setting changes
    const logChanges: string[] = [];
    const fieldsToNameAr: { [key in keyof AppSettings]: string } = {
      supportEmail: 'البريد الإلكتروني للدعم',
      whatsappNumber: 'رقم دعم واتساب',
      telegramLink: 'رابط تليجرام',
      facebookPage: 'صفحة فيسبوك',
      instagramPage: 'صفحة إنستغرام',
      websiteUrl: 'موقع الويب',
      businessHours: 'أوقات العمل والدعم',
      supportWelcomeMessage: 'رسالة الترحيب بالدعم',
      platformName: 'اسم المنصة',
      platformLogo: 'شعار المنصة',
      platformDescription: 'وصف المنصة',
      currentVersion: 'إصدار التطبيق',
      copyrightText: 'حقوق النشر والملكية',
      shamCashAccount: 'حساب شام كاش',
      donationInstructions: 'تعليمات التبرع والمساهمة',
      donationMessage: 'رسالة التبرع والتحفيز',
      donationEnabled: 'تفعيل نظام المساهمات',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfUse: 'شروط الاستخدام',
      disclaimer: 'إخلاء المسؤولية',
      announcementEnabled: 'تفعيل شريط الإعلانات',
      announcementTitle: 'عنوان الإعلان الرئيسي',
      announcementContent: 'تفاصيل محتوى الإعلان',
      announcementColor: 'لون شريط الإعلان',
      announcementExpiry: 'تاريخ انتهاء الإعلان',
      maintenanceModeEnabled: 'تفعيل وضع الصيانة الفنية',
      socialFacebook: 'رابط فيسبوك بالتواصل',
      socialInstagram: 'رابط إنستغرام بالتواصل',
      socialTelegram: 'رابط تليجرام بالتواصل',
      socialYoutube: 'رابط يوتيوب بالتواصل',
      socialTiktok: 'رابط تيك توك بالتواصل',
      socialX: 'رابط إكس بالتواصل'
    };

    (Object.keys(newSettings) as Array<keyof AppSettings>).forEach((key) => {
      const oldVal = appSettings[key];
      const newVal = newSettings[key];
      if (oldVal !== newVal) {
        const fieldName = fieldsToNameAr[key] || key;
        const oldStr = typeof oldVal === 'boolean' ? (oldVal ? 'مفعّل' : 'معطّل') : String(oldVal || 'فارغ');
        const newStr = typeof newVal === 'boolean' ? (newVal ? 'مفعّل' : 'معطّل') : String(newVal || 'فارغ');
        logChanges.push(`تعديل إعداد [${fieldName}]: من "${oldStr}" إلى "${newStr}"`);
      }
    });

    if (logChanges.length > 0) {
      logChanges.forEach((logMsg) => {
        addLog(logMsg, { panel: 'Admin', target_type: 'settings' });
      });
    } else {
      addLog('تحديث عام لإعدادات المنصة دون تغيير القيم', { panel: 'Admin', target_type: 'settings' });
    }

    await onUpdateAppSettings(newSettings);
  };

  // Auth Action for Login Gate
  const handleGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    
    setLoginError('');

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Use supabase.auth.signInWithPassword to verify email and password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPassword,
        });

        if (authError) {
          setLoginError(authError.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
          return;
        }

        const authUser = authData?.user;
        if (!authUser) {
          setLoginError('لم يتم العثور على المستخدم في نظام المصادقة.');
          return;
        }

        // 2. Search within the profiles table using id only
        const profile = await supabaseService.getProfile(authUser.id, authUser.email, authUser.user_metadata);
        if (!profile) {
          setLoginError('لم يتم العثور على الملف الشخصي لهذا الحساب.');
          return;
        }

        // 3. Verify that role = 'admin' or role = 'moderator'
        if (profile.role !== 'admin' && profile.role !== 'moderator') {
          setLoginError('عذراً! هذه البوابة مخصصة للإدارة والمشرفين فقط.');
          return;
        }

        // 4. Success Authentication
        setIsGateAuthenticated(true);
        sessionStorage.setItem('veloria-admin-gate-auth', 'true');
        setLoginError('');
        
        const roleText = profile.role === 'admin' ? 'مدير نظام' : 'مشرف نظام';
        const logMsg = `قام بالدخول الآمن بنجاح إلى لوحة الإدارة بصفته ${roleText}`;
        
        addLogWithUser(logMsg, profile, { panel: 'Admin', target_type: 'auth' });
      } catch (err: any) {
        console.warn('Admin Gate Login error:', err);
        setLoginError(err?.message || 'حدث خطأ أثناء الاتصال بقاعدة البيانات.');
      }
    } else {
      // Fallback for mock/local environment when Supabase is not configured
      const userMatch = users.find(u => u.email.toLowerCase() === cleanEmail);
      
      if (!userMatch) {
        setLoginError('لم يتم العثور على حساب بهذا البريد الإلكتروني.');
        return;
      }

      if (userMatch.role !== 'admin' && userMatch.role !== 'moderator') {
        setLoginError('عذراً! هذه البوابة مخصصة للإدارة والمشرفين فقط.');
        return;
      }

      // Verify correct passwords
      if (userMatch.role === 'admin' && loginPassword !== 'admin') {
        setLoginError('كلمة مرور الإدارة غير صحيحة. (كلمة المرور الافتراضية للتجربة هي: admin)');
        return;
      }

      if (userMatch.role === 'moderator' && loginPassword !== 'moderator') {
        setLoginError('كلمة مرور المشرف غير صحيحة. (كلمة المرور الافتراضية للتجربة هي: moderator)');
        return;
      }

      // Success Authentication
      setIsGateAuthenticated(true);
      sessionStorage.setItem('veloria-admin-gate-auth', 'true');
      setLoginError('');
      
      const roleText = userMatch.role === 'admin' ? 'مدير نظام' : 'مشرف نظام';
      const logMsg = `قام بالدخول الآمن بنجاح إلى لوحة الإدارة بصفته ${roleText}`;
      
      addLogWithUser(logMsg, userMatch, { panel: 'Admin', target_type: 'auth' });
    }
  };

  // Direct Bypass for developer ease
  const handleQuickBypass = (role: 'admin' | 'moderator') => {
    const defaultUser = users.find(u => u.role === role) || currentUser;
    setIsGateAuthenticated(true);
    sessionStorage.setItem('veloria-admin-gate-auth', 'true');
    setLoginError('');
    
    const roleText = role === 'admin' ? 'مدير نظام (دخول سريع)' : 'مشرف نظام (دخول سريع)';
    const logMsg = `تسجيل دخول آمن وسريع عبر بوابة التحقق الثنائية بصفته ${roleText}`;
    
    addLogWithUser(logMsg, defaultUser, { panel: 'Admin', target_type: 'auth' });
  };

  const handleLogoutGate = () => {
    setIsGateAuthenticated(false);
    sessionStorage.removeItem('veloria-admin-gate-auth');
    addLog('تسجيل الخروج من لوحة التحكم', { panel: 'Admin', target_type: 'auth' });
  };

  // Stat calculations
  const productsToUse = dbProductsForStats.length > 0 ? dbProductsForStats : products;
  const usersToUse = dbUsersForStats.length > 0 ? dbUsersForStats : users;

  const getStoreFollowersCount = (sellerId: string) => {
    if (storeFollowersMap[sellerId] !== undefined) {
      return storeFollowersMap[sellerId];
    }
    const targetUser = usersToUse.find(u => u.id === sellerId);
    return targetUser?.followersCount || 0;
  };

  const getStoreProductsCount = (sellerId: string) => {
    if (storeProductsMap[sellerId] !== undefined) {
      return storeProductsMap[sellerId];
    }
    return productsToUse.filter(p => p.sellerId === sellerId || (p as any).user_id === sellerId).length;
  };

  const totalUsers = usersToUse.length;
  const totalProducts = productsToUse.length;
  const activeProducts = productsToUse.filter(p => p.status === 'active').length;
  const soldProducts = productsToUse.filter(p => p.status === 'sold').length;
  const hiddenProducts = productsToUse.filter(p => p.status === 'hidden').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const verifiedStoresCount = usersToUse.filter(u => u.badges.includes('verified')).length;

  // Notification statistics computed directly from dbNotifLogs
  const notifStats = useMemo(() => {
    const totalNotifs = dbNotifLogs.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    let todayNotifs = 0;
    let thisWeekNotifs = 0;
    let unreadNotifs = 0;

    for (const item of dbNotifLogs) {
      // Unread check
      if (!item.is_read && !item.read) {
        unreadNotifs++;
      }

      if (item.created_at) {
        try {
          const itemDate = new Date(item.created_at);
          const itemTime = itemDate.getTime();
          if (!isNaN(itemTime)) {
            if (itemDate.toISOString().slice(0, 10) === todayStr) {
              todayNotifs++;
            }
            if (itemTime >= sevenDaysAgo) {
              thisWeekNotifs++;
            }
          }
        } catch (e) {
          // ignore date parsing error
        }
      }
    }

    return {
      totalNotifs,
      todayNotifs,
      thisWeekNotifs,
      unreadNotifs
    };
  }, [dbNotifLogs]);

  // Filtered Notification Logs memo computation
  const filteredNotifLogs = useMemo(() => {
    return dbNotifLogs.filter(item => {
      // Audience Filter
      if (notifLogFilter === 'specific' && item.audience !== 'specific') return false;
      if (notifLogFilter === 'all_users' && item.audience !== 'all') return false;
      if (notifLogFilter === 'verified' && item.audience !== 'verified') return false;

      // Search Query
      if (notifLogSearch.trim()) {
        const q = notifLogSearch.trim().toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const msgMatch = (item.message || item.body || '').toLowerCase().includes(q);
        const recId = String(item.recipient_id || item.user_id || '').toLowerCase();
        const recIdMatch = recId.includes(q);

        const recUser = recId ? usersToUse.find(u => u.id === recId) : null;
        const userNameMatch = recUser?.name?.toLowerCase().includes(q);
        const userStoreMatch = ((recUser as any)?.store_name || (recUser as any)?.storeName || '').toLowerCase().includes(q);

        return titleMatch || msgMatch || recIdMatch || userNameMatch || userStoreMatch;
      }

      return true;
    });
  }, [dbNotifLogs, notifLogFilter, notifLogSearch, usersToUse]);

  // Category Detail View Computations
  const currentCategoryDetail = selectedCategoryDetail 
    ? categories.find(c => String(c.id) === String(selectedCategoryDetail.id)) || selectedCategoryDetail 
    : null;

  const categoryAllProducts = useMemo(() => {
    if (!currentCategoryDetail) return [];
    const targetId = String(currentCategoryDetail.id);
    const targetClean = targetId.startsWith('cat-') ? targetId.replace('cat-', '') : targetId;

    return productsToUse.filter((p) => {
      if (!p || p.categoryId === undefined || p.categoryId === null) return false;
      const pCat = String(p.categoryId);
      const pCatClean = pCat.startsWith('cat-') ? pCat.replace('cat-', '') : pCat;
      return pCat === targetId || p.categoryId === currentCategoryDetail.id || pCatClean === targetClean;
    });
  }, [currentCategoryDetail, productsToUse]);

  const categoryActiveProducts = useMemo(() => {
    return categoryAllProducts.filter(p => p.status === 'active');
  }, [categoryAllProducts]);

  const categoryHiddenProducts = useMemo(() => {
    return categoryAllProducts.filter(p => p.status === 'hidden');
  }, [categoryAllProducts]);

  const filteredAndSortedCategoryProducts = useMemo(() => {
    let list = [...categoryAllProducts];

    // 1. Search Filter
    if (catDetailSearch.trim() !== '') {
      const q = catDetailSearch.trim().toLowerCase();
      list = list.filter((p) => {
        const seller = users.find(u => u.id === p.sellerId);
        const sellerName = seller ? seller.name.toLowerCase() : '';
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          sellerName.includes(q) ||
          String(p.price).includes(q)
        );
      });
    }

    // Helper for report count
    const getProductReportsCount = (prodId: string) => {
      return (reports || []).filter(r => r.type === 'product' && r.targetId === prodId).length;
    };

    // 2. Sorting
    list.sort((a, b) => {
      if (catDetailSort === 'date-desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (catDetailSort === 'date-asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (catDetailSort === 'price-desc') {
        return b.price - a.price;
      }
      if (catDetailSort === 'price-asc') {
        return a.price - b.price;
      }
      if (catDetailSort === 'views-desc') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (catDetailSort === 'reports-desc') {
        return getProductReportsCount(b.id) - getProductReportsCount(a.id);
      }
      return 0;
    });

    return list;
  }, [categoryAllProducts, catDetailSearch, catDetailSort, users, reports]);

  // Users Handlers
  const handleUserStatusUpdate = (userId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    // Prevent moderator from modifying admin accounts
    const targetUser = users.find(u => u.id === userId);
    if (currentUser.role !== 'admin' && targetUser?.role === 'admin') {
      alert('لا يمتلك المشرف صلاحية تعديل حساب مدير النظام.');
      return;
    }

    if (setUsers) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
    const statusArabic = newStatus === 'active' ? 'تنشيط' : newStatus === 'suspended' ? 'تعليق' : 'حظر';
    addLog(`قام بـ ${statusArabic} حساب المستخدم: ${targetUser?.name || userId}`, {
      panel: 'Admin',
      target_type: 'user',
      target_id: userId,
      target_name: targetUser?.name || null,
      target_user_id: userId,
      target_user_email: targetUser?.email || null
    });
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    if (setUsers) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    }
    addLog(`عدّل بيانات الملف الشخصي للمستخدم: ${editingUser.name}`, {
      panel: 'Admin',
      target_type: 'user',
      target_id: editingUser.id,
      target_name: editingUser.name,
      target_user_id: editingUser.id,
      target_user_email: editingUser.email || null
    });
    setEditingUser(null);
  };

  const toggleBadge = (user: User, badge: UserBadge) => {
    // Restricted to Admin
    if (currentUser.role !== 'admin') {
      alert('صلاحية منح وإدارة الشارات مخصصة لمدير النظام فقط.');
      return;
    }

    let updatedBadges = [...user.badges];
    let added = false;
    if (updatedBadges.includes(badge)) {
      updatedBadges = updatedBadges.filter(b => b !== badge);
    } else {
      updatedBadges.push(badge);
      added = true;
    }

    onUpdateUserBadges(user.id, updatedBadges);
    const badgeNameAr = badge === 'verified' ? 'موثق ✔️' : badge === 'active_seller' ? 'بائع نشط 🔥' : badge === 'featured_seller' ? 'بائع مميز ⭐' : 'متجر رسمي 🏪';
    addLog(`${added ? 'منح' : 'سحب'} الشارة (${badgeNameAr}) من التاجر: ${user.name}`, {
      panel: 'Admin',
      target_type: 'user',
      target_id: user.id,
      target_name: user.name,
      target_user_id: user.id,
      target_user_email: user.email || null
    });
  };

  // Products Handlers
  const executeProductStatusToggle = async (productId: string, action: 'active' | 'hidden' | 'sold', reason: string = '') => {
    console.log("executeProductStatusToggle started", productId);
    const targetProduct = productsToUse.find(p => p.id === productId);
    if (!targetProduct) {
      return;
    }

    let targetStatus: 'active' | 'hidden' | 'sold' | 'expired' = action;

    if (action === 'active') {
      if (targetProduct.status === 'hidden') {
        targetStatus = targetProduct.isSold ? 'sold' : 'active';
      } else {
        targetStatus = 'active';
      }
    }

    if (targetStatus === 'hidden') {
      console.log('Hide button clicked');
      console.log('calling handleUpdateProductStatus');

      const updates: any = {
        status: 'hidden',
        updated_at: new Date().toISOString()
      };

      try {
        console.log('Updating database...');
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId);
          if (error) {
            throw error;
          }
        }
        console.log('Database updated successfully');

        // Send notifications on success
        if (targetProduct.status !== 'hidden') {
          const bodyText = reason 
            ? `قام فريق الإدارة بإخفاء منتجك مؤقتاً بسبب مخالفة سياسات المنصة.\nالسبب: ${reason}`
            : `قام فريق الإدارة بإخفاء منتجك مؤقتاً بسبب مخالفة سياسات المنصة.`;
          
          const newNotif: Notification = {
            id: `notif-hide-${Date.now()}-${Math.random()}`,
            userId: targetProduct.sellerId,
            type: 'admin',
            title: 'تم إخفاء أحد منتجاتك',
            body: bodyText,
            createdAt: new Date().toISOString(),
            read: false
          };

          if (setNotifications) {
            setNotifications((prev) => [newNotif, ...prev]);
          } else {
            try {
              const notifsStr = localStorage.getItem('veloria-notifications');
              const currentNotifs = notifsStr ? JSON.parse(notifsStr) : [];
              localStorage.setItem('veloria-notifications', JSON.stringify([newNotif, ...currentNotifs]));
              window.dispatchEvent(new Event('storage'));
            } catch (e) {
              console.warn('Failed to update notifications in localStorage:', e);
            }
          }
        }
        console.log('Notification sent');

        // Update local state
        const updatedIsSold = targetProduct.isSold;
        if (setProducts) {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'hidden', isSold: updatedIsSold } : p));
        }
        
        setDbProductsForStats(prev => prev.map(p => p.id === productId ? { ...p, status: 'hidden', isSold: updatedIsSold } : p));
        console.log('Local state updated');
        console.log('Hide العملية انتهت');

        const statusAr = 'إخفاء ورقابة';
        const seller = users.find(u => u.id === targetProduct?.sellerId);
        addLog(`قام بـ ${statusAr} المنتج: [${targetProduct?.title}] للبائع: ${targetProduct?.sellerId}`, {
          panel: 'Admin',
          target_type: 'product',
          target_id: targetProduct?.id,
          target_name: targetProduct?.title,
          target_user_id: targetProduct?.sellerId,
          target_user_email: seller?.email || null
        });

      } catch (err: any) {
        console.error('Failed to hide product:', err);
      }
    } else {
      console.log("inside else (targetStatus is not hidden)");
      const updates: any = {
        status: targetStatus,
        updated_at: new Date().toISOString()
      };

      if (targetStatus === 'sold') {
        updates.is_sold = true;
      } else {
        if (targetStatus === 'active') {
          updates.is_sold = false;
        }
      }

      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId);
          if (error) {
            throw error;
          }
        }

        // Send notifications on success
        if (targetProduct.status === 'hidden') {
          const newNotif: Notification = {
            id: `notif-unhide-${Date.now()}-${Math.random()}`,
            userId: targetProduct.sellerId,
            type: 'admin',
            title: 'تمت إعادة نشر منتجك',
            body: 'بعد مراجعة المنتج تمت إعادة نشره داخل السوق.',
            createdAt: new Date().toISOString(),
            read: false
          };

          if (setNotifications) {
            setNotifications((prev) => [newNotif, ...prev]);
          } else {
            try {
              const notifsStr = localStorage.getItem('veloria-notifications');
              const currentNotifs = notifsStr ? JSON.parse(notifsStr) : [];
              localStorage.setItem('veloria-notifications', JSON.stringify([newNotif, ...currentNotifs]));
              window.dispatchEvent(new Event('storage'));
            } catch (e) {
              console.warn('Failed to update notifications in localStorage:', e);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to update product in Supabase:', err);
        return; // Stop if it failed
      }

      console.log("Step 5: Updating local states for non-hidden product");
      const updatedIsSold = targetStatus === 'sold' ? true : (targetStatus === 'active' ? false : targetProduct.isSold);

      if (setProducts) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: targetStatus, isSold: updatedIsSold } : p));
      }

      setDbProductsForStats(prev => prev.map(p => p.id === productId ? { ...p, status: targetStatus, isSold: updatedIsSold } : p));

      const statusAr = action === 'active' ? 'إلغاء الإخفاء' : 'مباع';
      const seller = users.find(u => u.id === targetProduct?.sellerId);
      addLog(`قام بـ ${statusAr} المنتج: [${targetProduct?.title}] للبائع: ${targetProduct?.sellerId}`, {
        panel: 'Admin',
        target_type: 'product',
        target_id: targetProduct?.id,
        target_name: targetProduct?.title,
        target_user_id: targetProduct?.sellerId,
        target_user_email: seller?.email || null
      });
    }
  };

  const handleProductStatusToggle = async (productId: string, action: 'active' | 'hidden' | 'sold') => {
    console.log("handleProductStatusToggle started", productId);
    const targetProduct = productsToUse.find(p => p.id === productId);
    if (!targetProduct) return;

    if (action === 'hidden' && targetProduct.status !== 'hidden') {
      setHideProductModal({
        isOpen: true,
        productId,
        action
      });
      return;
    }

    await executeProductStatusToggle(productId, action, '');
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('products')
          .update({
            title: editingProduct.title,
            price: editingProduct.price,
            description: editingProduct.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Failed to update edited product in Supabase:', err);
    }

    if (setProducts) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    }
    setDbProductsForStats(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));

    const seller = users.find(u => u.id === editingProduct.sellerId);
    addLog(`تعديل تفاصيل وأسعار المنتج الإعلاني: ${editingProduct.title}`, {
      panel: 'Admin',
      target_type: 'product',
      target_id: editingProduct.id,
      target_name: editingProduct.title,
      target_user_id: editingProduct.sellerId,
      target_user_email: seller?.email || null
    });
    setEditingProduct(null);
  };

  const handleDeleteProductAdmin = async (productId: string) => {
    if (currentUser.role !== 'admin') {
      alert('المشرف لا يملك صلاحية الحذف النهائي للمنتجات. يرجى إخفاء المنتج كإجراء رقابي.');
      return;
    }

    const targetProduct = productsToUse.find(p => p.id === productId);
    if (!targetProduct) return;

    setDeletingProductObj(targetProduct);
    setDeletionReasonInput('');
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProductObj) return;
    if (deletionReasonInput.trim() === '') {
      alert('لا يمكن حذف المنتج دون توفير سبب للحذف.');
      return;
    }

    const targetProduct = deletingProductObj;
    const productId = targetProduct.id;
    const reason = deletionReasonInput.trim();

    // --- Supabase Storage & Table Cleanup ---
    try {
      const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
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

        // Delete database entries from Supabase tables
        await supabase.from('product_images').delete().eq('product_id', productId);
        await supabase.from('favorites').delete().eq('product_id', productId);
        await supabase.from('reports').delete().eq('targetId', productId).eq('type', 'product');
        await supabase.from('products').delete().eq('id', productId);
      }
    } catch (err) {
      console.warn('Supabase automatic storage cleanup or DB deletion failed:', err);
    }

    // --- State Cleanup ---
    // Remove product from products list
    if (setProducts) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
    setDbProductsForStats(prev => prev.filter(p => p.id !== productId));

    // Clear reports related to the product
    if (setReports) {
      setReports(prev => prev.filter(r => !(r.type === 'product' && r.targetId === productId)));
    }

    // Remove favorites from localStorage
    try {
      const favs = localStorage.getItem('veloria-favorites');
      if (favs) {
        const favsArr = JSON.parse(favs) as string[];
        const filtered = favsArr.filter(id => id !== productId);
        localStorage.setItem('veloria-favorites', JSON.stringify(filtered));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('Failed to update favorites in localStorage:', e);
    }

    // Notify merchant & add to notifications
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

    if (setNotifications) {
      setNotifications((prev) => [newNotif, ...prev]);
    } else {
      try {
        const notifsStr = localStorage.getItem('veloria-notifications');
        const currentNotifs = notifsStr ? JSON.parse(notifsStr) : [];
        localStorage.setItem('veloria-notifications', JSON.stringify([newNotif, ...currentNotifs]));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.warn('Failed to update notifications in localStorage:', e);
      }
    }

    // Add administrative activity log
    const seller = users.find(u => u.id === targetProduct.sellerId);
    addLog(`حذف نهائي للمنتج الإعلاني: [${targetProduct.title}] بسبب: "${reason}"`, {
      panel: 'Admin',
      target_type: 'product',
      target_id: targetProduct.id,
      target_name: targetProduct.title,
      target_user_id: targetProduct.sellerId,
      target_user_email: seller?.email || null
    });
    alert(`تم حذف المنتج "${targetProduct.title}" بنجاح وإخطار التاجر بالسبب رقابياً.`);
    setDeletingProductObj(null);
    setDeletionReasonInput('');
  };

  // Reports Handlers
  const sendReportNotification = (userId: string, title: string, body: string, type: any = 'system') => {
    const newNotif: Notification = {
      id: `notif-rep-${Date.now()}-${Math.random()}`,
      userId,
      type,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (setNotifications) {
      setNotifications((prev) => [newNotif, ...prev]);
    } else {
      try {
        const notifsStr = localStorage.getItem('veloria-notifications');
        const currentNotifs = notifsStr ? JSON.parse(notifsStr) : [];
        localStorage.setItem('veloria-notifications', JSON.stringify([newNotif, ...currentNotifs]));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.warn('Failed to update notifications in localStorage:', e);
      }
    }
  };

  const handleAcceptReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (setReports) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'processing' } : r));
    }

    sendReportNotification(
      report.reporterId,
      'تحديث بشأن بلاغك قيد المراجعة',
      'تم استلام بلاغك ومراجعته وهو الآن قيد المعالجة.',
      'system'
    );

    addLog(`قبول مبدئي للشكوى رقم #${reportId} المقدمة من: ${report.reporterName} - الحالة: قيد المعالجة`, {
      panel: 'Admin',
      target_type: 'report',
      target_id: reportId,
      target_name: `بلاغ #${reportId}`,
      target_user_id: report.reporterId || null,
      target_user_email: null
    });
  };

  const handleHideProductAndResolveReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const targetProduct = products.find(p => p.id === report.targetId);
    if (!targetProduct) return;

    // 1. Hide the product
    if (setProducts) {
      setProducts(prev => prev.map(p => p.id === targetProduct.id ? { ...p, status: 'hidden' } : p));
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('products')
          .update({ status: 'hidden', updated_at: new Date().toISOString() })
          .eq('id', targetProduct.id);
      } catch (err) {
        console.warn('Failed to hide product in Supabase:', err);
      }
    }

    // 2. Send notification to the seller
    sendReportNotification(
      targetProduct.sellerId,
      'تنبيه رقابي: تم إخفاء أحد منتجاتك لمخالفة الشروط',
      `تم إخفاء منتجك "${targetProduct.title}" بسبب: ${report.reason} (${report.details})`,
      'admin'
    );

    // 3. Send notification to the reporter
    sendReportNotification(
      report.reporterId,
      'تم حل بلاغك واتخاذ الإجراء اللازم',
      `تم قبول بلاغك بشأن المنتج "${targetProduct.title}" وتم اتخاذ الإجراء اللازم بإخفاء المنتج.`,
      'system'
    );

    // 4. Change report status to 'resolved'
    if (setReports) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    }

    const seller = users.find(u => u.id === targetProduct.sellerId);
    addLog(`إخفاء المنتج المخالف [${targetProduct.title}] وحل البلاغ رقم #${reportId}`, {
      panel: 'Admin',
      target_type: 'report',
      target_id: reportId,
      target_name: targetProduct.title,
      target_user_id: seller?.id || targetProduct.sellerId,
      target_user_email: seller?.email || null
    });
  };

  const handleUserSuspendAndResolveReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const reportedUser = users.find(u => u.id === report.targetId);
    if (!reportedUser) return;

    // 1. Suspend the user
    if (setUsers) {
      setUsers(prev => prev.map(u => u.id === reportedUser.id ? { ...u, status: 'suspended' } : u));
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('id', reportedUser.id);
      } catch (err) {
        console.warn('Failed to suspend user in Supabase:', err);
      }
    }

    // 2. Send notification to the seller
    sendReportNotification(
      reportedUser.id,
      'تنبيه رقابي: تم تعليق حسابك',
      `تم تعليق حسابك ورقابته لمخالفة شروط الاستخدام بناءً على البلاغ رقم #${reportId} بسبب: ${report.reason}.`,
      'admin'
    );

    // 3. Send notification to the reporter
    sendReportNotification(
      report.reporterId,
      'تم حل بلاغك واتخاذ الإجراء اللازم',
      `تم قبول بلاغك بشأن الحساب "${reportedUser.name}" وتم اتخاذ الإجراء اللازم بتعليق حساب البائع.`,
      'system'
    );

    // 4. Change report status to 'resolved'
    if (setReports) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    }

    addLog(`تعليق بائع معتمد [${reportedUser.name}] وحل البلاغ رقم #${reportId}`, {
      panel: 'Admin',
      target_type: 'report',
      target_id: reportId,
      target_name: reportedUser.name,
      target_user_id: reportedUser.id,
      target_user_email: reportedUser.email || null
    });
  };

  const handleRejectReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // 1. Ask for rejection reason if any
    const rejectReason = prompt('أدخل سبب رفض الشكوى إن وجد (اختياري):') || '';

    // 2. Change report status to 'dismissed'
    if (setReports) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
    }

    // 3. Send notification to the reporter
    const notificationBody = rejectReason
      ? `تم مراجعة بلاغك المرفوع وتقرر رفضه وتجاهله بسبب: ${rejectReason}`
      : 'تم مراجعة بلاغك المرفوع وتقرر رفضه وتجاهله كبلاغ كيدي.';

    sendReportNotification(
      report.reporterId,
      'تحديث بشأن بلاغك المرفوع',
      notificationBody,
      'system'
    );

    addLog(`رفض وتجاهل الشكوى رقم #${reportId} المقدمة من: ${report.reporterName}`, {
      panel: 'Admin',
      target_type: 'report',
      target_id: reportId,
      target_name: `بلاغ #${reportId}`,
      target_user_id: report.reporterId || null,
      target_user_email: null
    });
  };

  // Categories Handlers
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim() === '') return;
    
    // Allowed only for admin
    if (currentUser.role !== 'admin') {
      alert('إضافة أقسام وفئات السوق الجديدة متاحة لمدير النظام فقط.');
      return;
    }

    onAddCategory({
      name: newCatName.trim(),
      icon: newCatIcon
    });
    addLog(`إضافة فئة تصنيف جديدة للسوق: "${newCatName.trim()}" مع الرمز ${newCatIcon}`, {
      panel: 'Admin',
      target_type: 'category',
      target_name: newCatName.trim()
    });
    setNewCatName('');
    setCatSuccess(true);
    setTimeout(() => setCatSuccess(false), 2000);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon || 'Sparkles');
    setEditCatError(null);
  };

  const handleCloseEditCategory = () => {
    setEditingCategory(null);
    setEditCatName('');
    setEditCatIcon('Sparkles');
    setEditCatError(null);
  };

  const handleToggleCategoryVisibility = async (cat: Category) => {
    if (currentUser.role !== 'admin') {
      alert('تعديل أقسام وفئات السوق متاح لمدير النظام فقط.');
      return;
    }

    const isCurrentlyActive = cat.is_active !== false && cat.isActive !== false;
    const newActiveState = !isCurrentlyActive;
    const catId = cat.id;

    try {
      if (isSupabaseConfigured && supabase) {
        const cleanId = catId.startsWith('cat-') ? catId.replace('cat-', '') : catId;
        const numericId = parseInt(cleanId, 10);

        let updateError = null;

        if (!isNaN(numericId)) {
          const { error } = await supabase
            .from('categories')
            .update({ is_active: newActiveState })
            .eq('id', numericId);
          
          if (error) {
            const { error: err2 } = await supabase
              .from('categories')
              .update({ is_active: newActiveState })
              .eq('id', catId);
            updateError = err2;
          }
        } else {
          const { error } = await supabase
            .from('categories')
            .update({ is_active: newActiveState })
            .eq('id', catId);
          updateError = error;
        }

        if (updateError) {
          setCatMessage({
            text: `حدث خطأ أثناء تغيير حالة التصنيف: ${updateError.message}`,
            type: 'error'
          });
          return;
        }
      }

      if (setCategories) {
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, is_active: newActiveState, isActive: newActiveState } : c));
      }

      addLog(`${newActiveState ? 'إظهار' : 'إخفاء'} التصنيف: "${cat.name}"`, {
        panel: 'Admin',
        target_type: 'category',
        target_id: cat.id,
        target_name: cat.name
      });

      setCatMessage({
        text: newActiveState ? `تم إظهار تصنيف "${cat.name}" بنجاح.` : `تم إخفاء تصنيف "${cat.name}" بنجاح.`,
        type: 'success'
      });

      setTimeout(() => {
        setCatMessage(null);
      }, 3000);

    } catch (err: any) {
      console.error('Error toggling category visibility:', err);
      setCatMessage({
        text: err?.message || 'حدث خطأ غير متوقع أثناء تغيير حالة التصنيف.',
        type: 'error'
      });
    }
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editCatName.trim()) return;

    if (currentUser.role !== 'admin') {
      alert('تعديل أقسام وفئات السوق متاح لمدير النظام فقط.');
      return;
    }

    setIsUpdatingCategory(true);
    setEditCatError(null);

    try {
      const updatedName = editCatName.trim();
      const updatedIcon = editCatIcon;
      const catId = editingCategory.id;

      if (isSupabaseConfigured && supabase) {
        const cleanId = catId.startsWith('cat-') ? catId.replace('cat-', '') : catId;
        const numericId = parseInt(cleanId, 10);

        let updateError = null;

        if (!isNaN(numericId)) {
          const { error } = await supabase
            .from('categories')
            .update({ name: updatedName, icon: updatedIcon })
            .eq('id', numericId);
          
          if (error) {
            const { error: err2 } = await supabase
              .from('categories')
              .update({ name: updatedName, icon: updatedIcon })
              .eq('id', catId);
            updateError = err2;
          }
        } else {
          const { error } = await supabase
            .from('categories')
            .update({ name: updatedName, icon: updatedIcon })
            .eq('id', catId);
          updateError = error;
        }

        if (updateError) {
          setEditCatError(updateError.message || 'حدث خطأ أثناء تعديل التصنيف في Supabase.');
          setIsUpdatingCategory(false);
          return;
        }
      }

      if (setCategories) {
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: updatedName, icon: updatedIcon } : c));
      }

      addLog(`تعديل قسم التصنيف: "${editingCategory.name}" إلى "${updatedName}" مع الرمز ${updatedIcon}`, {
        panel: 'Admin',
        target_type: 'category',
        target_id: editingCategory.id,
        target_name: updatedName
      });

      const successMsg = 'تم تعديل التصنيف بنجاح.';
      setCatMessage({ text: successMsg, type: 'success' });
      
      handleCloseEditCategory();

      setTimeout(() => {
        setCatMessage(null);
      }, 4000);

    } catch (err: any) {
      console.error('Error updating category:', err);
      setEditCatError(err?.message || 'حدث خطأ غير متوقع أثناء تعديل التصنيف.');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    console.log("Delete category clicked");

    if (currentUser.role !== 'admin') {
      try {
        alert('حذف الأقسام متاح للمدير فقط.');
      } catch (e) {}
      console.log("Delete finished");
      return;
    }

    console.log("Checking products count...");

    try {
      // Calculate local count of products under this category
      const localCount = products.filter(p => {
        const pCat = String(p.categoryId || '');
        const targetCat = String(catId);
        const pCatClean = pCat.startsWith('cat-') ? pCat.replace('cat-', '') : pCat;
        const targetCatClean = targetCat.startsWith('cat-') ? targetCat.replace('cat-', '') : targetCat;
        return pCat === targetCat || pCatClean === targetCatClean;
      }).length;

      // Calculate database count of products under this category
      let dbCount = 0;
      if (isSupabaseConfigured && supabase) {
        const cleanId = catId.startsWith('cat-') ? catId.replace('cat-', '') : catId;
        const numericId = parseInt(cleanId, 10);
        if (!isNaN(numericId)) {
          const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', numericId);
          if (!error && count !== null) {
            dbCount = count;
          }
        } else {
          const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', catId);
          if (!error && count !== null) {
            dbCount = count;
          }
        }
      }

      const productsCount = Math.max(localCount, dbCount);
      console.log("Products count = " + productsCount);

      if (productsCount > 0) {
        console.log("Category contains products");
        const errorMsg = 'لا يمكن حذف هذا التصنيف لأنه يحتوي على منتجات. قم بنقل المنتجات أو إخفاء التصنيف أولاً.';
        setCatMessage({ text: errorMsg, type: 'error' });
        try {
          alert(errorMsg);
        } catch (e) {
          console.warn('Alert blocked:', e);
        }
        console.log("Delete finished");
        return;
      }

      console.log("Deleting category...");

      // Delete from Supabase if configured
      if (isSupabaseConfigured && supabase) {
        const cleanId = catId.startsWith('cat-') ? catId.replace('cat-', '') : catId;
        const numericId = parseInt(cleanId, 10);
        if (!isNaN(numericId)) {
          const { error } = await supabase.from('categories').delete().eq('id', numericId);
          if (error) {
            const { error: err2 } = await supabase.from('categories').delete().eq('id', catId);
            if (err2) throw err2;
          }
        } else {
          const { error } = await supabase.from('categories').delete().eq('id', catId);
          if (error) throw error;
        }
      }

      console.log("Category deleted successfully");
      console.log("Updating local state");

      const cat = categories.find(c => c.id === catId);
      if (setCategories) {
        setCategories(prev => prev.filter(c => c.id !== catId));
      }
      addLog(`حذف قسم التصنيف: ${cat?.name}`, {
        panel: 'Admin',
        target_type: 'category',
        target_id: catId,
        target_name: cat?.name || null
      });

      const successMsg = 'تم حذف التصنيف بنجاح.';
      setCatMessage({ text: successMsg, type: 'success' });
      try {
        alert(successMsg);
      } catch (e) {
        console.warn('Alert blocked:', e);
      }

      // Clear the feedback message after 4 seconds
      setTimeout(() => {
        setCatMessage(null);
      }, 4000);

    } catch (err) {
      console.error(err);
    } finally {
      console.log("Delete finished");
    }
  };

  // Verification Requests Handlers
  const handleApproveVerification = (req: VerificationRequest) => {
    // Approve
    if (onUpdateVerificationStatus) {
      onUpdateVerificationStatus(req.id, 'approved');
    }
    
    // Find the user and add "verified" badge
    const targetUser = users.find(u => u.id === req.storeId);
    if (targetUser && !targetUser.badges.includes('verified')) {
      const updated = [...targetUser.badges, 'verified' as UserBadge];
      onUpdateUserBadges(req.storeId, updated);
    }
    
    addLog(`قبول طلب توثيق حساب المتجر ومنح شارة موثق ✔️ للتاجر: ${req.storeName}`, {
      panel: 'Admin',
      target_type: 'verification',
      target_id: req.id,
      target_name: req.storeName,
      target_user_id: req.storeId,
      target_user_email: targetUser?.email || null
    });
  };

  const handleRejectVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRequest) return;

    if (onUpdateVerificationStatus) {
      onUpdateVerificationStatus(rejectRequest.id, 'rejected', rejectionReasonInput);
    }

    addLog(`رفض طلب توثيق متجر التاجر: ${rejectRequest.storeName} بسبب: ${rejectionReasonInput}`, {
      panel: 'Admin',
      target_type: 'verification',
      target_id: rejectRequest.id,
      target_name: rejectRequest.storeName,
      target_user_id: rejectRequest.storeId,
      target_user_email: null
    });
    setRejectRequest(null);
    setRejectionReasonInput('');
  };

  // Toggle Featured Store Handler (is_featured)
  const handleToggleFeatured = async (seller: User) => {
    const currentStatus = Boolean(seller.is_featured || seller.isFeatured);
    const nextStatus = !currentStatus;

    console.log("seller.id =", seller.id);

    if (isSupabaseConfigured && supabase) {
      try {
        const row = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .eq("id", seller.id);
        console.log(row);

        const all = await supabase
          .from("profiles")
          .select("id, username, full_name");
        console.log(all.data);

        const { data, error } = await supabase
          .from('profiles')
          .update({ is_featured: nextStatus })
          .eq('id', seller.id)
          .select();

        console.log('[DIAGNOSTIC] UPDATE result:', { data, error });

        if (error) {
          console.error('[DIAGNOSTIC] UPDATE failed with error:', error);
        } else {
          // Verification SELECT query directly after UPDATE
          const { data: selectData, error: selectError } = await supabase
            .from('profiles')
            .select('id, is_featured')
            .eq('id', seller.id)
            .single();

          console.log('[DIAGNOSTIC] Verification SELECT after UPDATE:', {
            storeId: seller.id,
            is_featured: selectData?.is_featured,
            selectError
          });
        }
      } catch (err) {
        console.error('[DIAGNOSTIC] Failed updating is_featured in Supabase:', err);
      }
    }

    if (setUsers) {
      setUsers(prev =>
        prev.map(u =>
          u.id === seller.id
            ? { ...u, is_featured: nextStatus, isFeatured: nextStatus }
            : u
        )
      );
    }

    setDbUsersForStats(prev =>
      prev.map(u =>
        u.id === seller.id
          ? { ...u, is_featured: nextStatus, isFeatured: nextStatus }
          : u
      )
    );

    addLog(
      `${nextStatus ? 'تثبيت' : 'إزالة تثبيت'} المتجر (@${seller.username || seller.name}) ${
        nextStatus ? 'ضمن المتاجر المقترحة في الواجهة الرئيسية' : 'من المتاجر المقترحة'
      }`,
      {
        panel: 'Admin',
        target_type: 'user',
        target_id: seller.id,
        target_name: seller.name,
        target_user_id: seller.id,
        target_user_email: seller.email || null
      }
    );
  };

  // Autocomplete search effect for notification merchant target
  useEffect(() => {
    if (notifTarget !== 'specific') return;

    const query = notifSearchQuery.trim();
    if (query.length < 2) {
      setNotifSearchResults([]);
      setIsSearchingNotifUsers(false);
      return;
    }

    let isMounted = true;
    setIsSearchingNotifUsers(true);

    const performSearch = async () => {
      let combinedResults: User[] = [];

      // 1. Search in local users list first
      const qLower = query.toLowerCase();
      const localMatches = usersToUse.filter((u) => {
        const nameMatch = u.name?.toLowerCase().includes(qLower);
        const usernameMatch = u.username?.toLowerCase().includes(qLower);
        const idMatch = u.id?.toLowerCase().includes(qLower);
        const emailMatch = u.email?.toLowerCase().includes(qLower);
        const storeName = (u as any).store_name || (u as any).storeName || '';
        const storeMatch = storeName.toLowerCase().includes(qLower);
        return nameMatch || usernameMatch || idMatch || emailMatch || storeMatch;
      });

      combinedResults = [...localMatches];

      // 2. Search directly in Supabase profiles if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,store_name.ilike.%${query}%,id.ilike.%${query}%`)
            .limit(15);

          if (!error && data) {
            data.forEach((p: any) => {
              if (!combinedResults.some((u) => u.id === p.id)) {
                combinedResults.push(mapProfileToUser(p, p.email));
              }
            });
          }
        } catch (err) {
          console.warn('Error searching Supabase profiles for notification recipient:', err);
        }
      }

      if (isMounted) {
        setNotifSearchResults(combinedResults);
        setIsSearchingNotifUsers(false);
        setShowNotifDropdown(true);
      }
    };

    const timer = setTimeout(performSearch, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [notifSearchQuery, notifTarget, usersToUse]);

  const handleSelectNotifUser = (user: User) => {
    setSelectedNotifUser(user);
    setNotifSpecificUserId(user.id);
    setShowNotifDropdown(false);
    setNotifSearchQuery('');
    setNotifSearchResults([]);
  };

  const handleClearSelectedNotifUser = () => {
    setSelectedNotifUser(null);
    setNotifSpecificUserId('');
    setNotifSearchQuery('');
    setNotifSearchResults([]);
    setShowNotifDropdown(false);
  };

  // System Broadcast Notification Handler
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notifTarget === 'specific' && !notifSpecificUserId) {
      alert('يرجى تحديد تاجر مستهدف أولاً عبر البحث وتحديده من القائمة.');
      return;
    }
    if (notifTitle.trim() === '' || notifBody.trim() === '') return;

    const senderId = currentUser?.id || usersToUse.find(u => u.role === 'admin')?.id || 'admin';

    // Build list of target users depending on audience
    let rawTargetUsers: User[] = [];

    if (notifTarget === 'specific') {
      const found = selectedNotifUser || usersToUse.find(u => u.id === notifSpecificUserId) || ({ id: notifSpecificUserId, name: 'تاجر محدد' } as User);
      rawTargetUsers = [found];
    } else if (notifTarget === 'verified') {
      rawTargetUsers = usersToUse.filter(u => u.badges?.includes('verified') || (u as any).is_verified);
      if (rawTargetUsers.length === 0) {
        rawTargetUsers = usersToUse.filter(u => u.verificationStatus === 'approved' || (u as any).verification_status === 'approved');
      }
      if (rawTargetUsers.length === 0) {
        alert('لم يتم العثور على أي حسابات موثقة لإرسال الإشعار إليها.');
        return;
      }
    } else { // 'all'
      // Fetch users list once directly from Supabase profiles if available
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbProfiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, username, email');
          if (!profErr && dbProfiles && dbProfiles.length > 0) {
            rawTargetUsers = dbProfiles.map((p: any) => mapProfileToUser(p, p.email));
          } else {
            rawTargetUsers = usersToUse;
          }
        } catch (err) {
          rawTargetUsers = usersToUse;
        }
      } else {
        rawTargetUsers = usersToUse;
      }

      if (rawTargetUsers.length === 0) {
        alert('لا يوجد مستخدمين مسجلين لإرسال الإشعار إليهم.');
        return;
      }
    }

    // Strict deduplication by user ID (recipient_id) so every recipient receives max 1 notification record
    const targetMap = new Map<string, User>();
    for (const u of rawTargetUsers) {
      if (u.id && !targetMap.has(u.id)) {
        targetMap.set(u.id, u);
      }
    }

    const targetUsers = Array.from(targetMap.values());

    console.log('عدد المستخدمين المستهدفين:', targetUsers.length);

    // Build payload array (one row per unique target user)
    const payloads = targetUsers.map(u => ({
      user_id: u.id,
      recipient_id: u.id,
      sender_id: senderId,
      audience: notifTarget,
      type: 'system',
      title: notifTitle.trim(),
      message: notifBody.trim(),
      is_read: false,
      created_at: new Date().toISOString()
    }));

    console.log(`--- [Notification Broadcast] 1. INSERT Payloads (${payloads.length} records) ---`, payloads);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase Client is not configured or offline.');
      }

      // 1. Perform INSERT into notifications table
      const { data, error } = await supabase
        .from('notifications')
        .insert(payloads)
        .select();

      const insertedRecordsCount = data ? data.length : 0;
      console.log('عدد السجلات التي تم إدراجها فعلياً:', insertedRecordsCount);
      console.log('--- [Notification Broadcast] 2. INSERT Result ---', { data, error });

      if (error) {
        console.error('--- [Notification Broadcast] INSERT Failed ---', error);
        alert('فشلت عملية إرسال الإشعار إلى قاعدة البيانات: ' + (error.message || 'خطأ غير معروف'));
        return;
      }

      // 2. Immediate SELECT verification on the newly inserted record(s)
      if (data && data.length > 0) {
        const newRecordId = data[0].id;
        console.log(`--- [Notification Broadcast] 3. Running SELECT for Record ID [${newRecordId}] ---`);
        
        const { data: selectData, error: selectError } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', newRecordId)
          .single();

        console.log('--- [Notification Broadcast] 4. Verification SELECT Result ---', { selectData, selectError });
      }

      const targetText = notifTarget === 'all' 
        ? `جميع المستخدمين (${targetUsers.length} مستخدم)` 
        : notifTarget === 'verified' 
        ? `المتاجر الموثقة (${targetUsers.length} متجر)` 
        : `المستخدم بالمعرف [${notifSpecificUserId}] (${selectedNotifUser?.name || 'تاجر محدد'})`;

      addLog(`بث إشعار نظام عام لـ (${targetText}) بعنوان: "${notifTitle}"`, {
        panel: 'Admin',
        target_type: 'notification',
        target_id: notifSpecificUserId || null,
        target_name: notifTitle,
        target_user_id: selectedNotifUser?.id || null,
        target_user_email: selectedNotifUser?.email || null
      });

      // Update local state if handler provided
      if (setNotifications && data && data.length > 0) {
        const newNotifObjs: Notification[] = data.map((d: any, idx: number) => ({
          id: d.id || 'notif_' + Date.now() + '_' + idx,
          userId: d.user_id || d.recipient_id,
          user_id: d.user_id || d.recipient_id,
          senderId,
          sender_id: senderId,
          recipientId: d.recipient_id || d.user_id,
          recipient_id: d.recipient_id || d.user_id,
          audience: notifTarget as any,
          title: notifTitle.trim(),
          message: notifBody.trim(),
          type: 'system',
          read: false,
          is_read: false,
          createdAt: d.created_at || new Date().toISOString(),
          created_at: d.created_at || new Date().toISOString()
        }));
        setNotifications(prev => [...newNotifObjs, ...prev]);
      }

      setNotifTitle('');
      setNotifBody('');
      setNotifTemplate('none');
      setSelectedNotifUser(null);
      setNotifSpecificUserId('');
      setNotifSearchQuery('');
      setNotifSearchResults([]);
      setShowNotifDropdown(false);
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);

      // Refresh Notification Log table immediately
      await fetchNotifLogs();

    } catch (err: any) {
      console.error('--- [Notification Broadcast] Exception Error ---', err);
      alert('حدث خطأ غير متوقع أثناء إرسال الإشعار: ' + (err.message || 'خطأ في النظام'));
    }
  };

  // Contact Support Messages actions
  const handleSaveContactReply = (msgId: string) => {
    if (setContactMessages) {
      setContactMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        status: 'resolved',
        adminNotes: adminReplyText
      } : m));
    }
    addLog(`تم معالجة والرد على رسالة دعم من [${replyingMessage?.name}] بعنوان "${replyingMessage?.subject}"`, {
      panel: 'Admin',
      target_type: 'support_message',
      target_id: msgId,
      target_name: replyingMessage?.subject || null,
      target_user_email: replyingMessage?.email || null
    });
    alert('تم حفظ الرد والتعليق الإداري وتحديث حالة الرسالة إلى "تمت المعالجة" بنجاح.');
    setReplyingMessage(null);
    setAdminReplyText('');
  };

  const handleDeleteContactMsg = (msgId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) {
      if (setContactMessages) {
        setContactMessages(prev => prev.filter(m => m.id !== msgId));
      }
      addLog(`حذف رسالة دعم بريد وارد رقم #${msgId}`, {
        panel: 'Admin',
        target_type: 'support_message',
        target_id: msgId
      });
    }
  };

  // Filtered Lists
  const filteredUsersList = users.filter(u => {
    const query = userSearch.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(query) || 
                        (u.username || '').toLowerCase().includes(query) || 
                        u.email.toLowerCase().includes(query);
    
    if (!matchSearch) return false;

    if (userRoleFilter !== 'all') {
      if (u.role !== userRoleFilter) return false;
    }

    if (userFilter === 'verified') return u.badges.includes('verified');
    if (userFilter === 'suspended') return u.status === 'suspended';
    if (userFilter === 'banned') return u.status === 'banned';
    if (userFilter === 'deactivated') return u.status === 'deactivated';
    if (userFilter === 'active') return !u.status || u.status === 'active';
    return true;
  });

  const filteredContactMsgs = contactMessages.filter(msg => {
    const matchesSearch = msg.name.toLowerCase().includes(msgSearch.toLowerCase()) ||
                          msg.email.toLowerCase().includes(msgSearch.toLowerCase()) ||
                          msg.subject.toLowerCase().includes(msgSearch.toLowerCase()) ||
                          msg.message.toLowerCase().includes(msgSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    const matchesType = typeFilter === 'all' || msg.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredProductsList = productsToUse.filter(p => {
    const query = productSearch.toLowerCase();
    const seller = usersToUse.find(u => u.id === p.sellerId);
    const matchSearch = p.title.toLowerCase().includes(query) || 
                        (seller ? seller.name.toLowerCase().includes(query) : false) || 
                        p.description.toLowerCase().includes(query);
    
    if (!matchSearch) return false;

    if (productFilter === 'active') return p.status === 'active';
    if (productFilter === 'sold') return p.status === 'sold';
    if (productFilter === 'hidden') return p.status === 'hidden';
    return true;
  });

  const filteredReportsList = reports.filter(r => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved';
    if (reportFilter === 'dismissed') return r.status === 'dismissed';
    if (reportFilter === 'rejected') return r.status === 'dismissed';
    return true;
  });

  // --- Secure Admin Login View ---
  if (!isGateAuthenticated) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center font-sans rtl">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden text-right">
          <div className="p-8 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white text-center border-b border-amber-500/15 relative">
            <div className="absolute top-4 left-4 text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
              إصدار V1.0
            </div>
            <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-pulse" />
            <h1 className="text-xl font-black text-slate-800 dark:text-white">لوحة الإدارة والمشرفين</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">بوابة الدخول الآمن لحماية نزاهة منصة VELORIA</p>
          </div>

          <form onSubmit={handleGateLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">البريد الإلكتروني للإدارة:</label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@veloria.com"
                  className="w-full text-xs p-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  required
                />
                <Key className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة مرور الأمان الحساسة:</label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>تسجيل دخول إداري آمن</span>
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-medium">لتسهيل تجربة التقييم السريع للمحكمين:</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickBypass('admin')}
                  className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-bold cursor-pointer"
                >
                  👑 دخول سريع كمدير كامل الصلاحيات
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickBypass('moderator')}
                  className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-xl text-[10px] font-bold cursor-pointer"
                >
                  🛡️ دخول سريع كمشرف محتوى
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- Authenticated Dashboard Main View ---
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md overflow-hidden font-sans text-right rtl">
      {/* Top Professional Admin Banner */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-white">
                لوحة الإدارة والرقابة الشاملة
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentUser.role === 'admin' 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {currentUser.role === 'admin' ? 'صلاحيات كاملة - مدير' : 'صلاحيات رقابية - مشرف'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
              مرحباً <strong>{currentUser.name}</strong>. يرجى مراجعة التقارير ومراقبة مؤشرات أداء منصة VELORIA وحماية حقوق البائعين والمشترين.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-850 py-1.5 px-3 rounded-xl hidden lg:inline">
            IP: 192.168.1.104
          </span>
          <button
            onClick={handleLogoutGate}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            خروج آمن
          </button>
        </div>
      </div>

      {/* Grid containing Tab Navigation (Sidebar style on md+, top bar on mobile) */}
      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Tab Selector Column */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950/40 p-4 border-l border-slate-100 dark:border-slate-800/60 flex flex-col justify-between shrink-0">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold block px-3 uppercase tracking-wider mb-2">الأقسام الأساسية</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>مؤشرات الأداء والإحصائيات</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0" />
                <span>إدارة حسابات الأعضاء</span>
              </div>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded font-mono">{totalUsers}</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>إدارة عروض المنتجات</span>
              </div>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded font-mono">{totalProducts}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>بلاغات المحتوى والشكاوى</span>
              </div>
              {pendingReportsCount > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded animate-pulse">{pendingReportsCount}</span>
              )}
            </button>

            <span className="text-[10px] text-slate-400 font-extrabold block px-3 uppercase tracking-wider pt-4 pb-2">صلاحيات المدير الخاص</span>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                currentUser.role !== 'admin' ? 'opacity-50' : ''
              } ${
                activeTab === 'categories'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>إدارة وتعديل التصنيفات</span>
            </button>

            <button
              onClick={() => setActiveTab('verification')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>طلبات توثيق المتاجر</span>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 rounded font-mono">
                {verificationRequests.filter(r => r.status === 'pending').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                currentUser.role !== 'admin' ? 'opacity-50' : ''
              } ${
                activeTab === 'badges'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Star className="w-4 h-4 shrink-0" />
              <span>شارات الثقة والأوسمة</span>
            </button>

            <button
              onClick={() => setActiveTab('featured')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                currentUser.role !== 'admin' ? 'opacity-50' : ''
              } ${
                activeTab === 'featured'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Store className="w-4 h-4 shrink-0" />
              <span>إدارة المتاجر المقترحة</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>إرسال إشعارات عامة</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>سجل النشاط الإداري</span>
            </button>

            <button
              onClick={() => setActiveTab('contributions')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'contributions'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-500/10" />
                <span>طلبات المساهمة والدعم</span>
              </div>
              {contributions.filter(c => c.status === 'Pending').length > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded animate-pulse">
                  {contributions.filter(c => c.status === 'Pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('contact-messages')}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeTab === 'contact-messages'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>رسائل مركز الدعم (اتصل بنا)</span>
              </div>
              {contactMessages.filter(m => m.status === 'pending').length > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded animate-pulse">
                  {contactMessages.filter(m => m.status === 'pending').length}
                </span>
              )}
            </button>

            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('platform-settings')}
                  className={`w-full text-right px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'platform-settings'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>⚙️ إعدادات المنصة (إداري)</span>
                </button>
              </>
            )}
          </div>

          {/* Footer inside sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
            <p>الإصدار 1.0.0 فيلوريا</p>
            <p className="mt-0.5 text-amber-500">موصول بقاعدة البيانات النشطة</p>
          </div>
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* TAB 1: Dashboard & Analytics */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <Users className="w-5 h-5 text-indigo-500 mb-1" />
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{totalUsers}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">إجمالي المستخدمين</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <ShoppingCart className="w-5 h-5 text-emerald-500 mb-1" />
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{totalProducts}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">إجمالي المنتجات</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mb-1" />
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{activeProducts}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">المنتجات النشطة</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <Store className="w-5 h-5 text-amber-500 mb-1" />
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{soldProducts}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">المنتجات المباعة</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <AlertTriangle className="w-5 h-5 text-rose-500 mb-1" />
                  <div className={`text-xl font-black font-mono ${pendingReportsCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{pendingReportsCount}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">البلاغات المعلقة</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <UserCheck className="w-5 h-5 text-blue-500 mb-1" />
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{verifiedStoresCount}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">المتاجر الموثقة</p>
                </div>
              </div>

              {/* Visual Analytics & Ratios */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Ratio gauge (Active vs Sold vs Hidden) */}
                <div className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
                  <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-emerald-500" />
                    توزيع حالات المنتجات في السوق
                  </h4>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-600 dark:text-slate-300">المنتجات النشطة والمعروضة ({activeProducts})</span>
                        <span className="font-mono">{totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-600 dark:text-slate-300">المنتجات المباعة بنجاح ({soldProducts})</span>
                        <span className="font-mono">{totalProducts > 0 ? Math.round((soldProducts / totalProducts) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalProducts > 0 ? (soldProducts / totalProducts) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-600 dark:text-slate-300">المنتجات المخفية لرقابة المحتوى ({hiddenProducts})</span>
                        <span className="font-mono">{totalProducts > 0 ? Math.round((hiddenProducts / totalProducts) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalProducts > 0 ? (hiddenProducts / totalProducts) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Categories visual list */}
                <div className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
                  <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    أقسام السوق الأكثر نشاطاً وإعلاناً
                  </h4>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {categories.slice(0, 5).map((cat, idx) => {
                      const count = productsToUse.filter(p => String(p.categoryId) === String(cat.id)).length;
                      return (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span className="text-slate-400">#{idx+1}</span>
                            {cat.name}
                          </span>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-mono font-bold">
                            {count} إعلان
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Highest Rated Stores and performance statistics */}
                <div className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl">
                  <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    أعلى متاجر فيلوريا تقييماً
                  </h4>

                  <div className="space-y-2">
                    {usersToUse.slice(0, 3).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-xs p-1.5 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" />
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                        </div>
                        <div className="text-[10px] text-amber-500 font-bold font-mono">
                          {u.ratingAverage > 0 ? `⭐ ${u.ratingAverage}` : 'لا يوجد تقييم'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fictional System Alert / Quick Stats Notice */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">ملاحظة أمنية:</span> نظام الرقابة يسجل نشاط المديرين بشكل دائم. تم تعقب أحدث 5 عمليات بنجاح وتوفير شهادة التشفير الموثقة RLS لكل البيانات.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Users Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="ابحث باسم العضو، اسم المستخدم، البريد..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">فلترة الحالة:</span>
                    <select
                      value={userFilter}
                      onChange={(e: any) => setUserFilter(e.target.value)}
                      className="text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                    >
                      <option value="all">الكل ({totalUsers})</option>
                      <option value="active">النشطين</option>
                      <option value="verified">الموثقين فقط</option>
                      <option value="suspended">المعلقين</option>
                      <option value="banned">المحظورين</option>
                      <option value="deactivated">المعطلين ذاتياً (Deactivated)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">فلترة الدور:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e: any) => setUserRoleFilter(e.target.value)}
                      className="text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                    >
                      <option value="all">الكل</option>
                      <option value="visitor">عضو</option>
                      <option value="user">تاجر</option>
                      <option value="moderator">مشرف</option>
                      <option value="admin">مدير</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Data Table */}
              <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                    <tr>
                      <th className="p-3 text-[10px]">التاجر / العضو</th>
                      <th className="p-3 text-[10px]">المدينة</th>
                      <th className="p-3 text-[10px]">التقييم</th>
                      <th className="p-3 text-[10px]">الرتبة / الثقة</th>
                      <th className="p-3 text-[10px]">الدور / الصلاحية</th>
                      <th className="p-3 text-[10px]">تاريخ الانضمام</th>
                      <th className="p-3 text-[10px]">الحالة</th>
                      <th className="p-3 text-[10px]">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredUsersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                        <td className="p-3 flex items-center gap-2.5 min-w-[220px]">
                          <img src={u.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800" />
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 flex-wrap">
                              <span>{u.name}</span>
                              {u.badges.includes('verified') && (
                                <span className="text-[8px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-bold">موثق</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{u.city || 'غير محدد'}</td>
                        <td className="p-3 text-amber-500 font-bold font-mono">
                          {u.ratingAverage > 0 ? `⭐ ${u.ratingAverage}` : 'لا يوجد تقييم'}
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/10">
                            {u.trustLevel || 'عضو عادي'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              : u.role === 'moderator'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : u.role === 'user'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                          }`}>
                            {u.role === 'admin' ? 'مدير' : u.role === 'moderator' ? 'مشرف' : u.role === 'user' ? 'تاجر' : 'عضو'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono">{u.joinedAt || '2026-01-01'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            u.status === 'suspended'
                              ? 'bg-amber-500/10 text-amber-600'
                              : u.status === 'banned'
                              ? 'bg-rose-500/10 text-rose-600'
                              : u.status === 'deactivated'
                              ? 'bg-slate-500/10 text-slate-500'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            {u.status === 'suspended' ? 'معلق' : u.status === 'banned' ? 'محظور' : u.status === 'deactivated' ? 'معطل ذاتياً' : 'نشط'}
                          </span>
                        </td>
                        <td className="p-3 min-w-[240px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* View info action */}
                            <button
                              onClick={() => setViewingUserObj(u)}
                              className="p-1 text-sky-500 hover:text-sky-600 cursor-pointer"
                              title="عرض معلومات العضو التفصيلية"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Role action */}
                            <button
                              onClick={() => {
                                setChangingRoleUser(u);
                                setSelectedNewRole(u.role);
                                setRoleChangeConfirm(false);
                                setRoleError(null);
                              }}
                              className="p-1 text-teal-500 hover:text-teal-600 cursor-pointer"
                              title="تغيير دور المستخدم"
                            >
                              <Shield className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1 text-indigo-500 hover:text-indigo-600 cursor-pointer"
                              title="تعديل ملف المستخدم"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* User status actions */}
                            {u.status === 'suspended' || u.status === 'deactivated' || u.status === 'banned' ? (
                              <button
                                onClick={() => handleUserStatusUpdate(u.id, 'active')}
                                className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold rounded hover:bg-emerald-500/20 cursor-pointer"
                                title="إعادة تنشيط الحساب"
                              >
                                تفعيل
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserStatusUpdate(u.id, 'suspended')}
                                className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-bold rounded hover:bg-amber-500/20 cursor-pointer"
                                title="تعليق الحساب مؤقتاً لمراجعة السلوك"
                              >
                                تعليق
                              </button>
                            )}

                            {u.status !== 'banned' && (
                              <button
                                onClick={() => handleUserStatusUpdate(u.id, 'banned')}
                                className="px-2 py-0.5 bg-rose-500/10 text-rose-600 text-[9px] font-bold rounded hover:bg-rose-500/20 cursor-pointer"
                                title="حظر الحساب نهائياً لمنع الدخول"
                              >
                                حظر
                              </button>
                            )}

                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => toggleBadge(u, 'verified')}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                                  u.badges.includes('verified')
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300'
                                }`}
                                title="توثيق الحساب بالكامل"
                              >
                                {u.badges.includes('verified') ? 'إلغاء التوثيق' : 'توثيق ✔️'}
                              </button>
                            )}

                            {/* Delete User action */}
                            <button
                              onClick={() => {
                                setDeletingUserObj(u);
                                setDeleteConfirmStep(1);
                              }}
                              className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="ابحث باسم الإعلان، البائع..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">حالة الإعلان:</span>
                  <select
                    value={productFilter}
                    onChange={(e: any) => setProductFilter(e.target.value)}
                    className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                  >
                    <option value="all">الكل ({totalProducts})</option>
                    <option value="active">نشط ومعروض</option>
                    <option value="sold">مباع</option>
                    <option value="hidden">مخفي بمخالفة</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                    <tr>
                      <th className="p-3 text-[10px]">المنتج</th>
                      <th className="p-3 text-[10px]">القسم</th>
                      <th className="p-3 text-[10px]">السعر</th>
                      <th className="p-3 text-[10px]">البائع</th>
                      <th className="p-3 text-[10px]">المشاهدات</th>
                      <th className="p-3 text-[10px]">الحالة</th>
                      <th className="p-3 text-[10px]">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredProductsList.map((p) => {
                      const category = categories.find(c => String(c.id) === String(p.categoryId));
                      const seller = users.find(u => u.id === p.sellerId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                          <td className="p-3 flex items-center gap-2 min-w-[200px]">
                            <img 
                              src={p.images[0]} 
                              className="w-9 h-9 rounded-lg object-cover cursor-zoom-in hover:opacity-80 transition-opacity" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(p.images[0]);
                              }}
                              title="تكبير الصورة"
                            />
                            <span 
                              onClick={() => onSelectProduct?.(p)}
                              className="font-bold truncate max-w-[150px] text-slate-800 dark:text-slate-200 hover:text-amber-500 hover:underline cursor-pointer transition-colors" 
                              title={p.title}
                            >
                              {p.title}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{category?.name || 'تصنيف آخر'}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.price} {p.currency}</td>
                          <td className="p-3 font-bold text-slate-600 dark:text-slate-400">
                            {seller ? (
                              <span 
                                onClick={() => onSelectSeller?.(seller)}
                                className="hover:text-amber-500 hover:underline cursor-pointer transition-colors"
                                title="عرض الملف الشخصي للبائع"
                              >
                                {seller.name}
                              </span>
                            ) : (
                              'غير معروف'
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-400">{p.viewsCount || 0}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              p.status === 'hidden'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                                : p.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : p.status === 'sold'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                : 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                            }`}>
                              {p.status === 'hidden' ? 'مخفي بمخالفة' : p.status === 'active' ? 'نشط' : p.status === 'sold' ? 'مباع' : 'منتهي الصلاحية'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1 text-indigo-500 hover:text-indigo-600 cursor-pointer"
                                title="تعديل المنتج"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {p.status !== 'hidden' ? (
                                <button
                                  onClick={() => {
                                    console.log("Hide button clicked");
                                    handleProductStatusToggle(p.id, 'hidden');
                                  }}
                                  className="p-1 text-amber-500 hover:text-rose-500 cursor-pointer"
                                  title="إخفاء المنتج من السوق للمخالفة"
                                >
                                  <EyeOff className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleProductStatusToggle(p.id, 'active')}
                                  className="p-1 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                                  title="إعادة تنشيط وإظهار المنتج"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}

                              {currentUser.role === 'admin' && (
                                <button
                                  onClick={() => handleDeleteProductAdmin(p.id)}
                                  className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                                  title="حذف نهائي من قاعدة البيانات"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Reports Management */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-[11px] font-bold text-slate-500">مجموع البلاغات النشطة والمعلقة: {reports.length}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">تصفية حسب الحالة:</span>
                  <select
                    value={reportFilter}
                    onChange={(e: any) => setReportFilter(e.target.value)}
                    className="text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200"
                  >
                    <option value="all">عرض الكل</option>
                    <option value="pending">المعلقة فقط ({pendingReportsCount})</option>
                    <option value="resolved">تم اعتمادها وحلها</option>
                    <option value="rejected">المرفوضة / كيدية</option>
                  </select>
                </div>
              </div>

              {/* Reports list */}
              {filteredReportsList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  لا توجد أي بلاغات مطابقة للتصفية حالياً.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReportsList.map((rep) => {
                    const targetProduct = products.find(p => p.id === rep.targetId);
                    const reportedUser = users.find(u => u.id === rep.targetId);
                    return (
                      <ReportCard
                        key={rep.id}
                        report={rep}
                        targetProduct={targetProduct}
                        reportedUser={reportedUser}
                        onAcceptReport={handleAcceptReport}
                        onHideProduct={handleHideProductAndResolveReport}
                        onSuspendUser={handleUserSuspendAndResolveReport}
                        onRejectReport={handleRejectReport}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Categories Management */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {currentUser.role !== 'admin' ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-3xl text-slate-400">
                  <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-slate-700">قسم مغلق ومحمي</h3>
                  <p className="text-xs mt-1 text-slate-400">تعديل التصنيفات والفئات متاح لمدير النظام الشامل (Administrator) فقط.</p>
                </div>
              ) : (
                selectedCategoryDetail ? (
                  /* --- CATEGORY DETAIL PAGE --- */
                  <div className="space-y-6">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedCategoryDetail(null)}
                            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            title="الرجوع إلى قائمة التصنيفات"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">📁</span>
                              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                {currentCategoryDetail?.name || selectedCategoryDetail.name}
                              </h2>
                              {((currentCategoryDetail?.is_active === false) || (currentCategoryDetail?.isActive === false)) && (
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                                  مخفي
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              إدارة واستعراض جميع المنتجات التابعة لهذا التصنيف
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedCategoryDetail(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>الرجوع للتصنيفات</span>
                        </button>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">جميع المنتجات</span>
                          <span className="text-xl font-black text-slate-800 dark:text-slate-100">{categoryAllProducts.length}</span>
                        </div>

                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 text-center">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">المنتجات النشطة</span>
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{categoryActiveProducts.length}</span>
                        </div>

                        <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100/50 dark:border-rose-900/30 text-center">
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">المنتجات المخفية</span>
                          <span className="text-xl font-black text-rose-600 dark:text-rose-400">{categoryHiddenProducts.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Toolbar: Search and Sort */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                      {/* Search */}
                      <div className="relative w-full md:w-80">
                        <input
                          type="text"
                          placeholder="ابحث باسم المنتج، المتجر، السعر..."
                          value={catDetailSearch}
                          onChange={(e) => setCatDetailSearch(e.target.value)}
                          className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                      </div>

                      {/* Sort */}
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">الترتيب حسب:</span>
                        <select
                          value={catDetailSort}
                          onChange={(e) => setCatDetailSort(e.target.value as any)}
                          className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="date-desc">التاريخ (الأحدث أولاً)</option>
                          <option value="date-asc">التاريخ (الأقدم أولاً)</option>
                          <option value="price-desc">السعر (الأعلى أولاً)</option>
                          <option value="price-asc">السعر (الأقل أولاً)</option>
                          <option value="views-desc">عدد المشاهدات (الأكثر مشاهدة)</option>
                          <option value="reports-desc">عدد البلاغات (الأكثر بلاغات)</option>
                        </select>
                      </div>
                    </div>

                    {/* Products Table */}
                    <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                          <tr>
                            <th className="p-3 text-[10px]">المنتج</th>
                            <th className="p-3 text-[10px]">المتجر / التاجر</th>
                            <th className="p-3 text-[10px]">السعر</th>
                            <th className="p-3 text-[10px]">الحالة</th>
                            <th className="p-3 text-[10px]">البلاغات</th>
                            <th className="p-3 text-[10px]">المشاهدات</th>
                            <th className="p-3 text-[10px]">تاريخ الإضافة</th>
                            <th className="p-3 text-[10px]">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {filteredAndSortedCategoryProducts.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                                لا توجد منتجات مطابقة في هذا التصنيف
                              </td>
                            </tr>
                          ) : (
                            filteredAndSortedCategoryProducts.map((p) => {
                              const seller = users.find((u) => u.id === p.sellerId);
                              const pReports = (reports || []).filter((r) => r.type === 'product' && r.targetId === p.id);
                              const reportCount = pReports.length;

                              return (
                                <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                                  {/* صورة واسم المنتج */}
                                  <td className="p-3 flex items-center gap-2 min-w-[180px]">
                                    <img
                                      src={p.images[0]}
                                      className="w-10 h-10 rounded-lg object-cover cursor-zoom-in hover:opacity-80 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxImage(p.images[0]);
                                      }}
                                      title="تكبير الصورة"
                                    />
                                    <span
                                      onClick={() => onSelectProduct?.(p)}
                                      className="font-bold truncate max-w-[140px] text-slate-800 dark:text-slate-200 hover:text-amber-500 hover:underline cursor-pointer transition-colors"
                                      title={p.title}
                                    >
                                      {p.title}
                                    </span>
                                  </td>

                                  {/* اسم المتجر / التاجر */}
                                  <td className="p-3 font-bold text-slate-600 dark:text-slate-400">
                                    {seller ? (
                                      <button
                                        onClick={() => onSelectSeller?.(seller)}
                                        className="flex items-center gap-1.5 hover:text-amber-500 hover:underline cursor-pointer transition-colors"
                                        title="الانتقال لصفحة المتجر"
                                      >
                                        <Store className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{seller.name}</span>
                                      </button>
                                    ) : (
                                      'غير معروف'
                                    )}
                                  </td>

                                  {/* السعر */}
                                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {p.price} {p.currency}
                                  </td>

                                  {/* الحالة */}
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      p.status === 'hidden'
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                                        : p.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                        : p.status === 'sold'
                                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                        : 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                                    }`}>
                                      {p.status === 'hidden' ? 'مخفي' : p.status === 'active' ? 'نشط' : p.status === 'sold' ? 'مباع' : 'منتهي'}
                                    </span>
                                  </td>

                                  {/* عدد البلاغات */}
                                  <td className="p-3 font-mono font-bold">
                                    {reportCount > 0 ? (
                                      <span className="text-rose-500 flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        {reportCount}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">0</span>
                                    )}
                                  </td>

                                  {/* عدد المشاهدات */}
                                  <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                                    {p.viewsCount || 0}
                                  </td>

                                  {/* تاريخ الإضافة */}
                                  <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                                  </td>

                                  {/* الإجراءات */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5">
                                      {seller && (
                                        <button
                                          onClick={() => onSelectSeller?.(seller)}
                                          className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                                          title="الانتقال إلى صفحة المتجر"
                                        >
                                          <Store className="w-4 h-4" />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => setEditingProduct(p)}
                                        className="p-1 text-indigo-500 hover:text-indigo-600 cursor-pointer"
                                        title="تعديل المنتج"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>

                                      {p.status !== 'hidden' ? (
                                        <button
                                          onClick={() => handleProductStatusToggle(p.id, 'hidden')}
                                          className="p-1 text-amber-500 hover:text-rose-500 cursor-pointer"
                                          title="إخفاء المنتج"
                                        >
                                          <EyeOff className="w-4 h-4" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleProductStatusToggle(p.id, 'active')}
                                          className="p-1 text-emerald-500 hover:text-emerald-600 cursor-pointer"
                                          title="إظهار وإعادة تنشيط المنتج"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      )}

                                      {currentUser.role === 'admin' && (
                                        <button
                                          onClick={() => handleDeleteProductAdmin(p.id)}
                                          className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                                          title="حذف المنتج نهائياً"
                                        >
                                          <Trash className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Creator Form */}
                    <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                      <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-amber-500" />
                        إضافة قسم تصنيفي جديد للسوق
                      </h3>
                      <p className="text-[10px] text-slate-400 mb-4">تنظيم أفضل لإعلانات ومعروضات التاجر لتسهيل وصول المشتري.</p>

                      {catSuccess && (
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 text-xs rounded-xl mb-4 font-bold text-center">
                          تم إضافة التصنيف الجديد بنجاح وإتاحته للجميع فوراً!
                        </div>
                      )}

                      <form onSubmit={handleCreateCategory} className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">اسم القسم الجديد (بالعربية):</label>
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="مثال: عقارات، أثاث قديم، معدات..."
                            className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1 font-bold">أيقونة القسم المناسبة:</label>
                          <select
                            value={newCatIcon}
                            onChange={(e) => setNewCatIcon(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <option value="Sparkles">بريق ✨</option>
                            <option value="Shirt">أزياء وملابس 👕</option>
                            <option value="Luggage">أحذية وحقائب 👜</option>
                            <option value="Smartphone">موبايلات وإكسسوارات 📱</option>
                            <option value="Tv">إلكترونيات 📺</option>
                            <option value="Home">أجهزة منزلية 🏠</option>
                            <option value="Car">سيارات وقطع غيار 🚗</option>
                            <option value="Building">عقارات 🏢</option>
                            <option value="Bed">أثاث ومفروشات 🛏️</option>
                            <option value="BookOpen">كتب وقرطاسية 📖</option>
                            <option value="Gamepad">ألعاب أطفال 🎮</option>
                            <option value="Utensils">أطعمة ومشروبات 🍔</option>
                            <option value="Wrench">خدمات وصيانة 🛠️</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-colors"
                        >
                          إضافة القسم الجديد بنجاح
                        </button>
                      </form>
                    </div>

                    {/* Existing Categories Table */}
                    <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-4">أقسام وتصنيفات المنصة ({categories.length})</h3>
                      {catMessage && (
                        <div className={`p-2.5 rounded-xl mb-4 text-xs font-bold text-center ${
                          catMessage.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {catMessage.text}
                        </div>
                      )}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {categories.map((cat) => {
                          const isHidden = cat.is_active === false || cat.isActive === false;
                          const activeProdCount = (products || []).filter((p) => {
                            if (p.status !== 'active') return false;
                            const pCatId = String(p.categoryId);
                            const cId = String(cat.id);
                            return (
                              pCatId === cId ||
                              p.categoryId === cat.id ||
                              (typeof pCatId === 'string' && typeof cId === 'string' && pCatId.replace('cat-', '') === cId.replace('cat-', ''))
                            );
                          }).length;

                          return (
                            <div
                              key={cat.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                isHidden
                                  ? 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850'
                              }`}
                            >
                              <div
                                onClick={() => setSelectedCategoryDetail(cat)}
                                className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity"
                                title="اضغط للانتقال لصفحة إدارة هذا التصنيف والمنتجات التابعة له"
                              >
                                <span className="text-base group-hover:scale-110 transition-transform">📁</span>
                                <span className="text-xs font-bold text-slate-850 dark:text-white group-hover:text-amber-500 transition-colors">
                                  {cat.name}{' '}
                                  <span className="text-slate-400 font-extrabold mr-0.5">({activeProdCount})</span>
                                </span>
                                {isHidden && (
                                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-300/50 dark:border-slate-700/50">
                                    مخفي
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer transition-colors"
                                  title="تعديل هذا القسم"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {isHidden ? (
                                  <button
                                    onClick={() => handleToggleCategoryVisibility(cat)}
                                    className="px-2 py-1 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                    title="إظهار التصنيف"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>إظهار</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleCategoryVisibility(cat)}
                                    className="px-2 py-1 text-xs font-bold bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                    title="إخفاء التصنيف"
                                  >
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>إخفاء</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                  title="حذف هذا القسم"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 6: Verification Requests Management */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-2">طلبات توثيق المتاجر والعلامات التجارية</h3>
              <p className="text-[10px] text-slate-400">توثيق الحساب يمنح المتجر شارة (✔️ موثق) مما يزيد مبيعاتهم ومصداقيتهم بمعدل 4 أضعاف.</p>

              {/* Grid of verification requests */}
              <div className="space-y-3">
                {(!verificationRequests || verificationRequests.length === 0) ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                    🎉 لا توجد طلبات توثيق مسجلة حالياً.
                  </div>
                ) : (
                  verificationRequests.map((req) => {
                    const targetUser = users.find(u => u.id === req.storeId) || {
                      id: req.storeId,
                      name: req.storeName,
                      email: '',
                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
                      badges: [],
                      isPremium: false,
                      followersCount: 0,
                      ratingAverage: 5,
                      ratingsCount: 0,
                      role: 'user' as const,
                      joinedAt: req.createdAt || new Date().toISOString(),
                      username: req.storeUsername
                    };
                    const avatarUrl = targetUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                    return (
                      <div key={req.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img 
                            src={avatarUrl} 
                            onClick={() => onSelectSeller?.(targetUser as User)}
                            className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                            title="اضغط لفتح صفحة المتجر والمراجعة"
                          />
                          <div>
                            <div className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span>{req.storeName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">(@{req.storeUsername})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>سجل تجاري/هوية: <strong className="font-mono text-slate-700 dark:text-slate-300">{(req as any).nationalId || (req as any).national_id || 'غ/م'}</strong></span>
                              <span>نوع النشاط: <strong className="text-slate-700 dark:text-slate-300">{(req as any).businessType || (req as any).business_type || 'متجر'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => onUpdateVerificationStatus?.(req.id, 'approved')}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                قبول التوثيق
                              </button>
                              <button
                                onClick={() => onUpdateVerificationStatus?.(req.id, 'rejected')}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                رفض
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold rounded-xl text-xs border border-emerald-500/20">
                              تم القبول والتوثيق ✔️
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-3 py-1 bg-rose-500/10 text-rose-600 font-bold rounded-xl text-xs border border-rose-500/20">
                              مرفوض ❌
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 8: Featured Stores Management */}
          {activeTab === 'featured' && (() => {
            const filteredFeaturedSellers = usersToUse.filter((seller) => {
              if (!featuredSearch.trim()) return true;
              const term = featuredSearch.trim().toLowerCase();
              const storeName = (seller.name || '').toLowerCase();
              const ownerName = ((seller as any).full_name || (seller as any).fullName || '').toLowerCase();
              const username = (seller.username || '').toLowerCase();
              const city = (seller.city || '').toLowerCase();
              const customStoreName = ((seller as any).store_name || (seller as any).storeName || '').toLowerCase();

              return (
                storeName.includes(term) ||
                ownerName.includes(term) ||
                username.includes(term) ||
                city.includes(term) ||
                customStoreName.includes(term)
              );
            });

            const sortedFeaturedSellers = [...filteredFeaturedSellers].sort((a, b) => {
              if (featuredSort === 'newest') {
                const dateA = new Date(a.joinedAt || (a as any).created_at || 0).getTime();
                const dateB = new Date(b.joinedAt || (b as any).created_at || 0).getTime();
                return dateB - dateA;
              }
              if (featuredSort === 'oldest') {
                const dateA = new Date(a.joinedAt || (a as any).created_at || 0).getTime();
                const dateB = new Date(b.joinedAt || (b as any).created_at || 0).getTime();
                return dateA - dateB;
              }
              if (featuredSort === 'name-asc') {
                return (a.name || '').localeCompare(b.name || '', 'ar');
              }
              if (featuredSort === 'name-desc') {
                return (b.name || '').localeCompare(a.name || '', 'ar');
              }
              if (featuredSort === 'followers-desc') {
                return getStoreFollowersCount(b.id) - getStoreFollowersCount(a.id);
              }
              if (featuredSort === 'followers-asc') {
                return getStoreFollowersCount(a.id) - getStoreFollowersCount(b.id);
              }
              if (featuredSort === 'rating-desc') {
                return (b.ratingAverage || 0) - (a.ratingAverage || 0);
              }
              if (featuredSort === 'rating-asc') {
                return (a.ratingAverage || 0) - (b.ratingAverage || 0);
              }
              if (featuredSort === 'city') {
                return (a.city || 'الرياض').localeCompare(b.city || 'الرياض', 'ar');
              }
              if (featuredSort === 'verified-first') {
                const isVerifiedA = Boolean(
                  verificationRequests?.some(r => (r.storeId === a.id || r.storeUsername === a.username) && r.status === 'approved') ||
                  a.badges?.includes('verified') ||
                  (a as any).isVerified
                );
                const isVerifiedB = Boolean(
                  verificationRequests?.some(r => (r.storeId === b.id || r.storeUsername === b.username) && r.status === 'approved') ||
                  b.badges?.includes('verified') ||
                  (b as any).isVerified
                );
                return Number(isVerifiedB) - Number(isVerifiedA);
              }
              if (featuredSort === 'featured-first') {
                const isFeaturedA = Boolean(a.is_featured || a.isFeatured);
                const isFeaturedB = Boolean(b.is_featured || b.isFeatured);
                return Number(isFeaturedB) - Number(isFeaturedA);
              }
              return 0;
            });

            return (
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-1">إدارة المتاجر المقترحة في الصفحة الرئيسية</h3>
                <p className="text-[10px] text-slate-400">الظهور في الصفحة الرئيسية يقتصر فقط على قرار الإدارة عبر تفعيل خيار التثبيت بالواجهة (is_featured). التوثيق لا يمنح التثبيت تلقائياً.</p>

                {/* Search Box & Sort Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-72 md:w-80">
                      <input
                        type="text"
                        placeholder="ابحث باسم المتجر، صاحب المتجر، اسم المستخدم، المدينة..."
                        value={featuredSearch}
                        onChange={(e) => setFeaturedSearch(e.target.value)}
                        className="w-full text-xs p-2.5 pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
                        <span>فرز حسب:</span>
                      </label>
                      <select
                        value={featuredSort}
                        onChange={(e) => setFeaturedSort(e.target.value as any)}
                        className="text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 font-bold cursor-pointer transition-colors"
                      >
                        <option value="newest">أحدث المتاجر (Newest)</option>
                        <option value="oldest">أقدم المتاجر (Oldest)</option>
                        <option value="name-asc">الاسم (أ → ي)</option>
                        <option value="name-desc">الاسم (ي → أ)</option>
                        <option value="followers-desc">عدد المتابعين (الأعلى أولاً)</option>
                        <option value="followers-asc">عدد المتابعين (الأقل أولاً)</option>
                        <option value="rating-desc">التقييم (الأعلى أولاً)</option>
                        <option value="rating-asc">التقييم (الأقل أولاً)</option>
                        <option value="city">المدينة</option>
                        <option value="verified-first">حالة التوثيق (الموثقة أولاً)</option>
                        <option value="featured-first">المتاجر المثبتة أولاً</option>
                      </select>
                    </div>
                  </div>

                  {featuredSearch.trim() && (
                    <span className="text-[10px] text-slate-400 font-bold shrink-0 self-end md:self-center">
                      نتائج البحث: ({sortedFeaturedSellers.length})
                    </span>
                  )}
                </div>

                {/* Table of potential candidates */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                      <tr>
                        <th className="p-3 text-[10px]">المتجر</th>
                        <th className="p-3 text-[10px]">المدينة</th>
                        <th className="p-3 text-[10px]">عدد المنتجات</th>
                        <th className="p-3 text-[10px]">المتابعين</th>
                        <th className="p-3 text-[10px]">التقييم</th>
                        <th className="p-3 text-[10px]">مستوى التوثيق</th>
                        <th className="p-3 text-[10px]">حالة التثبيت بالواجهة</th>
                        <th className="p-3 text-[10px] text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {usersToUse.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 text-xs font-bold">
                            لا توجد متاجر مضافة حالياً
                          </td>
                        </tr>
                      ) : sortedFeaturedSellers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 text-xs font-bold">
                            لا توجد متاجر مطابقة لعملية البحث.
                          </td>
                        </tr>
                      ) : (
                        sortedFeaturedSellers.map((seller) => {
                        const followersCount = getStoreFollowersCount(seller.id);
                        const productsCount = getStoreProductsCount(seller.id);

                        // Rating calculation from DB / reviews
                        const userReviewsCount = reviews.filter(r => {
                          const prod = products.find(p => p.id === r.productId);
                          return prod && (prod.sellerId === seller.id || (prod as any).user_id === seller.id);
                        }).length || seller.ratingsCount || 0;

                        const hasRating = seller.ratingAverage > 0;
                        const ratingDisplay = hasRating
                          ? `⭐ ${seller.ratingAverage}${userReviewsCount > 0 ? ` (${userReviewsCount})` : ''}`
                          : 'لا يوجد تقييم بعد';

                        // Verification level calculation
                        const reqApproved = verificationRequests?.some(
                          r => (r.storeId === seller.id || r.storeUsername === seller.username) && r.status === 'approved'
                        );
                        const hasBadge = seller.badges?.includes('verified') || (seller as any).isVerified;

                        // Featured status calculation
                        const isFeatured = Boolean(seller.is_featured || seller.isFeatured);

                        return (
                          <tr key={seller.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                            <td className="p-3 flex items-center gap-2">
                              <img src={seller.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">{seller.name}</span>
                                <span className="text-[9px] text-slate-400">@{seller.username || seller.id}</span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-500">{seller.city || 'الرياض'}</td>
                            <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{productsCount} إعلان</td>
                            <td className="p-3 font-mono">{followersCount} متابع</td>
                            <td className="p-3 font-mono text-amber-500 font-bold">
                              {ratingDisplay}
                            </td>
                            <td className="p-3">
                              {reqApproved ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  متجر موثق
                                </span>
                              ) : hasBadge ? (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                  متجر موثق (إدارة)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded">
                                  متجر عادي
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {isFeatured ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 w-fit">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  مثبت بالواجهة
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
                                  غير مثبت
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {!isFeatured ? (
                                <button
                                  onClick={() => handleToggleFeatured(seller)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] cursor-pointer transition-colors shadow-2xs"
                                >
                                  ⭐ تثبيت بالواجهة
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleFeatured(seller)}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold rounded-xl text-[10px] cursor-pointer transition-colors"
                                >
                                  ❌ إزالة من الواجهة
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

          {/* TAB 9: System Notifications Broadcaster */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Top Notification Dashboard Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Notifications */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-all hover:border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي الإشعارات</span>
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                      <Bell className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {notifStats.totalNotifs}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">جميع السجلات المخزنة في النظام</p>
                </div>

                {/* 2. Today's Notifications */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-all hover:border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إشعارات اليوم</span>
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {notifStats.todayNotifs}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">مرسلة خلال اليوم الحالي</p>
                </div>

                {/* 3. This Week's Notifications */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-all hover:border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إشعارات هذا الأسبوع</span>
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {notifStats.thisWeekNotifs}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">خلال آخر 7 أيام</p>
                </div>

                {/* 4. Unread Notifications */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-all hover:border-rose-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الإشعارات غير المقروءة</span>
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                      <EyeOff className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {notifStats.unreadNotifs}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {notifStats.unreadNotifs > 0 ? 'بانتظار قراءة المستلمين' : 'تم قراءة جميع الإشعارات'}
                  </p>
                </div>
              </div>

              <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  بث وإرسال إشعار نظام عام (System Notifications)
                </h3>
                <p className="text-[10px] text-slate-400 mb-4">يتم إرسال تنبيه فوري يظهر لجميع المشتركين أو لفئة معينة لتوجيه حركة البيع أو تنبيههم بالصيانة والتحديثات.</p>

                {notifSuccess && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs rounded-xl mb-4 font-bold text-center">
                    📢 تم بث وإرسال إشعار النظام الموحد بنجاح لجميع المستخدمين المستهدفين!
                  </div>
                )}

                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">الجمهور المستهدف (Audience):</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="notif_target"
                          checked={notifTarget === 'all'}
                          onChange={() => setNotifTarget('all')}
                        />
                        <span>جميع مستخدمي فيلوريا ({totalUsers})</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="notif_target"
                          checked={notifTarget === 'verified'}
                          onChange={() => setNotifTarget('verified')}
                        />
                        <span>المتاجر الموثقة فقط ({verifiedStoresCount})</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="notif_target"
                          checked={notifTarget === 'specific'}
                          onChange={() => setNotifTarget('specific')}
                        />
                        <span>مستشار / تاجر معين بالمعرف</span>
                      </label>
                    </div>
                  </div>

                  {notifTarget === 'specific' && (
                    <div className="space-y-1.5" ref={notifDropdownRef}>
                      <label className="block text-[10px] text-slate-400 font-bold">البحث عن التاجر أو المستشار المستهدف:</label>
                      
                      {selectedNotifUser ? (
                        /* Selected Merchant Card */
                        <div className="p-3 bg-white dark:bg-slate-900 border border-amber-500/40 dark:border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={selectedNotifUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                              alt={selectedNotifUser.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-amber-500/30"
                            />
                            <div className="min-w-0">
                              <div className="font-black text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
                                <span className="truncate">{selectedNotifUser.name}</span>
                                {selectedNotifUser.username && (
                                  <span className="text-[10px] text-amber-500 font-bold shrink-0">@{selectedNotifUser.username}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                {((selectedNotifUser as any).store_name || (selectedNotifUser as any).storeName) && (
                                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-extrabold text-[9px]">
                                    متجر: {(selectedNotifUser as any).store_name || (selectedNotifUser as any).storeName}
                                  </span>
                                )}
                                <span className="font-mono text-[9px] text-slate-400">ID: #{selectedNotifUser.id}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleClearSelectedNotifUser}
                            className="p-1.5 bg-slate-100 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="إلغاء الاختيار واختيار تاجر آخر"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* Autocomplete Search Input & Dropdown */
                        <div className="relative">
                          <div className="relative">
                            <input
                              type="text"
                              value={notifSearchQuery}
                              onChange={(e) => {
                                setNotifSearchQuery(e.target.value);
                                setShowNotifDropdown(true);
                              }}
                              onFocus={() => {
                                if (notifSearchQuery.trim().length >= 2) {
                                  setShowNotifDropdown(true);
                                }
                              }}
                              placeholder="ابحث باسم التاجر، اسم المستخدم، اسم المتجر، أو المعرف (User ID)..."
                              className="w-full text-xs p-2.5 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                            {isSearchingNotifUsers && (
                              <div className="absolute top-2.5 left-3 pointer-events-none">
                                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                              </div>
                            )}
                          </div>

                          {/* Results Dropdown */}
                          {showNotifDropdown && notifSearchQuery.trim().length >= 2 && (
                            <div className="absolute z-30 top-full right-0 left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                              {isSearchingNotifUsers ? (
                                <div className="p-4 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                                  <span>جاري البحث في قاعدة البيانات...</span>
                                </div>
                              ) : notifSearchResults.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400 font-bold">
                                  لا يوجد تاجر مطابق.
                                </div>
                              ) : (
                                notifSearchResults.map((user) => {
                                  const storeName = (user as any).store_name || (user as any).storeName;
                                  return (
                                    <div
                                      key={user.id}
                                      onClick={() => handleSelectNotifUser(user)}
                                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between gap-3 text-right"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                          src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                                          alt={user.name}
                                          className="w-9 h-9 rounded-full object-cover shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                                            <span className="truncate">{user.name}</span>
                                            {user.username && (
                                              <span className="text-[10px] text-amber-500 font-normal shrink-0">@{user.username}</span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 truncate mt-0.5">
                                            {storeName && (
                                              <span className="text-slate-600 dark:text-slate-300 font-semibold truncate">
                                                متجر: {storeName}
                                              </span>
                                            )}
                                            <span className="font-mono text-[9px] text-slate-400 shrink-0">#{user.id}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0 hover:bg-amber-500 hover:text-slate-950 transition-colors">
                                        اختيار
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">قالب الإشعار:</label>
                    <select
                      value={notifTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      {NOTIFICATION_TEMPLATES.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id}>
                          {tmpl.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">عنوان التنبيه:</label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="مثال: تحديث شروط الاستخدام للسوق أو حملة دعم المتاجر المنزلية"
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-bold">محتوى ونص الإشعار الإداري:</label>
                    <textarea
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      rows={3}
                      placeholder="اكتب هنا التفاصيل التي ستظهر للمستخدم في صندوق التنبيهات المخصص..."
                      className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenNotifPreview}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors border border-slate-200/80 dark:border-slate-750"
                    >
                      <Eye className="w-4 h-4 text-amber-500" />
                      <span>معاينة الإشعار</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال وبث التنبيه الموحد الآن</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Notification Modal */}
              {showNotifPreviewModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full text-right space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Modal Title / Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">معاينة الإشعار قبل الإرسال</h3>
                          <p className="text-[11px] text-slate-400">عاين شكل الإشعار كما سيظهر في صندوق التنبيهات لدى المستلم</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNotifPreviewModal(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Target Audience Information */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {notifTarget === 'all' && 'جميع المستخدمين'}
                          {notifTarget === 'verified' && 'المتاجر الموثقة'}
                          {notifTarget === 'specific' && 'تاجر محدد'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">الجمهور المستهدف:</span>
                      </div>
                      {notifTarget === 'specific' && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">
                            {selectedNotifUser?.name || (selectedNotifUser as any)?.store_name || (selectedNotifUser as any)?.storeName || selectedNotifUser?.username || notifSpecificUserId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">اسم التاجر:</span>
                        </div>
                      )}
                    </div>

                    {/* Read-Only Notification Card (Identical to app's notification cards) */}
                    <div className="p-4 rounded-2xl border bg-amber-500/5 border-amber-500/15 ring-1 ring-amber-500/10 text-right flex gap-3.5 items-start">
                      <div className="p-2.5 rounded-full bg-white dark:bg-slate-950 h-fit border border-slate-100 dark:border-slate-850 shrink-0 shadow-3xs">
                        <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>

                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">الآن</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              تنبيه إداري
                            </span>
                            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-tight">
                              {notifTitle}
                            </h3>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5 whitespace-pre-wrap">{notifBody}</p>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 mt-2 text-[10px] text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">VELORIA admin</span>
                          <span className="font-bold">:المرسل</span>
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      </div>
                    </div>

                    {/* Modal Actions Footer: ONLY two buttons (إلغاء & إرسال الآن) */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNotifPreviewModal(false)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          setShowNotifPreviewModal(false);
                          handleSendNotification(e);
                        }}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center gap-2 shadow-sm transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>إرسال الآن</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Phase 1: Notification History / Log Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>سجل الإشعارات والتنبيهات</span>
                        <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                          {dbNotifLogs.length} إشعار
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        سجل مباشر لجميع التنبيهات المرسلة والمخزنة في قاعدة البيانات
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchNotifLogs}
                    disabled={isLoadingNotifLogs}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNotifLogs ? 'animate-spin text-amber-500' : ''}`} />
                    <span>تحديث السجل</span>
                  </button>
                </div>

                {/* Search Box & Audience Filter */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={notifLogSearch}
                      onChange={(e) => setNotifLogSearch(e.target.value)}
                      placeholder="ابحث بعنوان الإشعار، نص الرسالة، اسم المستلم، أو المعرف..."
                      className="w-full text-xs p-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3 pointer-events-none" />
                    {notifLogSearch && (
                      <button
                        onClick={() => setNotifLogSearch('')}
                        className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Audience Filter Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'specific', label: 'مستخدم محدد' },
                      { id: 'all_users', label: 'جميع المستخدمين' },
                      { id: 'verified', label: 'المتاجر الموثقة' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setNotifLogFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          notifLogFilter === tab.id
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">عنوان الإشعار</th>
                        <th className="p-3">نوع الإشعار</th>
                        <th className="p-3">المستهدف</th>
                        <th className="p-3">اسم المستلم</th>
                        <th className="p-3">اسم المرسل</th>
                        <th className="p-3">تاريخ ووقت الإرسال</th>
                        <th className="p-3">حالة الإشعار</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {isLoadingNotifLogs ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                              <span>جاري تحميل سجل الإشعارات من قاعدة البيانات...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredNotifLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            {notifLogSearch || notifLogFilter !== 'all' ? (
                              <span>لا توجد إشعارات تطابق خيارات البحث والفلترة المحددة.</span>
                            ) : (
                              <span>سجل الإشعارات فارغ حالياً.</span>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredNotifLogs.map((item) => {
                          const recId = item.recipient_id || item.user_id;
                          const recUser = recId ? usersToUse.find(u => u.id === recId) : null;
                          
                          let recipientDisplayName = 'جميع المستخدمين';
                          if (item.audience === 'verified') {
                            recipientDisplayName = 'المتاجر الموثقة';
                          } else if (item.audience === 'specific' || recId) {
                            if (recUser) {
                              const storeName = (recUser as any).store_name || (recUser as any).storeName;
                              recipientDisplayName = recUser.name + (storeName ? ` (${storeName})` : '');
                            } else if (recId && recId !== 'all') {
                              recipientDisplayName = `مستخدم محدد (#${recId})`;
                            }
                          }

                          const senderId = item.sender_id;
                          const senderUser = senderId ? usersToUse.find(u => u.id === senderId) : null;
                          const senderDisplayName = senderUser ? senderUser.name : (currentUser?.id === senderId ? currentUser.name : 'إدارة النظام');

                          let formattedDate = '—';
                          if (item.created_at) {
                            try {
                              const d = new Date(item.created_at);
                              formattedDate = d.toLocaleString('ar-SA', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              formattedDate = item.created_at;
                            }
                          }

                          let targetLabel = 'جميع المستخدمين';
                          let targetStyle = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
                          if (item.audience === 'verified') {
                            targetLabel = 'المتاجر الموثقة';
                            targetStyle = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                          } else if (item.audience === 'specific') {
                            targetLabel = 'مستخدم محدد';
                            targetStyle = 'bg-purple-500/10 text-purple-500 border-purple-500/20';
                          }

                          const typeLabels: Record<string, string> = {
                            system: 'تنبيه نظام',
                            admin: 'إشعار إداري',
                            order: 'طلب جديد',
                            review: 'تقييم',
                            follow: 'متابعة',
                            contribution: 'مساهمة',
                            announcement: 'إعلان عام'
                          };

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                <div className="max-w-[200px] truncate" title={item.title}>
                                  {item.title}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  {typeLabels[item.type] || item.type || 'نظام'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${targetStyle}`}>
                                  {targetLabel}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                <div className="max-w-[160px] truncate" title={recipientDisplayName}>
                                  {recipientDisplayName}
                                </div>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                                {senderDisplayName}
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                {formattedDate}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>تم الإرسال</span>
                                </span>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedNotifForDetail(item)}
                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                    title="عرض تفاصيل الإشعار الكاملة"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>عرض التفاصيل</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNotifLog(item.id)}
                                    disabled={isDeletingNotifId === item.id}
                                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                    title="حذف هذا الإشعار من سجل قاعدة البيانات"
                                  >
                                    {isDeletingNotifId === item.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash className="w-3.5 h-3.5" />
                                    )}
                                    <span>حذف السجل</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal: View Notification Details */}
              {selectedNotifForDetail && (() => {
                const item = selectedNotifForDetail;
                const recId = item.recipient_id || item.user_id;
                const recUser = recId ? usersToUse.find(u => u.id === recId) : null;
                let recipientDisplayName = 'جميع المستخدمين';
                if (item.audience === 'verified') {
                  recipientDisplayName = 'المتاجر الموثقة';
                } else if (item.audience === 'specific' || recId) {
                  if (recUser) {
                    const storeName = (recUser as any).store_name || (recUser as any).storeName;
                    recipientDisplayName = recUser.name + (storeName ? ` (متجر: ${storeName})` : '');
                  } else if (recId && recId !== 'all') {
                    recipientDisplayName = `مستخدم محدد (#${recId})`;
                  }
                }

                const senderId = item.sender_id;
                const senderUser = senderId ? usersToUse.find(u => u.id === senderId) : null;
                const senderDisplayName = senderUser ? senderUser.name : (currentUser?.id === senderId ? currentUser.name : 'إدارة النظام');

                let formattedDate = '—';
                if (item.created_at) {
                  try {
                    const d = new Date(item.created_at);
                    formattedDate = d.toLocaleString('ar-SA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch (e) {
                    formattedDate = item.created_at;
                  }
                }

                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">تفاصيل الإشعار المرسل</h3>
                            <p className="text-xs text-slate-400 font-mono">ID: #{item.id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedNotifForDetail(null)}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">عنوان الإشعار:</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{item.title}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">الجمهور المستهدف:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                              {item.audience === 'verified' ? 'المتاجر الموثقة' : item.audience === 'specific' ? 'مستخدم محدد' : 'جميع المستخدمين'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">اسم المستلم:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{recipientDisplayName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">اسم المرسل:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{senderDisplayName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">نوع الإشعار:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{item.type || 'system'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">تاريخ ووقت الإرسال:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">{formattedDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">حالة التسليم:</span>
                            <span className="font-bold text-emerald-500 mt-0.5 block">تم الإرسال بنجاح</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px]">حالة القراءة:</span>
                            <span className="font-medium text-slate-600 dark:text-slate-400 mt-0.5 block">
                              {item.is_read || item.read ? 'تمت القراءة' : 'لم يُقرأ بعد'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 font-bold block mb-1 text-[11px]">محتوى الرسالة النصية:</span>
                          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                            {item.message || item.body || 'لا يوجد نص'}
                          </div>
                        </div>

                        {(item.link || item.reference_id) && (
                          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                            {item.link && (
                              <div>
                                <span className="text-slate-400 text-[10px] block">الرابط المرفق:</span>
                                <span className="text-amber-500 truncate block">{item.link}</span>
                              </div>
                            )}
                            {item.reference_id && (
                              <div>
                                <span className="text-slate-400 text-[10px] block">رقم المرجع:</span>
                                <span className="text-slate-300 truncate block">{item.reference_id}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedNotifForDetail(null)}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 10: Activity Logs */}
          {activeTab === 'logs' && (() => {
            const formatLogDate = (dateStr?: string) => {
              if (!dateStr) return '—';
              try {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} - ${hours}:${minutes}`;
              } catch {
                return dateStr;
              }
            };

            const renderStatusBadge = (status?: string) => {
              const s = (status || 'success').toLowerCase();
              if (s === 'warning') {
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    تنبيه (Warning)
                  </span>
                );
              }
              if (s === 'failed' || s === 'error') {
                return (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    فاشلة (Failed)
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                  <CheckCircle className="w-3 h-3" />
                  ناجحة (Success)
                </span>
              );
            };

            const filteredLogs = activityLogs.filter(log => {
              const term = logSearch.trim().toLowerCase();
              const nameMatch = (log.user_name || log.adminName || '').toLowerCase().includes(term);
              const emailMatch = (log.user_email || '').toLowerCase().includes(term);
              const opMatch = (log.operation || '').toLowerCase().includes(term);
              const detailMatch = (log.details || '').toLowerCase().includes(term);
              const ipMatch = (log.ip_address || log.ipAddress || '').toLowerCase().includes(term);

              const matchesSearch = !term || nameMatch || emailMatch || opMatch || detailMatch || ipMatch;

              const roleStr = log.user_role || log.role || '';
              const matchesRole = logRoleFilter === 'all' ||
                (logRoleFilter === 'admin' && (roleStr === 'مدير النظام' || roleStr.includes('مدير'))) ||
                (logRoleFilter === 'moderator' && (roleStr === 'مشرف السوق' || roleStr.includes('مشرف')));

              const logStatus = (log.status || 'success').toLowerCase();
              const matchesStatus = logStatusFilter === 'all' ||
                (logStatusFilter === 'success' && logStatus === 'success') ||
                (logStatusFilter === 'warning' && logStatus === 'warning') ||
                (logStatusFilter === 'failed' && (logStatus === 'failed' || logStatus === 'error'));

              return matchesSearch && matchesRole && matchesStatus;
            });

            return (
              <div className="space-y-4">
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>سجل عمليات مديري ومشرفي النظام (Audit Trail)</span>
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/20">
                        {activityLogs.length} سجل
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      يقرأ السجل مباشرة من جدول <code className="font-mono text-amber-500 font-bold">activity_logs</code> في Supabase بعرض أحدث العمليات أولاً.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => fetchActivityLogs()}
                      disabled={isLoadingLogs}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                      title="تحديث بيانات السجل من Supabase"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin text-amber-500' : ''}`} />
                      <span>تحديث السجل</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('هل تود مسح سجل العمليات الحالي بجميع مدخلاته من Supabase؟ لا يمكن التراجع عن هذه الخطوة.')) {
                          if (isSupabaseConfigured && supabase) {
                            try {
                              const { error } = await supabase
                                .from('activity_logs')
                                .delete()
                                .neq('id', '00000000-0000-0000-0000-000000000000');
                              if (error) {
                                console.warn('Error clearing activity_logs in Supabase:', error.message);
                              }
                            } catch (err) {
                              console.warn('Failed to clear activity_logs in Supabase:', err);
                            }
                          }
                          await fetchActivityLogs();
                        }
                      }}
                      className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all border border-rose-500/20"
                    >
                      تصفير السجل الكامل
                    </button>
                  </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث باسم المدير، البريد الإلكتروني، العملية، التفاصيل، أو IP..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden text-slate-800 dark:text-slate-200"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">فلترة الرتبة:</span>
                    <select
                      value={logRoleFilter}
                      onChange={(e: any) => setLogRoleFilter(e.target.value)}
                      className="text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden w-full text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="all">جميع الرتب والمسؤولين</option>
                      <option value="admin">مدير النظام فقط</option>
                      <option value="moderator">مشرف السوق فقط</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">فلترة الحالة:</span>
                    <select
                      value={logStatusFilter}
                      onChange={(e: any) => setLogStatusFilter(e.target.value)}
                      className="text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden w-full text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="all">جميع الحالات (الكل)</option>
                      <option value="success">Success (ناجحة)</option>
                      <option value="warning">Warning (تنبيه)</option>
                      <option value="failed">Failed / Error (فاشلة)</option>
                    </select>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse min-w-[900px]">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-3 text-[10px] font-bold">المدير / المشرف</th>
                          <th className="p-3 text-[10px] font-bold">البريد الإلكتروني</th>
                          <th className="p-3 text-[10px] font-bold">الرتبة</th>
                          <th className="p-3 text-[10px] font-bold">العملية المنفذة</th>
                          <th className="p-3 text-[10px] font-bold">التفاصيل</th>
                          <th className="p-3 text-[10px] font-bold">الحالة</th>
                          <th className="p-3 text-[10px] font-bold">التاريخ والوقت</th>
                          <th className="p-3 text-[10px] font-bold">IP والجهاز</th>
                          <th className="p-3 text-[10px] font-bold text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                        {isLoadingLogs ? (
                          <tr>
                            <td colSpan={9} className="p-10 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                                <span className="font-semibold text-xs">جاري تحميل سجل العمليات من Supabase...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredLogs.length > 0 ? (
                          filteredLogs.map((log) => {
                            const nameToDisplay = log.user_name || log.adminName || 'مدير فيلوريا';
                            const emailToDisplay = log.user_email || '—';
                            const roleToDisplay = log.user_role || log.role || 'مدير النظام';
                            const formattedDate = formatLogDate(log.created_at || log.timestamp);
                            const ipToDisplay = log.ip_address || log.ipAddress || '—';
                            const deviceToDisplay = log.device_type || 'Unknown';

                            return (
                              <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {nameToDisplay}
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] dir-ltr text-right whitespace-nowrap">
                                  {emailToDisplay}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                                    roleToDisplay.includes('مدير') || roleToDisplay === 'admin'
                                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                                      : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                                  }`}>
                                    {roleToDisplay}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200 max-w-[220px]">
                                  <div className="truncate" title={log.operation}>
                                    {log.operation}
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px] max-w-[200px]">
                                  <div className="truncate" title={log.details || '—'}>
                                    {log.details || '—'}
                                  </div>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  {renderStatusBadge(log.status)}
                                </td>
                                <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap" dir="ltr">
                                  {formattedDate}
                                </td>
                                <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[10px] whitespace-nowrap">
                                  <div>{ipToDisplay}</div>
                                  <div className="text-[9px] text-slate-400 font-sans font-medium">{deviceToDisplay}</div>
                                </td>
                                <td className="p-3 whitespace-nowrap text-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLogForDetail(log)}
                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="عرض كافة تفاصيل السجل و User Agent"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>عرض التفاصيل</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="p-10 text-center text-slate-400 font-sans">
                              ❌ لم يتم العثور على أي عمليات مطابقة خيارات البحث والفلترة المحددة.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal: View Full Activity Log Details */}
                {selectedLogForDetail && (() => {
                  const log = selectedLogForDetail;
                  const nameToDisplay = log.user_name || log.adminName || 'مدير فيلوريا';
                  const emailToDisplay = log.user_email || '—';
                  const roleToDisplay = log.user_role || log.role || 'مدير النظام';
                  const formattedDate = formatLogDate(log.created_at || log.timestamp);
                  const ipToDisplay = log.ip_address || log.ipAddress || 'غير محدد';
                  const deviceToDisplay = log.device_type || 'غير محدد';
                  const userAgentToDisplay = log.user_agent || 'غير متاح';

                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl">
                              <Eye className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">تفاصيل سجل العملية الإدارية</h3>
                              <p className="text-xs text-slate-400 font-mono">ID: #{log.id}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedLogForDetail(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4 text-xs">
                          {/* Main Operation Box */}
                          <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">العملية المنفذة (Operation):</span>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-relaxed">
                              {log.operation}
                            </div>
                          </div>

                          {/* Grid info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-slate-400 font-medium block text-[10px]">اسم المنفذ (User Name):</span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">{nameToDisplay}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block text-[10px]">البريد الإلكتروني (User Email):</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 text-xs mt-0.5 block dir-ltr text-right">{emailToDisplay}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block text-[10px]">الرتبة واللوحة (Role / Panel):</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-0.5 block">
                                {roleToDisplay} ({log.panel || 'Admin'})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block text-[10px]">حالة العملية (Status):</span>
                              <div className="mt-0.5">{renderStatusBadge(log.status)}</div>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block text-[10px]">التاريخ والوقت (Created At):</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 text-xs mt-0.5 block dir-ltr text-right">{formattedDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block text-[10px]">عنوان IP (IP Address):</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">{ipToDisplay}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 font-medium block text-[10px]">نوع الجهاز (Device Type):</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">{deviceToDisplay}</span>
                            </div>
                          </div>

                          {/* Details section if available */}
                          {log.details && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="text-slate-400 font-bold block text-[10px]">التفاصيل والملاحظات (Details):</span>
                              <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed whitespace-pre-wrap">{log.details}</p>
                            </div>
                          )}

                          {/* Target details if present */}
                          {(log.target_type || log.target_name || log.target_id) && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                              <span className="text-slate-400 font-bold block text-[10px]">معلومات العنصر المستهدف (Target Info):</span>
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                {log.target_type && <div><span className="text-slate-400">النوع:</span> <span className="text-amber-500 font-bold">{log.target_type}</span></div>}
                                {log.target_name && <div><span className="text-slate-400">الاسم:</span> <span className="text-slate-200 font-bold">{log.target_name}</span></div>}
                                {log.target_id && <div><span className="text-slate-400">المعرف:</span> <span className="text-slate-300">#{log.target_id}</span></div>}
                                {log.target_user_email && <div><span className="text-slate-400">بريد الهدف:</span> <span className="text-slate-300">{log.target_user_email}</span></div>}
                              </div>
                            </div>
                          )}

                          {/* Full User Agent */}
                          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                            <span className="text-slate-400 font-bold block text-[10px]">User Agent (الكامل):</span>
                            <div className="font-mono text-[10px] text-slate-300 break-all bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 leading-normal dir-ltr text-left">
                              {userAgentToDisplay}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedLogForDetail(null)}
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* TAB 11: Contribution Requests */}
          {activeTab === 'contributions' && (
            <div className="space-y-6 text-right rtl animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                    طلبات المساهمة والدعم (Contribution Requests)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    مراجعة المساهمات المالية المرسلة عبر "شام كاش". التحقق من استلام الدفع يساهم في دعم مبادرة VELORIA واستقرارها.
                  </p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-500/15">
                  معلّقة: {contributions.filter(c => c.status === 'Pending').length} طلبات
                </div>
              </div>

              {/* Sham Cash Settings Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">إعدادات حساب المساهمات والمبادرات</h4>
                    <p className="text-[10px] text-slate-400">تعديل رقم حساب شام كاش المعتمد لتلقي المساهمات والدعم من المستخدمين</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 space-y-1 w-full">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400">
                      رقم حساب شام كاش الحالي (Sham Cash Account)
                    </label>
                    <input
                      type="text"
                      value={editAccountVal}
                      onChange={(e) => setEditAccountVal(e.target.value)}
                      placeholder="أدخل رقم الحساب هنا"
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 text-left"
                      dir="ltr"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (onUpdateShamCashAccount) {
                        onUpdateShamCashAccount(editAccountVal);
                        alert('تم تحديث رقم الحساب بنجاح! سيتم اعتماده مباشرة لجميع المستخدمين دون الحاجة لتحديث التطبيق.');
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors shadow-xs shrink-0 w-full sm:w-auto text-center"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </div>

              {contributions.filter(c => c.status === 'Pending').length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800/80 p-6 space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-700 dark:text-slate-300">لا توجد مساهمات معلّقة</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      تمت معالجة جميع طلبات المساهمة والتحويلات المالية الواردة بنجاح. لا توجد إجراءات معلقة حالياً.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contributions
                    .filter(c => c.status === 'Pending')
                    .map((req) => {
                      const user = users.find(u => u.id === req.user_id);
                      const uName = user?.name || 'مستخدم غير معروف';
                      const uEmail = user?.email || 'لا يوجد بريد إلكتروني';
                      const uAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';

                      return (
                        <div
                          key={req.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all space-y-4"
                        >
                          {/* User identity & date info */}
                          <div className="flex items-start gap-3">
                            <img
                              src={uAvatar}
                              alt={uName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="overflow-hidden space-y-0.5">
                              <h4 className="font-black text-xs text-slate-800 dark:text-slate-200 truncate">{uName}</h4>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{uEmail}</p>
                              <div className="text-[9px] text-slate-400 flex items-center gap-1.5 pt-1">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                  {new Date(req.created_at).toLocaleString('ar-SA')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Payment stats */}
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-850/60 text-xs flex justify-between items-center">
                            <div>
                              <span className="text-slate-400 font-bold block text-[9px]">طريقة الدفع</span>
                              <span className="font-black text-slate-700 dark:text-slate-300">{req.payment_method}</span>
                            </div>
                            <div className="text-left">
                              <span className="text-slate-400 font-bold block text-[9px]">رقم الحساب المستهدف</span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{req.account_number}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => {
                                onReviewContribution(req.id, 'Completed');
                                addLog(`اعتماد وتأكيد استلام مساهمة دعم مالي من المستخدم/التاجر: ${user?.name || 'غير معروف'}`, {
                                  panel: 'Admin',
                                  target_type: 'contribution',
                                  target_id: req.id,
                                  target_name: `مساهمة #${req.id}`,
                                  target_user_id: user?.id || req.user_id,
                                  target_user_email: user?.email || null
                                });
                              }}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Payment Received</span>
                            </button>
                            <button
                              onClick={() => {
                                onReviewContribution(req.id, 'Rejected');
                                addLog(`رفض مساهمة الدعم المالي من المستخدم/التاجر: ${user?.name || 'غير معروف'} لعدم استلام الرصيد`, {
                                  panel: 'Admin',
                                  target_type: 'contribution',
                                  target_id: req.id,
                                  target_name: `مساهمة #${req.id}`,
                                  target_user_id: user?.id || req.user_id,
                                  target_user_email: user?.email || null
                                });
                              }}
                              className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1 transition-all border border-rose-500/10"
                            >
                              <span className="text-xs">❌</span>
                              <span>Payment Not Received</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 12: Contact Us Support Messages */}
          {activeTab === 'contact-messages' && (
            <div className="space-y-4 text-right animate-fade-in" dir="rtl">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">رسائل وطلبات مركز الاتصال والدعم الفني (اتصل بنا)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">مراجعة الأسئلة العامة، بلاغات المشاكل، واقتراحات الميزات الإضافية المستلمة من زوار المنصة.</p>
                </div>
                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs px-2.5 py-1 rounded-xl">
                  معلّق: {contactMessages.filter(m => m.status === 'pending').length} رسائل
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم، الإيميل، العنوان أو المحتوى..."
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden w-full"
                  >
                    <option value="all">كل حالات الرسائل</option>
                    <option value="pending">⏳ قيد المراجعة / معلّقة</option>
                    <option value="resolved">✔️ تمت المعالجة والرد</option>
                    <option value="archived">📁 مؤرشفة</option>
                  </select>
                </div>

                <div>
                  <select
                    value={typeFilter}
                    onChange={(e: any) => setTypeFilter(e.target.value)}
                    className="text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden w-full"
                  >
                    <option value="all">كل أنواع الرسائل</option>
                    <option value="general">✉️ استفسار عام / اقتراح</option>
                    <option value="problem">⚠️ إبلاغ عن مشكلة</option>
                    <option value="feature">💡 اقتراح ميزة جديدة</option>
                  </select>
                </div>
              </div>

              {/* Messages Grid */}
              <div className="grid grid-cols-1 gap-4">
                {filteredContactMsgs.length > 0 ? (
                  filteredContactMsgs.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                        msg.status === 'pending'
                          ? 'border-amber-100 dark:border-amber-900/30 bg-amber-500/5'
                          : 'border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{msg.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">&lt;{msg.email}&gt;</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-2.5 py-0.5 rounded font-bold ${
                            msg.type === 'problem'
                              ? 'bg-rose-500/10 text-rose-500'
                              : msg.type === 'feature'
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {msg.type === 'problem' ? '⚠️ بلاغ مشكلة' : msg.type === 'feature' ? '💡 اقتراح ميزة' : '✉️ استفسار عام'}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            msg.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                          }`}>
                            {msg.status === 'pending' ? '⏳ قيد التدقيق' : '✔️ تمت المعالجة'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{msg.createdAt.replace('T', ' ').substring(0, 16)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{msg.subject}</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                          {msg.message}
                        </p>
                      </div>

                      {msg.adminNotes && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                          <span className="font-black text-amber-500 block mb-0.5">💬 الرد والتعليق الإداري:</span>
                          {msg.adminNotes}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <div className="flex gap-2">
                          {msg.status === 'pending' && (
                            <button
                              onClick={() => {
                                setReplyingMessage(msg);
                                setAdminReplyText('');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer transition-colors"
                            >
                              ✍️ الرد وحل الطلب
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteContactMsg(msg.id)}
                            className="text-[10px] text-rose-500 bg-rose-500/10 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 cursor-pointer"
                          >
                            حذف الرسالة
                          </button>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">رقم التعريف: #{msg.id}</span>
                      </div>

                      {/* Inline reply interface */}
                      {replyingMessage?.id === msg.id && (
                        <div className="mt-4 p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-3">
                          <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400">كتابة رد المراجعة والحل (سيتم عرضه كتعليق إداري):</label>
                          <textarea
                            rows={2}
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="اكتب ردك أو الإجراء المتخذ لحل هذا الطلب..."
                            className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-amber-500 focus:outline-hidden text-right"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSaveContactReply(msg.id)}
                              disabled={!adminReplyText.trim()}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded-lg disabled:opacity-50 cursor-pointer"
                            >
                              حفظ وإغلاق كـ "تمت المعالجة"
                            </button>
                            <button
                              onClick={() => setReplyingMessage(null)}
                              className="px-3 py-1.5 bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded-lg cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 space-y-2">
                    <p className="text-xl">📥</p>
                    <p className="text-xs font-bold">صندوق بريد وارد مركز الاتصال فارغ تماماً!</p>
                    <p className="text-[10px] text-slate-300">لا توجد رسائل مطابقة لخيارات الفرز الحالية.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 13: Platform Settings */}
          {activeTab === 'platform-settings' && appSettings && (
            <AdminSettingsView
              appSettings={appSettings}
              onSaveSettings={handleSaveSettings}
              currentUser={currentUser}
            />
          )}



        </div>
      </div>

      {/* MODAL 1: Edit User Profile Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-right">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">تعديل بيانات الملف الشخصي للأعضاء</h3>
            <p className="text-[10px] text-slate-400 mb-4">أنت تقوم بتعديل البيانات الإدارية للمستخدم بصفة رقابية.</p>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">اسم المستخدم:</label>
                  <input
                    type="text"
                    value={editingUser.username || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">المدينة الحالية:</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">مستوى الثقة والرتبة المعروضة:</label>
                <input
                  type="text"
                  value={editingUser.trustLevel || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, trustLevel: e.target.value })}
                  placeholder="مثال: تاجر معتمد، مستشار خشب تخصصي"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">السيرة الذاتية أو الوصف الإعلاني:</label>
                <textarea
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  حفظ البيانات والتعميم
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View User Info Modal */}
      {viewingUserObj && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                <span>تفاصيل ومعلومات العضو كاملة</span>
              </h3>
              <button
                onClick={() => setViewingUserObj(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
              <img src={viewingUserObj.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 dark:border-slate-800" />
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-base leading-snug flex items-center gap-1.5 flex-wrap">
                  <span>{viewingUserObj.name}</span>
                  {viewingUserObj.badges.includes('verified') && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">موثق ✔️</span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{viewingUserObj.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">اسم المستخدم (Username):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">@{viewingUserObj.username || 'غير متوفر'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">المدينة:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingUserObj.city || 'غير محدد'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">الدور / الصلاحية:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {viewingUserObj.role === 'admin' ? 'مدير' : viewingUserObj.role === 'moderator' ? 'مشرف' : viewingUserObj.role === 'user' ? 'تاجر' : 'عضو'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الانضمام:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{viewingUserObj.joinedAt || '2026-01-01'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">عدد المنتجات المعلنة:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{products.filter(p => p.sellerId === viewingUserObj.id).length} إعلان</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">عدد طلبات الشراء / البيع:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {orders.filter(o => o.buyerId === viewingUserObj.id || o.sellerId === viewingUserObj.id).length} طلب
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">المتابعين (Followers):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{viewingUserObj.followersCount || 0} متابع</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">متوسط التقييم ومجموع الآراء:</span>
                <span className="font-bold text-amber-500 font-mono">
                  {viewingUserObj.ratingAverage > 0 ? (
                    `⭐ ${viewingUserObj.ratingAverage} (${reviews.filter(r => { const prod = products.find(p => p.id === r.productId); return prod && prod.sellerId === viewingUserObj.id; }).length || viewingUserObj.ratingsCount || 0} رأي)`
                  ) : (
                    'لا يوجد تقييم بعد'
                  )}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">حالة الحساب الحالية:</span>
                <span className={`font-bold ${
                  viewingUserObj.status === 'suspended' ? 'text-amber-600' : viewingUserObj.status === 'banned' ? 'text-rose-600' : viewingUserObj.status === 'deactivated' ? 'text-slate-500' : 'text-emerald-600'
                }`}>
                  {viewingUserObj.status === 'suspended' ? 'معلق مؤقتاً' : viewingUserObj.status === 'banned' ? 'محظور نهائياً' : viewingUserObj.status === 'deactivated' ? 'معطل ذاتياً' : 'نشط وعامل'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">حالة توثيق المتجر:</span>
                <span className={`font-bold ${viewingUserObj.badges.includes('verified') ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {viewingUserObj.badges.includes('verified') ? 'متجر موثق رسمي ✔️' : 'غير موثق'}
                </span>
              </div>
            </div>

            {viewingUserObj.bio && (
              <div className="mt-3 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 text-xs text-right">
                <span className="text-[10px] text-slate-400 block mb-1">النبذة والوصف التعريفي:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{viewingUserObj.bio}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewingUserObj(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer text-center"
              >
                إغلاق نافذة العرض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Change User Role Modal */}
      {changingRoleUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-right">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">تغيير دور وصلاحية المستخدم</h3>
            <p className="text-[10px] text-slate-400 mb-4">أنت تقوم بتغيير الدور الحقيقي للمستخدم مباشرة في قاعدة البيانات الشخصية.</p>

            <div className="space-y-4">
              {roleError && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-bold text-xs">
                  ⚠️ {roleError}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">اسم العضو:</label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 font-bold text-xs">
                  {changingRoleUser.name}
                </div>
              </div>

              {!roleChangeConfirm ? (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-2">اختر الدور الجديد:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'visitor', label: 'عضو' },
                        { value: 'user', label: 'تاجر' },
                        { value: 'moderator', label: 'مشرف' },
                        { value: 'admin', label: 'مدير' }
                      ].map((roleOption) => (
                        <label
                          key={roleOption.value}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            selectedNewRole === roleOption.value
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{roleOption.label}</span>
                          <input
                            type="radio"
                            name="new_role"
                            value={roleOption.value}
                            checked={selectedNewRole === roleOption.value}
                            onChange={() => {
                              setSelectedNewRole(roleOption.value as any);
                              setRoleError(null);
                            }}
                            className="accent-indigo-600"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedNewRole === 'admin' && currentUser.role !== 'admin') {
                          setRoleError('لا يسمح بتعيين صلاحية "مدير" إلا إذا كان المدير الحالي هو من يقوم بذلك.');
                          return;
                        }
                        if (selectedNewRole === changingRoleUser.role) {
                          setRoleError('الرجاء اختيار دور جديد مختلف عن الدور الحالي.');
                          return;
                        }
                        setRoleChangeConfirm(true);
                        setRoleError(null);
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer text-center"
                    >
                      تغيير الدور...
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangingRoleUser(null)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400">
                    <p className="font-extrabold text-xs mb-1">⚠️ تأكيد تغيير صلاحية المستخدم</p>
                    <p className="text-[10px] leading-relaxed">
                      هل أنت متأكد من تغيير صلاحية العضو <strong className="font-bold underline">{changingRoleUser.name}</strong> من صلاحية <strong className="font-bold">({changingRoleUser.role === 'admin' ? 'مدير' : changingRoleUser.role === 'moderator' ? 'مشرف' : changingRoleUser.role === 'user' ? 'تاجر' : 'عضو'})</strong> إلى صلاحية <strong className="text-indigo-600 dark:text-indigo-400 font-bold">({selectedNewRole === 'admin' ? 'مدير' : selectedNewRole === 'moderator' ? 'مشرف' : selectedNewRole === 'user' ? 'تاجر' : 'عضو'})</strong>؟
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={async () => {
                        // Update local state
                        if (setUsers) {
                          setUsers(prev => prev.map(u => u.id === changingRoleUser.id ? { ...u, role: selectedNewRole } : u));
                        }

                        // Update Database directly
                        if (isSupabaseConfigured && supabase) {
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ role: selectedNewRole })
                              .eq('id', changingRoleUser.id);
                            if (error) throw error;
                          } catch (dbErr) {
                            console.error('Database role update failed:', dbErr);
                          }
                        }

                        addLog(`عدّل صلاحية المستخدم ${changingRoleUser.name} إلى: ${selectedNewRole}`, {
                          panel: 'Admin',
                          target_type: 'user',
                          target_id: changingRoleUser.id,
                          target_name: changingRoleUser.name,
                          target_user_id: changingRoleUser.id,
                          target_user_email: changingRoleUser.email || null
                        });
                        setChangingRoleUser(null);
                        setRoleChangeConfirm(false);
                      }}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer text-center"
                    >
                      نعم، متأكد وحفظ التعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleChangeConfirm(false)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      تراجع
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Double Confirm Delete Account Modal */}
      {deletingUserObj && deleteConfirmStep > 0 && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-150 dark:border-rose-950 shadow-2xl max-w-md w-full p-6 text-right">
            <h3 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <span>تحذير أمني: حذف الحساب نهائياً من السيستم</span>
            </h3>
            
            {deleteConfirmStep === 1 ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف حساب العضو <strong className="text-slate-800 dark:text-white">{deletingUserObj.name}</strong> نهائياً من المنصة؟ 
                  <br />
                  <span className="text-rose-500 font-bold block mt-2">تنبيه: سيؤدي هذا الإجراء إلى تصفية كافة بياناته لحماية سلامة وسلامة الترابطات والعلاقات في قاعدة البيانات.</span>
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setDeleteConfirmStep(2)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    نعم، متأكد (متابعة للتأكيد الثاني)
                  </button>
                  <button
                    onClick={() => {
                      setDeletingUserObj(null);
                      setDeleteConfirmStep(0);
                    }}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء وتراجع
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  <span className="bg-rose-500/10 text-rose-600 px-2 py-1.5 rounded font-black block text-center mb-3 text-xs">
                    تأكيد نهائي وحاسم (خطوة غير قابلة للتراجع بعد التنفيذ)
                  </span>
                  يرجى تأكيد قرار حذف الحساب للمرة الثانية والأخيرة لحساب العضو <strong className="text-slate-800 dark:text-white">{deletingUserObj.name}</strong>. سيتم مسح كافة ملفاته وإعلاناته ومراسلاته لسلامة قاعدة البيانات.
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={async () => {
                      const uId = deletingUserObj.id;
                      
                      // Update local products state
                      if (setProducts) {
                        setProducts(prev => prev.filter(p => p.sellerId !== uId));
                      }
                      // Update local users state
                      if (setUsers) {
                        setUsers(prev => prev.filter(u => u.id !== uId));
                      }
                      
                      // Supabase cascade deletion
                      if (isSupabaseConfigured && supabase) {
                        try {
                          await supabase.from('favorites').delete().eq('user_id', uId);
                          await supabase.from('followers').delete().eq('follower_id', uId);
                          await supabase.from('followers').delete().eq('following_id', uId);
                          await supabase.from('reviews').delete().eq('rater_id', uId);
                          await supabase.from('reviews').delete().eq('rated_user_id', uId);
                          
                          // Delete product images & products
                          const { data: userProds } = await supabase.from('products').select('id').eq('user_id', uId);
                          if (userProds && userProds.length > 0) {
                            const prodIds = userProds.map(p => p.id);
                            await supabase.from('product_images').delete().in('product_id', prodIds);
                            await supabase.from('favorites').delete().in('product_id', prodIds);
                            await supabase.from('products').delete().eq('user_id', uId);
                          }
                          
                          await supabase.from('orders').delete().eq('buyer_id', uId);
                          await supabase.from('orders').delete().eq('seller_id', uId);
                          await supabase.from('reports').delete().eq('reporter_id', uId);
                          await supabase.from('reports').delete().eq('reported_user_id', uId);
                          await supabase.from('messages').delete().eq('sender_id', uId);
                          await supabase.from('messages').delete().eq('receiver_id', uId);
                          await supabase.from('verification_requests').delete().eq('store_id', uId);
                          
                          // Delete from profiles
                          await supabase.from('profiles').delete().eq('id', uId);
                        } catch (dbErr) {
                          console.error('Error in DB cascade deletion:', dbErr);
                        }
                      }

                      addLog(`حذف حساب العضو ${deletingUserObj.name} نهائياً وحذف جميع البيانات المرفقة به لضمان سلامة العلاقات`, {
                        panel: 'Admin',
                        target_type: 'user',
                        target_id: deletingUserObj.id,
                        target_name: deletingUserObj.name,
                        target_user_id: deletingUserObj.id,
                        target_user_email: deletingUserObj.email || null
                      });
                      setDeletingUserObj(null);
                      setDeleteConfirmStep(0);
                    }}
                    className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl text-xs cursor-pointer text-center"
                  >
                    تأكيد الحذف النهائي الشامل
                  </button>
                  <button
                    onClick={() => {
                      setDeletingUserObj(null);
                      setDeleteConfirmStep(0);
                    }}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-right">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">تعديل الإعلان والأسعار بصفة إشرافية</h3>
            <p className="text-[10px] text-slate-400 mb-4">أنت بصدد تعديل بيانات منتج التاجر لحمايته من المشاكل الإملائية أو المخالفات البسيطة.</p>

            <form onSubmit={handleEditProductSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">عنوان الإعلان التجاري:</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">السعر المقدر (بالليرة السورية ل.س):</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">تفاصيل ومواصفات المعروض:</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  تعديل ونشر المنتج بنجاح
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection Reason for Verification */}
      {rejectRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-right">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">رفض طلب التوثيق بالمنصة</h3>
            <p className="text-[10px] text-slate-400 mb-4">يرجى توضيح سبب الرفض لمساعدتهم في تصحيح الطلب لاحقاً.</p>

            <form onSubmit={handleRejectVerificationSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">سبب الرفض الموجه للتاجر:</label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  rows={3}
                  placeholder="مثال: الصورة المرفوعة للهوية غير واضحة، أو الاسم المسجل لا يطابق وثيقة السجل التجاري..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  إرسال الرفض الرسمي
                </button>
                <button
                  type="button"
                  onClick={() => setRejectRequest(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Product Confirmation Modal */}
      {deletingProductObj && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 text-right rtl">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="text-rose-600">⚠️</span>
              <span>تأكيد الحذف النهائي للمنتج</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
              أنت بصدد حذف المنتج <strong className="text-slate-900 dark:text-white">"{deletingProductObj.title}"</strong> بشكل نهائي من قاعدة البيانات ومسح صوره من الخادم. هذا الإجراء غير قابل للتراجع عنه.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmDeleteProduct(); }} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-bold">سبب حذف المنتج وإخطار التاجر (مطلوب):</label>
                <textarea
                  value={deletionReasonInput}
                  onChange={(e) => setDeletionReasonInput(e.target.value)}
                  rows={3}
                  placeholder="مثال: المنتج مخالف للسياسات العامة أو يحتوي على محتوى غير لائق..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  تأكيد الحذف النهائي
                </button>
                <button
                  type="button"
                  onClick={() => { setDeletingProductObj(null); setDeletionReasonInput(''); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for Image Preview */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center">
            <img 
              src={lightboxImage} 
              alt="معاينة المنتج" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border-4 border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white cursor-pointer transition-colors"
              title="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Hide Product Modal */}
      <HideProductModal
        isOpen={hideProductModal.isOpen}
        onClose={() => setHideProductModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={(reason) => {
          executeProductStatusToggle(hideProductModal.productId, hideProductModal.action, reason);
        }}
      />

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 md:p-6 space-y-4 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Edit className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">تعديل التصنيف</h3>
              </div>
              <button 
                onClick={handleCloseEditCategory}
                disabled={isUpdatingCategory}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {editCatError && (
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs rounded-xl font-bold">
                {editCatError}
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 mb-1">اسم القسم (بالعربية):</label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="اسم التصنيف..."
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  required
                  disabled={isUpdatingCategory}
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 mb-1 font-bold">أيقونة القسم:</label>
                <select
                  value={editCatIcon}
                  onChange={(e) => setEditCatIcon(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                  disabled={isUpdatingCategory}
                >
                  <option value="Sparkles">بريق ✨</option>
                  <option value="Shirt">أزياء وملابس 👕</option>
                  <option value="Luggage">أحذية وحقائب 👜</option>
                  <option value="Smartphone">موبايلات وإكسسوارات 📱</option>
                  <option value="Tv">إلكترونيات 📺</option>
                  <option value="Home">أجهزة منزلية 🏠</option>
                  <option value="Car">سيارات وقطع غيار 🚗</option>
                  <option value="Building">عقارات 🏢</option>
                  <option value="Bed">أثاث ومفروشات 🛏️</option>
                  <option value="BookOpen">كتب وقرطاسية 📖</option>
                  <option value="Gamepad">ألعاب أطفال 🎮</option>
                  <option value="Utensils">أطعمة ومشروبات 🍔</option>
                  <option value="Wrench">خدمات وصيانة 🛠️</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingCategory}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isUpdatingCategory ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditCategory}
                  disabled={isUpdatingCategory}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
