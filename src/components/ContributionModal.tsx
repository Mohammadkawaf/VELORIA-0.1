import React, { useState } from 'react';
import { Heart, Copy, Check, Info } from 'lucide-react';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTransfer: () => void;
  accountNumber?: string;
}

export default function ContributionModal({
  isOpen,
  onClose,
  onConfirmTransfer,
  accountNumber = 'XXXXXXXXXX'
}: ContributionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-emerald-500/10 to-teal-500/10 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full mb-3 shadow-inner">
            <Heart className="w-8 h-8 fill-emerald-500" />
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            المساهمة في فيلوريا (Contribute to VELORIA)
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            دعمكم يضمن استمرار خدماتنا المجانية وحمايتنا للبائعين والمشترين
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300">
              Did VELORIA help you complete your transaction?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your contribution helps improve the platform and add new features for all users.
            </p>
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
            <p className="text-[11px] text-slate-500 dark:text-slate-500 italic">
              هل ساعدتك منصة فيلوريا في إتمام صفقتك بنجاح؟ مساهمتك الاختيارية تعزز استقرار المنصة وتطورها.
            </p>
          </div>

          {/* Payment Method Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">طريقة الدفع (Payment Method):</span>
              <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-black px-3 py-1 rounded-lg border border-emerald-500/10 text-[10px]">
                Sham Cash (شام كاش)
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">رقم الحساب (Account Number):</span>
              <span className="font-mono font-bold bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {accountNumber}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              يرجى تحويل مبلغ المساهمة عبر خدمة "شام كاش" إلى رقم الحساب أعلاه، ثم النقر على زر <strong>"لقد قمت بالتحويل"</strong> لتسجيل المعاملة.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              copied
                ? 'bg-slate-700 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>تم نسخ الرقم!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>نسخ رقم الحساب</span>
              </>
            )}
          </button>

          <button
            onClick={onConfirmTransfer}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
          >
            لقد قمت بالتحويل
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
