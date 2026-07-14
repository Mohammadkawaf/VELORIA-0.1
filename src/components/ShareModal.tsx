import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, Facebook, Mail, Phone, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  description?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  title,
  description = ''
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert('فشل نسخ الرابط، يرجى نسخه يدوياً: ' + shareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl
        });
      } catch (err) {
        console.warn('Native share failed or dismissed:', err);
      }
    } else {
      alert('ميزة المشاركة الأصلية غير مدعومة في متصفحك الحالي، يرجى استخدام قنوات المشاركة أدناه.');
    }
  };

  // Pre-encoded shares
  const encUrl = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(title + '\n' + description);

  const shareChannels = [
    {
      name: 'واتساب',
      icon: <Phone className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15',
      url: `https://api.whatsapp.com/send?text=${encTitle}%20${encUrl}`
    },
    {
      name: 'تلغرام',
      icon: <Send className="w-5 h-5 text-sky-500" />,
      color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-500/15',
      url: `https://t.me/share/url?url=${encUrl}&text=${encTitle}`
    },
    {
      name: 'فيسبوك',
      icon: <Facebook className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`
    },
    {
      name: 'ماسينجر',
      icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/15',
      url: `fb-messenger://share/?link=${encUrl}`
    },
    {
      name: 'رسالة نصية SMS',
      icon: <span className="text-sm font-bold">💬</span>,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750',
      url: `sms:?body=${encTitle}%20${encUrl}`
    },
    {
      name: 'بريد إلكتروني',
      icon: <Mail className="w-5 h-5 text-rose-500" />,
      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-450 hover:bg-rose-500/15',
      url: `mailto:?subject=${encTitle}&body=${encUrl}`
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 md:p-6 animate-scale-up space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">مشاركة ونشر الرابط المباشر</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Capsule */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
          <span className="font-bold text-amber-600 dark:text-amber-400">فيلوريا الحرة:</span> انشر وشارك هذا الرابط لتمكين المشترين والعملاء من الوصول إلى صفحة منتجك أو متجرك الخاص بشكل مباشر ومبسط وسريع.
        </div>

        {/* Link display & copy button */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-extrabold text-slate-400">الرابط المباشر المولد:</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-[10px] text-left font-mono px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-slate-600 dark:text-slate-300"
              dir="ltr"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 dark:text-slate-300'
              }`}
              title="نسخ الرابط"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold animate-fade-in">
              ✔️ تم نسخ الرابط المباشر إلى الحافظة بنجاح!
            </p>
          )}
        </div>

        {/* Native share option */}
        {navigator.share && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة عبر قائمة الجهاز الأصلية</span>
          </button>
        )}

        {/* Share buttons grid */}
        <div className="space-y-2">
          <label className="block text-[10px] font-extrabold text-slate-400">شارك مباشرة عبر قنوات التواصل:</label>
          <div className="grid grid-cols-2 gap-2">
            {shareChannels.map((ch, idx) => (
              <a
                key={idx}
                href={ch.url}
                target="_blank"
                referrerPolicy="no-referrer"
                className={`flex items-center gap-2 p-2 rounded-xl text-[10px] font-bold transition-all text-right border border-transparent hover:border-slate-200 dark:hover:border-slate-800 ${ch.color}`}
              >
                <span className="shrink-0">{ch.icon}</span>
                <span className="truncate">{ch.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
