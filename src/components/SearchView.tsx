import React, { useState, useMemo } from 'react';
import { Product, Category, User } from '../types';
import ProductCard from './ProductCard';
import { Search, SlidersHorizontal, ArrowUpDown, X, MapPin, Tag, Star, Sparkles, Filter } from 'lucide-react';

interface SearchViewProps {
  products: Product[];
  categories: Category[];
  users: User[];
  currentUser: User | null;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewProduct: (product: Product) => void;
  initialCategoryId?: string;
  initialQuery?: string;
  onVisitStore?: (seller: User) => void;
}

export default function SearchView({
  products,
  categories,
  users,
  currentUser,
  favorites,
  onToggleFavorite,
  onViewProduct,
  initialCategoryId = 'all',
  initialQuery = '',
  onVisitStore
}: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated' | 'most_viewed'>('newest');

  // Distinct cities from mock products and users
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    // Add known major Syrian cities
    cities.add('دمشق');
    cities.add('حلب');
    cities.add('حمص');
    products.forEach((p) => {
      const city = p.city?.trim();
      if (city) cities.add(city);
    });
    return Array.from(cities);
  }, [products]);

  // Handle resets
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceMin('');
    setPriceMax('');
    setSelectedCity('all');
    setMinRating(0);
    setSortBy('newest');
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.status === 'active' || p.status === 'sold');

    // 1. Advanced Arabic Search Query Parser
    if (searchQuery.trim() !== '') {
      // Helper function to parse natural Arabic price queries
      const parseArabicSearchQuery = (query: string) => {
        let textQuery = query.toLowerCase().trim();
        let extractedMinPrice: number | null = null;
        let extractedMaxPrice: number | null = null;
        let exactPrice: number | null = null;

        // Map Eastern Arabic numerals (٠-٩) to Western (0-9)
        const arabicDigitsMap: { [key: string]: string } = {
          '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
          '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
        };
        let normalized = textQuery.split('').map(char => arabicDigitsMap[char] || char).join('');
        
        // Normalize letters for easier regex match
        let normalizedForRegex = normalized
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه');

        // Check for "بين [عدد] و [عدد]"
        const betweenRegex = /بين\s+(\d+)\s+و\s*(\d+)/i;
        const matchBetween = normalizedForRegex.match(betweenRegex);
        if (matchBetween) {
          extractedMinPrice = Number(matchBetween[1]);
          extractedMaxPrice = Number(matchBetween[2]);
          normalized = normalized.replace(/بين\s+\d+\s+و\s*\d+/i, '').trim();
        }

        // Check for "اقل من [عدد]" or "أقل من [عدد]"
        const lessThanRegex = /(اقل\s+من|أقل\s+من|تحت|اصغر\s+من|أصغر\s+من)\s+(\d+)/i;
        const matchLess = normalizedForRegex.match(lessThanRegex);
        if (matchLess) {
          extractedMaxPrice = Number(matchLess[2]);
          normalized = normalized.replace(/(اقل\s+من|أقل\s+من|تحت|اصغر\s+من|أصغر\s+من)\s+\d+/i, '').trim();
        }

        // Check for "اكثر من [عدد]" or "أكثر من [عدد]" or "اكبر من" or "أكبر من"
        const moreThanRegex = /(اكثر\s+من|أكثر\s+من|فوق|اكبر\s+من|أكبر\s+من)\s+(\d+)/i;
        const matchMore = normalizedForRegex.match(moreThanRegex);
        if (matchMore) {
          extractedMinPrice = Number(matchMore[2]);
          normalized = normalized.replace(/(اكثر\s+من|أكثر\s+من|فوق|اكبر\s+من|أكبر\s+من)\s+\d+/i, '').trim();
        }

        // Check for standalone numbers representing price like "حذاء 50000"
        const standaloneNumberRegex = /\b(\d+)\b/;
        const matchStandaloneNum = normalized.match(standaloneNumberRegex);
        if (matchStandaloneNum && extractedMinPrice === null && extractedMaxPrice === null) {
          exactPrice = Number(matchStandaloneNum[1]);
          normalized = normalized.replace(standaloneNumberRegex, '').trim();
        }

        return {
          cleanQuery: normalized.trim(),
          minPrice: extractedMinPrice,
          maxPrice: extractedMaxPrice,
          exactPrice: exactPrice
        };
      };

      const parsed = parseArabicSearchQuery(searchQuery);

      // Apply price constraints parsed from query
      if (parsed.minPrice !== null) {
        result = result.filter((p) => p.price >= (parsed.minPrice as number));
      }
      if (parsed.maxPrice !== null) {
        result = result.filter((p) => p.price <= (parsed.maxPrice as number));
      }
      if (parsed.exactPrice !== null) {
        // If there's an exact price in the query (e.g. "حذاء 50000"), we check if it is within a reasonable range or <= the specified budget
        result = result.filter((p) => p.price <= (parsed.exactPrice as number));
      }

      // Apply text search criteria if there is any remaining query text
      if (parsed.cleanQuery !== '') {
        const cleanQueryNormalized = parsed.cleanQuery
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .toLowerCase();

        result = result.filter((p) => {
          const seller = users.find((u) => u.id === p.sellerId);
          const pTitleNorm = p.title.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
          const pDescNorm = p.description.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
          const pCatNorm = (categories.find(c => c.id === p.categoryId)?.name || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
          
          const matchesTitle = pTitleNorm.includes(cleanQueryNormalized);
          const matchesDesc = pDescNorm.includes(cleanQueryNormalized);
          const matchesCategoryName = pCatNorm.includes(cleanQueryNormalized);
          const matchesSeller = seller 
            ? seller.name.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').includes(cleanQueryNormalized) || 
              (seller.username || '').toLowerCase().includes(cleanQueryNormalized)
            : false;

          return matchesTitle || matchesDesc || matchesCategoryName || matchesSeller;
        });
      }
    }

    // 2. Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // 3. Price Range Min
    if (priceMin !== '') {
      result = result.filter((p) => p.price >= priceMin);
    }

    // 4. Price Range Max
    if (priceMax !== '') {
      result = result.filter((p) => p.price <= priceMax);
    }

    // 5. City Filter
    if (selectedCity !== 'all') {
      result = result.filter((p) => (p.city || '').toLowerCase().includes(selectedCity.toLowerCase()));
    }

    // 6. Rating Filter
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    // 7. Sort By
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'top_rated') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'most_viewed') {
      result.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }

    return result;
  }, [products, searchQuery, selectedCategory, priceMin, priceMax, selectedCity, minRating, sortBy, users]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans text-right">
      {/* Sidebar Filters Widget */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 space-y-5 h-fit shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
          <span className="text-xs font-black text-slate-400">فلاتر تضييق البحث</span>
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Filter className="w-4.5 h-4.5 text-amber-500" />
            خيارات التصفية
          </h3>
        </div>

        {/* Category selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 block">تصنيف المنتج الرئيسي:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full text-xs pr-3 pl-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة أقسام المنصة</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Price limits */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 block">نطاق السعر بالليرة السورية (ل.س):</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="من"
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 text-center"
            />
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="إلى"
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 text-center"
            />
          </div>
        </div>

        {/* City Location */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 block">المدينة الجغرافية:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full text-xs pr-3 pl-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كافة المدن والمناطق</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Minimum rating */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 block">الحد الأدنى للتقييم:</label>
          <div className="flex justify-between gap-1">
            {[0, 3, 4, 4.5, 4.8].map((stars) => (
              <button
                key={stars}
                onClick={() => setMinRating(stars)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  minRating === stars
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-650 dark:text-slate-300'
                }`}
              >
                {stars === 0 ? 'الكل' : `${stars} ⭐`}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={handleResetFilters}
          className="w-full py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-350 text-[10px] font-black rounded-xl cursor-pointer transition-colors"
        >
          إعادة تعيين كافة الفلاتر
        </button>
      </div>

      {/* Main Results Listing */}
      <div className="lg:col-span-3 space-y-5">
        {/* Search header & text box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 space-y-3 shadow-xs">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن: طاولة خشب، كعكة فراولة، اسم تاجر، سعر معين..."
              className="w-full text-xs pr-11 pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs flex-wrap gap-2 pt-1 border-t border-slate-50 dark:border-slate-950">
            <span className="text-[10px] text-slate-400 font-bold">
              عثرنا على <strong>{filteredProducts.length}</strong> منتج مطابق لمعاييرك
            </span>

            {/* Sorting mechanism */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                ترتيب النتائج:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="text-[11px] font-bold bg-slate-50 dark:bg-slate-950 pr-2 pl-6 py-1 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-hidden"
              >
                <option value="newest">الأحدث نشرًا أولاً</option>
                <option value="top_rated">الأعلى تقييماً ⭐</option>
                <option value="most_viewed">الأكثر مشاهدة 👁️</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isFavorite={favorites.includes(prod.id)}
                onToggleFavorite={onToggleFavorite}
                onViewDetails={onViewProduct}
                currentUser={currentUser}
                users={users}
                onVisitStore={onVisitStore}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">لم نعثر على نتائج مطابقة</h3>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                جرب كتابة كلمات مختلفة بالبحث، أو تخفيف قيود أسعار الفلاتر، أو تصفح الأقسام الأخرى بالسوق الحر.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer"
            >
              البدء من جديد وإعادة تهيئة الفلاتر
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
