import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Check, X, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ResetPasswordViewProps {
  onComplete: () => void;
  onNavigateToLogin: () => void;
}

export default function ResetPasswordView({ onComplete, onNavigateToLogin }: ResetPasswordViewProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password criteria states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);

  useEffect(() => {
    setHasMinLength(newPassword.length >= 8);
    setHasUppercase(/[A-Z]/.test(newPassword));
    setHasLowercase(/[a-z]/.test(newPassword));
    setHasNumber(/[0-9]/.test(newPassword));
    setHasSpecial(/[^A-Za-z0-9]/.test(newPassword));
  }, [newPassword]);

  const getStrengthScore = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    return score;
  };

  const score = getStrengthScore();
  const isPasswordMatching = newPassword && newPassword === confirmPassword;
  const isStrengthValid = score >= 4; // Requires at least 4 criteria met

  const getStrengthLabel = () => {
    if (!newPassword) return '';
    if (score <= 2) return 'ضعيفة ⚠️';
    if (score <= 4) return 'متوسطة 🛡️';
    return 'قوية جداً 🔥';
  };

  const getStrengthColor = () => {
    if (score <= 2) return 'bg-rose-500';
    if (score <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('الرجاء تعبئة جميع الحقول.');
      return;
    }

    if (!isPasswordMatching) {
      setErrorMessage('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (score < 3) {
      setErrorMessage('كلمة المرور ضعيفة جداً. الرجاء استيفاء الشروط المطلوبة لضمان أمان حسابك.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('خادم Supabase غير متصل حالياً للقيام بهذه العملية.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(error.message || 'حدث خطأ أثناء تحديث كلمة المرور.');
      } else {
        setSuccessMessage('تم تغيير كلمة المرور بنجاح.');
        setTimeout(() => {
          onComplete();
        }, 2500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء تغيير كلمة المرور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-lg font-sans rtl text-right">
      <div className="text-center space-y-2 mb-6">
        <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
          VELORIA
        </span>
        <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100">
          إعادة تعيين كلمة المرور الجديدة
        </h2>
        <p className="text-[11px] text-slate-400">
          قم بإنشاء كلمة مرور قوية وجديدة لحماية حسابك واستعادة الوصول الكامل للمنصة.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl text-center flex items-center gap-2 justify-center">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl text-center flex flex-col items-center gap-2 justify-center leading-relaxed font-bold">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
          <span>{successMessage}</span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-1">جاري توجيهك الآن...</span>
        </div>
      )}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">كلمة المرور الجديدة:</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pr-4 pl-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 focus:outline-hidden focus:border-amber-500 transition-colors text-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength meter */}
          {newPassword && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-850">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">قوة كلمة المرور:</span>
                <span className={`text-xs ${score <= 2 ? 'text-rose-500' : score <= 4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {getStrengthLabel()}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`h-full flex-1 transition-all duration-300 ${
                      idx <= score ? getStrengthColor() : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[9px] font-medium text-slate-400">
                <div className="flex items-center gap-1.5">
                  {hasMinLength ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : ''}>8 أحرف على الأقل</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasUppercase ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={hasUppercase ? 'text-emerald-600 dark:text-emerald-400' : ''}>حرف كبير [A-Z]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasLowercase ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={hasLowercase ? 'text-emerald-600 dark:text-emerald-400' : ''}>حرف صغير [a-z]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasNumber ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400' : ''}>رقم واحد على الأقل</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  {hasSpecial ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={hasSpecial ? 'text-emerald-600 dark:text-emerald-400' : ''}>رمز خاص واحد على الأقل (مثال: @#$!)</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">تأكيد كلمة المرور الجديدة:</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pr-4 pl-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 focus:outline-hidden focus:border-amber-500 transition-colors text-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && (
              <div className="mt-1 text-[10px] font-bold text-right">
                {isPasswordMatching ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                    <span>كلمتا المرور متطابقتان</span>
                    <Check className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1 justify-end">
                    <span>كلمتا المرور غير متطابقتين</span>
                    <X className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Change Password Button */}
          <button
            type="submit"
            disabled={isLoading || !isPasswordMatching || score < 3}
            className={`w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>جاري تحديث كلمة المرور...</span>
              </span>
            ) : (
              <span>تغيير كلمة المرور</span>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-4 border-t border-slate-150 dark:border-slate-800/60 mt-4">
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center gap-1.5 justify-center mx-auto"
        >
          <span>العودة لصفحة تسجيل الدخول</span>
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
