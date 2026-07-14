import React, { useState } from 'react';
import { Mail, Phone, Send, Info, HelpCircle, Shield, FileText, CheckCircle, AlertTriangle, Lightbulb, MessageSquare, Clock } from 'lucide-react';
import { ContactMessage, AppSettings } from '../types';

interface ContactViewProps {
  currentUser: any;
  onSubmitMessage: (msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) => void;
  onNavigateToLegal: () => void;
  settings?: AppSettings;
}

export default function ContactView({
  currentUser,
  onSubmitMessage,
  onNavigateToLegal,
  settings
}: ContactViewProps) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [msgType, setMsgType] = useState<'general' | 'problem' | 'feature'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // App details
  const appVersion = settings?.currentVersion || 'v1.4.2-PreLaunch';

  // FAQs
  const faqs = [
    {
      q: `ما هي منصة ${settings?.platformName || 'فيلوريا'} (${settings?.platformName || 'VELORIA'})؟`,
      a: settings?.platformDescription || 'فيلوريا هي منصة وسيطة حرة ومفتوحة تربط الحرفيين والتجار المحليين السوريين مباشرة بالعملاء والمشترين لتسويق وبيع منتجاتهم اليدوية والمنزلية والمبتكرة بشكل مباشر دون عمولات.'
    },
    {
      q: 'كيف يمكنني توثيق متجري والحصول على الشارة؟',
      a: 'لتفعيل طلب التوثيق، يجب إكمال بيانات متجرك (الاسم والنبذة التعريفية وصورة الحساب والغلاف ورقم الواتساب) ونشر ٥ منتجات على الأقل وخلو سجلك من أي بلاغات نشطة، ثم تقديم الطلب من صفحة ملفك الشخصي.'
    },
    {
      q: 'هل هناك عمولات أو رسوم على المبيعات؟',
      a: `لا، منصة ${settings?.platformName || 'فيلوريا'} حرة بالكامل ومجانية ١٠٠٪. لا نفرض أي عمولات على الصفقات التي تعقد بين البائع والمشتري بشكل مباشر.`
    },
    {
      q: 'كيف يمكنني تمويل حسابي أو استخدام "شام كاش"؟',
      a: 'تتيح المنصة نظام التبرع والمساهمة الاختيارية لدعم الاستضافة والتشغيل، ويمكن للمستخدمين إرسال تبرعاتهم عبر حساب شام كاش المعتمد ومراجعة الإدارة لمنح شارات التقدير.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      alert('الرجاء ملء كافة الحقول المطلوبة لإرسال الرسالة.');
      return;
    }

    onSubmitMessage({
      name: name.trim(),
      email: email.trim(),
      type: msgType,
      subject: subject.trim(),
      message: message.trim()
    });

    setIsSubmitted(true);
    setSubject('');
    setMessage('');
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  const selectType = (type: 'problem' | 'feature' | 'general') => {
    setMsgType(type);
    if (type === 'problem') {
      setSubject('إبلاغ عن مشكلة تقنية / مخالفة');
    } else if (type === 'feature') {
      setSubject('اقتراح ميزة جديدة / تطوير');
    } else {
      setSubject('');
    }
    // Scroll smoothly to form
    const formElement = document.getElementById('contact-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const supportEmail = settings?.supportEmail || 'support@veloria.org';
  const whatsappNumber = settings?.whatsappNumber || '+963 930 000 000';
  const cleanWhatsapp = whatsappNumber.replace(/\s+/g, '').replace('+', '');
  const telegramLink = settings?.telegramLink || 'https://t.me/VeloriaMarket';
  const telegramLabel = telegramLink.includes('/') ? '@' + telegramLink.split('/').pop() : telegramLink;
  const facebookPage = settings?.facebookPage || 'https://facebook.com/VeloriaMarket';
  const facebookLabel = facebookPage.includes('/') ? 'fb.com/' + facebookPage.split('/').pop() : facebookPage;

  return (
    <div className="space-y-6 text-right font-sans max-w-4xl mx-auto animate-fade-in" dir="rtl">
      {/* Hero Welcome banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <MessageSquare className="w-56 h-56" />
        </div>
        <h2 className="text-xl md:text-2xl font-black">مركز الدعم والتواصل لـ {settings?.platformName || 'VELORIA'}</h2>
        <p className="text-xs md:text-sm text-amber-50/90 leading-relaxed max-w-2xl">
          {settings?.supportWelcomeMessage || 'يسعدنا تواصلكم معنا دائماً! سواء كنتم بحاجة إلى الدعم الفني، أو ترغبون في الإبلاغ عن مشكلة، أو تودون اقتراح ميزة لتطوير المنصة، فإن فريق فيلوريا هنا للاستماع لآرائكم وتلبية احتياجاتكم.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Info Section */}
        <div className="md:col-span-1 space-y-6">
          {/* About Card */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              حول منصة {settings?.platformName || 'فيلوريا'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {settings?.platformDescription || 'فيلوريا هي مبادرة وطنية حرة تهدف لتمكين أصحاب الحرف اليدوية والمشاريع المنزلية من خلال توفير سوق إلكتروني متكامل يعزز التجارة المحلية الشفافة ويسهل التواصل المباشر بين المنتجين والمستهلكين في كافة المدن السورية.'}
            </p>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between font-mono">
              <span>رقم الإصدار الحالي:</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">{appVersion}</span>
            </div>
          </div>

          {/* Quick Contact Info */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">قنوات التواصل المعتمدة</h3>
            
            <div className="space-y-2.5 pt-1">
              <a 
                href={`mailto:${supportEmail}`} 
                className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950 transition-colors cursor-pointer text-left font-mono text-[11px] text-slate-650 dark:text-slate-300"
                dir="ltr"
              >
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{supportEmail}</span>
              </a>

              <a 
                href={`https://wa.me/${cleanWhatsapp}`} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 transition-colors cursor-pointer text-left font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
                dir="ltr"
              >
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{whatsappNumber}</span>
              </a>

              <a 
                href={telegramLink} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/10 transition-colors cursor-pointer text-left font-mono text-[11px] text-sky-600 dark:text-sky-400"
                dir="ltr"
              >
                <span className="text-sky-500 font-bold text-xs shrink-0">✈️</span>
                <span>{telegramLabel}</span>
              </a>

              <a 
                href={facebookPage} 
                target="_blank" 
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 transition-colors cursor-pointer text-left font-mono text-[11px] text-blue-600 dark:text-blue-450"
                dir="ltr"
              >
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">👤</span>
                <span>{facebookLabel}</span>
              </a>
            </div>
            
            {settings?.businessHours && (
              <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{settings.businessHours}</span>
              </div>
            )}
          </div>

          {/* Legal Quick Links */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">اتفاقية استخدام فيلوريا</h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              يتطلب استخدام خدمات فيلوريا والمتاجرة فيها الموافقة المسبقة والكاملة على شروطنا القانونية والاتفاقية الأمنية.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onNavigateToLegal}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-850 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>الشروط والأحكام</span>
              </button>
              <button
                onClick={onNavigateToLegal}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-950 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-850 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>سياسة الخصوصية</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form and Interaction Section */}
        <div className="md:col-span-2 space-y-6">
          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => selectType('problem')}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-28 ${
                msgType === 'problem'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-450 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750'
              }`}
            >
              <div className="p-1.5 bg-rose-500/10 rounded-lg w-fit">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs">هل واجهت مشكلة؟</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">تقديم شكوى، الإبلاغ عن خلل فني أو إعلان مخالف.</p>
              </div>
            </button>

            <button
              onClick={() => selectType('feature')}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-28 ${
                msgType === 'feature'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750'
              }`}
            >
              <div className="p-1.5 bg-indigo-500/10 rounded-lg w-fit">
                <Lightbulb className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs">اقترح ميزة جديدة</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">ساعدنا في تطوير وتحديث خدمات وميزات فيلوريا الحرة.</p>
              </div>
            </button>
          </div>

          {/* Form */}
          <div id="contact-form-section" className="p-5 md:p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
              📬 أرسل لنا رسالة مباشرة
            </h3>

            {isSubmitted ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl text-center space-y-2 animate-scale-up">
                <div className="flex justify-center text-emerald-500">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="font-black text-xs text-emerald-600 dark:text-emerald-450">تم إرسال رسالتك بنجاح!</h4>
                <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal">
                  نشكرك على تواصلك ودعمك المستمر. تم حفظ رسالتك في نظام الدعم الإداري، وسيقوم فريق العمل أو إدارة فيلوريا بالرد عليكم في أقرب فرصة ممكنة.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">اسمك الكامل:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 transition-colors font-bold"
                      placeholder="عبد الرحمن"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">البريد الإلكتروني للرد:</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 transition-colors text-left font-mono font-bold"
                      placeholder="name@domain.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">نوع المراسلة:</label>
                    <select
                      value={msgType}
                      onChange={(e) => selectType(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="general">استفسار عام / اقتراح</option>
                      <option value="problem">⚠️ الإبلاغ عن مشكلة تقنية / شكوى</option>
                      <option value="feature">💡 اقتراح ميزة جديدة للمنصة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان الموضوع:</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 transition-colors font-bold"
                      placeholder="اكتب عنواناً معبراً هنا..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">تفاصيل الرسالة أو الشكوى:</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 transition-colors font-medium leading-relaxed"
                    placeholder="اكتب تفاصيل استفسارك أو المشكلة بالتفصيل هنا، لكي نتمكن من مساعدتك بالشكل الأمثل..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>إرسال الرسالة للإدارة الآن</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          الأسئلة الشائعة والمتكررة (FAQ)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/80 space-y-1.5 text-right">
              <h4 className="font-black text-xs text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                <span className="text-amber-500 shrink-0">◀</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed pr-4">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
