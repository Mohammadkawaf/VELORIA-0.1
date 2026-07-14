import React, { useState, useRef } from 'react';
import { Category, Product, User } from '../types';
import { PlusCircle, Image as ImageIcon, Trash2, Check, HelpCircle, Loader2, Camera, X } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';

interface AddProductViewProps {
  categories: Category[];
  currentUser: User | null;
  onAddProduct: (newProduct: any) => Promise<any> | void;
}

const uploadProductImage = async (file: File): Promise<string> => {
  let compressedFile = file;
  try {
    // Compress the file first
    compressedFile = await compressImage(file);
  } catch (err) {
    console.warn('Image compression failed, using original file:', err);
  }

  try {
    const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
    if (isSupabaseConfigured && supabase) {
      // Use webp as we compressed to webp
      const fileExt = 'webp';
      const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedFile);
        
      if (error) {
        let errorMsg = 'فشل تحميل صورة المنتج.';
        if (error.message?.includes('Bucket not found') || error.message?.includes('bucket_id') || error.message?.includes('does not exist')) {
          errorMsg = 'مجلد التخزين "product-images" غير موجود في مشروع Supabase الخاص بك. يرجى إنشاؤه من لوحة تحكم Supabase وتفعيل الوصول العام له لرفع صور المنتجات.';
        } else {
          errorMsg = `فشل الرفع إلى Supabase: ${error.message}`;
        }
        throw new Error(errorMsg);
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('مجلد') || err.message.includes('Supabase'))) {
      throw err;
    }
    console.warn('Supabase upload failed or not configured, falling back to local base64:', err);
  }
  
  // Fallback to Base64 ONLY if Supabase is NOT configured (offline preview mode)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(compressedFile);
  });
};

