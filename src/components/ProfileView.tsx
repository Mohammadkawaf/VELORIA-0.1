import React, { useState } from 'react';
import { User, Product, Review, Report, VerificationRequest } from '../types';
import ProductCard from './ProductCard';
import { supabase, isSupabaseConfigured, supabaseService } from '../lib/supabase';
import { compressImage } from '../utils/imageCompression';
import { 
  User as UserIcon, MapPin, Calendar, Award, ShieldCheck, Star, 
  Share2, Edit3, MessageCircle, Heart, Grid, Sparkles, MessageSquare, Info, Save, X, Camera, ShieldAlert, FileText, CheckCircle
} from 'lucide-react';
import ShareModal from './ShareModal';

interface ProfileViewProps {
  profileUser: User;
  products: Product[];
  reviews?: Review[];
  currentUser: User | null;
  onFollow: (userId: string) => void;
  followedSellers: string[];
  onStartChat: (userId: string) => void;
  onUpdateProfile?: (updatedUser: User) => void;
  onViewProduct: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  users: User[];
  reports?: Report[];
  verificationRequests?: VerificationRequest[];
  onSubmitVerification?: (storeId: string) => void;
}

export default function ProfileView({
  profileUser,
  products,
  reviews,
  currentUser,
  onFollow,
  followedSellers,
  onStartChat,
  onUpdateProfile,
  onViewProduct,
  onToggleFavorite,
  favorites,
  users,
  reports = [],
  verificationRequests = [],
  onSubmitVerification
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'reviews' | 'info'>('products');
  const [isEditing, setIsEditing] = useState(false);

  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showVerificationChecklist, setShowVerificationChecklist] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Editable fields state
  const [editedName, setEditedName] = useState(profileUser.name);
  const [editedUsername, setEditedUsername] = useState(profileUser.username || '');
  const [editedBio, setEditedBio] = useState(profileUser.bio || '');
  const [editedCity, setEditedCity] = useState(profileUser.city || 'الرياض');
  const [editedAvatar, setEditedAvatar] = useState(profileUser.avatar);
  const [editedCover, setEditedCover] = useState(profileUser.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&h=300&q=80');
  const [editedWhatsapp, setEditedWhatsapp] = useState(profileUser.whatsapp_number || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [diagnosticError, setDiagnosticError] = useState<{
    source: string;
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    raw?: any;
  } | null>(null);

  const getWhatsAppLink = () => {
    let num = profileUser.whatsapp || profileUser.whatsapp_number || '';
    num = num.replace(/\D/g, '');
    if (num.startsWith('00')) num = num.substring(2);
    if (num.startsWith('05') && num.length === 10) {
      num = '966' + num.substring(1);
    }
    return num;
  };

  const handleWhatsAppClick = () => {
    const num = getWhatsAppLink();
    if (!num) {
      alert('لم يقم البائع بإضافة رقم واتساب.');
      return;
    }
    const msg = encodeURIComponent(`مرحباً ${profileUser.name}، أود التواصل معك للاستفسار عن منتجاتك المعروضة في منصة فيلوريا.\nرابط متجرك: ${window.location.origin}/store/${profileUser.username || profileUser.id}`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('الرجاء اختيار صورة بحجم أقل من 5 ميجابايت.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Compress the image before uploading to optimize performance and prevent crashes
      const compressedFile = file;

      // Await file reading as a Promise to stay inside the try-catch block
      const localDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(compressedFile);
      });

      if (supabase && isSupabaseConfigured) {
        const timestamp = Date.now();
        const filePath = `${profileUser.id}/avatar-${timestamp}.webp`;

        // Remove old avatars if any
        if (profileUser.avatar) {
          const parts = profileUser.avatar.split('/avatars/');
          if (parts.length > 1) {
            const oldPath = parts[1];
            await supabase.storage.from('avatars').remove([oldPath]).catch(() => {});
          }
        }

        const { data, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, compressedFile, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (uploadErr) {
          console.error('Error uploading to Supabase Storage:', uploadErr);
          const errObj = {
            source: 'رفع الصورة الشخصية (handleAvatarChange)',
            code: (uploadErr as any).code || 'N/A',
            message: uploadErr.message,
            details: (uploadErr as any).details || 'N/A',
            hint: (uploadErr as any).hint || 'N/A',
            raw: uploadErr
          };
          setDiagnosticError(errObj);
          const alertMsg = `⚠️ خطأ رفع الصورة الشخصية (avatars):\nCode: ${errObj.code}\nMessage: ${errObj.message}\nDetails: ${errObj.details}\nHint: ${errObj.hint}\nRaw: ${JSON.stringify(uploadErr, null, 2)}`;
          alert(alertMsg);
          setUploadError(`فشل رفع الصورة: ${uploadErr.message}`);
          throw uploadErr;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setEditedAvatar(publicUrl);
        
        if (onUpdateProfile) {
          onUpdateProfile({
            ...profileUser,
            avatar: publicUrl
          });
        }
      } else {
        setEditedAvatar(localDataUrl);
        if (onUpdateProfile) {
          onUpdateProfile({
            ...profileUser,
            avatar: localDataUrl
          });
        }
      }
    } catch (err: any) {
      console.error('Avatar change/upload exception:', err);
      const errObj = {
        source: 'استثناء كامل في handleAvatarChange',
        code: err?.code || err?.status || 'N/A',
        message: err?.message || String(err),
        details: err?.details || 'N/A',
        hint: err?.hint || 'N/A',
        raw: err
      };
      setDiagnosticError(errObj);
      const alertMsg = `⚠️ استثناء كامل في handleAvatarChange:\nCode: ${errObj.code}\nMessage: ${errObj.message}\nDetails: ${errObj.details}\nHint: ${errObj.hint}\nRaw: ${JSON.stringify(err, null, 2) || String(err)}`;
      alert(alertMsg);
      setUploadError(`حدث خطأ أثناء الرفع: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setUploadError('');

    try {
      // Automatically compress the image before uploading while preserving visual quality
      const compressedFile = file;

      // Await file reading as a Promise to stay inside the try-catch block
      const localDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(compressedFile);
      });

      if (supabase && isSupabaseConfigured) {
        // Replace the previous cover image and delete old cover image from Storage automatically
        if (profileUser.coverImage) {
          const parts = profileUser.coverImage.split('/avatars/');
          if (parts.length > 1) {
            const oldPath = parts[1];
            await supabase.storage.from('avatars').remove([oldPath]).catch(() => {});
          }
        }

        const timestamp = Date.now();
        const filePath = `${profileUser.id}/cover-${timestamp}.webp`;

        const { data, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, compressedFile, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (uploadErr) {
          console.error('Error uploading cover to Supabase Storage:', uploadErr);
          const errObj = {
            source: 'رفع الغلاف (handleCoverChange)',
            code: (uploadErr as any).code || 'N/A',
            message: uploadErr.message,
            details: (uploadErr as any).details || 'N/A',
            hint: (uploadErr as any).hint || 'N/A',
            raw: uploadErr
          };
          setDiagnosticError(errObj);
          const alertMsg = `⚠️ خطأ رفع صورة الغلاف (avatars):\nCode: ${errObj.code}\nMessage: ${errObj.message}\nDetails: ${errObj.details}\nHint: ${errObj.hint}\nRaw: ${JSON.stringify(uploadErr, null, 2)}`;
          alert(alertMsg);
          setUploadError(`فشل رفع الغلاف: ${uploadErr.message}`);
          throw uploadErr;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setEditedCover(publicUrl);
        if (onUpdateProfile) {
          onUpdateProfile({
            ...profileUser,
            coverImage: publicUrl
          });
        }
      } else {
        setEditedCover(localDataUrl);
        if (onUpdateProfile) {
          onUpdateProfile({
            ...profileUser,
            coverImage: localDataUrl
          });
        }
      }
    } catch (err: any) {
      console.error('Cover change/upload exception:', err);
      const errObj = {
        source: 'استثناء كامل في handleCoverChange',
        code: err?.code || err?.status || 'N/A',
        message: err?.message || String(err),
        details: err?.details || 'N/A',
        hint: err?.hint || 'N/A',
        raw: err
      };
      setDiagnosticError(errObj);
      const alertMsg = `⚠️ استثناء كامل في handleCoverChange:\nCode: ${errObj.code}\nMessage: ${errObj.message}\nDetails: ${errObj.details}\nHint: ${errObj.hint}\nRaw: ${JSON.stringify(err, null, 2) || String(err)}`;
      alert(alertMsg);
      setUploadError(`حدث خطأ أثناء رفع الغلاف: ${err?.message || err}`);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.id === profileUser.id;
  const isFollowing = followedSellers.includes(profileUser.id);

  // Filter user's active products
  const userProducts = products.filter((p) => p.sellerId === profileUser.id);
  // Filter reviews for products owned by this seller
  const userProductIds = userProducts.map((p) => p.id);
  
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [loadingSellerReviews, setLoadingSellerReviews] = useState(false);

  React.useEffect(() => {
    const fetchSellerReviews = async () => {
      if (!isSupabaseConfigured || userProductIds.length === 0) {
        setSellerReviews([]);
        return;
      }
      setLoadingSellerReviews(true);
      try {
        const reviewsPromises = userProductIds.map(id => supabaseService.getProductRatings(id));
        const allReviewsLists = await Promise.all(reviewsPromises);
        setSellerReviews(allReviewsLists.flat());
      } catch (err) {
        console.error('Error fetching seller reviews:', err);
      } finally {
        setLoadingSellerReviews(false);
      }
    };
    fetchSellerReviews();
  }, [profileUser.id, products]);

  // Calculate 30-day username lock remaining time
  const getUsernameChangeLockStatus = () => {
    if (!profileUser.lastUsernameChangeDate) return { locked: false, remaining: 0 };
    const daysSinceChange = (new Date().getTime() - new Date(profileUser.lastUsernameChangeDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceChange < 30) {
      return { locked: true, remaining: Math.ceil(30 - daysSinceChange) };
    }
    return { locked: false, remaining: 0 };
  };
  const lockStatus = getUsernameChangeLockStatus();

  const handleSaveProfile = () => {
    if (!onUpdateProfile) return;
    
    const newUsername = editedUsername.trim().toLowerCase();
    const hasVeloria = (str: string) => {
      const lower = str.toLowerCase();
      return lower.includes('veloria') || lower.includes('فيلوريا');
    };

    if (hasVeloria(editedName) || hasVeloria(newUsername)) {
      alert('اسم المتجر أو اسم المستخدم الجديد يحتوي على كلمة محظورة (VELORIA / فيلوريا). بموجب قوانين المنصة، يُمنع استخدام اسم المنصة أو الكلمات التي تلمح إلى صفة رسمية لتجنب تضليل الأعضاء.');
      return;
    }

    let updatedLastChangeDate = profileUser.lastUsernameChangeDate;

    if (newUsername !== (profileUser.username || '').toLowerCase()) {
      // 1. Check 30 days restriction
      if (lockStatus.locked) {
        alert(`عذراً، لا يمكنك تعديل اسم المستخدم إلا مرة كل 30 يوماً. تبقى ${lockStatus.remaining} يوم قبل التعديل القادم.`);
        return;
      }

      // 2. Check for empty username
      if (newUsername === '') {
        alert('اسم المستخدم لا يمكن أن يكون فارغاً.');
        return;
      }

      // Validate format (alphanumeric and underscores only)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(newUsername)) {
        alert('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وعلامة الشرطة السفلية (_) فقط.');
        return;
      }

      // 3. Check for unique username
      const isTaken = users.some(u => u.id !== profileUser.id && (u.username || '').toLowerCase() === newUsername);
      if (isTaken) {
        alert('اسم المستخدم هذا محجوز ومستعمل بالفعل، يرجى اختيار اسم مستخدم فريد.');
        return;
      }

      // Update change date
      updatedLastChangeDate = new Date().toISOString();
    }

    const updated: User = {
      ...profileUser,
      name: editedName.trim(),
      username: newUsername || profileUser.username,
      bio: editedBio.trim(),
      city: editedCity.trim(),
      avatar: editedAvatar.trim(),
      coverImage: editedCover.trim(),
      whatsapp_number: editedWhatsapp.trim(),
      phone: editedWhatsapp.trim(),
      lastUsernameChangeDate: updatedLastChangeDate
    };
    onUpdateProfile(updated);
    setIsEditing(false);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleDeactivateAccount = () => {
    if (!onUpdateProfile) return;
    const confirmDeactivate = confirm(
      "هل أنت متأكد من رغبتك في تعطيل وتجميد حسابك؟\n\nبموجب قواعد VELORIA، لن يتم حذف الحساب فوريّاً بل سيتم تجميده للحفاظ على سجل التقييمات والطلب التاريخي لضمان الأمان والشفافية. يمكنك العودة وإعادة تنشيطه لاحقاً."
    );
    if (confirmDeactivate) {
      const updated: User = {
        ...profileUser,
        status: 'deactivated'
      };
      onUpdateProfile(updated);
      alert("تم تعطيل وتجميد حسابك بنجاح. سيتم الآن تسجيل خروجك وتوجيهك للصفحة الرئيسية لتصفح فيلوريا كزائر.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-right">
      {uploadError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold leading-relaxed flex items-start justify-between gap-3 shadow-xs">
          <div className="flex-1">
            <span className="font-extrabold block text-sm mb-1">⚠️ تنبيه من نظام تخزين VELORIA:</span>
            <span>{uploadError}</span>
          </div>
          <button 
            onClick={() => setUploadError('')} 
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {diagnosticError && (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500/40 text-slate-800 dark:text-slate-200 rounded-3xl text-xs leading-relaxed flex flex-col gap-4 shadow-md font-sans">
          <div className="flex items-start justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div>
              <span className="font-extrabold text-sm block text-amber-600 dark:text-amber-400 mb-1">🛠️ تشخيص أخطاء تخزين Supabase:</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">مصدر الخطأ: {diagnosticError.source}</span>
            </div>
            <button 
              onClick={() => setDiagnosticError(null)} 
              className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="font-black text-slate-500 block">كود الخطأ (Code):</span>
              <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg font-mono text-[11px] block">{diagnosticError.code || 'N/A'}</code>
            </div>
            <div className="space-y-1">
              <span className="font-black text-slate-500 block">الرسالة (Message):</span>
              <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg font-mono text-[11px] block break-all">{diagnosticError.message || 'N/A'}</code>
            </div>
            <div className="space-y-1">
              <span className="font-black text-slate-500 block">التفاصيل (Details):</span>
              <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg font-mono text-[11px] block whitespace-pre-wrap">{diagnosticError.details || 'N/A'}</code>
            </div>
            <div className="space-y-1">
              <span className="font-black text-slate-500 block">تلميح (Hint):</span>
              <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg font-mono text-[11px] block whitespace-pre-wrap">{diagnosticError.hint || 'N/A'}</code>
            </div>
          </div>
          <div className="space-y-1 mt-2 text-right">
            <span className="font-black text-slate-500 block">محتوى الاستجابة الكامل (Complete JSON Response Object):</span>
            <pre className="p-3 bg-slate-900 text-amber-400 rounded-2xl font-mono text-[10px] overflow-auto max-h-60 text-left ltr" style={{ direction: 'ltr' }}>
              {JSON.stringify(diagnosticError.raw, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Cover Image Header */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xs bg-slate-950">
        <img 
          src={isEditing ? editedCover : profileUser.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&h=300&q=80'} 
          className="w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        
        {/* Upload Cover Image Button */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
              className="px-3.5 py-2 bg-slate-950/65 hover:bg-slate-950 text-white text-[11px] font-black rounded-xl backdrop-blur-md transition-colors cursor-pointer border border-white/10 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>{isUploadingCover ? 'جاري الرفع...' : 'تحميل صورة الغلاف'}</span>
            </button>
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {/* Share Store Button */}
        <button 
          onClick={handleShare}
          className="absolute top-4 left-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer border border-white/10"
          title="مشاركة رابط المتجر"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Info Capsule */}
      <div className="relative px-6 pb-6 -mt-24 md:-mt-28 space-y-4">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
          
          {/* Avatar and Primary Bio */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-right w-full md:w-auto">
            <img 
              src={isEditing ? editedAvatar : profileUser.avatar} 
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg relative z-10" 
            />
            
            <div className="space-y-1 relative z-10 text-white md:text-slate-900 dark:md:text-slate-100">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-xl font-black">{profileUser.name}</h1>
                {profileUser.badges.includes('verified') && (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" title="بائع معتمد ✔️" />
                )}
              </div>
              <p className="text-xs text-slate-300 md:text-slate-500 font-bold">@{profileUser.username || profileUser.id}</p>
              
              <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] text-slate-300 md:text-slate-400 font-bold pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {profileUser.city || 'الرياض'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  انضم في {profileUser.joinedAt}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Edit or Follow/Chat) */}
          <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end relative z-10">
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>إلغاء</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black cursor-pointer transition-colors shadow-xs"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>تعديل الملف الشخصي</span>
                </button>
              )
            ) : (
              <>
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1DB954] hover:bg-[#1aa34a] text-white rounded-xl text-xs font-black cursor-pointer transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>التواصل عبر واتساب</span>
                </button>
                <button
                  onClick={() => onFollow(profileUser.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    isFollowing
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/15'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  {isFollowing ? 'إلغاء المتابعة' : 'متابعة المتجر'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit fields form (visible only in editing state) */}
        {isEditing && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-4 pt-5">
            <h3 className="font-extrabold text-xs text-amber-600 dark:text-amber-400">نموذج تعديل بيانات المتجر:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">الاسم الشخصي / أو اسم متجرك:</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">المدينة الحالية:</label>
                <input
                  type="text"
                  value={editedCity}
                  onChange={(e) => setEditedCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                <span>اسم المستخدم الفريد (Username):</span>
                {lockStatus.locked && (
                  <span className="text-[10px] text-rose-500 font-extrabold bg-rose-500/10 px-2 py-0.5 rounded">
                    مغلق مؤقتاً (متبقي {lockStatus.remaining} يوم)
                  </span>
                )}
              </label>
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-1">
                <span className="text-xs text-slate-400 font-mono select-none" dir="ltr">veloria.com/store/</span>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  disabled={lockStatus.locked}
                  placeholder="mohamad_shoes"
                  className="flex-1 text-xs px-1 py-1 bg-transparent border-0 focus:ring-0 outline-hidden font-mono text-left"
                  dir="ltr"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                {lockStatus.locked 
                  ? "عذراً، تماشياً مع قواعد المنصة يمنع تغيير اسم المستخدم أكثر من مرة واحدة كل 30 يوماً لحفظ هويات البائعين وحقوق المشترين."
                  : "اسم المستخدم فريد ويستخدم في رابط متجرك المباشر. يمكنك تعديله مرة واحدة كل 30 يوماً."}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">النبذة التعريفية للمتجر (Bio):</label>
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 leading-normal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">الصورة الشخصية للمتجر (Avatar):</label>
                <div className="flex items-center gap-3 mt-1">
                  <img 
                    src={editedAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'} 
                    alt="Avatar Preview" 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'جاري التحميل...' : 'اختيار صورة من المعرض'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">لا يتطلب إدخال رابط يدوياً بعد الآن.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الواتساب للتواصل المباشر:</label>
                <input
                  type="text"
                  value={editedWhatsapp}
                  onChange={(e) => setEditedWhatsapp(e.target.value)}
                  placeholder="966501234567"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 font-mono text-left"
                  dir="ltr"
                  required
                />
                <p className="text-[9px] text-slate-400 mt-1">الصيغة الدولية (مثل: 966501234567) لتسهيل الضغط والربط المباشر.</p>
              </div>
            </div>
          </div>
        )}

        {/* Bio sentence */}
        {!isEditing && (
          <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed max-w-3xl">
            {profileUser.bio || 'لا توجد نبذة تعريفية منشورة لهذا الحساب بعد.'}
          </p>
        )}

        {/* Trust Indicators Board */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-2">
          {/* Sincerity Level */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">مستوى السمعة والثقة:</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-450 flex items-center justify-center gap-1">
              <Award className="w-4 h-4 text-amber-500" />
              {profileUser.trustLevel || 'موثق بمستوى برونزي'}
            </span>
          </div>

          {/* Followers count */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">المتابعون النشطون:</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">
              {profileUser.followersCount} متابع
            </span>
          </div>

          {/* Average rating */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">متوسط تقييم السوق:</span>
            <span className="text-xs font-black text-slate-800 dark:text-white flex items-center justify-center gap-1">
              {profileUser.ratingAverage} ⭐
              <span className="text-[9px] text-slate-400 font-bold">({profileUser.ratingsCount})</span>
            </span>
          </div>

          {/* Listed products */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">الإعلانات المنشورة:</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">
              {userProducts.length} إعلان
            </span>
          </div>

          {/* Total sales count */}
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي المبيعات الناجحة:</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {profileUser.salesCount || 0} عملية بيع
            </span>
          </div>
        </div>

        {/* Store Verification Request section */}
        {isOwnProfile && !isEditing && (() => {
          const missing: string[] = [];

          // Store name exists
          if (!profileUser.name || profileUser.name.trim() === '') {
            missing.push('تسمية المتجر أو الاسم الشخصي');
          }
          // Store description exists (bio)
          if (!profileUser.bio || profileUser.bio.trim() === '') {
            missing.push('نبذة تعريفية للمتجر (Bio)');
          }
          // Profile image uploaded (not default / empty)
          if (!profileUser.avatar || profileUser.avatar.includes('photo-1535713875002-d1d0cf377fde') || profileUser.avatar.includes('placeholder')) {
            missing.push('صورة الحساب الشخصية (Avatar)');
          }
          // Cover image uploaded (must not be empty and not default)
          if (!profileUser.coverImage || profileUser.coverImage === '' || profileUser.coverImage.includes('photo-1557683316') || profileUser.coverImage.includes('photo-1618005182384-a83a8bd57fbe')) {
            missing.push('صورة غلاف المتجر');
          }
          // WhatsApp number added
          if (!profileUser.whatsapp_number || profileUser.whatsapp_number.trim() === '') {
            missing.push('رقم واتساب معتمد للتواصل المباشر');
          }
          // At least 5 published products
          if (userProducts.length < 5) {
            missing.push(`نشر ٥ منتجات على الأقل (لديك حالياً ${userProducts.length})`);
          }

          // No active violations (pending reports on this user or their products)
          const activeViolations = reports.some(r => r.reporterId !== profileUser.id && (r.targetId === profileUser.id || userProducts.some(p => p.id === r.targetId)) && r.status === 'pending');
          if (activeViolations) {
            missing.push('خلو السجل من البلاغات النشطة أو المخالفات المعلقة');
          }

          const isVerified = profileUser.badges.includes('verified');
          const myRequests = verificationRequests.filter(r => r.storeId === profileUser.id);
          const hasPending = myRequests.some(r => r.status === 'pending' || r.status === 'reviewed');
          const isEligible = missing.length === 0 && !isVerified && !hasPending;

          return (
            <div className="p-5 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 dark:from-slate-950/20 dark:via-slate-900/60 dark:to-slate-950/40 rounded-3xl border border-indigo-500/10 dark:border-indigo-500/15 shadow-xs space-y-4 text-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/15 rounded-xl shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                      طلب توثيق المتجر والحصول على الشارة ✔️
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      احصل على شارة التوثيق الزرقاء لمتجرك لتأكيد مصداقيتك وزيادة ثقة المشترين في معروضاتك المصنعة يدوياً.
                    </p>
                  </div>
                </div>

                {!isVerified && !hasPending && (
                  <button
                    onClick={() => setShowVerificationChecklist(!showVerificationChecklist)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl cursor-pointer transition-colors shrink-0 self-start sm:self-auto"
                  >
                    {showVerificationChecklist ? 'إغلاق نافذة التدقيق' : 'تقديم طلب التوثيق'}
                  </button>
                )}

                {isVerified && (
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl font-black flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>متجرك موثق ومعتمد رسمياً ✔️</span>
                  </span>
                )}

                {hasPending && (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3.5 py-1.5 rounded-xl font-black">
                      ⏳ طلب التوثيق قيد المراجعة والتدقيق
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {myRequests.some(r => r.status === 'reviewed') ? 'حالة الطلب: قيد المراجعة الرقابية النهائية من الإدارة' : 'حالة الطلب: قيد الفرز الأولي من فريق الإشراف'}
                    </span>
                  </div>
                )}
              </div>

              {/* Rejection notice if last request was rejected */}
              {myRequests.length > 0 && myRequests[0].status === 'rejected' && !hasPending && !isVerified && (
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                  <p className="font-extrabold flex items-center gap-1">
                    <span>⚠️ تم رفض طلب التوثيق الأخير الخاص بك:</span>
                  </p>
                  <p className="mt-1 bg-white/40 dark:bg-black/20 p-2.5 rounded-xl border border-rose-500/10 font-bold">
                    {myRequests[0].rejectionReason || 'لم يطابق متجرك الشروط والمعايير الأساسية للتسجيل.'}
                  </p>
                  <p className="mt-1.5 text-[10px] text-slate-400 font-bold">
                    يمكنك معالجة النقاط المذكورة وتصحيحها ثم إعادة تقديم طلبك مجدداً بكل سهولة وبدون شروط معقدة.
                  </p>
                </div>
              )}

              {/* Checklist View */}
              {showVerificationChecklist && !isVerified && !hasPending && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">قائمة تدقيق شروط التوثيق الأساسية:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Rule 1: Store Name */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${profileUser.name && profileUser.name.trim() !== '' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">اسم المتجر مضاف وملأى</span>
                    </div>

                    {/* Rule 2: Bio */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${profileUser.bio && profileUser.bio.trim() !== '' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">النبذة التعريفية للمتجر (Bio) مكتملة</span>
                    </div>

                    {/* Rule 3: Avatar */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${profileUser.avatar && !profileUser.avatar.includes('placeholder') && !profileUser.avatar.includes('photo-1535713875002-d1d0cf377fde') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">صورة الحساب الشخصية (Avatar) مرفوعة</span>
                    </div>

                    {/* Rule 4: Cover Image */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${profileUser.coverImage && profileUser.coverImage !== '' && !profileUser.coverImage.includes('photo-1557683316') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">صورة غلاف المتجر مخصصة ومرفوعة</span>
                    </div>

                    {/* Rule 5: WhatsApp */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${profileUser.whatsapp_number && profileUser.whatsapp_number.trim() !== '' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">رقم واتساب معتمد ومضاف للتواصل</span>
                    </div>

                    {/* Rule 6: At least 5 products */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${userProducts.length >= 5 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">نشر ٥ منتجات على الأقل (لديك {userProducts.length})</span>
                    </div>

                    {/* Rule 7: Violations check */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`p-1 rounded-full ${!reports.some(r => r.reporterId !== profileUser.id && (r.targetId === profileUser.id || userProducts.some(p => p.id === r.targetId)) && r.status === 'pending') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">خلو المتجر من أي بلاغات نشطة أو معلقة</span>
                    </div>
                  </div>

                  {/* Requirements warning / submission */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800">
                    {missing.length > 0 ? (
                      <p className="text-[10px] text-rose-500 font-bold leading-normal">
                        ⚠️ لا يمكنك تقديم الطلب لوجود نواقص: ({missing.join('، ')}). يرجى استكمالها لتنشيط زر الإرسال.
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                        🎉 تهانينا! لقد استوفيت كافة الشروط المطلوبة لتوثيق المتجر. يمكنك تقديم طلبك الآن.
                      </p>
                    )}

                    <button
                      onClick={() => {
                        if (!isEligible) return;
                        if (onSubmitVerification) {
                          onSubmitVerification(profileUser.id);
                          setShowVerificationChecklist(false);
                        }
                      }}
                      disabled={!isEligible}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-black rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      إرسال طلب التوثيق للمراجعة 🛡️
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-150 dark:border-slate-800/80 pt-4 text-xs gap-6 font-bold">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'products'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>المنتجات المعروضة ({userProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>آراء وتقييمات العملاء ({sellerReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 border-b-2 px-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>معلومات الحساب</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="pt-2">
          {activeTab === 'products' && (
            userProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {userProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isFavorite={favorites.includes(p.id)}
                    onToggleFavorite={onToggleFavorite}
                    onViewDetails={onViewProduct}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                لا توجد أي إعلانات نشطة منشورة لهذا الحساب حالياً.
              </div>
            )
          )}

          {activeTab === 'reviews' && (
            sellerReviews.length > 0 ? (
              <div className="space-y-3">
                {sellerReviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex gap-3 text-right">
                    <img src={rev.reviewerAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">{rev.reviewerName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">{rev.createdAt.split('T')[0]}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-650 dark:text-slate-400 leading-normal pt-1">{rev.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                لم يتلق هذا المتجر أي تقييمات من المشترين بعد. كن أول من يشتري ويضع رأيه الصادق!
              </div>
            )
          )}

          {activeTab === 'info' && (
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">الاسم الرسمي:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{profileUser.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">البريد الإلكتروني المعتمد:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{profileUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">تاريخ الانضمام للمنصة:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{profileUser.joinedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px]">مستوى الحساب:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-450">
                    {profileUser.isPremium ? 'عضوية متميزة (Premium Store)' : 'عضوية مجانية قياسية'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-850 text-[10px] text-slate-400 leading-relaxed">
                🛡️ فيلوريا هي شبكة اتصالات حرة مفتوحة مبنية بالكامل على الثقة والسمعة. للحفاظ على أمان معاملاتك، احرص على مراجعة التقييمات واطلب المعاينة اليدوية قبل الدفع، ولا تشارك معلومات حسابك السرية مع أي شخص يدعي كونه مشرفاً دون التحقق من شارته الرسمية.
              </div>

              {isOwnProfile && (
                <div className="pt-4 mt-2 border-t border-rose-500/15 space-y-2">
                  <span className="text-rose-500 block font-bold text-[10px]">إجراءات الحساب المتقدمة:</span>
                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="max-w-md">
                      <h4 className="font-bold text-[11px] text-rose-600 dark:text-rose-400">تعطيل وتجميد الحساب (Deactivate Account)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        بموجب قواعد النزاهة وحفظ الحقوق في VELORIA، لا يتم حذف الحسابات فوريّاً بل يتم وضعها في وضعية (تعطيل مؤقت). هذا يحافظ على سجل مبيعاتك، تقييماتك، والطلبات التاريخية لحين رغبتك بالعودة.
                      </p>
                    </div>
                    <button
                      onClick={handleDeactivateAccount}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-colors shrink-0"
                    >
                      تعطيل حسابي الآن
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}${window.location.pathname}?view=profile&storeId=${profileUser.id}`}
        title={`متجر متميز في فيلوريا: ${profileUser.name}`}
        description={`تصفح المنتجات اليدوية والحرفية الفريدة في متجر "${profileUser.name}" بدعم كامل وبلا عمولات.`}
      />
    </div>
  );
}
