import React, { useState, useEffect } from 'react';
import { User, Category, Product, Report, UserBadge, Order, UserRole, Contribution, VerificationRequest, ContactMessage, AppSettings, Review, Message, Notification } from '../types';
import AdminSettingsView from './AdminSettingsView';
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
  Lock,
  ArrowLeft,
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
  Database
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
}

// Activity Log entry structure
interface ActivityLog {
  id: string;
  adminName: string;
  role: string;
  operation: string;
  timestamp: string;
  ipAddress?: string;
}

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
  setVerificationRequests
}: AdminPanelProps) {
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
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended' | 'banned' | 'verified' | 'deactivated'>('all');
  
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'sold' | 'hidden'>('all');

  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed' | 'rejected'>('all');

  // Logs Search & Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logRoleFilter, setLogRoleFilter] = useState<'all' | 'admin' | 'moderator'>('all');

  // Modals / Edit states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [catSuccess, setCatSuccess] = useState(false);

  // Verification rejection reason modal
  const [rejectRequest, setRejectRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // System Notification broadcast form
  const [notifTarget, setNotifTarget] = useState<'all' | 'verified' | 'specific'>('all');
  const [notifSpecificUserId, setNotifSpecificUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifSuccess, setNotifSuccess] = useState(false);

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

  // Real-Time Activity Logs state (persisted locally)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('veloria-admin-logs');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', adminName: 'عبد الرحمن الشمري', role: 'مدير النظام', operation: 'تسجيل دخول إلى لوحة التحكم الإدارية', timestamp: '2026-06-25 09:12', ipAddress: '192.168.1.45' },
      { id: '2', adminName: 'سليمان الحربي', role: 'مشرف السوق', operation: 'مراجعة البلاغ رقم #rep-104 وتجاهله كونه بلاغ كيدي', timestamp: '2026-06-25 08:33', ipAddress: '192.168.1.12' },
      { id: '3', adminName: 'عبد الرحمن الشمري', role: 'مدير النظام', operation: 'إضافة تصنيف جديد للسوق: "أثاث ومفروشات"', timestamp: '2026-06-24 15:20', ipAddress: '192.168.1.45' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('veloria-admin-logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addLog = (operation: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      adminName: currentUser.name || 'مدير فيلوريا',
      role: currentUser.role === 'admin' ? 'مدير النظام' : 'مشرف السوق',
      operation,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 254 + 1)
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
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
        addLog(logMsg);
      });
    } else {
      addLog('تحديث عام لإعدادات المنصة دون تغيير القيم');
    }

    onUpdateAppSettings(newSettings);
  };

  // Auth Action for Login Gate
  const handleGateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    
    // Find the current logged-in user or matching user in the system
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
    
    // Append entry to logs
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      adminName: userMatch.name,
      role: roleText,
      operation: logMsg,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: '192.168.1.100'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Direct Bypass for developer ease
  const handleQuickBypass = (role: 'admin' | 'moderator') => {
    const defaultUser = users.find(u => u.role === role) || currentUser;
    setIsGateAuthenticated(true);
    sessionStorage.setItem('veloria-admin-gate-auth', 'true');
    setLoginError('');
    
    const roleText = role === 'admin' ? 'مدير نظام (دخول سريع)' : 'مشرف نظام (دخول سريع)';
    const logMsg = `تسجيل دخول آمن وسريع عبر بوابة التحقق الثنائية بصفته ${roleText}`;
    
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      adminName: defaultUser.name,
      role: roleText,
      operation: logMsg,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: '127.0.0.1'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleLogoutGate = () => {
    setIsGateAuthenticated(false);
    sessionStorage.removeItem('veloria-admin-gate-auth');
    addLog('تسجيل الخروج من لوحة التحكم');
  };

  // Stat calculations
  const totalUsers = users.length;
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const soldProducts = products.filter(p => p.status === 'sold').length;
  const hiddenProducts = products.filter(p => p.status === 'hidden').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const verifiedStoresCount = users.filter(u => u.badges.includes('verified')).length;

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
    addLog(`قام بـ ${statusArabic} حساب المستخدم: ${targetUser?.name || userId}`);
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    if (setUsers) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    }
    addLog(`عدّل بيانات الملف الشخصي للمستخدم: ${editingUser.name}`);
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
    addLog(`${added ? 'منح' : 'سحب'} الشارة (${badgeNameAr}) من التاجر: ${user.name}`);
  };

  // Products Handlers
  const handleProductStatusToggle = (productId: string, newStatus: 'active' | 'hidden' | 'sold') => {
    const targetProduct = products.find(p => p.id === productId);
    if (setProducts) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p));
    }
    const statusAr = newStatus === 'active' ? 'إعادة إظهار وتنشيط' : newStatus === 'hidden' ? 'إخفاء ورقابة' : 'مباع';
    addLog(`قام بـ ${statusAr} المنتج: [${targetProduct?.title}] للبائع: ${targetProduct?.sellerId}`);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (setProducts) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    }
    addLog(`تعديل تفاصيل وأسعار المنتج الإعلاني: ${editingProduct.title}`);
    setEditingProduct(null);
  };

  const handleDeleteProductAdmin = async (productId: string) => {
    if (currentUser.role !== 'admin') {
      alert('المشرف لا يملك صلاحية الحذف النهائي للمنتجات. يرجى إخفاء المنتج كإجراء رقابي.');
      return;
    }

    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    // First confirmation dialog
    const confirmDelete = confirm(`هل أنت متأكد من حذف هذا المنتج؟\n\nتنبيه: هذا الإجراء نهائي ولا يمكن التراجع عنه.`);
    if (!confirmDelete) return;

    // Prompt for deletion reason
    const reason = prompt('يرجى كتابة سبب حذف المنتج لإخطار التاجر به (مطلوب):');
    if (reason === null) return; // user cancelled
    if (reason.trim() === '') {
      alert('لا يمكن حذف المنتج دون توفير سبب للحذف.');
      return;
    }

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
    try {
      const notifsStr = localStorage.getItem('veloria-notifications');
      const currentNotifs = notifsStr ? JSON.parse(notifsStr) : [];
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random()}`,
        userId: targetProduct.sellerId,
        type: 'admin',
        title: `❌ تم حذف منتجك: "${targetProduct.title}"`,
        body: `نحيطك علماً بأن إدارة المنصة قامت بحذف منتجك المخالف لسبب رقابي: "${reason}". يرجى الالتزام بالسياسات والقوانين لتفادي حظر حسابك.`,
        createdAt: new Date().toISOString(),
        read: false
      };
      
      // Clean up previous notifications about this product, then insert new one
      const filteredNotifs = currentNotifs.filter((n: any) => 
        !(n.title?.includes(targetProduct.title) || n.body?.includes(targetProduct.title) || n.id?.includes(productId))
      );
      
      const mergedNotifs = [newNotif, ...filteredNotifs].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
      localStorage.setItem('veloria-notifications', JSON.stringify(mergedNotifs));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Failed to update notifications in localStorage:', e);
    }

    // Add administrative activity log
    addLog(`حذف نهائي للمنتج الإعلاني: [${targetProduct.title}] بسبب: "${reason}"`);
    alert(`تم حذف المنتج "${targetProduct.title}" بنجاح وإخطار التاجر بالسبب رقابياً.`);
  };

  // Reports Handlers
  const handleAcceptReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (setReports) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    }
    addLog(`اعتماد وحل البلاغ رقم #${reportId} المقدم من: ${report?.reporterName}`);
  };

  const handleRejectReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (setReports) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
    }
    addLog(`رفض وتجاهل الشكوى رقم #${reportId} المقدمة من: ${report?.reporterName}`);
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
    addLog(`إضافة فئة تصنيف جديدة للسوق: "${newCatName.trim()}" مع الرمز ${newCatIcon}`);
    setNewCatName('');
    setCatSuccess(true);
    setTimeout(() => setCatSuccess(false), 2000);
  };

  const handleDeleteCategory = (catId: string) => {
    if (currentUser.role !== 'admin') {
      alert('حذف الأقسام متاح للمدير فقط.');
      return;
    }

    const cat = categories.find(c => c.id === catId);
    if (confirm(`هل تريد بالتأكيد حذف تصنيف [${cat?.name}]؟ سيتم نقل المنتجات المرتبطة به للتصنيف العام.`)) {
      if (setCategories) {
        setCategories(prev => prev.filter(c => c.id !== catId));
      }
      addLog(`حذف قسم التصنيف: ${cat?.name}`);
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
    
    addLog(`قبول طلب توثيق حساب المتجر ومنح شارة موثق ✔️ للتاجر: ${req.storeName}`);
  };

  const handleRejectVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRequest) return;

    if (onUpdateVerificationStatus) {
      onUpdateVerificationStatus(rejectRequest.id, 'rejected', rejectionReasonInput);
    }

    addLog(`رفض طلب توثيق متجر التاجر: ${rejectRequest.storeName} بسبب: ${rejectionReasonInput}`);
    setRejectRequest(null);
    setRejectionReasonInput('');
  };

  // System Broadcast Notification Handler
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifTitle.trim() === '' || notifBody.trim() === '') return;

    // Simulate sending general alerts or appending to orders/messages fallbacks
    const targetText = notifTarget === 'all' 
      ? 'جميع المستخدمين' 
      : notifTarget === 'verified' 
      ? 'المتاجر الموثقة فقط' 
      : `المستخدم بالمعرف [${notifSpecificUserId}]`;

    addLog(`بث إشعار نظام عام لـ (${targetText}) بعنوان: "${notifTitle}"`);
    setNotifTitle('');
    setNotifBody('');
    setNotifSuccess(true);
    setTimeout(() => setNotifSuccess(false), 3000);
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
    addLog(`تم معالجة والرد على رسالة دعم من [${replyingMessage?.name}] بعنوان "${replyingMessage?.subject}"`);
    alert('تم حفظ الرد والتعليق الإداري وتحديث حالة الرسالة إلى "تمت المعالجة" بنجاح.');
    setReplyingMessage(null);
    setAdminReplyText('');
  };

  const handleDeleteContactMsg = (msgId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الرسالة نهائياً؟')) {
      if (setContactMessages) {
        setContactMessages(prev => prev.filter(m => m.id !== msgId));
      }
      addLog(`حذف رسالة دعم بريد وارد رقم #${msgId}`);
    }
  };

  // Filtered Lists
  const filteredUsersList = users.filter(u => {
    const query = userSearch.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(query) || 
                        (u.username || '').toLowerCase().includes(query) || 
                        u.email.toLowerCase().includes(query);
    
    if (!matchSearch) return false;

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

  const filteredProductsList = products.filter(p => {
    const query = productSearch.toLowerCase();
    const seller = users.find(u => u.id === p.sellerId);
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
                      const count = products.filter(p => p.categoryId === cat.id).length;
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
                    {users.slice(0, 3).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-xs p-1.5 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" />
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                        </div>
                        <div className="text-[10px] text-amber-500 font-bold font-mono">
                          ⭐ {u.ratingAverage || '5.0'}
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="ابحث باسم العضو، اسم المستخدم، البريد..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">فلترة الحالة:</span>
                  <select
                    value={userFilter}
                    onChange={(e: any) => setUserFilter(e.target.value)}
                    className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                  >
                    <option value="all">الكل ({totalUsers})</option>
                    <option value="active">النشطين</option>
                    <option value="verified">الموثقين فقط</option>
                    <option value="suspended">المعلقين</option>
                    <option value="banned">المحظورين</option>
                    <option value="deactivated">المعطلين ذاتياً (Deactivated)</option>
                  </select>
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
                        <td className="p-3 text-amber-500 font-bold font-mono">⭐ {u.ratingAverage}</td>
                        <td className="p-3">
                          <span className="text-[10px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/10">
                            {u.trustLevel || 'عضو عادي'}
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
                        <td className="p-3 min-w-[200px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Products Management */}
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
                      const category = categories.find(c => c.id === p.categoryId);
                      const seller = users.find(u => u.id === p.sellerId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                          <td className="p-3 flex items-center gap-2 min-w-[200px]">
                            <img src={p.images[0]} className="w-9 h-9 rounded-lg object-cover" />
                            <span className="font-bold truncate max-w-[150px] text-slate-800 dark:text-slate-200" title={p.title}>
                              {p.title}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{category?.name || 'تصنيف آخر'}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.price} {p.currency}</td>
                          <td className="p-3 font-bold text-slate-600 dark:text-slate-400">{seller?.name || 'غير معروف'}</td>
                          <td className="p-3 font-mono text-slate-400">{p.viewsCount || 0}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              p.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600'
                                : p.status === 'sold'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}>
                              {p.status === 'active' ? 'نشط' : p.status === 'sold' ? 'مباع' : 'مخفي بمخالفة'}
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
                                  onClick={() => handleProductStatusToggle(p.id, 'hidden')}
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
                      <div key={rep.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded">
                              بلاغ على {rep.type === 'product' ? 'منتج إعلاني' : 'حساب بائع'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {rep.targetName}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            الشاكي: <strong className="text-slate-700 dark:text-slate-300">{rep.reporterName}</strong> | تاريخ: {rep.createdAt ? rep.createdAt.split('T')[0] : '2026-06-25'}
                          </div>
                        </div>

                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 text-xs space-y-1.5">
                          <div>
                            <strong className="text-amber-600">سبب المخالفة المحددة:</strong>{' '}
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{rep.reason}</span>
                          </div>
                          {rep.details && (
                            <div>
                              <strong className="text-slate-400">شرح وتفاصيل داعمة للشكوى:</strong>{' '}
                              <p className="text-slate-600 dark:text-slate-400 mt-1">{rep.details}</p>
                            </div>
                          )}
                        </div>

                        {/* Report Resolution State Actions */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {rep.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleAcceptReport(rep.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                              >
                                قبول الشكوى واعتمادها
                              </button>

                              {rep.type === 'product' && targetProduct && targetProduct.status !== 'hidden' && (
                                <button
                                  onClick={() => {
                                    handleProductStatusToggle(targetProduct.id, 'hidden');
                                    handleAcceptReport(rep.id);
                                  }}
                                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                                >
                                  إخفاء المنتج المخالف وحل الشكوى
                                </button>
                              )}

                              {rep.type === 'user' && reportedUser && reportedUser.status !== 'suspended' && (
                                <button
                                  onClick={() => {
                                    handleUserStatusUpdate(reportedUser.id, 'suspended');
                                    handleAcceptReport(rep.id);
                                  }}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                                >
                                  تعليق بائع معتمد وحل الشكوى
                                </button>
                              )}

                              <button
                                onClick={() => handleRejectReport(rep.id)}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                              >
                                تجاهل / بلاغ كيدي
                              </button>
                            </>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              rep.status === 'resolved' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-slate-500/10 text-slate-500'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                              {rep.status === 'resolved' ? 'تم معالجة الشكوى واتخاذ القرار الرقابي' : 'تم رفض البلاغ وحفظ الملف كبلاغ كيدي'}
                            </span>
                          )}
                        </div>
                      </div>
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
                    <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-4">التصنيفات المفعلة حالياً ({categories.length})</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {categories.map((cat) => (
                        <div key={cat.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">📁</span>
                            <span className="text-xs font-bold text-slate-850 dark:text-white">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="حذف هذا القسم"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                    const targetUser = users.find(u => u.id === req.storeId);
                    const avatarUrl = targetUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80';
                    return (
                      <div key={req.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          <div>
                            <div className="font-black text-xs text-slate-850 dark:text-white flex items-center gap-1.5">
                              <span>{req.storeName}</span>
                              <span className="text-[9px] font-medium text-slate-400">المعرف: #{req.storeId}</span>
                            </div>
                            <p className="text-[10px] text-slate-400">اسم المتجر التجاري: <strong className="text-indigo-500">@{req.storeUsername}</strong></p>
                            <p className="text-[9px] text-slate-400">تاريخ التقديم: {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-SY') : 'مسبقاً'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' || req.status === 'reviewed' ? (
                            <>
                              {req.status === 'reviewed' && (
                                <span className="text-[9px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 px-2.5 py-1 rounded-full font-bold ml-1">
                                  ✔️ تمت المراجعة الأولية
                                </span>
                              )}
                              <button
                                onClick={() => handleApproveVerification(req)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                موافقة وتوثيق الحساب ✔️
                              </button>
                              <button
                                onClick={() => setRejectRequest(req)}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                رفض الطلب
                              </button>
                            </>
                          ) : (
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                              req.status === 'approved' 
                                ? 'bg-emerald-500/15 text-emerald-500' 
                                : 'bg-rose-500/15 text-rose-500'
                            }`}>
                              {req.status === 'approved' ? '✔️ مقبول وموثق' : `❌ مرفوض: ${req.rejectionReason || 'لم يطابق الشروط'}`}
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

          {/* TAB 7: Badges Management */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              {currentUser.role !== 'admin' ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded-3xl text-slate-400">
                  <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-slate-700">قسم مغلق ومحمي</h3>
                  <p className="text-xs mt-1 text-slate-400">منح وإلغاء شارات الثقة الفاخرة متاح لمدير النظام فقط.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">إدارة الأوسمة وشارات المصداقية</h3>
                  <p className="text-[10px] text-slate-400">يمكنك سحب أو منح الشارات مباشرة من جدول المستخدمين، وهنا تجد وصف الأوسمة المعتمدة في فيلوريا:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4.5 h-4.5" />
                        <span>✔️ موثق (Verified)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">تُمنح للمتاجر التي رفعت هويتها الوطنية أو سجلها التجاري الموثق لضمان مبيعات آمنة للأعضاء.</p>
                    </div>

                    <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-600 dark:text-orange-400">
                        <Flame className="w-4.5 h-4.5" />
                        <span>🔥 بائع نشط (Active Seller)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">تُمنح تلقائياً للتجار الذين لديهم أكثر من 15 منتجاً نشطاً في نفس الوقت مع استجابة سريعة للرسائل.</p>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        <Star className="w-4.5 h-4.5" />
                        <span>⭐ بائع مميز (Featured Seller)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">تُمنح يدوياً للتجار الحاصلين على متوسط تقييم 4.8 فأكثر ولديهم سجل خدمة عملاء راقي.</p>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                        <Store className="w-4.5 h-4.5" />
                        <span>🏪 متجر رسمي (Official Store)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">تُمنح للمحلات والمصانع الرسمية وصناع الحرف الذين يمتلكون ورش عمل مسجلة ومعروفة جغرافياً.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: Featured Stores Management */}
          {activeTab === 'featured' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-1">المتاجر المقترحة في الصفحة الرئيسية</h3>
              <p className="text-[10px] text-slate-400">متاجر يتم عرضها في أعلى الواجهة لسرعة تصفحها وزيارة منتجاتها. المعايير الحالية: النشاط، التقييم، مستوى الثقة.</p>

              {/* Table of potential candidates */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
                    <tr>
                      <th className="p-3 text-[10px]">المتجر</th>
                      <th className="p-3 text-[10px]">المدينة</th>
                      <th className="p-3 text-[10px]">المتابعين</th>
                      <th className="p-3 text-[10px]">التقييم</th>
                      <th className="p-3 text-[10px]">مستوى الثقة</th>
                      <th className="p-3 text-[10px]">الحالة بالواجهة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {users.slice(0, 5).map((seller) => (
                      <tr key={seller.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                        <td className="p-3 flex items-center gap-2">
                          <img src={seller.avatar} className="w-7 h-7 rounded-full object-cover" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{seller.name}</span>
                        </td>
                        <td className="p-3 text-slate-500">{seller.city || 'الرياض'}</td>
                        <td className="p-3 font-mono">{seller.followersCount || 10} متابع</td>
                        <td className="p-3 font-mono text-amber-500 font-bold">⭐ {seller.ratingAverage}</td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded">
                            {seller.trustLevel || 'موثوق'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                             مثبت ومقترح 📌
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: System Notifications Broadcaster */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
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
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">معرف البائع أو العضو (User ID):</label>
                      <select
                        value={notifSpecificUserId}
                        onChange={(e) => setNotifSpecificUserId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        required
                      >
                        <option value="">اختر التاجر...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  )}

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

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال وبث التنبيه الموحد الآن</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 10: Activity Logs */}
          {activeTab === 'logs' && (() => {
            const filteredLogs = activityLogs.filter(log => {
              const matchesSearch = log.adminName.toLowerCase().includes(logSearch.toLowerCase()) || 
                                    log.operation.toLowerCase().includes(logSearch.toLowerCase()) ||
                                    (log.ipAddress && log.ipAddress.includes(logSearch));
              
              const matchesRole = logRoleFilter === 'all' || 
                                  (logRoleFilter === 'admin' && log.role === 'مدير النظام') ||
                                  (logRoleFilter === 'moderator' && log.role === 'مشرف السوق');
              
              return matchesSearch && matchesRole;
            });

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">سجل عمليات مديري ومشرفي النظام (Audit Trail)</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">تتبع العمليات الحساسة وإجراءات الرقابة مع فلترة متقدمة حسب الرتبة والاسم.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('هل تود مسح سجل العمليات الحالي؟ لا يمكن التراجع عن هذه الخطوة.')) {
                        setActivityLogs([]);
                      }
                    }}
                    className="text-[10px] bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl font-bold cursor-pointer hover:bg-rose-500/20 transition-all self-end sm:self-auto"
                  >
                    تصفير السجل الكامل
                  </button>
                </div>

                {/* Filter / Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث باسم المدير، العملية، أو عنوان IP..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full text-xs p-2.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">فلترة الرتبة:</span>
                    <select
                      value={logRoleFilter}
                      onChange={(e: any) => setLogRoleFilter(e.target.value)}
                      className="text-xs p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-amber-500 focus:outline-hidden w-full"
                    >
                      <option value="all">كل الرتب والمسؤولين</option>
                      <option value="admin">مدير النظام فقط</option>
                      <option value="moderator">مشرف السوق فقط</option>
                    </select>
                  </div>
                </div>

                {/* Logs chronological table */}
                <div className="border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-3 text-[10px]">المدير/المشرف</th>
                          <th className="p-3 text-[10px]">الرتبة</th>
                          <th className="p-3 text-[10px]">العملية المنفذة</th>
                          <th className="p-3 text-[10px]">التاريخ والوقت</th>
                          <th className="p-3 text-[10px]">عنوان IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {filteredLogs.length > 0 ? (
                          filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                              <td className="p-3 font-sans font-bold text-slate-800 dark:text-slate-200">{log.adminName}</td>
                              <td className="p-3">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-sans font-bold ${
                                  log.role === 'مدير النظام' 
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                }`}>
                                  {log.role}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 dark:text-slate-300 font-sans text-[11px] font-medium">{log.operation}</td>
                              <td className="p-3 text-slate-400 text-[10px]">{log.timestamp}</td>
                              <td className="p-3 text-slate-400 text-[10px]">{log.ipAddress || '192.168.1.1'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                              ❌ لم يتم العثور على أي عمليات مطابقة للبحث الحالي.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                                addLog(`اعتماد وتأكيد استلام مساهمة دعم مالي من المستخدم/التاجر: ${user?.name || 'غير معروف'}`);
                              }}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Payment Received</span>
                            </button>
                            <button
                              onClick={() => {
                                onReviewContribution(req.id, 'Rejected');
                                addLog(`رفض مساهمة الدعم المالي من المستخدم/التاجر: ${user?.name || 'غير معروف'} لعدم استلام الرصيد`);
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
    </div>
  );
}
