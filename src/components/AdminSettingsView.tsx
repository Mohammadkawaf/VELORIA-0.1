import React, { useState } from 'react';
import { AppSettings } from '../types';
import { 
  Save, 
  Mail, 
  Phone, 
  Globe, 
  Clock, 
  Settings, 
  Info, 
  FileText, 
  Shield, 
  AlertTriangle, 
  Volume2, 
  Heart, 
  Megaphone, 
  Share2, 
  Activity, 
  CheckCircle,
  X,
  Upload,
  Image,
  Trash2
} from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AdminSettingsViewProps {
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export default function AdminSettingsView({
  appSettings,
  onSaveSettings
}: AdminSettingsViewProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoError(null);

    try {
      // 1. Compress the logo image
      const compressedFile = await compressImage(file);

      // 2. Read as data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const localDataUrl = reader.result as string;

        // 3. Try uploading to Supabase if configured, otherwise use base64
        if (supabase && isSupabaseConfigured) {
          try {
            const timestamp = Date.now();
            const filePath = `platform/logo-${timestamp}.webp`;

            const { data, error: uploadErr } = await supabase.storage
              .from('avatars')
              .upload(filePath, compressedFile, {
                contentType: 'image/webp',
                upsert: true,
              });

            if (uploadErr) {
              console.error('Error uploading logo to Supabase Storage:', uploadErr);
              let errorMsg = 'فشل تحميل الشعار إلى خادم Supabase.';
              if (uploadErr.message?.includes('Bucket not found') || uploadErr.message?.includes('bucket_id') || uploadErr.message?.includes('does not exist')) {
                errorMsg = 'مجلد التخزين "avatars" غير موجود في مشروع Supabase الخاص بك. يرجى تهيئة المجلد وتفعيل الوصول العام له لرفع الشعار.';
              } else {
                errorMsg = `فشل الرفع: ${uploadErr.message}`;
              }
              setLogoError(errorMsg);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

              setPlatformLogo(publicUrl);
            }
          } catch (supaErr: any) {
            console.error('Supabase upload exception for logo:', supaErr);
            let errorMsg = 'حدث خطأ أثناء الاتصال بخادم التخزين.';
            if (supaErr.message?.includes('Bucket not found') || supaErr.message?.includes('bucket_id') || supaErr.message?.includes('does not exist')) {
              errorMsg = 'مجلد التخزين "avatars" غير موجود في مشروع Supabase الخاص بك. يرجى تهيئة المجلد وتفعيل الوصول العام له لرفع الشعار.';
            } else {
              errorMsg = `خطأ في الاتصال: ${supaErr.message || supaErr}`;
            }
            setLogoError(errorMsg);
          }
        } else {
          setPlatformLogo(localDataUrl);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setLogoError('حدث خطأ أثناء تحميل الصورة من المعرض.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Local form states
  const [supportEmail, setSupportEmail] = useState(appSettings.supportEmail);
  const [whatsappNumber, setWhatsappNumber] = useState(appSettings.whatsappNumber);
  const [telegramLink, setTelegramLink] = useState(appSettings.telegramLink);
  const [facebookPage, setFacebookPage] = useState(appSettings.facebookPage);
  const [instagramPage, setInstagramPage] = useState(appSettings.instagramPage);
  const [websiteUrl, setWebsiteUrl] = useState(appSettings.websiteUrl);
  const [businessHours, setBusinessHours] = useState(appSettings.businessHours);
  const [supportWelcomeMessage, setSupportWelcomeMessage] = useState(appSettings.supportWelcomeMessage);

  const [platformName, setPlatformName] = useState(appSettings.platformName);
  const [platformLogo, setPlatformLogo] = useState(appSettings.platformLogo);
  const [platformDescription, setPlatformDescription] = useState(appSettings.platformDescription);
  const [currentVersion, setCurrentVersion] = useState(appSettings.currentVersion);
  const [copyrightText, setCopyrightText] = useState(appSettings.copyrightText);

  const [shamCashAccount, setShamCashAccount] = useState(appSettings.shamCashAccount);
  const [donationInstructions, setDonationInstructions] = useState(appSettings.donationInstructions);
  const [donationMessage, setDonationMessage] = useState(appSettings.donationMessage);
  const [donationEnabled, setDonationEnabled] = useState(appSettings.donationEnabled);

  const [privacyPolicy, setPrivacyPolicy] = useState(appSettings.privacyPolicy);
  const [termsOfUse, setTermsOfUse] = useState(appSettings.termsOfUse);
  const [disclaimer, setDisclaimer] = useState(appSettings.disclaimer);

  const [announcementEnabled, setAnnouncementEnabled] = useState(appSettings.announcementEnabled);
  const [announcementTitle, setAnnouncementTitle] = useState(appSettings.announcementTitle);
  const [announcementContent, setAnnouncementContent] = useState(appSettings.announcementContent);
  const [announcementColor, setAnnouncementColor] = useState(appSettings.announcementColor);
  const [announcementExpiry, setAnnouncementExpiry] = useState(appSettings.announcementExpiry);

  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState(appSettings.maintenanceModeEnabled);

  const [socialFacebook, setSocialFacebook] = useState(appSettings.socialFacebook);
  const [socialInstagram, setSocialInstagram] = useState(appSettings.socialInstagram);
  const [socialTelegram, setSocialTelegram] = useState(appSettings.socialTelegram);
  const [socialYoutube, setSocialYoutube] = useState(appSettings.socialYoutube);
  const [socialTiktok, setSocialTiktok] = useState(appSettings.socialTiktok);
  const [socialX, setSocialX] = useState(appSettings.socialX);

  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic Validation
    if (!platformName.trim()) {
      setValidationError('اسم المنصة مطلوب ولا يمكن تركه فارغاً.');
      return;
    }
    if (!supportEmail.trim() || !supportEmail.includes('@')) {
      setValidationError('يرجى إدخال بريد إلكتروني صالح للدعم الفني.');
      return;
    }

    const updatedSettings: AppSettings = {
      supportEmail: supportEmail.trim(),
      whatsappNumber: whatsappNumber.trim(),
      telegramLink: telegramLink.trim(),
      facebookPage: facebookPage.trim(),
      instagramPage: instagramPage.trim(),
      websiteUrl: websiteUrl.trim(),
      businessHours: businessHours.trim(),
      supportWelcomeMessage: supportWelcomeMessage.trim(),

      platformName: platformName.trim(),
      platformLogo: platformLogo.trim(),
      platformDescription: platformDescription.trim(),
      currentVersion: currentVersion.trim(),
      copyrightText: copyrightText.trim(),

      shamCashAccount: shamCashAccount.trim(),
      donationInstructions: donationInstructions.trim(),
      donationMessage: donationMessage.trim(),
      donationEnabled,

      privacyPolicy,
      termsOfUse,
      disclaimer,

      announcementEnabled,
      announcementTitle: announcementTitle.trim(),
      announcementContent: announcementContent.trim(),
      announcementColor,
      announcementExpiry: announcementExpiry.trim(),

      maintenanceModeEnabled,

      socialFacebook: socialFacebook.trim(),
      socialInstagram: socialInstagram.trim(),
      socialTelegram: socialTelegram.trim(),
      socialYoutube: socialYoutube.trim(),
      socialTiktok: socialTiktok.trim(),
      socialX: socialX.trim()
    };

    onSaveSettings(updatedSettings);
    setShowSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Tab Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 to-slate-800 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Settings className="w-56 h-56" />
        </div>
        <div className="flex items-center gap-3">
          <span className="p-2 bg-white/10 rounded-2xl text-xl">⚙️</span>
          <h2 className="text-xl md:text-2xl font-black">إعدادات المنصة والتحكم المركزي</h2>
        </div>
        <p className="text-xs md:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
          أهلاً بك في البوابة الإدارية للتحكم بالقيم والمعلومات التشغيلية لمنصة <strong>{platformName}</strong>. تتيح لك هذه الصفحة تعديل كافة قنوات التواصل، الحسابات المالية، الإعلانات، وضبط وضع الصيانة الفورية دون الحاجة لتغيير الكود المصدري للتطبيق.
        </p>
      </div>

      {showSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-scale-up">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>تم حفظ كافة إعدادات المنصة بنجاح وتعميم التغييرات على قاعدة البيانات الفورية! ✨</span>
        </div>
      )}

      {validationError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-scale-up">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* SECTION 1: MAINTENANCE & ANNOUNCEMENT (TOP PRIORITY) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Maintenance Mode Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-rose-500" />
              وضعية الصيانة الفنية الفورية
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              عند تفعيل وضعية الصيانة الفنية، سيتم إغلاق المنصة أمام الزوار والتجار العاديين وعرض صفحة تنبيه تفيد بالصيانة المؤقتة، مع إبقاء صلاحيات الوصول والتحكم الكاملة للإدارة ومديري النظام المعتمدين فقط.
            </p>
            
            <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-rose-600 block">تفعيل وضع الصيانة</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-400">إغلاق وتأمين النظام مؤقتاً</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={maintenanceModeEnabled} 
                  onChange={(e) => setMaintenanceModeEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-hidden rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>
          </div>

          {/* Slogan & Announcement Banner Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Megaphone className="w-4 h-4 text-amber-500" />
              شريط الإعلانات العام بالصفحة الرئيسية
            </h3>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عرض الإعلان العام</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={announcementEnabled} 
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-hidden rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">لون خلفية شريط الإعلان:</label>
                  <select
                    value={announcementColor}
                    onChange={(e) => setAnnouncementColor(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-bold"
                  >
                    <option value="amber">🟡 أصفر كهرماني (Amber)</option>
                    <option value="rose">🔴 أحمر دافئ (Rose)</option>
                    <option value="indigo">🔵 أزرق ملكي (Indigo)</option>
                    <option value="emerald">🟢 أخضر زمردي (Emerald)</option>
                    <option value="slate">⚫ رمادي كوني (Slate)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ انتهاء الصلاحية (اختياري):</label>
                  <input
                    type="date"
                    value={announcementExpiry}
                    onChange={(e) => setAnnouncementExpiry(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان التنبيه الرئيسي:</label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="مثال: تحديث أمني عام في سوق فيلوريا"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">محتوى وتفاصيل نص الإعلان:</label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="اكتب التنويه الكامل هنا للظهور بالرأس العلوي للصفحة الرئيسية للزوار..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PLATFORM IDENTITY & COPYRIGHTS */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-indigo-500" />
            الهوية البصرية والتعريف العام للمنصة
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">اسم المنصة الرسمي:</label>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">شعار المنصة (Platform Logo):</label>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-850 h-[42px] relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {platformLogo ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {platformLogo.startsWith('data:image/') || platformLogo.startsWith('http') || platformLogo.includes('/') ? (
                        <img 
                          src={platformLogo} 
                          alt="Logo Preview" 
                          className="w-8 h-8 object-contain rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="text-lg">{platformLogo}</span>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px] sm:max-w-[100px]">صورة الشعار</span>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        title="تغيير الصورة"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlatformLogo('🛍️')}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="استعادة الافتراضي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="w-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Image className="w-4 h-4" />
                    <span>{isUploadingLogo ? 'جاري التحميل...' : 'اختر صورة من المعرض'}</span>
                  </button>
                )}
              </div>
              {logoError && (
                <span className="text-[9px] text-rose-500 block mt-1">{logoError}</span>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رقم الإصدار البرمجي الحالي:</label>
              <input
                type="text"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">حقوق الملكية الفكرية وسطر الفوتر (Copyright Text):</label>
            <input
              type="text"
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">النبذة التعريفية للمنصة (Platform Description):</label>
            <textarea
              value={platformDescription}
              onChange={(e) => setPlatformDescription(e.target.value)}
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 3: CONTACT INFORMATION */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Mail className="w-4 h-4 text-emerald-500" />
            معلومات وقنوات الاتصال والدعم الفني
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">البريد الإلكتروني للدعم (Support Email):</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رقم الدعم واتساب (WhatsApp Support):</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رابط قناة/مجموعة تليجرام:</label>
              <input
                type="url"
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">صفحة فيسبوك الرسمية:</label>
              <input
                type="url"
                value={facebookPage}
                onChange={(e) => setFacebookPage(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">حساب إنستغرام الرسمي:</label>
              <input
                type="url"
                value={instagramPage}
                onChange={(e) => setInstagramPage(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رابط موقع الويب الخارجي:</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">ساعات وتوقيت تقديم الدعم الفني (Business Hours):</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رسالة الترحيب بمركز الدعم والاتصال:</label>
              <input
                type="text"
                value={supportWelcomeMessage}
                onChange={(e) => setSupportWelcomeMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-bold"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: SOCIAL MEDIA PROFILE LINKS */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Share2 className="w-4 h-4 text-sky-500" />
            روابط شبكات التواصل الاجتماعي للتطبيق
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">فيسبوك (Facebook Link):</label>
              <input
                type="url"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                dir="ltr"
                placeholder="https://facebook.com/..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">إنستغرام (Instagram Link):</label>
              <input
                type="url"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                dir="ltr"
                placeholder="https://instagram.com/..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">تليجرام (Telegram Channel):</label>
              <input
                type="url"
                value={socialTelegram}
                onChange={(e) => setSocialTelegram(e.target.value)}
                dir="ltr"
                placeholder="https://t.me/..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-left"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">يوتيوب (YouTube Channel):</label>
              <input
                type="url"
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                dir="ltr"
                placeholder="https://youtube.com/..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">تيك توك (TikTok Profile):</label>
              <input
                type="url"
                value={socialTiktok}
                onChange={(e) => setSocialTiktok(e.target.value)}
                dir="ltr"
                placeholder="https://tiktok.com/@..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">إكس / تويتر سابقاً (X Profile):</label>
              <input
                type="url"
                value={socialX}
                onChange={(e) => setSocialX(e.target.value)}
                dir="ltr"
                placeholder="https://x.com/..."
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono text-left"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: DONATION & CONTRIBUTIONS CONFIG */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
            إعدادات التبرع والمساهمات المالية
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">السماح بتلقي تبرعات ومساهمات الأعضاء</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={donationEnabled} 
                onChange={(e) => setDonationEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-hidden rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رقم حساب شام كاش (Sham Cash ID):</label>
              <input
                type="text"
                value={shamCashAccount}
                onChange={(e) => setShamCashAccount(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-mono font-bold text-left"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">رسالة التبرع التحفيزية (Donation Message):</label>
              <input
                type="text"
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">إرشادات التحويل وتأكيد التحويل (Instructions):</label>
            <textarea
              value={donationInstructions}
              onChange={(e) => setDonationInstructions(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-medium"
            />
          </div>
        </div>

        {/* SECTION 6: LEGAL PAGES DYNAMIC CONTENT */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            محتوى وتفاصيل الصفحات القانونية للمنصة
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">إخلاء المسؤولية المعتمد (Disclaimer):</label>
              <textarea
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
                rows={4}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-medium leading-relaxed"
                placeholder="اكتب بنود إخلاء المسؤولية القانوني..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">شروط الاستخدام والاتفاقيات الأمنية (Terms of Use):</label>
              <textarea
                value={termsOfUse}
                onChange={(e) => setTermsOfUse(e.target.value)}
                rows={5}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-medium leading-relaxed"
                placeholder="اكتب تفاصيل شروط الاستخدام للسوق والتجار والمشترين..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">سياسة حماية بيانات الخصوصية (Privacy Policy):</label>
              <textarea
                value={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.value)}
                rows={5}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 font-medium leading-relaxed"
                placeholder="اكتب تفاصيل سياسات الحفاظ على سرية وحماية بيانات الأعضاء..."
              />
            </div>
          </div>
        </div>

        {/* SAVE FORM ACTIONS ROW */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850/80 flex justify-start gap-3">
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl cursor-pointer flex items-center gap-2 transition-all shadow-md"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>حفظ كافة تعديلات الإعدادات والتعميم فوراً</span>
          </button>
        </div>
      </form>
    </div>
  );
}
