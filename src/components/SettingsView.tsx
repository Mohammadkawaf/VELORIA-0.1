import React, { useState } from 'react';
import { User } from '../types';
import { Settings, Shield, Bell, Moon, Sun, AlertTriangle, Key, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User | null;
  onUpdateProfile: (user: User) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function SettingsView({
  currentUser,
  onUpdateProfile,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}: SettingsViewProps) {
  // Local Settings States
  const [systemAlerts, setSystemAlerts] = useState(() => {
    return localStorage.getItem('veloria-settings-systemAlerts') !== 'false';
  });
  const [orderUpdates, setOrderUpdates] = useState(() => {
    return localStorage.getItem('veloria-settings-orderUpdates') !== 'false';
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('veloria-settings-email') === 'true';
  });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Toggle handlers
  const handleToggleSystemAlerts = () => {
    const newVal = !systemAlerts;
    setSystemAlerts(newVal);
    localStorage.setItem('veloria-settings-systemAlerts', String(newVal));
  };

  const handleToggleOrderUpdates = () => {
    const newVal = !orderUpdates;
    setOrderUpdates(newVal);
    localStorage.setItem('veloria-settings-orderUpdates', String(newVal));
  };

  const handleToggleEmail = () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    localStorage.setItem('veloria-settings-email', String(newVal));
  };

  // Password change simulation
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ text: 'يرجى ملء كافة حقول كلمة المرور.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور.', isError: true });
      return;
    }

    setPasswordMessage({ text: 'تم تحديث كلمة المرور الخاصة بك بنجاح! 🔐', isError: false });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 4000);
  };

  // Account Self-Deactivation
  const handleDeactivate = () => {
    if (!currentUser) return;
    
    // Update profile status to deactivated
    const deactivatedUser: User = {
      ...currentUser,
      status: 'deactivated'
    };

    // Callback to update state
    onUpdateProfile(deactivatedUser);

    setSuccessMsg('تم تعطيل حسابك ذاتياً بنجاح. سنقوم بتسجيل خروجك الآن...');
    
    // Logout after a small delay
    setTimeout(() => {
      onLogout();
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto my-6 p-4 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm font-sans text-right space-y-8">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <span className="text-[10px] text-slate-400 font-bold">VELORIA V1 — الإعدادات</span>
        <h2 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
          إعدادات المنصة والحساب
          <Settings className="w-5 h-5 text-[#D4A017]" />
        </h2>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-pulse">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Appearance Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-[#D4A017] flex items-center gap-2 justify-end">
          مظهر المنصة والوضع الليلي
          <Sun className="w-4 h-4" />
        </h3>
        
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between gap-4">
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>الوضع المضيء</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-500" />
                <span>الوضع الداكن</span>
              </>
            )}
          </button>
          
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">الوضع الليلي (Dark Mode)</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-400">تسهيل القراءة وتخفيف إجهاد العين في بيئات الإضاءة المنخفضة.</p>
          </div>
        </div>
      </div>

      {/* 2. Notifications Config Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-[#D4A017] flex items-center gap-2 justify-end">
          تفضيلات الإشعارات والتنبيهات
          <Bell className="w-4 h-4" />
        </h3>

        <div className="space-y-3">
          {/* Item 1 */}
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemAlerts}
                onChange={handleToggleSystemAlerts}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-[#D4A017]"></div>
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">إشعارات النظام العامة 🛡️</h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-400">الحصول على تنبيهات الأمان، الترقيات، وتنبيهات الإدارة مباشرة.</p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={orderUpdates}
                onChange={handleToggleOrderUpdates}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-[#D4A017]"></div>
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">تحديثات الطلبات والمراسلات 🛍️</h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-400">تنبيهك فوراً عند ورود طلب شراء جديد أو رسالة دردشة من أحد العملاء.</p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
            <div className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={handleToggleEmail}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-[#D4A017]"></div>
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">البريد الإلكتروني الدوري 📧</h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-400">استلام ملخصات أسبوعية بالمنتجات الأكثر مبيعاً ونشاط المتاجر.</p>
            </div>
          </div>
        </div>
      </div>

      {currentUser ? (
        <>
          {/* 3. Password / Account Security */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#D4A017] flex items-center gap-2 justify-end">
              أمان الحساب وكلمة المرور
              <Key className="w-4 h-4" />
            </h3>

            <form onSubmit={handlePasswordChange} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
              {passwordMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-bold ${
                  passwordMessage.isError 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15' 
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-550 dark:text-slate-400">تأكيد كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right focus:outline-hidden focus:border-[#D4A017]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-550 dark:text-slate-400">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right focus:outline-hidden focus:border-[#D4A017]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-550 dark:text-slate-400">كلمة المرور الحالية</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right focus:outline-hidden focus:border-[#D4A017]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all border border-slate-800"
                >
                  حفظ كلمة المرور الجديدة 🔐
                </button>
              </div>
            </form>
          </div>

          {/* 4. Danger Zone - Account Self Deactivation */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-rose-500 flex items-center gap-2 justify-end">
              منطقة الخطر وإيقاف الحساب
              <AlertTriangle className="w-4 h-4" />
            </h3>

            <div className="p-6 rounded-2xl border border-rose-500/15 bg-rose-500/5 space-y-4 text-right">
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400">تعطيل الحساب ذاتياً (Self-Deactivation)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  عند تعطيل حسابك ذاتياً، سيتم إخفاء متجرك وإعلاناتك مؤقتاً من السوق العام، ولن تتمكن من تسجيل الدخول أو استقبال طلبات شراء جديدة. يمكنك دائماً التوجه للإدارة أو المشرفين لطلب إعادة التنشيط والتحقق من حسابك لاحقاً عند رغبتك في العودة.
                </p>
              </div>

              {deactivateConfirm ? (
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-rose-500/20 space-y-3.5">
                  <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                    ⚠️ هل أنت متأكد تماماً من رغبتك في تعطيل حسابك والانسحاب المؤقت من المنصة؟
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setDeactivateConfirm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      تراجع وإلغاء ❌
                    </button>
                    <button
                      type="button"
                      onClick={handleDeactivate}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs"
                    >
                      تأكيد تعطيل حسابي ⚠️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDeactivateConfirm(true)}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>تعطيل حسابي الآن</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-450 text-xs">
          <span>يرجى تسجيل الدخول للوصول إلى إعدادات الحساب والأمان والتعطيل الذاتي.</span>
        </div>
      )}
    </div>
  );
}
