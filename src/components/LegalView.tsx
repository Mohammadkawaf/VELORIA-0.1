import React, { useState } from 'react';
import { FileText, Shield, ShieldAlert, Check, HelpCircle } from 'lucide-react';
import { AppSettings } from '../types';

interface LegalViewProps {
  settings?: AppSettings;
}

export default function LegalView({ settings }: LegalViewProps) {
  const [activeTab, setActiveTab] = useState<'disclaimer' | 'terms' | 'privacy'>('disclaimer');

  const renderFormattedText = (text?: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;
      
      // Check if line looks like a header (e.g. "١. " or "1. ")
      if (trimmed.match(/^[١٢٣٤٥٦٧٨٩٠\d]+\./) || trimmed.startsWith('#')) {
        return (
          <h4 key={i} className="font-extrabold text-slate-800 dark:text-slate-200 mt-4 mb-1.5 text-xs">
            {trimmed.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      return (
        <p key={i} className="text-slate-600 dark:text-slate-400 mb-1.5 leading-relaxed text-[11px]">
          {trimmed}
        </p>
      );
    });
  };

  const platformName = settings?.platformName || 'VELORIA';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-6 bg-slate-100 dark:bg-slate-900/40 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-amber-500" />
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              الصفحات القانونية والاتفاقية الأمنية ({platformName} Legal)
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              ندعوكم لقراءة هذه البنود بتمعن قبل البدء بالبيع والشراء، وذلك لضمان تجربة آمنة وخالية من النزاعات.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 text-xs">
        <button
          onClick={() => setActiveTab('disclaimer')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'disclaimer'
              ? 'border-rose-500 text-rose-600 dark:text-rose-450 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          🚨 إخلاء المسؤولية (إلزامي)
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'terms'
              ? 'border-amber-500 text-amber-650 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          📜 الشروط والأحكام
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 py-3 text-center font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-amber-500 text-amber-650 dark:text-amber-400 bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:bg-slate-100/50'
          }`}
        >
          🔒 سياسة الخصوصية
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6 text-right leading-relaxed text-xs">
        {activeTab === 'disclaimer' && (
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-sm mb-1 text-rose-700 dark:text-rose-400">تنصيب وإقرار إخلاء المسؤولية الرسمي</h3>
                <p className="text-[11px] leading-relaxed">
                  منصة {platformName} هي منصة إلكترونية مفتوحة تهدف لتسهيل عملية التواصل المباشر وربط التجار المحليين بالعملاء والمهتمين بالصناعات اليدوية والمنزلية والمشاريع المتنوعة.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {settings?.disclaimer ? (
                renderFormattedText(settings.disclaimer)
              ) : (
                <>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200">١. آلية عمل فيلوريا ودورها الفعلي:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    المنصة تقوم بدور <strong>الوسيط أو دليل الإعلانات فقط</strong>. نحن لا نمتلك، ولا نبيع، ولا نقوم بمعاينة أو شحن أو تغليف أي من المنتجات والخدمات المعروضة. السعر والاتفاق يتم بالكامل خارج المنصة وبشكل ثنائي مباشر (P2P).
                  </p>

                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-rose-600">٢. غياب المسؤولية المالية والمصرفية بالكامل:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    منصة {platformName} <strong>غير مسؤولة مطلقاً</strong> عن أي عمليات دفع إلكتروني أو تحويلات بنكية أو اتفاقات مالية تتم بين الأطراف. ننصح دوماً بالدفع يداً بيد عند المعاينة والاستلام لضمان جودة المنتج وثقتكم الكاملة.
                  </p>

                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200">٣. الشحن والتوصيل والتسليم الفعلي:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    لا نتحمل أي مسؤولية قانونية أو مدنية تتعلق بتأخير وصول المنتجات، تلفها أثناء الشحن، عيوب الصناعة، أو عدم التزام مندوب التوصيل المستقل بالاتفاق. يرجى الاتفاق بشكل تفصيلي مع البائع عبر نظام الدردشة المفتوح.
                  </p>

                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-rose-600">٤. حظر إساءة الاستخدام والمنتجات المخالفة:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    يتحمل التاجر المسؤولية القانونية والأخلاقية الكاملة عن كافة الصور والنصوص والأسعار التي يقوم بنشرها، ونقوم بحذف أي محتوى مخالف أو مشبوه بشكل فوري بالتعاون مع المشرفين المعتمدين.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-2">شروط استخدام سوق {platformName} الحر</h3>
            <div className="space-y-3">
              {settings?.termsOfUse ? (
                renderFormattedText(settings.termsOfUse)
              ) : (
                <>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">١. شروط التسجيل للتاجر والمشتري:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    يجب أن يكون الاسم حقيقياً أو معبراً بشكل مباشر عن هوية المتجر (مثل: ورشة، حلويات منزلية). كما يمنع استخدام أسماء تضليلية أو انتحال شخصيات أخرى أو علامات تجارية مسجلة دون إذن.
                  </p>

                  <h4 className="font-bold text-slate-700 dark:text-slate-300">٢. سياسة تسعير وعرض المنتجات:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    يجب أن يعكس السعر القيمة الفعلية للمنتج بالليرة السورية أو العملة المحلية المتاحة. يمنع منعاً باتاً نشر إعلانات وهمية أو ترويجية بدون نية بيع فعلية، أو استخدام أسعار وهمية لجذب الزوار بشكل مضلل.
                  </p>

                  <h4 className="font-bold text-slate-700 dark:text-slate-300">٣. الصور وحقوق الملكية الفكرية:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    يجب أن تكون الصور حقيقية للمنتج قدر الإمكان لتفادي تضليل المشتري. نوصي بتصوير المنتجات اليدوية بأنفسكم لتعكس الهوية الحقيقية لأعمالكم وتزيد من مستوى تقييمكم وثقتكم بالسوق.
                  </p>

                  <h4 className="font-bold text-slate-700 dark:text-slate-300">٤. إنهاء وإيقاف الحسابات المخالفة:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    يحق للمشرفين ومديري النظام تعليق أو حذف حساب أي بائع يتلقى بلاغات متكررة عن احتيال أو سوء معاملة، أو من يثبت تقديمه لأسعار تختلف بشكل فادح عما تم كتابته بالإعلان الأساسي.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-2">سياسة حماية خصوصية المستخدمين</h3>
            <div className="space-y-3">
              {settings?.privacyPolicy ? (
                renderFormattedText(settings.privacyPolicy)
              ) : (
                <>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">١. البيانات التي نجمعها لحفظ استقرار حسابك:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    نقوم بحفظ معلومات التسجيل الأساسية مثل الاسم، اسم المستخدم، البريد الإلكتروني، والمدينة لنتمكن من عرض إعلاناتك أمام المتصفحين والباحثين في مدينتك بشكل جغرافي دقيق وفعال.
                  </p>

                  <h4 className="font-bold text-slate-700 dark:text-slate-300">٢. حماية وتشفير الرسائل والمراسلات:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    يتم حفظ جميع الدردشات والمراسلات بشكل آمن وخاص بالكامل بين البائع والمشتري، ولا يتم الاطلاع عليها إلا في حالات النزاع أو تقديم بلاغ رسمي من أحد الأطراف لضمان نزاهة التعاملات.
                  </p>

                  <h4 className="font-bold text-slate-700 dark:text-slate-300">٣. ملفات تعريف الارتباط والتقنيات المحلية:</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    نستخدم وحدات التخزين المحلية بالمتصفح (LocalStorage) لحفظ تفضيلات المظهر الداكن والمشرق، وحفظ جلستك النشطة بالمتصفح، وحفظ قائمة المفضلة الخاصة بك لتسريع التصفح.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
