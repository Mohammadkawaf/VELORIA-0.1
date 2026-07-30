import React, { useState, useEffect } from 'react';
import { AppSettings, User, MaintenanceLog, AnnouncementLog } from '../types';
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
  Trash2,
  Loader2,
  Eye,
  Wrench,
  Calendar,
  UserCheck
} from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { isSupabaseConfigured, supabase, supabaseService } from '../lib/supabase';

interface AdminSettingsViewProps {
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  currentUser?: User;
}

export default function AdminSettingsView({
  appSettings,
  onSaveSettings,
  currentUser
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
  const [maintenanceReason, setMaintenanceReason] = useState(
    appSettings.maintenanceReason || 'يتم حالياً إجراء تحديثات على الخوادم وتحسين أداء المنصة...'
  );
  const [maintenanceReturnTime, setMaintenanceReturnTime] = useState(
    appSettings.maintenanceReturnTime || 'خلال ساعتين'
  );
  const [showFullMaintenancePreview, setShowFullMaintenancePreview] = useState(false);

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState<boolean | null>(null);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Maintenance & Announcement History States
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [announcementLogs, setAnnouncementLogs] = useState<AnnouncementLog[]>([]);
  const [showClearMaintConfirm, setShowClearMaintConfirm] = useState(false);
  const [showClearAnnConfirm, setShowClearAnnConfirm] = useState(false);
  const [isDeletingMaintLog, setIsDeletingMaintLog] = useState<string | null>(null);
  const [isDeletingAnnLog, setIsDeletingAnnLog] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadSettingsAndLogsFromDb = async () => {
      try {
        const fetched = await supabaseService.getAppSettings();
        if (isMounted && fetched) {
          setMaintenanceModeEnabled(fetched.maintenanceModeEnabled ?? false);
          if (fetched.maintenanceReason) setMaintenanceReason(fetched.maintenanceReason);
          if (fetched.maintenanceReturnTime) setMaintenanceReturnTime(fetched.maintenanceReturnTime);
          setAnnouncementEnabled(fetched.announcementEnabled ?? false);
          if (fetched.announcementContent) setAnnouncementContent(fetched.announcementContent);
          if (fetched.announcementTitle) setAnnouncementTitle(fetched.announcementTitle);

          if (fetched.platformName) setPlatformName(fetched.platformName);
          if (fetched.platformLogo) setPlatformLogo(fetched.platformLogo);
          if (fetched.platformDescription) setPlatformDescription(fetched.platformDescription);
          if (fetched.currentVersion) setCurrentVersion(fetched.currentVersion);
          if (fetched.copyrightText) setCopyrightText(fetched.copyrightText);
          if (fetched.websiteUrl) setWebsiteUrl(fetched.websiteUrl);

          if (fetched.donationShamCashId || fetched.shamCashAccount) {
            setShamCashAccount(fetched.donationShamCashId || fetched.shamCashAccount);
          }
          if (fetched.donationInstructions) setDonationInstructions(fetched.donationInstructions);
          if (fetched.donationMessage) setDonationMessage(fetched.donationMessage);
          if (fetched.donationEnabled !== undefined) setDonationEnabled(fetched.donationEnabled);

          if (fetched.privacyPolicy) setPrivacyPolicy(fetched.privacyPolicy);
          if (fetched.termsOfUse) setTermsOfUse(fetched.termsOfUse);
          if (fetched.disclaimerText || fetched.disclaimer) {
            setDisclaimer(fetched.disclaimerText || fetched.disclaimer);
          }
        }

        const maintHistory = await supabaseService.getMaintenanceLogs();
        if (isMounted) setMaintenanceLogs(maintHistory);

        const annHistory = await supabaseService.getAnnouncementLogs();
        if (isMounted) setAnnouncementLogs(annHistory);
      } catch (err) {
        console.warn('Failed to load application_settings or logs on mount:', err);
      }
    };
    loadSettingsAndLogsFromDb();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setMaintenanceModeEnabled(appSettings.maintenanceModeEnabled);
    if (appSettings.maintenanceReason) setMaintenanceReason(appSettings.maintenanceReason);
    if (appSettings.maintenanceReturnTime) setMaintenanceReturnTime(appSettings.maintenanceReturnTime);
    if (appSettings.platformName) setPlatformName(appSettings.platformName);
    if (appSettings.platformLogo) setPlatformLogo(appSettings.platformLogo);
    if (appSettings.platformDescription) setPlatformDescription(appSettings.platformDescription);
    if (appSettings.currentVersion) setCurrentVersion(appSettings.currentVersion);
    if (appSettings.copyrightText) setCopyrightText(appSettings.copyrightText);
    if (appSettings.websiteUrl) setWebsiteUrl(appSettings.websiteUrl);

    if (appSettings.donationShamCashId || appSettings.shamCashAccount) {
      setShamCashAccount(appSettings.donationShamCashId || appSettings.shamCashAccount);
    }
    if (appSettings.donationInstructions) setDonationInstructions(appSettings.donationInstructions);
    if (appSettings.donationMessage) setDonationMessage(appSettings.donationMessage);
    if (appSettings.donationEnabled !== undefined) setDonationEnabled(appSettings.donationEnabled);

    if (appSettings.privacyPolicy) setPrivacyPolicy(appSettings.privacyPolicy);
    if (appSettings.termsOfUse) setTermsOfUse(appSettings.termsOfUse);
    if (appSettings.disclaimerText || appSettings.disclaimer) {
      setDisclaimer(appSettings.disclaimerText || appSettings.disclaimer);
    }
  }, [appSettings]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleOpenMaintenanceModal = (targetState: boolean) => {
    if (isSavingMaintenance) return;
    setPendingMaintenanceState(targetState);
    setShowMaintenanceModal(true);
  };

  const handleConfirmMaintenanceChange = async () => {
    if (pendingMaintenanceState === null || isSavingMaintenance) return;
    setIsSavingMaintenance(true);
    try {
      const newMaintenanceValue = pendingMaintenanceState;
      setMaintenanceModeEnabled(newMaintenanceValue);

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
        donationShamCashId: shamCashAccount.trim(),
        donationInstructions: donationInstructions.trim(),
        donationMessage: donationMessage.trim(),
        donationEnabled,

        privacyPolicy,
        termsOfUse,
        disclaimer,
        disclaimerText: disclaimer,

        announcementEnabled,
        announcementTitle: announcementTitle.trim(),
        announcementContent: announcementContent.trim(),
        announcementColor,
        announcementExpiry: announcementExpiry.trim(),

        maintenanceModeEnabled: newMaintenanceValue,
        maintenanceReason: maintenanceReason.trim(),
        maintenanceReturnTime: maintenanceReturnTime,

        socialFacebook: socialFacebook.trim(),
        socialInstagram: socialInstagram.trim(),
        socialTelegram: socialTelegram.trim(),
        socialYoutube: socialYoutube.trim(),
        socialTiktok: socialTiktok.trim(),
        socialX: socialX.trim()
      };

      await onSaveSettings(updatedSettings);

      // Save new log entry to maintenance_history in DB
      try {
        const createdLog = await supabaseService.addMaintenanceLog({
          adminName: currentUser?.name || 'المدير العام',
          actionType: newMaintenanceValue ? 'تفعيل' : 'إلغاء',
          reason: maintenanceReason.trim() || (newMaintenanceValue ? 'تم تفعيل الصيانة' : 'تم إلغاء الصيانة'),
          returnTime: newMaintenanceValue ? maintenanceReturnTime : undefined,
          createdAt: new Date().toISOString()
        });
        setMaintenanceLogs(prev => [createdLog, ...prev]);
      } catch (logErr) {
        console.warn('Failed to add maintenance log:', logErr);
      }

      setShowMaintenanceModal(false);
      setPendingMaintenanceState(null);
      showToast('تم تحديث حالة الصيانة وتسجيل العملية في السجل بنجاح.', 'success');
    } catch (err: any) {
      console.error('Error saving maintenance setting:', err);
      showToast(err?.message || 'حدث خطأ أثناء حفظ حالة الصيانة.', 'error');
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleDeleteMaintenanceLog = async (id: string) => {
    setIsDeletingMaintLog(id);
    try {
      await supabaseService.deleteMaintenanceLog(id);
      setMaintenanceLogs(prev => prev.filter(l => l.id !== id));
      showToast('تم حذف سجل الصيانة بنجاح.', 'success');
    } catch (err) {
      showToast('فشل حذف سجل الصيانة.', 'error');
    } finally {
      setIsDeletingMaintLog(null);
    }
  };

  const handleClearAllMaintenanceLogs = async () => {
    try {
      await supabaseService.clearMaintenanceLogs();
      setMaintenanceLogs([]);
      setShowClearMaintConfirm(false);
      showToast('تم مسح جميع سجلات الصيانة بنجاح.', 'success');
    } catch (err) {
      showToast('فشل مسح جميع سجلات الصيانة.', 'error');
    }
  };

  const handleDeleteAnnouncementLog = async (id: string) => {
    setIsDeletingAnnLog(id);
    try {
      await supabaseService.deleteAnnouncementLog(id);
      setAnnouncementLogs(prev => prev.filter(l => l.id !== id));
      showToast('تم حذف سجل الإعلان بنجاح.', 'success');
    } catch (err) {
      showToast('فشل حذف سجل الإعلان.', 'error');
    } finally {
      setIsDeletingAnnLog(null);
    }
  };

  const handleClearAllAnnouncementLogs = async () => {
    try {
      await supabaseService.clearAnnouncementLogs();
      setAnnouncementLogs([]);
      setShowClearAnnConfirm(false);
      showToast('تم مسح جميع سجلات الإعلانات بنجاح.', 'success');
    } catch (err) {
      showToast('فشل مسح جميع سجلات الإعلانات.', 'error');
    }
  };

  const [socialFacebook, setSocialFacebook] = useState(appSettings.socialFacebook);
  const [socialInstagram, setSocialInstagram] = useState(appSettings.socialInstagram);
  const [socialTelegram, setSocialTelegram] = useState(appSettings.socialTelegram);
  const [socialYoutube, setSocialYoutube] = useState(appSettings.socialYoutube);
  const [socialTiktok, setSocialTiktok] = useState(appSettings.socialTiktok);
  const [socialX, setSocialX] = useState(appSettings.socialX);

  const [showSuccess, setShowSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
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
      donationShamCashId: shamCashAccount.trim(),
      donationInstructions: donationInstructions.trim(),
      donationMessage: donationMessage.trim(),
      donationEnabled,

      privacyPolicy,
      termsOfUse,
      disclaimer,
      disclaimerText: disclaimer,

      announcementEnabled,
      announcementTitle: announcementTitle.trim(),
      announcementContent: announcementContent.trim(),
      announcementColor,
      announcementExpiry: announcementExpiry.trim(),

      maintenanceModeEnabled,
      maintenanceReason: maintenanceReason.trim(),
      maintenanceReturnTime: maintenanceReturnTime,

      socialFacebook: socialFacebook.trim(),
      socialInstagram: socialInstagram.trim(),
      socialTelegram: socialTelegram.trim(),
      socialYoutube: socialYoutube.trim(),
      socialTiktok: socialTiktok.trim(),
      socialX: socialX.trim()
    };

    await onSaveSettings(updatedSettings);

    // Add new log to Announcement History in DB
    try {
      const createdAnnLog = await supabaseService.addAnnouncementLog({
        adminName: currentUser?.name || 'المدير العام',
        title: announcementTitle.trim() || 'تحديث الإعلان العام',
        content: announcementContent.trim() || 'بدون محتوى',
        enabled: announcementEnabled,
        color: announcementColor,
        createdAt: new Date().toISOString()
      });

      setAnnouncementLogs(prev => [createdAnnLog, ...prev]);
    } catch (logErr) {
      console.warn('Failed to add announcement log:', logErr);
    }

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
          <div className={`p-6 rounded-3xl border transition-all duration-300 shadow-xs space-y-4 ${
            maintenanceModeEnabled
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50'
              : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800'
          }`}>
            {/* Warning Banner when Maintenance Mode is Active */}
            {maintenanceModeEnabled && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center gap-2">
                <span>⚠️ وضع الصيانة مفعل حالياً</span>
              </div>
            )}

            <h3 className={`font-extrabold text-sm flex items-center gap-2 border-b pb-3 ${
              maintenanceModeEnabled
                ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                : 'text-slate-850 dark:text-white border-slate-100 dark:border-slate-800'
            }`}>
              <Activity className={`w-4 h-4 ${maintenanceModeEnabled ? 'text-rose-500' : 'text-slate-500'}`} />
              وضعية الصيانة الفنية الفورية
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {maintenanceModeEnabled ? (
                'عند تفعيل وضعية الصيانة الفنية، سيتم إغلاق المنصة أمام الزوار والتجار العاديين وعرض صفحة تنبيه تفيد بالصيانة المؤقتة، مع إبقاء صلاحيات الوصول والتحكم الكاملة للإدارة ومديري النظام المعتمدين فقط.'
              ) : (
                'المنصة تعمل بشكل طبيعي.'
              )}
            </p>
            
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
              maintenanceModeEnabled
                ? 'border-rose-500/30 bg-rose-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
            }`}>
              <div className="space-y-0.5">
                <span className={`text-xs font-black block ${
                  maintenanceModeEnabled ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'
                }`}>
                  {maintenanceModeEnabled ? 'وضع الصيانة مفعّل' : 'تفعيل وضع الصيانة'}
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">
                  {maintenanceModeEnabled ? 'المنصة مغلقة مؤقتاً أمام الزوار' : 'إغلاق وتأمين النظام مؤقتاً'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSavingMaintenance && (
                  <Loader2 className={`w-4 h-4 animate-spin ${maintenanceModeEnabled ? 'text-rose-500' : 'text-indigo-500'}`} />
                )}

                <label className={`relative inline-flex items-center ${isSavingMaintenance ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input 
                    type="checkbox" 
                    checked={maintenanceModeEnabled} 
                    disabled={isSavingMaintenance}
                    onChange={(e) => handleOpenMaintenanceModal(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-hidden rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>
            </div>

            {/* Maintenance Mode Fields & Live Preview Section */}
            <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 space-y-4">
              {/* 1. سبب الصيانة */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>سبب الصيانة</span>
                </label>
                <textarea
                  rows={3}
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder={`مثال:\nيتم حالياً إجراء تحديثات على الخوادم وتحسين أداء المنصة...`}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium leading-relaxed resize-y"
                />
              </div>

              {/* 2. وقت العودة المتوقع */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>وقت العودة المتوقع</span>
                </label>
                <select
                  value={maintenanceReturnTime}
                  onChange={(e) => setMaintenanceReturnTime(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-hidden text-slate-800 dark:text-slate-100 font-bold cursor-pointer"
                >
                  <option value="خلال 30 دقيقة">خلال 30 دقيقة</option>
                  <option value="خلال ساعة">خلال ساعة</option>
                  <option value="خلال ساعتين">خلال ساعتين</option>
                  <option value="اليوم">اليوم</option>
                  <option value="غداً">غداً</option>
                  <option value="خلال أسبوع">خلال أسبوع</option>
                  <option value="غير محدد">غير محدد</option>
                </select>
              </div>

              {/* 3. معاينة رسالة الصيانة (Live Preview Card) */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>معاينة رسالة الصيانة</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2.5 text-xs font-sans">
                  <div className="font-black text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5">
                    <span>🔧</span>
                    <span>المنصة تحت الصيانة</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    <span className="text-slate-400 font-bold">سبب الصيانة: </span>
                    <span>{maintenanceReason.trim() || 'يتم حالياً إجراء تحديثات على الخوادم وتحسين أداء المنصة...'}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-slate-400 font-bold">العودة المتوقعة: </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{maintenanceReturnTime}</span>
                  </div>
                  <div className="text-slate-450 dark:text-slate-400 text-[10px] pt-1 border-t border-amber-500/15">
                    شكراً لتفهمكم.
                  </div>
                </div>
              </div>

              {/* 4. Full Page Maintenance Preview Button */}
              <button
                type="button"
                onClick={() => setShowFullMaintenancePreview(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-2xs active:scale-[0.99]"
              >
                <Eye className="w-4 h-4 text-amber-500" />
                <span>معاينة صفحة الصيانة</span>
              </button>

              {/* 5. SECTION: سجل الصيانة (Maintenance History) */}
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>سجل الصيانة</span>
                    <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      ({maintenanceLogs.length})
                    </span>
                  </div>

                  {maintenanceLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClearMaintConfirm(true)}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>مسح جميع السجلات</span>
                    </button>
                  )}
                </div>

                {maintenanceLogs.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-850 text-slate-400 text-xs">
                    لا توجد سجلات صيانة سابقة حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pl-1">
                    {maintenanceLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 space-y-2 text-xs relative group transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-150 dark:border-slate-850/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              log.actionType === 'تفعيل'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {log.actionType === 'تفعيل' ? '🔴 تفعيل الصيانة' : '🟢 إلغاء الصيانة'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span>المدير:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{log.adminName}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {new Date(log.createdAt).toLocaleString('ar-SA', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteMaintenanceLog(log.id)}
                              disabled={isDeletingMaintLog === log.id}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="حذف السجل"
                            >
                              {isDeletingMaintLog === log.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          <span className="text-slate-400 font-bold">سبب الصيانة: </span>
                          <span>{log.reason || 'بدون سبب مذكور'}</span>
                        </div>

                        {log.returnTime && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>وقت العودة المتوقع: {log.returnTime}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

              {/* 1. Live Preview Card (المعاينة المباشرة) */}
              <div className="space-y-2 pt-3 border-t border-slate-150 dark:border-slate-850">
                <div className="text-[11px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-500" />
                    <span>معاينة مباشرة (المظهر الفعلي بالصفحة الرئيسية)</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    announcementEnabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {announcementEnabled ? 'مفعل للزوار' : 'معطل'}
                  </span>
                </div>

                {/* Live Banner Preview Box */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-xs ${
                  announcementColor === 'rose'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : announcementColor === 'indigo'
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : announcementColor === 'emerald'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : announcementColor === 'slate'
                    ? 'bg-slate-800 text-white border-slate-700'
                    : 'bg-amber-500 text-slate-950 border-amber-600'
                }`}>
                  <div className="flex items-start gap-3 text-right" dir="rtl">
                    <div className="p-2 bg-black/10 rounded-xl shrink-0 mt-0.5">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-extrabold text-xs leading-snug">
                        {announcementTitle.trim() || 'عنوان التنبيه الرئيسي هنا...'}
                      </h4>
                      <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                        {announcementContent.trim() || 'تفاصيل ومحتوى نص الإعلان سيظهر هنا للزوار مباشرة أثناء الكتابة...'}
                      </p>
                      {announcementExpiry && (
                        <span className="inline-block text-[9px] bg-black/15 px-2 py-0.5 rounded font-mono mt-1">
                          ينتهي بتاريخ: {announcementExpiry}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Announcement History Section (سجل الإعلانات) */}
              <div className="space-y-3 pt-3 border-t border-slate-150 dark:border-slate-850">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-amber-500" />
                    <span>سجل الإعلانات</span>
                    <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      ({announcementLogs.length})
                    </span>
                  </div>

                  {announcementLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClearAnnConfirm(true)}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>مسح جميع السجلات</span>
                    </button>
                  )}
                </div>

                {announcementLogs.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-850 text-slate-400 text-xs">
                    لا توجد إعلانات منشورة سابقاً في السجل.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pl-1">
                    {announcementLogs.map((log) => {
                      const colorLabels: Record<string, string> = {
                        amber: '🟡 أصفر',
                        rose: '🔴 أحمر',
                        indigo: '🔵 أزرق',
                        emerald: '🟢 أخضر',
                        slate: '⚫ رمادي'
                      };
                      return (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-850 space-y-2 text-xs relative group transition-all"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-150 dark:border-slate-850/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                log.enabled
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {log.enabled ? 'مفعل' : 'معطل'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {colorLabels[log.color] || log.color}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                الناشر: <strong className="text-slate-800 dark:text-slate-200">{log.adminName}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                {new Date(log.createdAt).toLocaleString('ar-SA', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncementLog(log.id)}
                                disabled={isDeletingAnnLog === log.id}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="حذف السجل"
                              >
                                {isDeletingAnnLog === log.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="font-bold text-slate-850 dark:text-white text-xs">
                            {log.title}
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {log.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* Full Page Maintenance Preview Modal */}
      {showFullMaintenancePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
            {/* Background Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500"></div>

            {/* Close Icon Button */}
            <button
              type="button"
              onClick={() => setShowFullMaintenancePreview(false)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Wrench Badge */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center text-3xl shadow-xs">
              🔧
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <span>المنصة تحت الصيانة</span>
              </h2>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                نعمل حالياً على تحسين المنصة وسنعود للعمل بأقرب وقت.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850/80 space-y-3.5 text-right text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">سبب الصيانة:</span>
                <p className="text-slate-700 dark:text-slate-200 font-bold leading-relaxed whitespace-pre-line">
                  {maintenanceReason.trim() || 'يتم حالياً إجراء تحديثات على الخوادم وتحسين أداء المنصة...'}
                </p>
              </div>

              <div className="border-t border-slate-200/60 dark:border-slate-800 pt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">وقت العودة المتوقع:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                  {maintenanceReturnTime}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              شكراً لتفهمكم وصبركم معنا 🙏
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <button
                type="button"
                onClick={() => setShowFullMaintenancePreview(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Maintenance Mode */}
      {showMaintenanceModal && pendingMaintenanceState !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-right font-sans">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className={`p-3 rounded-2xl shrink-0 ${
                pendingMaintenanceState 
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-500' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500'
              }`}>
                {pendingMaintenanceState ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-850 dark:text-white">
                  {pendingMaintenanceState ? 'تأكيد تفعيل وضع الصيانة' : 'تأكيد إنهاء وضع الصيانة'}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">تنبيه إداري هام</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
              {pendingMaintenanceState ? (
                'سيتم إيقاف المنصة مؤقتاً لجميع الزوار والتجار، مع بقاء وصول الإدارة والمشرفين فقط.\nهل تريد المتابعة؟'
              ) : (
                'سيتم إعادة فتح المنصة لجميع المستخدمين.\nهل تريد المتابعة؟'
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSavingMaintenance}
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setPendingMaintenanceState(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSavingMaintenance}
                onClick={handleConfirmMaintenanceChange}
                className={`px-5 py-2.5 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                  pendingMaintenanceState
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSavingMaintenance ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{pendingMaintenanceState ? 'تفعيل' : 'إعادة التشغيل'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation for clearing all maintenance logs */}
      {showClearMaintConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-500/20 shadow-2xl max-w-md w-full p-6 text-right font-sans" dir="rtl">
            <h3 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>تأكيد مسح جميع سجلات الصيانة</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              هل أنت متأكد من مسح جميع سجلات عمليات الصيانة السابقة من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
            </p>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClearAllMaintenanceLogs}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                نعم، مسح جميع السجلات
              </button>
              <button
                type="button"
                onClick={() => setShowClearMaintConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation for clearing all announcement logs */}
      {showClearAnnConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-500/20 shadow-2xl max-w-md w-full p-6 text-right font-sans" dir="rtl">
            <h3 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>تأكيد مسح جميع سجلات الإعلانات</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              هل أنت متأكد من مسح جميع سجلات الإعلانات المنشورة سابقاً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
            </p>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClearAllAnnouncementLogs}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                نعم، مسح جميع السجلات
              </button>
              <button
                type="button"
                onClick={() => setShowClearAnnConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button 
            type="button"
            onClick={() => setToast(null)} 
            className="mr-2 opacity-80 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
