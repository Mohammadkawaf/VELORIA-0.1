import React, { useState, useRef } from 'react';
import { Category, Product, User } from '../types';
import { Save, X, Trash2, Loader2, Camera, ChevronRight, ChevronLeft, Star, Edit } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';

interface EditProductViewProps {
  product: Product;
  categories: Category[];
  onSave: (updatedProduct: Product) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const uploadProductImage = async (file: File): Promise<string> => {
  let compressedFile = file;
  try {
    compressedFile = await compressImage(file);
  } catch (err) {
    console.warn('Image compression failed, using original file:', err);
  }

  try {
    const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
    if (isSupabaseConfigured && supabase) {
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

const GOVERNORATES_CITIES: Record<string, string[]> = {
  "دمشق": ["دمشق المدينة", "مشروع دمر", "المزة", "المالكي", "أبو رمانة", "البرامكة", "القصاع", "الميدان", "التجارة", "ركن الدين", "كفرسوسة", "المهاجرين", "شاغور"],
  "ريف دمشق": ["جرمانا", "قدسيا", "ضاحية قدسيا", "التل", "الكسوة", "صحنايا", "أشرفية صحنايا", "ضاحية الأسد", "يبرود", "النبك", "قطنا", "الزبداني", "صيدنايا"],
  "حلب": ["حلب المدينة", "منبج", "الباب", "عفرين", "نبل", "أعزاز", "الزهراء", "السفيرة", "الجميلية", "الشهباء", "الفرقان", "حلب الجديدة", "الموكامبو"],
  "حمص": ["حمص المدينة", "الرستن", "تدمر", "القصير", "تلكلخ", "المشرفة", "الإنشاءات", "الوعر", "الحمراء", "الغوطة", "المحطة"],
  "حماة": ["حماة المدينة", "سلمية", "مصياف", "السقيلبية", "محردة", "الغاب", "العاصي", "طريق حلب"],
  "اللاذقية": ["اللاذقية المدينة", "جبلة", "القرداحة", "الحفة", "صلنفة", "الرمل الشمالي", "المشروع الأول", "الأوقاف", "الزراعة"],
  "طرطوس": ["طرطوس المدينة", "بانياس", "صافيتا", "الدريكيش", "الشيخ بدر", "القدموس", "مشتى الحلو"],
  "السويداء": ["السويداء المدينة", "شهبا", "صلخد", "القريا"],
  "درعا": ["درعا المدينة", "طفس", "نوى", "بصرى الشام", "الصنمين", "ازرع", "داعل"],
  "دير الزور": ["دير الزور المدينة", "الميادين", "البوكمال"],
  "الحسكة": ["الحسكة المدينة", "القامشلي", "رأس العين", "عامودا", "المالكية", "الدرباسية"]
};

export default function EditProductView({
  product,
  categories,
  onSave,
  onCancel,
  onDelete
}: EditProductViewProps) {
  const [title, setTitle] = useState(product.title);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState<number | ''>(product.price);
  const [city, setCity] = useState(product.city || '');
  
  const [imageUrls, setImageUrls] = useState<string[]>(product.images);
  const [status, setStatus] = useState<Product['status']>(product.status);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (imageUrls.length + files.length > 10) {
      alert('الحد الأقصى للصور هو ١٠ صور فقط للمحافظة على المساحة وتفاصيل الإعلان.');
      return;
    }
    
    setIsUploading(true);
    const newUrls = [...imageUrls];
    
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
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);

    try {
      const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
      if (isSupabaseConfigured && supabase) {
        // 1. Delete from database table product_images
        const { error: dbError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', product.id)
          .eq('image_url', urlToDelete);

        if (dbError) {
          console.error('Error deleting image from product_images table:', dbError);
          alert('فشل حذف الصورة من قاعدة البيانات: ' + dbError.message);
        }

        // 2. Delete from Supabase Storage if it was uploaded there
        if (urlToDelete && urlToDelete.includes('product-images')) {
          const bucketMarker = '/product-images/';
          const markerIndex = urlToDelete.indexOf(bucketMarker);
          if (markerIndex !== -1) {
            const filePath = decodeURIComponent(urlToDelete.substring(markerIndex + bucketMarker.length));
            console.log('Deleting image from storage in EditProductView:', filePath);
            const { error: storageError } = await supabase.storage
              .from('product-images')
              .remove([filePath]);
            
            if (storageError) {
              console.error('Error deleting image file from storage:', storageError);
              alert('فشل حذف ملف الصورة من خادم التخزين: ' + storageError.message);
            } else {
              console.log('Successfully deleted file from storage:', filePath);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to completely remove image:', err);
      alert('حدث خطأ غير متوقع أثناء إزالة الصورة: ' + (err?.message || err));
    }
  };

  // Reordering functions
  const moveImageLeft = (index: number) => {
    if (index === imageUrls.length - 1) return; // Can't move left/forward further
    const updated = [...imageUrls];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setImageUrls(updated);
  };

  const moveImageRight = (index: number) => {
    if (index === 0) return; // Can't move right/backward further
    const updated = [...imageUrls];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setImageUrls(updated);
  };

  const makeCoverImage = (index: number) => {
    if (index === 0) return;
    const updated = [...imageUrls];
    const target = updated.splice(index, 1)[0];
    updated.unshift(target);
    setImageUrls(updated);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !description || !price || !city) {
      alert('الرجاء تعبئة كافة البيانات الرئيسية للإعلان.');
      return;
    }

    if (imageUrls.length === 0) {
      alert('الرجاء إضافة صورة واحدة على الأقل للمنتج لضمان قبول نشره.');
      return;
    }

    setIsSaving(true);

    const updatedProduct: Product = {
      ...product,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      currency: 'ل.س',
      categoryId: categoryId,
      images: imageUrls,
      status: status,
      city: city.trim()
    };

    // Simulate small saving latency
    setTimeout(() => {
      onSave(updatedProduct);
      setIsSaving(false);
    }, 1000);
  };

  const handleDeleteClick = () => {
    if (confirm(`هل أنت متأكد تماماً من رغبتك في حذف المنتج: "${product.title}" نهائياً من المتجر وقاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      onDelete();
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md font-sans text-right">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-850 pb-4 mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="إلغاء وتراجع"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
          تعديل تفاصيل المنتج
          <Edit className="w-5 h-5 text-amber-500" />
        </h2>
      </div>

      <form onSubmit={handleUpdate} className="space-y-5">
        {/* Availability Status Selector */}
        <div className="p-4 rounded-2xl bg-amber-550/5 border border-amber-500/10 space-y-2">
          <label className="block text-xs font-black text-slate-800 dark:text-slate-200">حالة توفر المنتج:</label>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border ${
                status === 'active'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-base">🟢</span>
              <span>متوفر للبيع</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('sold')}
              className={`py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border ${
                status === 'sold'
                  ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="text-base">🔴</span>
              <span>مباع (تم البيع)</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">المنتجات المباعة تظل ظاهرة كجزء من أعمالك وسجل مبيعاتك مع إيقاف زر تواصل واتساب.</p>
        </div>

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

        {/* Category & Sale Type */}
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
            <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">السعر (ل.س):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 150000"
              className="w-full text-xs px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 text-right"
              required
            />
          </div>
        </div>

        {/* City Input */}
        <div>
          <label className="block text-xs font-bold text-slate-650 dark:text-slate-350 mb-1.5">المدينة (الموقع الحالي للمنتج):</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="مثال: دمشق، حلب، حمص..."
            className="w-full text-xs px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 text-right"
            required
          />
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
          <p className="text-[10px] text-slate-400">الصورة الأولى في القائمة تصبح تلقائياً غلاف الإعلان. يمكنك إعادة ترتيبها بالأسهم أدناه.</p>
          
          {/* Multiple File selector from gallery */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 transition-colors hover:border-amber-500/50">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
              id="edit-gallery-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="edit-gallery-upload"
              className="flex flex-col items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-amber-500" />
              )}
              <span className="text-xs font-bold">📷 اختيار صور من المعرض</span>
              <span className="text-[10px] text-slate-400">يمكنك إضافة صور جديدة (الحد الأقصى للإجمالي 10 صور)</span>
            </label>
            {isUploading && (
              <p className="text-[10px] text-amber-500 font-bold mt-2 animate-pulse">جاري رفع ومعالجة الصور بالضغط الذكي...</p>
            )}
          </div>

          {/* List of current images with sorting controls */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col group bg-white dark:bg-slate-900 shadow-3xs">
                  <div className="relative flex-1 overflow-hidden">
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    
                    {idx === 0 && (
                      <span className="absolute bottom-1 right-1 text-[8px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded leading-none shadow-xs">
                        الغلاف
                      </span>
                    )}

                    {/* Delete button overlay */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 hover:bg-rose-750 text-white transition-all cursor-pointer shadow-md z-10"
                      title="حذف الصورة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Reordering Controls Bar */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => moveImageLeft(idx)}
                      disabled={idx === imageUrls.length - 1}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-450 disabled:opacity-30 cursor-pointer"
                      title="تحريك للأمام"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => makeCoverImage(idx)}
                        className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-all"
                        title="تعيين كغلاف"
                      >
                        غلاف
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => moveImageRight(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-450 disabled:opacity-30 cursor-pointer"
                      title="تحريك للخلف"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ والمطابقة...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            className="py-3 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف المنتج</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-5 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-350 font-bold text-xs rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
