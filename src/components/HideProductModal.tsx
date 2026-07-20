import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface HideProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function HideProductModal({
  isOpen,
  onClose,
  onConfirm
}: HideProductModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 md:p-6 animate-scale-up space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">إخفاء المنتج</h3>
          </div>
          <button 
            onClick={handleCancel}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal">
          يرجى كتابة سبب إخفاء المنتج. سيتم إرسال هذا السبب إلى التاجر ضمن الإشعار.
        </div>

        {/* Textarea Input */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-slate-400">سبب الإخفاء (اختياري):</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: انتهاك شروط البيع، منتج غير حقيقي، سعر مضلل..."
            className="w-full min-h-[100px] text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            dir="rtl"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center shadow-sm"
          >
            تأكيد الإخفاء
          </button>
        </div>
      </div>
    </div>
  );
}
