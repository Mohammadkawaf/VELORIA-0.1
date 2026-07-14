import React from 'react';
import { Category } from '../types';
import Icon from './Icons';
import { ArrowLeft, Layers, HelpCircle, Flame } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  productsCountByCategory: (categoryId: string) => number;
}

export default function CategoriesView({
  categories,
  onSelectCategory,
  productsCountByCategory
}: CategoriesViewProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* Slogan Intro */}
      <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-amber-500/10 shadow-lg text-right">
        <div className="flex items-center gap-2 mb-2 justify-end">
          <span className="text-[10px] uppercase font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full tracking-wider border border-amber-500/15">
            تصفح جغرافي واهتمامات منسقة
          </span>
          <Layers className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-black leading-tight mb-2">
          أقسام وتصنيفات سوق فيلوريا الشاملة
        </h2>
        <p className="text-[11px] text-slate-400 max-w-xl leading-relaxed">
          انقر على أي من الأقسام المذكورة بالأسفل لتصفية كافة الإعلانات النشطة وعرض المنتجات المصنوعة يدوياً أو المعروضة للتسليم الفوري في مدينتك.
        </p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((cat) => {
          const count = productsCountByCategory(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-amber-500/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center justify-between gap-3 cursor-pointer group hover:-translate-y-0.5 duration-250"
            >
              <div className="p-3.5 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
                <Icon name={cat.icon} className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-450 transition-colors leading-tight">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">
                  {count === 0 ? 'لا توجد إعلانات بعد' : `${count} إعلان نشط`}
                </span>
              </div>

              <div className="text-[9px] text-amber-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 mt-1">
                <span>تصفح الآن</span>
                <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
