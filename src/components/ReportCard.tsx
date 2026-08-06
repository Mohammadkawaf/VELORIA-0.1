import React from 'react';
import { Check } from 'lucide-react';
import { Report, Product, User } from '../types';

interface ReportCardProps {
  report: Report;
  targetProduct?: Product;
  reportedUser?: User;
  onAcceptReport?: (reportId: string) => void;
  onHideProduct?: (reportId: string) => void;
  onSuspendUser?: (reportId: string) => void;
  onRejectReport?: (reportId: string) => void;
  isModeratorView?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report: rep,
  targetProduct,
  reportedUser,
  onAcceptReport,
  onHideProduct,
  onSuspendUser,
  onRejectReport,
  isModeratorView = false,
}) => {
  const rtlTextStyle: React.CSSProperties = {
    direction: 'rtl',
    textAlign: 'right',
    unicodeBidi: 'isolate',
  };

  return (
    <div
      dir="rtl"
      style={rtlTextStyle}
      className={`p-5 rounded-2xl border text-right space-y-3 ${
        isModeratorView
          ? 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10'
      }`}
    >
      {/* Header: Badges + Target Name + Reporter Info */}
      <div
        dir="rtl"
        style={rtlTextStyle}
        className="flex items-center justify-between flex-wrap gap-2 text-right"
      >
        <div
          dir="rtl"
          style={rtlTextStyle}
          className="flex items-center gap-2 flex-wrap text-right"
        >
          <span className="text-[10px] bg-rose-500 text-white font-extrabold px-2.5 py-0.5 rounded shrink-0">
            {rep.type === 'product' ? 'مخالفة: إعلان منتج' : 'مخالفة: حساب بائع'}
          </span>

          {rep.status === 'pending' && (
            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold px-2 py-0.5 rounded shrink-0">
              جديد
            </span>
          )}
          {rep.status === 'processing' && (
            <span className="text-[10px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-extrabold px-2 py-0.5 rounded shrink-0">
              قيد المعالجة
            </span>
          )}
          {rep.status === 'resolved' && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-extrabold px-2 py-0.5 rounded shrink-0">
              تم الحل
            </span>
          )}
          {rep.status === 'dismissed' && (
            <span className="text-[10px] bg-slate-500/10 text-slate-500 border border-slate-500/20 font-extrabold px-2 py-0.5 rounded shrink-0">
              مرفوض
            </span>
          )}

          {/* Target Name with strict RTL text styling */}
          <span
            dir="rtl"
            style={rtlTextStyle}
            className="text-xs font-extrabold text-slate-900 dark:text-white"
          >
            {rep.targetName}
          </span>
        </div>

        {/* Reporter Info */}
        <div
          dir="rtl"
          style={rtlTextStyle}
          className="text-[10px] text-slate-400 text-right"
        >
          <span>الشاكي: </span>
          <strong
            dir="rtl"
            style={rtlTextStyle}
            className="text-slate-700 dark:text-slate-300 font-bold"
          >
            {rep.reporterName}
          </strong>
          {rep.createdAt && (
            <>
              <span> | تاريخ: </span>
              <span dir="ltr" className="font-mono">
                {rep.createdAt.includes('T') ? rep.createdAt.split('T')[0] : rep.createdAt}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Report Body: Reason & Supporting Details */}
      <div
        dir="rtl"
        style={rtlTextStyle}
        className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-right break-words"
      >
        {/* Reason */}
        <div
          dir="rtl"
          style={rtlTextStyle}
          className="text-right"
        >
          <strong className="text-amber-600 dark:text-amber-400 font-extrabold">السبب الأساسي للمخالفة:</strong>{' '}
          <span
            dir="rtl"
            style={rtlTextStyle}
            className="text-slate-800 dark:text-slate-200 font-bold"
          >
            {rep.reason}
          </span>
        </div>

        {/* Supporting Details */}
        {rep.details && (
          <div
            dir="rtl"
            style={rtlTextStyle}
            className="text-right pt-1 border-t border-slate-100 dark:border-slate-800/60"
          >
            <strong className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
              التفاصيل الداعمة للشكوى:
            </strong>
            <p
              dir="rtl"
              style={rtlTextStyle}
              className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap break-words text-right"
            >
              {rep.details}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        dir="rtl"
        style={rtlTextStyle}
        className="flex items-center gap-2 flex-wrap pt-1"
      >
        {rep.status === 'pending' || rep.status === 'processing' ? (
          <>
            {rep.status === 'pending' && onAcceptReport && (
              <button
                type="button"
                onClick={() => onAcceptReport(rep.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                قبول الشكوى واعتمادها
              </button>
            )}

            {rep.type === 'product' && targetProduct && targetProduct.status !== 'hidden' && onHideProduct && (
              <button
                type="button"
                onClick={() => onHideProduct(rep.id)}
                className="bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                إخفاء المنتج المخالف وحل الشكوى
              </button>
            )}

            {rep.type === 'user' && reportedUser && reportedUser.status !== 'suspended' && onSuspendUser && (
              <button
                type="button"
                onClick={() => onSuspendUser(rep.id)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                تعليق بائع معتمد وحل الشكوى
              </button>
            )}

            {onRejectReport && (
              <button
                type="button"
                onClick={() => onRejectReport(rep.id)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                تجاهل / بلاغ كيدي
              </button>
            )}
          </>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full ${
            rep.status === 'resolved'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
          }`}>
            <Check className="w-3.5 h-3.5" />
            {rep.status === 'resolved' ? 'تم معالجة الشكوى واتخاذ القرار الرقابي' : 'تم رفض البلاغ وحفظ الملف كبلاغ كيدي'}
          </span>
        )}
      </div>
    </div>
  );
};
