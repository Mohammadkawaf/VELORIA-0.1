import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, Key, Mail, Sparkles, Check, HelpCircle } from 'lucide-react';
import { supabaseService, isSupabaseConfigured } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

export default function LoginView({ onLogin, onNavigateToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage('');
    setResetSuccessMessage('');

    if (!forgotEmail) {
      setResetErrorMessage('الرجاء إدخال البريد الإلكتروني.');
      return;
    }

    if (isSupabaseConfigured) {
      setIsResetLoading(true);
      try {
        const { error } = await supabaseService.resetPassword(forgotEmail.trim());
        if (error) {
          setResetErrorMessage(error.message || 'حدث خطأ أثناء محاولة إرسال رابط إعادة التعيين.');
        } else {
          setResetSuccessMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى التحقق من بريدك الإلكتروني.');
        }
      } catch (err: any) {
        setResetErrorMessage(err.message || 'حدث خطأ غير متوقع.');
      } finally {
        setIsResetLoading(false);
      }
    } else {
      setResetErrorMessage('نظام Supabase غير متصل حالياً للقيام بهذه العملية.');
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    if (isSupabaseConfigured) {
      setIsLoading(true);
      try {
        const { user, error } = await supabaseService.signIn(email, password);
        if (error) {
          setErrorMessage(error.message || 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
          setIsLoading(false);
          return;
        }
        if (user) {
          onLogin(user);
        } else {
          setErrorMessage('فشل تسجيل الدخول: لم يتم العثور على الملف الشخصي المقترن بالحساب.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage('منظومة قاعدة البيانات والربط غير متصلة حالياً.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md font-sans">
      <div className="text-center space-y-2 mb-6">
        <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
          VELORIA
        </span>
        <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100">
          {showForgotPassword ? 'إعادة تعيين كلمة المرور' : 'تسجيل الدخول إلى حسابك'}
        </h2>
        <p className="text-[11px] text-slate-400">
          {showForgotPassword 
            ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمنًا لتحديث كلمة المرور.'
            : 'تواصل مع البائعين، أرسل العروض، وتصفح متجرك الخاص مجاناً وبدون أي عمولات.'}
        </p>
      </div>

      {showForgotPassword ? (
        <div className="space-y-4">
          {resetErrorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl text-center">
              {resetErrorMessage}
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl text-center leading-relaxed">
              {resetSuccessMessage}
            </div>
          )}

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">البريد الإلكتروني:</label>
              <div className="relative">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="example@veloria.com"
                  className="w-full text-xs pr-10 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 focus:outline-hidden focus:border-amber-500 transition-colors text-right"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetLoading}
              className={`w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${isResetLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isResetLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري إرسال الرابط...</span>
                </span>
              ) : (
                <span>إرسال رابط إعادة التعيين</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetErrorMessage('');
                setResetSuccessMessage('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl mb-4 text-center">
              {errorMessage}
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">البريد الإلكتروني:</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@veloria.com"
                  className="w-full text-xs pr-10 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 focus:outline-hidden focus:border-amber-500 transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pr-10 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 focus:outline-hidden focus:border-amber-500 transition-colors"
                  required
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotPassword(true);
                  setResetErrorMessage('');
                  setResetSuccessMessage('');
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
              
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
              >
                إنشاء حساب جديد
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري تسجيل الدخول...</span>
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
