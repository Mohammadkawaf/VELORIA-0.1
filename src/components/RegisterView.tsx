import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, User as UserIcon, Mail, Key, Shield, Check, Phone } from 'lucide-react';
import { supabaseService, isSupabaseConfigured } from '../lib/supabase';

interface RegisterViewProps {
  onRegister: (user: User) => void;
  onNavigateToLogin: () => void;
  onViewLegal: () => void;
}

export default function RegisterView({ onRegister, onNavigateToLogin, onViewLegal }: RegisterViewProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Mandatory legal agreements
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeDisclaimer, setAgreeDisclaimer] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !username || !email || !whatsappNumber || !password || !confirmPassword) {
      setError('الرجاء تعبئة جميع الحقول المطلوبة للبدء.');
      return;
    }

    const cleanWhatsapp = whatsappNumber.trim().replace(/[\s+]/g, '');
    if (!/^\d{9,15}$/.test(cleanWhatsapp)) {
      setError('يرجى إدخال رقم واتساب صحيح بالصيغة الدولية (مثال: 966501234567) بدون رموز أو مسافات.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين. يرجى التحقق وإعادة الإدخال.');
      return;
    }

    // Store/User Name policy validation
    const hasVeloria = (str: string) => {
      const lower = str.toLowerCase();
      return lower.includes('veloria') || lower.includes('فيلوريا');
    };

    if (hasVeloria(fullName) || hasVeloria(username)) {
      setError('اسم المتجر أو اسم المستخدم يحتوي على كلمة محظورة (VELORIA / فيلوريا). بموجب قواعد المنصة، يُمنع منعاً باتاً استخدام اسم المنصة أو مشتقاتها لتجنب إيهام الأعضاء بوجود علاقة رسمية مع الإدارة.');
      return;
    }

    if (!agreeTerms || !agreePrivacy || !agreeDisclaimer) {
      setError('يجب عليك الموافقة على الشروط والأحكام، سياسة الخصوصية، وإخلاء المسؤولية الإلزامي للمتابعة.');
      return;
    }

    if (isSupabaseConfigured) {
      setIsLoading(true);
      try {
        const { user, error: signUpError } = await supabaseService.signUp(
          email.trim(),
          password,
          fullName.trim(),
          username.trim(),
          cleanWhatsapp
        );

        if (signUpError) {
          setError(signUpError.message || 'فشل إنشاء الحساب في Supabase.');
          setIsLoading(false);
          return;
        }

        if (user) {
          onRegister(user);
        } else {
          // If "Email confirmation" is enabled, user will be null (no session is returned until confirmed)
          alert('✔️ تم إنشاء الحساب بنجاح! تم إرسال رسالة تفعيل إلى بريدك الإلكتروني. يرجى النقر على رابط التفعيل المرسل لتتمكن من تسجيل الدخول إلى حسابك.');
          onNavigateToLogin();
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع أثناء التسجيل.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Create custom user session
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        coverImage: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=800&h=300&q=80',
        bio: 'عضو مبدع في عائلة سوق فيلوريا الحر.',
        badges: [],
        isPremium: false,
        followersCount: 0,
        ratingAverage: 5.0,
        ratingsCount: 0,
        role: 'user',
        joinedAt: new Date().toISOString().split('T')[0],
        city: 'المملكة العربية السعودية',
        phone: cleanWhatsapp,
        whatsapp_number: cleanWhatsapp,
        salesCount: 0,
        trustLevel: 'عضو جديد مبادر'
      };

      onRegister(newUser);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md font-sans">
      <div className="text-center space-y-2 mb-6">
        <span className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
          VELORIA
        </span>
        <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100">إنشاء حساب تاجر أو مشترٍ جديد</h2>
        <p className="text-[11px] text-slate-400">انضم مجاناً اليوم، ابدأ ببيع منتجاتك أو خدماتك، وتواصل مباشرة مع المشترين.</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl mb-4 text-center leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1">الاسم الكامل (أو اسم ورشتك):</label>
          <div className="relative">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: ورشة الصانع الماهر"
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors"
              required
            />
            <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1">اسم المستخدم (فريد وبدون مسافات):</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="al_sane3_workshop"
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors text-left"
              dir="ltr"
              required
            />
            <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold font-mono">@</span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1">البريد الإلكتروني:</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@veloria.com"
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors"
              required
            />
            <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1">رقم الواتساب (مطلوب للربط والتواصل المباشر):</label>
          <div className="relative">
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="966501234567"
              className="w-full text-xs pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors text-left font-mono"
              dir="ltr"
              required
            />
            <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">يرجى كتابة الرقم بالصيغة الدولية بدون (+) أو أصفار في البداية (مثال: 966501234567).</p>
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-350 mb-1">كلمة المرور:</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors"
                required
              />
              <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-650 dark:text-slate-350 mb-1">تأكيد كلمة المرور:</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 transition-colors"
                required
              />
              <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* Mandatory legal checkboxes */}
        <div className="p-3.5 rounded-2xl bg-slate-55/35 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850/60 space-y-2.5 mt-3">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            الموافقات القانونية الإلزامية للتسجيل:
          </h4>
          
          <label className="flex items-start gap-2.5 cursor-pointer text-right">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-800"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 select-none">
              أوافق على كافة <button type="button" onClick={onViewLegal} className="text-amber-600 dark:text-amber-400 font-bold underline">الشروط والأحكام</button> المعمول بها بالمنصة.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-right">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-800"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 select-none">
              أوافق على بنود <button type="button" onClick={onViewLegal} className="text-amber-600 dark:text-amber-400 font-bold underline">سياسة الخصوصية</button> وحفظ بياناتي بأمان.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-right">
            <input
              type="checkbox"
              checked={agreeDisclaimer}
              onChange={(e) => setAgreeDisclaimer(e.target.checked)}
              className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-800"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 select-none font-bold">
              أقر بموافقتي على <button type="button" onClick={onViewLegal} className="text-amber-600 dark:text-amber-400 font-black underline text-rose-500">إخلاء المسؤولية الإلزامي</button> لكون فيلوريا منصة ربط مباشر ولا نتحمل أي عمليات مالية أو توصيل.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span>جاري إنشاء الحساب...</span>
            </span>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حسابي الآن والبدء</span>
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </button>
        </div>
      </form>
    </div>
  );
}