export default function AddProductView({
  categories,
  currentUser,
  onAddProduct
}: AddProductViewProps) {
  console.log("categories prop =", categories);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(currentUser?.city || 'دمشق');
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (imageUrls.length + files.length > 10) {
      alert('الحد الأقصى للصور هو ١٠ صور فقط للمحافظة على المساحة وتفاصيل الإعلان.');
      return;
    }
    
    setIsUploading(true);
    const newUrls: string[] = [...imageUrls];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadedUrl = await uploadProductImage(file);
        newUrls.push(uploadedUrl);
      } catch (err: any) {
        console.error('Error uploading file:', err);
        alert(err.message || 'حدث خطأ أثناء رفع أحد الملفات.');
      }
    }
    
    setImageUrls(newUrls);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const urlToDelete = imageUrls[index];
    setImageUrls(imageUrls.filter((_, i) => i !== index));

    if (urlToDelete && urlToDelete.includes('product-images')) {
      try {
        const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
        if (isSupabaseConfigured && supabase) {
          const bucketMarker = '/product-images/';
          const markerIndex = urlToDelete.indexOf(bucketMarker);
          if (markerIndex !== -1) {
            const filePath = decodeURIComponent(urlToDelete.substring(markerIndex + bucketMarker.length));
            console.log('Deleting removed image from storage:', filePath);
            const { error } = await supabase.storage
              .from('product-images')
              .remove([filePath]);
            if (error) {
              console.error('Error deleting from storage:', error);
              alert('فشل حذف الصورة من خادم التخزين: ' + error.message);
            } else {
              console.log('Successfully deleted from storage:', filePath);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to delete image from storage:', err);
        alert('حدث خطأ غير متوقع أثناء حذف الصورة من التخزين: ' + (err?.message || err));
      }
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('عذراً، يجب تسجيل الدخول كعضو أولاً لتتمكن من ترويج ونشر منتجاتك.');
      return;
    }

    if (!title || !price || !categoryId || !description) {
      alert('الرجاء تعبئة كافة البيانات الرئيسية للإعلان.');
      return;
    }

    if (imageUrls.length === 0) {
      alert('الرجاء إضافة صورة واحدة على الأقل للمنتج لضمان قبول نشره.');
      return;
    }

    setIsPublishing(true);

    const runPublish = async () => {
      try {
        const productPayload = {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          currency: 'ل.س',
          categoryId: categoryId,
          images: imageUrls,
          sellerId: currentUser?.id || '',
          status: 'active',
          location: `${city}، سوريا`,
          viewsCount: 1
        };

        await onAddProduct(productPayload);

        setIsPublishing(false);
        setSuccessMsg('تم نشر إعلانك بنجاح وسيكون متاحاً لجميع الزوار على الفور!');
        
        // Clear inputs
        setTitle('');
        setPrice('');
        setCategoryId('');
        setDescription('');
        setImageUrls([]);
      } catch (err: any) {
        console.error('Error in AddProductView publish:', err);
        alert(err?.message || 'حدث خطأ أثناء نشر الإعلان، يرجى المحاولة مرة أخرى.');
        setIsPublishing(false);
      }
    };

    runPublish();
  };

  return (
    <div className="max-w-2xl mx-auto my-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md font-sans text-right">
      <div className="border-b border-slate-100 dark:border-slate-850 pb-4 mb-6">
        <h2 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center justify-end gap-2">
          إضافة منتج أو إعلان جديد
          <PlusCircle className="w-5.5 h-5.5 text-amber-500" />
        </h2>
        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
          املأ الحقول التالية بأكبر قدر من الدقة. التوصيف الواضح والتقييمات الإيجابية للمشترين تضمن رفع مستواك وتعميق الثقة بمتجرك.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl mb-6 text-center">
          🎉 {successMsg}
        </div>
      )}

      <form onSubmit={handlePublish} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">عنوان الإعلان (مختصر وجذاب):</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: لوحة فنية أصلية بالخط العربي الذهبي"
            className="w-full text-xs px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 text-right"
            required
          />
        </div>

        {/* Category & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">القسم / التصنيف:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs pr-3 pl-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer text-right"
              required
            >
              <option value="">-- اختر التصنيف المناسب --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">السعر المطلوب (بالليرة السورية ل.س):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 50000"
              className="w-full text-xs px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 text-right"
              required
            />
          </div>
        </div>

        {/* Location city */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">المدينة والمنطقة:</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full text-xs pr-3 pl-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer text-right"
          >
            <option value="دمشق">دمشق</option>
            <option value="حلب">حلب</option>
            <option value="حمص">حمص</option>
            <option value="اللاذقية">اللاذقية</option>
            <option value="طرطوس">طرطوس</option>
            <option value="حماة">حماة</option>
            <option value="السويداء">السويداء</option>
            <option value="درعا">درعا</option>
            <option value="دير الزور">دير الزور</option>
            <option value="الحسكة">الحسكة</option>
            <option value="القامشلي">القامشلي</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">توصيف المنتج بالتفصيل (الحالة، المقاسات، المواد المستخدمة):</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب أدق تفاصيل المنتج الحرفي أو الخدمة ليسهل على المشترين التواصل معك فوراً."
            rows={5}
            className="w-full text-xs px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 leading-relaxed text-right"
            required
          />
        </div>

        {/* Images (Up to 10 support) */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
          <label className="block text-xs font-black text-slate-700 dark:text-slate-300">ألبوم صور الإعلان (الحد الأقصى ١٠ صور):</label>
          <p className="text-[10px] text-slate-400">الصورة الأولى في القائمة تصبح تلقائياً غلاف الإعلان في نتائج البحث.</p>
          
          {/* Multiple File selector from gallery */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 transition-colors hover:border-amber-500/50">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
              id="gallery-images-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="gallery-images-upload"
              className="flex flex-col items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-amber-500" />
              )}
              <span className="text-xs font-bold">📷 اختيار صور من المعرض</span>
              <span className="text-[10px] text-slate-400">يمكنك اختيار عدة صور معاً (الحد الأقصى 10 صور)</span>
            </label>
            {isUploading && (
              <p className="text-[10px] text-amber-500 font-bold mt-2 animate-pulse">جاري رفع ومعالجة الصور...</p>
            )}
          </div>

          {/* List of current images */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                  <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  
                  {idx === 0 && (
                    <span className="absolute bottom-1 right-1 text-[8px] bg-amber-500 text-slate-950 font-black px-1 py-0.5 rounded leading-none shadow-xs">
                      الغلاف
                    </span>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 hover:bg-rose-750 text-white transition-colors cursor-pointer shadow-md z-10"
                    title="حذف الصورة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPublishing || isUploading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري النشر والمطابقة...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>نشر هذا الإعلان الآن</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => alert('ميزة حفظ المسودات ستكون متاحة قريباً في الإصدار المدفوع من منصة فيلوريا!')}
            className="px-5 py-3 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-350 font-bold text-xs rounded-xl cursor-pointer"
          >
            حفظ كمسودة
          </button>
        </div>
      </form>
    </div>
  );
}
