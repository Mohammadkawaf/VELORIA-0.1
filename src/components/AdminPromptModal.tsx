import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface AdminPromptModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  placeholder?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isRequired?: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
}

export default function AdminPromptModal({
  isOpen,
  title,
  description,
  placeholder = '',
  cancelLabel = 'إلغاء',
  confirmLabel = 'تأكيد',
  isRequired = false,
  onClose,
  onConfirm
}: AdminPromptModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isRequired && !text.trim()) {
      setError('هذا الحقل مطلوب ولا يمكن تركه فارغاً.');
      return;
    }
    onConfirm(text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 md:p-6 animate-scale-up space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-white">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal">
          {description}
        </div>

        {/* Textarea Input */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold text-slate-400">
            {title === 'إخفاء المنتج' ? 'سبب الإخفاء (اختياري):' : 'التفاصيل والسبب:'}
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            className={`w-full min-h-[100px] text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
              error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-150 dark:border-slate-850'
            }`}
            dir="rtl"
          />
          {error && (
            <p className="text-[10px] text-rose-500 font-bold">{error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer text-center shadow-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
