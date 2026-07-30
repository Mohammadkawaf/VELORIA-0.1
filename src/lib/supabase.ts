import { createClient } from '@supabase/supabase-js';
import { Product, User, Category, Order, Review, Message, Report, AppSettings, ProductFilterOptions, Notification, MaintenanceLog, AnnouncementLog } from '../types';

// Retrieve environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Safely initialize the client or log a clear setup guide
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ VELORIA: Supabase is not configured yet. The app is running in Local Storage offline-first fallback mode. Create VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables in AI Studio Settings to connect your live Supabase database.'
  );
} else if (supabase) {
  // Pre-create the required storage buckets automatically so they exist and are publicly accessible
  supabase.storage.createBucket('avatars', { public: true })
    .catch((e) => console.debug('Auto-bucket check for avatars:', e.message || e));
  supabase.storage.createBucket('product-images', { public: true })
    .catch((e) => console.debug('Auto-bucket check for product-images:', e.message || e));
}

// Helper function to map a database profile and an auth email to the custom User object type
export function mapProfileToUser(p: any, authEmail?: string): User {
  return {
    id: p.id,
    name: p.full_name || 'مستخدم فيلوريا',
    username: p.username || '',
    email: authEmail || p.email || '',
    avatar: p.avatar_url || p.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    bio: p.bio || '',
    city: p.city || 'الرياض',
    phone: p.whatsapp || p.whatsapp_number || '',
    whatsapp: p.whatsapp || p.whatsapp_number || '',
    whatsapp_number: p.whatsapp || p.whatsapp_number || '',
    followersCount: 0,
    ratingAverage: p.rating !== undefined && p.rating !== null ? Number(p.rating) : 0,
    ratingsCount: 0,
    isPremium: p.role === 'admin',
    role: p.role || 'user',
    joinedAt: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    coverImage: p.cover_url || p.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300&q=80',
    badges: (p.user_badges || []).map((ub: any) => ub.badges?.name).filter(Boolean) as any[],
    is_featured: p.is_featured === true,
    isFeatured: p.is_featured === true
  };
}

// Local storage helpers for maintenance and announcement logs
function getLocalMaintenanceLogs(): MaintenanceLog[] {
  try {
    const raw = localStorage.getItem('veloria_maintenance_history');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalMaintenanceLog(log: MaintenanceLog) {
  try {
    const current = getLocalMaintenanceLogs();
    const updated = [log, ...current.filter(l => l.id !== log.id)];
    localStorage.setItem('veloria_maintenance_history', JSON.stringify(updated));
  } catch (e) {}
}

function deleteLocalMaintenanceLog(id: string) {
  try {
    const current = getLocalMaintenanceLogs();
    const updated = current.filter(l => l.id !== id);
    localStorage.setItem('veloria_maintenance_history', JSON.stringify(updated));
  } catch (e) {}
}

function clearLocalMaintenanceLogs() {
  try {
    localStorage.removeItem('veloria_maintenance_history');
  } catch (e) {}
}

function getLocalAnnouncementLogs(): AnnouncementLog[] {
  try {
    const raw = localStorage.getItem('veloria_announcement_history');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalAnnouncementLog(log: AnnouncementLog) {
  try {
    const current = getLocalAnnouncementLogs();
    const updated = [log, ...current.filter(l => l.id !== log.id)];
    localStorage.setItem('veloria_announcement_history', JSON.stringify(updated));
  } catch (e) {}
}

function deleteLocalAnnouncementLog(id: string) {
  try {
    const current = getLocalAnnouncementLogs();
    const updated = current.filter(l => l.id !== id);
    localStorage.setItem('veloria_announcement_history', JSON.stringify(updated));
  } catch (e) {}
}

function clearLocalAnnouncementLogs() {
  try {
    localStorage.removeItem('veloria_announcement_history');
  } catch (e) {}
}

// Helper methods with transparent fallbacks to local storage
export const supabaseService = {
  // Authentication & Session Management
  async signUp(email: string, password: string, fullName: string, username: string, whatsappNumber: string): Promise<{ user: User | null; session: any; error: any }> {
    if (!supabase) {
      return { user: null, session: null, error: new Error('سيرفر Supabase غير متصل حالياً.') };
    }

    try {
      const cleanUsername = username.toLowerCase().trim().replace(/[\s@]/g, '');
      const cleanWhatsapp = whatsappNumber.trim().replace(/[\s+]/g, '');

      // 1. Sign up user in Auth
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: cleanUsername,
            full_name: fullName.trim(),
            whatsapp: cleanWhatsapp,
            whatsapp_number: cleanWhatsapp,
            phone: cleanWhatsapp
          }
        }
      });

      if (error) {
        return { user: null, session: null, error };
      }

      const authUser = data.user;
      if (!authUser) {
        return { user: null, session: null, error: new Error('تعذر إنشاء حساب في Supabase.') };
      }

      // Wait a brief moment for the handle_new_user trigger to execute and insert the profile row
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Update the profile with remaining details like whatsapp
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            whatsapp: cleanWhatsapp,
            city: 'الرياض'
          })
          .eq('id', authUser.id);
        
        if (updateError) {
          console.warn('Profile sync update failed (trigger may be delayed):', updateError);
          // Fallback: upsert the profile directly if the trigger didn't fire yet
          await supabase
            .from('profiles')
            .upsert({
              id: authUser.id,
              username: cleanUsername,
              full_name: fullName.trim(),
              whatsapp: cleanWhatsapp,
              role: 'user'
            });
        }
      } catch (err) {
        console.warn('Failed to update phone number in profile:', err);
      }

      // Load the complete user profile
      const profile = await this.getProfile(authUser.id, authUser.email, authUser.user_metadata);

      return {
        user: profile,
        session: data.session,
        error: null
      };
    } catch (err: any) {
      console.warn('Supabase signUp error caught:', err);
      return { user: null, session: null, error: err };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; session: any; error: any }> {
    if (!supabase) {
      return { user: null, session: null, error: new Error('سيرفر Supabase غير متصل حالياً.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, session: null, error };
      }

      const authUser = data.user;
      if (!authUser) {
        return { user: null, session: null, error: new Error('لم يتم العثور على المستخدم.') };
      }

      // Load the profile and merge the email from Auth
      const profile = await this.getProfile(authUser.id, authUser.email, authUser.user_metadata);

      return {
        user: profile,
        session: data.session,
        error: null
      };
    } catch (err: any) {
      console.warn('Supabase signIn error caught:', err);
      return { user: null, session: null, error: err };
    }
  },

  async resetPassword(email: string): Promise<{ error: any }> {
    if (!supabase) {
      return { error: new Error('سيرفر Supabase غير متصل حالياً.') };
    }
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Failed to sign out from Supabase Auth:', err);
    }
  },

  async getCurrentSessionUser(): Promise<User | null> {
    if (!supabase) return null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session || !session.user) return null;
      
      const authUser = session.user;
      return await this.getProfile(authUser.id, authUser.email, authUser.user_metadata);
    } catch (err) {
      console.warn('Failed to fetch session from Supabase:', err);
      return null;
    }
  },

  async getProfile(userId: string, authEmail?: string, userMetadata?: any): Promise<User | null> {
    if (!supabase) {
      return null;
    }
    
    // Ensure the ID is a valid UUID format before querying the database to avoid invalid syntax exceptions
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      return null;
    }
    
    // Fetch the primary user profile with badges
    let data: any = null;
    let error: any = null;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, user_badges(badge_id, badges(*))')
        .eq('id', userId)
        .maybeSingle();
      data = profileData;
      error = profileError;
    } catch (e: any) {
      error = e;
    }
    
    if (error) {
      // Fallback to simple query for redundancy
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (!simpleError) {
          data = simpleData;
        }
      } catch (e: any) {
        // Ignored in production
      }
    }
    
    if (!data) {
      return null;
    }
    
    return mapProfileToUser(data, authEmail || data.email);
  },

  // Profiles
  async getProfiles(): Promise<User[]> {
    if (!supabase) return [];
    
    let data: any = null;
    let error: any = null;

    try {
      const response = await supabase
        .from('profiles')
        .select('*, user_badges(badge_id, badges(*))');
      data = response.data;
      error = response.error;
    } catch (e: any) {
      error = e;
    }
    
    if (error) {
      console.warn('Error fetching profiles with badges from Supabase, falling back to simple select:', error.message || error);
      try {
        const simpleFetch = await supabase
          .from('profiles')
          .select('*');
        if (simpleFetch.error) {
          console.warn('Error fetching profiles from Supabase:', simpleFetch.error);
          throw simpleFetch.error;
        }
        data = simpleFetch.data;
      } catch (e: any) {
        console.warn('Error in simple profiles fetch fallback:', e);
        throw e;
      }
    }

    return (data || []).map((p: any) => mapProfileToUser(p, p.email));
  },

  async updateProfile(user: Partial<User> & { id: string }): Promise<void> {
    if (!supabase) return;

    // Ensure the ID is a valid UUID format before querying the database to avoid invalid syntax exceptions
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isUUID) {
      console.warn('ℹ️ Skip persisting mock user profile update to Supabase:', user.id);
      return;
    }
    
    // We update with exactly the columns that exist in the database schema:
    // full_name, username, bio, city, profile_image, cover_image, phone, whatsapp, updated_at
    const payload: any = {
      updated_at: new Date().toISOString()
    };
    
    if (user.name !== undefined) payload.full_name = user.name;
    if (user.username !== undefined) payload.username = user.username;
    if (user.bio !== undefined) payload.bio = user.bio;
    if (user.city !== undefined) payload.city = user.city;
    if (user.avatar !== undefined) payload.profile_image = user.avatar;
    if (user.coverImage !== undefined) payload.cover_image = user.coverImage;
    if (user.phone !== undefined) payload.whatsapp = user.phone;
    if (user.whatsapp_number !== undefined) payload.whatsapp = user.whatsapp_number;
    
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);
      
    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw error;
    }
  },

  // Products
  async getProducts(options?: ProductFilterOptions): Promise<Product[]> {
    if (!supabase) return [];

    let query = supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        categories!inner(is_active)
      `);

    if (!options?.includeHiddenCategories) {
      query = query.eq('categories.is_active', true);
    }

    // 1. Filter by Status (by default we query all, but we can filter specifically)
    if (options?.status) {
      if (options.status === 'active') {
        query = query.in('status', ['active', 'sold']);
      } else {
        query = query.eq('status', options.status);
      }
    }

    // 2. Filter by Category
    if (options?.categoryId) {
      const catId = typeof options.categoryId === 'string' && options.categoryId.startsWith('cat-')
        ? parseInt(options.categoryId.replace('cat-', ''), 10)
        : Number(options.categoryId);
      if (!isNaN(catId)) {
        query = query.eq('category_id', catId);
      }
    }

    // 2b. Filter by Product IDs (e.g. for favorites list)
    if (options?.productIds) {
      if (options.productIds.length > 0) {
        query = query.in('id', options.productIds);
      } else {
        // Return nothing if an empty array is explicitly passed
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    // 3. Search Term (Title, description)
    if (options?.searchTerm && options.searchTerm.trim() !== '') {
      const term = `%${options.searchTerm.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    // 4. Future Extendable Filters
    if (options?.priceMin !== undefined && options?.priceMin !== null) {
      query = query.gte('price', options.priceMin);
    }
    if (options?.priceMax !== undefined && options?.priceMax !== null) {
      query = query.lte('price', options.priceMax);
    }
    if (options?.city) {
      query = query.eq('city', options.city);
    }
    if (options?.currency) {
      query = query.eq('currency', options.currency);
    }
    if (options?.isVerified !== undefined && options?.isVerified !== null) {
      query = query.eq('is_verified', options.isVerified);
    }
    if (options?.isFeatured !== undefined && options?.isFeatured !== null) {
      query = query.eq('is_featured', options.isFeatured);
    }
    if (options?.hasOffer !== undefined && options?.hasOffer !== null) {
      query = query.eq('has_offer', options.hasOffer);
    }
    if (options?.condition) {
      query = query.eq('condition', options.condition);
    }
    if (options?.delivery !== undefined && options?.delivery !== null) {
      query = query.eq('delivery', options.delivery);
    }

    // 5. Apply sorting
    const sort = options?.sortBy || 'newest';
    console.log(`Received Sort = ${sort}`);
    switch (sort) {
      case 'oldest':
        console.log('Entered oldest');
        query = query.order('created_at', { ascending: true });
        break;
      case 'price-high':
      case 'price-desc':
        console.log('Entered price-desc');
        query = query.order('price', { ascending: false });
        break;
      case 'price-low':
      case 'price-asc':
        console.log('Entered price-asc');
        query = query.order('price', { ascending: true });
        break;
      case 'top-rated':
        console.log('Entered top-rated');
        query = query.order('rating_average', { ascending: false, nullsFirst: false });
        break;
      case 'most-viewed':
        console.log('Entered most-viewed');
        query = query.order('views_count', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        console.log('Entered newest');
        query = query.order('created_at', { ascending: false });
        break;
    }

    console.log('Executing Query...');
    const { data, error } = await query;

    if (data) {
      console.log('First 5 queried products:', data.slice(0, 5).map((p: any) => ({
        title: p.title,
        price: p.price,
        views_count: p.views_count,
        rating_average: p.rating_average,
        created_at: p.created_at
      })));
    }

    if (error) {
      console.warn('Error fetching products with query builder from Supabase:', error);
      throw error;
    }

    return (data || []).map((p: any) => {
      const sortedImages = (p.product_images || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((img: any) => img.image_url);

      return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        price: Number(p.price),
        currency: p.currency || 'ل.س',
        categoryId: p.category_id,
        images: sortedImages.length > 0 ? sortedImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80'],
        sellerId: p.user_id,
        status: p.status as any,
        isSold: p.is_sold || false,
        createdAt: p.created_at,
        rating: p.rating_average !== undefined && p.rating_average !== null ? Number(p.rating_average) : 0,
        reviewsCount: p.ratings_count !== undefined && p.ratings_count !== null ? Number(p.ratings_count) : 0,
        viewsCount: p.views_count || 0,
        city: p.city || null
      };
    });
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const finalCategoryId =
      typeof product.categoryId === 'string' &&
      product.categoryId.startsWith('cat-')
        ? parseInt(product.categoryId.replace('cat-', ''), 10)
        : product.categoryId;

    const insertPayload = {
      user_id: product.sellerId,
      category_id: finalCategoryId,
      title: product.title,
      description: product.description,
      price: product.price,
      status: product.status || 'active',
      is_sold: product.status === 'sold',
      currency: product.currency || 'ل.س',
      city: product.city || null
    };

    console.log('--- [createProduct START] ---');
    console.log('1- البيانات المرسلة إلى insert:', insertPayload);
    console.log('2- قيمة user_id:', product.sellerId);
    console.log('3- قيمة category_id:', finalCategoryId);

    console.log("========== CREATE PRODUCT DEBUG ==========");
    console.log("Received Product =", product);
    console.log("Product.city =", product.city);
    console.log("Insert Payload =", insertPayload);
    console.log("Insert Payload.city =", insertPayload.city);
    console.log("==========================================");

    // Insert Product core
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    console.log("Insert Result =", prodData);
    console.log("Insert Error =", prodError);

    console.log('4- نتيجة insert كاملة:', { prodData, prodError });
    console.log('5- قيمة prodData:', prodData);
    console.log('6- قيمة prodError كاملة كما تعود من Supabase:', prodError);

    if (prodData) {
      console.log('7- نجح الإدخال! UUID المنتج الجديد:', prodData.id);
    }
    if (prodError) {
      console.log('8- فشل الإدخال! رسالة الخطأ الحقيقية القادمة من Supabase:', prodError.message || prodError);
    }
    console.log('--- [createProduct END] ---');

    if (prodError) throw prodError;

    // Insert Product Images
    const imageUrls = product.images;
    console.log("Uploaded image URLs:", imageUrls);

    console.log("product.images before condition:", product.images);
    if (product.images) {
      console.log("product.images.length:", product.images.length);
    } else {
      console.log("product.images is undefined or null");
    }

    if (product.images && product.images.length > 0) {
      const imagePayloads = product.images.map((url, idx) => ({
        product_id: prodData.id,
        image_url: url,
        sort_order: idx
      }));

      console.log("imagePayloads =", imagePayloads);

      const { error: imgError } = await supabase
        .from('product_images')
        .insert(imagePayloads);

      console.log("imgError =", imgError);

      if (imgError) console.warn('Error uploading product images metadata:', imgError);
    } else {
      console.log("SKIPPED IMAGE INSERT BECAUSE product.images IS EMPTY");
    }

    return {
      id: prodData.id,
      title: prodData.title,
      description: prodData.description || '',
      price: Number(prodData.price),
      currency: prodData.currency || 'ل.س',
      categoryId: prodData.category_id,
      images: product.images,
      sellerId: prodData.user_id,
      status: prodData.status,
      isSold: prodData.is_sold || false,
      createdAt: prodData.created_at,
      rating: 0,
      reviewsCount: 0,
      viewsCount: 0,
      city: prodData.city || null
    };
  },

  async updateProductStatus(productId: string, status: 'active' | 'sold' | 'expired' | 'hidden'): Promise<void> {
    if (!supabase) return;
    const payload: any = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'sold') {
      payload.is_sold = true;
    } else if (status === 'active') {
      payload.is_sold = false;
    }
    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId);

    if (error) throw error;
  },

  async incrementProductViews(productId: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.rpc("increment_product_views", {
        product_id: productId
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error incrementing product views:', err);
    }
  },

  // Favorites
  async getFavorites(userId: string): Promise<string[]> {
    if (!supabase) return [];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) return [];
    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((f: any) => f.product_id);
  },

  async toggleFavorite(userId: string, productId: string, isFav: boolean): Promise<void> {
    if (!supabase) return;
    const isUserUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const isProdUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    if (!isUserUUID || !isProdUUID) return;
    if (isFav) {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id: productId });
      if (error && error.code !== '23505') throw error; // Ignore duplicate key
    } else {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) throw error;
    }
  },

  // Followers
  async getFollowedSellers(userId: string): Promise<string[]> {
    console.log('[Followers DB Diagnostic] Starting followers request...');
    console.log('[Followers DB Diagnostic] VITE_SUPABASE_URL:', (import.meta as any).env?.VITE_SUPABASE_URL || supabaseUrl);
    console.log('[Followers DB Diagnostic] Supabase Client Initialized:', Boolean(supabase));
    console.log('[Followers DB Diagnostic] userId:', userId);
    console.log('[Followers DB Diagnostic] Time:', new Date().toISOString());
    console.log('[Followers DB Diagnostic] Table:', 'followers');

    if (!supabase) {
      console.warn('[Followers DB Diagnostic] Supabase client is null');
      return [];
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      console.warn('[Followers DB Diagnostic] userId is not a valid UUID:', userId);
      return [];
    }

    console.log('[Followers DB] Fetching followed sellers from followers table for follower_id:', userId);

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) {
        console.error('[Followers DB Diagnostic] Supabase Error detected:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          errorType: 'Supabase Error'
        });
        throw error;
      }

      const followedIds = (data || []).map((f: any) => f.following_id);
      console.log('[Followers DB] Followed sellers loaded from DB:', followedIds);
      return followedIds;
    } catch (err: any) {
      const isNetworkError = err instanceof TypeError || err?.name === 'TypeError' || err?.message?.includes('Failed to fetch');
      console.error('[Followers DB Diagnostic] Request failed:', {
        isNetworkError,
        errorType: err?.name || typeof err,
        errorMessage: err?.message || String(err),
        stack: err?.stack,
        navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        category: isNetworkError ? 'Network Error' : (err?.code ? 'Supabase Error' : 'Unknown Error')
      });
      throw err;
    }
  },

  async toggleFollow(followerId: string, followingId: string, shouldFollow: boolean): Promise<void> {
    if (!supabase) return;
    const isFollowerUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(followerId);
    const isFollowingUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(followingId);
    if (!isFollowerUUID || !isFollowingUUID) {
      console.warn('[Followers DB] Skipping DB toggleFollow because IDs are not valid UUIDs:', { followerId, followingId });
      return;
    }

    if (shouldFollow) {
      console.log('[Followers DB] BEFORE INSERT into followers table:', { follower_id: followerId, following_id: followingId });
      const { data, error } = await supabase
        .from('followers')
        .insert({ follower_id: followerId, following_id: followingId })
        .select();

      if (error && error.code !== '23505') {
        console.error('[Followers DB] INSERT error in followers table:', error);
        throw error;
      }
      console.log('[Followers DB] AFTER INSERT into followers table successful:', data);
    } else {
      console.log('[Followers DB] BEFORE DELETE from followers table:', { follower_id: followerId, following_id: followingId });
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) {
        console.error('[Followers DB] DELETE error in followers table:', error);
        throw error;
      }
      console.log('[Followers DB] AFTER DELETE from followers table successful.');
    }
  },

  async getFollowersCount(followingId: string): Promise<number> {
    if (!supabase) return 0;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(followingId);
    if (!isUUID) return 0;
    console.log('[Followers DB] Fetching followers count for following_id:', followingId);
    const { count, error } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', followingId);

    if (error) {
      console.error('[Followers DB] Error counting followers:', error);
      return 0;
    }
    const finalCount = count ?? 0;
    console.log(`[Followers DB] Followers count for ${followingId} is: ${finalCount}`);
    return finalCount;
  },

  async getAllFollowersCounts(): Promise<Record<string, number>> {
    if (!supabase) return {};
    console.log('[Followers DB] Fetching all followers to compute followers counts...');
    const { data, error } = await supabase
      .from('followers')
      .select('following_id');

    if (error) {
      console.error('[Followers DB] Error fetching all followers:', error);
      return {};
    }
    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      if (row.following_id) {
        counts[row.following_id] = (counts[row.following_id] || 0) + 1;
      }
    });
    console.log('[Followers DB] All store followers counts computed:', counts);
    return counts;
  },

  // Orders
  async getOrders(userId: string): Promise<Order[]> {
    if (!supabase) return [];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) return [];
    const { data, error } = await supabase
      .from('orders')
      .select('*, products(*, product_images(*)), buyer:profiles!buyer_id(full_name), seller:profiles!seller_id(full_name)')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((o: any) => {
      const sortedImages = (o.products?.product_images || [])
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((img: any) => img.image_url);

      const productImage = sortedImages.length > 0 
        ? sortedImages[0] 
        : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80';

      return {
        id: o.id,
        productId: o.product_id,
        productTitle: o.products?.title || 'منتج غير معروف',
        productImage: productImage,
        buyerId: o.buyer_id,
        buyerName: o.buyer?.full_name || 'مشتري فيلوريا',
        sellerId: o.seller_id,
        sellerName: o.seller?.full_name || 'بائع فيلوريا',
        price: Number(o.product_price) || Number(o.products?.price) || 0,
        quantity: Number(o.quantity) || 1,
        status: o.status as any,
        buyerMessage: o.buyer_message || undefined,
        productPrice: Number(o.product_price) || undefined,
        createdAt: o.created_at,
        updatedAt: o.updated_at || undefined,
        order_number: o.order_number || undefined,
        orderNumber: o.order_number || undefined,
        sellerRating: o.seller_rating || undefined,
        productRating: o.product_rating || undefined,
        ratingComment: o.rating_comment || undefined,
        cancellationReason: o.cancellation_reason || undefined
      };
    });
  },

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    if (!supabase) throw new Error('Supabase client unconfigured.');
    const { data, error } = await supabase
      .from('orders')
      .insert({
        buyer_id: order.buyerId,
        seller_id: order.sellerId,
        product_id: order.productId,
        quantity: order.quantity || 1,
        buyer_message: order.buyerMessage || null,
        product_price: order.productPrice || order.price || 0,
        status: order.status || 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...order,
      id: data.id,
      status: data.status as any,
      buyerMessage: data.buyer_message || undefined,
      productPrice: Number(data.product_price) || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at || undefined,
      order_number: data.order_number || undefined,
      orderNumber: data.order_number || undefined,
      sellerRating: data.seller_rating || undefined,
      productRating: data.product_rating || undefined,
      ratingComment: data.rating_comment || undefined,
      cancellationReason: data.cancellation_reason || undefined
    };
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    extraData?: {
      sellerRating?: number;
      productRating?: number;
      ratingComment?: string;
      cancellationReason?: string;
    }
  ): Promise<void> {
    if (!supabase) return;
    
    // We update only the columns that actually exist in the orders table in the database.
    // The rating fields and cancellation reasons are stored in separate tables or local states
    // and must not be pushed into the orders table, as they do not exist as columns there.
    const updatePayload: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id || null;

    console.log('--- updateOrderStatus Runtime Debug Logs ---');
    console.log('orderId:', orderId);
    console.log('updatePayload:', JSON.stringify(updatePayload, null, 2));
    console.log('currentUser.id / auth.uid():', currentUserId);
    console.log('---------------------------------------------');

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.error('Full Supabase update error:', error);
      throw error;
    }
  },

  // Reports
  async submitReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> {
    if (!supabase) throw new Error('Supabase client unconfigured.');
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: report.reporterId,
        reported_user_id: report.type === 'user' ? report.targetId : null,
        reported_product_id: report.type === 'product' ? report.targetId : null,
        reason: report.reason + ': ' + report.details,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...report,
      id: data.id,
      status: 'pending',
      createdAt: data.created_at
    };
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('Error fetching categories from Supabase:', error.message);
        return [];
      }

      return (data || []).map((c: any) => ({
        id: String(c.id),
        name: c.name,
        icon: c.icon || 'MoreHorizontal',
        is_active: c.is_active !== false,
        isActive: c.is_active !== false
      }));
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
      return [];
    }
  },

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    let settings: AppSettings = { ...defaultAppSettings };

    if (!supabase || !isSupabaseConfigured) {
      return settings;
    }

    try {
      // Fetch the first record from application_settings
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .limit(1);

      if (error) {
        console.warn('Could not load settings from application_settings table:', error.message);
        return settings;
      }

      if (data && data.length > 0) {
        const row = data[0];

        // Map branding fields directly from DB columns
        if (row.platform_name !== undefined && row.platform_name !== null) {
          settings.platformName = String(row.platform_name);
        }
        if (row.platform_logo !== undefined && row.platform_logo !== null) {
          settings.platformLogo = String(row.platform_logo);
        }
        if (row.platform_description !== undefined && row.platform_description !== null) {
          settings.platformDescription = String(row.platform_description);
        }
        if (row.current_version !== undefined && row.current_version !== null) {
          settings.currentVersion = String(row.current_version);
        }
        if (row.copyright_text !== undefined && row.copyright_text !== null) {
          settings.copyrightText = String(row.copyright_text);
        }
        if (row.website_url !== undefined && row.website_url !== null) {
          settings.websiteUrl = String(row.website_url);
        }

        // Map maintenance and announcement fields directly from DB columns
        if (row.maintenance_mode !== undefined && row.maintenance_mode !== null) {
          settings.maintenanceModeEnabled = Boolean(
            row.maintenance_mode === true ||
            row.maintenance_mode === 'true' ||
            row.maintenance_mode === 1
          );
        }

        if (row.maintenance_reason !== undefined && row.maintenance_reason !== null) {
          settings.maintenanceReason = String(row.maintenance_reason);
        }

        if (row.maintenance_return_time !== undefined && row.maintenance_return_time !== null) {
          settings.maintenanceReturnTime = String(row.maintenance_return_time);
        }

        if (row.announcement_enabled !== undefined && row.announcement_enabled !== null) {
          settings.announcementEnabled = Boolean(
            row.announcement_enabled === true ||
            row.announcement_enabled === 'true' ||
            row.announcement_enabled === 1
          );
        }

        if (row.announcement_text !== undefined && row.announcement_text !== null) {
          settings.announcementContent = String(row.announcement_text);
        }

        // Map donation settings
        if (row.donations_enabled !== undefined && row.donations_enabled !== null) {
          settings.donationEnabled = Boolean(
            row.donations_enabled === true ||
            row.donations_enabled === 'true' ||
            row.donations_enabled === 1
          );
        }

        if (row.donation_shamcash_id !== undefined && row.donation_shamcash_id !== null) {
          settings.donationShamCashId = String(row.donation_shamcash_id);
          settings.shamCashAccount = String(row.donation_shamcash_id);
        }

        if (row.donation_message !== undefined && row.donation_message !== null) {
          settings.donationMessage = String(row.donation_message);
        }

        if (row.donation_instructions !== undefined && row.donation_instructions !== null) {
          settings.donationInstructions = String(row.donation_instructions);
        }

        // Map legal pages content
        if (row.disclaimer_text !== undefined && row.disclaimer_text !== null) {
          settings.disclaimerText = String(row.disclaimer_text);
          settings.disclaimer = String(row.disclaimer_text);
        }

        if (row.terms_of_use !== undefined && row.terms_of_use !== null) {
          settings.termsOfUse = String(row.terms_of_use);
        }

        if (row.privacy_policy !== undefined && row.privacy_policy !== null) {
          settings.privacyPolicy = String(row.privacy_policy);
        }

        // Map social media links from official DB columns
        if (row.facebook_page !== undefined && row.facebook_page !== null) {
          settings.socialFacebook = String(row.facebook_page);
        }
        if (row.instagram_page !== undefined && row.instagram_page !== null) {
          settings.socialInstagram = String(row.instagram_page);
        }
        if (row.telegram_link !== undefined && row.telegram_link !== null) {
          settings.socialTelegram = String(row.telegram_link);
        }
        if (row.youtube_channel !== undefined && row.youtube_channel !== null) {
          settings.socialYoutube = String(row.youtube_channel);
        }
        if (row.tiktok_page !== undefined && row.tiktok_page !== null) {
          settings.socialTiktok = String(row.tiktok_page);
        }
        if (row.x_page !== undefined && row.x_page !== null) {
          settings.socialX = String(row.x_page);
        }

        console.log('[AppSettings] Loaded Settings from DB', {
          platform_name: settings.platformName,
          donations_enabled: settings.donationEnabled,
          socialFacebook: settings.socialFacebook,
          socialInstagram: settings.socialInstagram,
          socialTelegram: settings.socialTelegram,
          socialYoutube: settings.socialYoutube,
          socialTiktok: settings.socialTiktok,
          socialX: settings.socialX
        });
      }
    } catch (err: any) {
      console.warn('Error loading settings from Supabase:', err.message);
    }

    return settings;
  },

  async updateAppSettings(settings: AppSettings): Promise<void> {
    if (!supabase || !isSupabaseConfigured) {
      return;
    }

    try {
      // Fetch existing first record to update
      const { data: existingRows } = await supabase
        .from('application_settings')
        .select('*')
        .limit(1);

      const payload: Record<string, any> = {
        platform_name: settings.platformName || '',
        platform_logo: settings.platformLogo || '',
        platform_description: settings.platformDescription || '',
        current_version: settings.currentVersion || '',
        copyright_text: settings.copyrightText || '',
        website_url: settings.websiteUrl || '',
        maintenance_mode: Boolean(settings.maintenanceModeEnabled),
        maintenance_reason: settings.maintenanceReason || '',
        maintenance_return_time: settings.maintenanceReturnTime || '',
        announcement_enabled: Boolean(settings.announcementEnabled),
        announcement_text: settings.announcementContent || settings.announcementTitle || '',
        donations_enabled: Boolean(settings.donationEnabled),
        donation_shamcash_id: settings.donationShamCashId || settings.shamCashAccount || '',
        donation_message: settings.donationMessage || '',
        donation_instructions: settings.donationInstructions || '',
        disclaimer_text: settings.disclaimerText || settings.disclaimer || '',
        terms_of_use: settings.termsOfUse || '',
        privacy_policy: settings.privacyPolicy || '',
        facebook_page: settings.socialFacebook || settings.facebookPage || '',
        instagram_page: settings.socialInstagram || settings.instagramPage || '',
        telegram_link: settings.socialTelegram || settings.telegramLink || '',
        youtube_channel: settings.socialYoutube || '',
        tiktok_page: settings.socialTiktok || '',
        x_page: settings.socialX || '',
        updated_at: new Date().toISOString()
      };

      console.log('[Branding] BEFORE UPDATE', {
        platform_name: payload.platform_name,
        platform_logo: payload.platform_logo,
        platform_description: payload.platform_description,
        current_version: payload.current_version,
        copyright_text: payload.copyright_text,
        website_url: payload.website_url
      });

      if (existingRows && existingRows.length > 0) {
        const firstRow = existingRows[0];
        let updateQuery = supabase.from('application_settings').update(payload);
        if (firstRow.id !== undefined && firstRow.id !== null) {
          updateQuery = updateQuery.eq('id', firstRow.id);
        }
        const { error: updateError } = await updateQuery;
        if (updateError) {
          console.error('Error updating application_settings record:', updateError.message);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('application_settings')
          .insert([payload]);

        if (insertError) {
          console.error('Error inserting initial application_settings record:', insertError.message);
          throw insertError;
        }
      }

      console.log('[Branding] AFTER UPDATE', {
        platform_name: payload.platform_name,
        platform_logo: payload.platform_logo,
        platform_description: payload.platform_description,
        current_version: payload.current_version,
        copyright_text: payload.copyright_text,
        website_url: payload.website_url
      });
    } catch (err: any) {
      console.warn('Failed to update app settings in Supabase:', err.message);
      throw err;
    }
  },

  // Maintenance Logs
  async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    if (!supabase || !isSupabaseConfigured) {
      return getLocalMaintenanceLogs();
    }
    try {
      const { data, error } = await supabase
        .from('maintenance_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch maintenance_history table:', error.message);
        return getLocalMaintenanceLogs();
      }

      const fetched: MaintenanceLog[] = (data || []).map((row: any) => ({
        id: String(row.id),
        adminName: row.admin_name || 'المدير العام',
        actionType: row.action_type || 'تفعيل',
        reason: row.reason || '',
        returnTime: row.return_time || '',
        createdAt: row.created_at || new Date().toISOString()
      }));

      try {
        localStorage.setItem('veloria_maintenance_history', JSON.stringify(fetched));
      } catch (e) {}

      return fetched;
    } catch (err) {
      return getLocalMaintenanceLogs();
    }
  },

  async addMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): Promise<MaintenanceLog> {
    const tempId = 'maint_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newLog: MaintenanceLog = {
      id: tempId,
      ...log
    };

    saveLocalMaintenanceLog(newLog);

    if (!supabase || !isSupabaseConfigured) {
      return newLog;
    }

    try {
      const payload = {
        admin_name: log.adminName,
        action_type: log.actionType,
        reason: log.reason,
        return_time: log.returnTime || '',
        created_at: log.createdAt || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('maintenance_history')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        const created: MaintenanceLog = {
          id: String(data[0].id),
          adminName: data[0].admin_name || log.adminName,
          actionType: data[0].action_type || log.actionType,
          reason: data[0].reason || log.reason,
          returnTime: data[0].return_time || log.returnTime,
          createdAt: data[0].created_at || log.createdAt
        };
        saveLocalMaintenanceLog(created);
        return created;
      }
    } catch (err) {
      console.warn('Could not save to maintenance_history DB table:', err);
    }

    return newLog;
  },

  async deleteMaintenanceLog(id: string): Promise<void> {
    deleteLocalMaintenanceLog(id);
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase.from('maintenance_history').delete().eq('id', id);
    } catch (err) {
      console.warn('Error deleting maintenance_history:', err);
    }
  },

  async clearMaintenanceLogs(): Promise<void> {
    clearLocalMaintenanceLogs();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase.from('maintenance_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('Error clearing maintenance_history:', err);
    }
  },

  // Announcement Logs
  async getAnnouncementLogs(): Promise<AnnouncementLog[]> {
    if (!supabase || !isSupabaseConfigured) {
      return getLocalAnnouncementLogs();
    }
    try {
      const { data, error } = await supabase
        .from('announcement_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch announcement_history table:', error.message);
        return getLocalAnnouncementLogs();
      }

      const fetched: AnnouncementLog[] = (data || []).map((row: any) => ({
        id: String(row.id),
        adminName: row.admin_name || 'المدير العام',
        title: row.title || '',
        content: row.content || '',
        enabled: row.enabled === true || row.enabled === 'true' || row.enabled === 1,
        color: row.color || 'amber',
        createdAt: row.created_at || new Date().toISOString()
      }));

      try {
        localStorage.setItem('veloria_announcement_history', JSON.stringify(fetched));
      } catch (e) {}

      return fetched;
    } catch (err) {
      return getLocalAnnouncementLogs();
    }
  },

  async addAnnouncementLog(log: Omit<AnnouncementLog, 'id'>): Promise<AnnouncementLog> {
    const tempId = 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newLog: AnnouncementLog = {
      id: tempId,
      ...log
    };

    saveLocalAnnouncementLog(newLog);

    if (!supabase || !isSupabaseConfigured) {
      return newLog;
    }

    try {
      const payload = {
        admin_name: log.adminName,
        title: log.title,
        content: log.content,
        enabled: Boolean(log.enabled),
        color: log.color,
        created_at: log.createdAt || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('announcement_history')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        const created: AnnouncementLog = {
          id: String(data[0].id),
          adminName: data[0].admin_name || log.adminName,
          title: data[0].title || log.title,
          content: data[0].content || log.content,
          enabled: data[0].enabled === true || data[0].enabled === 'true' || data[0].enabled === 1,
          color: data[0].color || log.color,
          createdAt: data[0].created_at || log.createdAt
        };
        saveLocalAnnouncementLog(created);
        return created;
      }
    } catch (err) {
      console.warn('Could not save to announcement_history DB table:', err);
    }

    return newLog;
  },

  async deleteAnnouncementLog(id: string): Promise<void> {
    deleteLocalAnnouncementLog(id);
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase.from('announcement_history').delete().eq('id', id);
    } catch (err) {
      console.warn('Error deleting announcement_history:', err);
    }
  },

  async clearAnnouncementLogs(): Promise<void> {
    clearLocalAnnouncementLogs();
    if (!supabase || !isSupabaseConfigured) return;

    try {
      await supabase.from('announcement_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('Error clearing announcement_history:', err);
    }
  },

  async addProductRating(
    productId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<void> {
    if (!supabase) return;
    
    const insertObj = {
      product_id: productId,
      reviewer_user_id: userId,
      rating,
      comment,
      created_at: new Date().toISOString()
    };
    
    console.log('--- addProductRating Insert Object ---', JSON.stringify(insertObj, null, 2));

    const { error } = await supabase
      .from('product_ratings')
      .insert(insertObj);
    if (error) {
      console.error('Error adding product rating in Supabase:', error);
      throw error;
    }
  },

  async checkProductRatingExists(productId: string, userId: string): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { data, error } = await supabase
        .from('product_ratings')
        .select('id')
        .eq('product_id', productId)
        .eq('reviewer_user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error querying product_ratings with reviewer_user_id, trying user_id:', error.message);
        const { data: dataFallback, error: errorFallback } = await supabase
          .from('product_ratings')
          .select('id')
          .eq('product_id', productId)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (errorFallback) {
          console.error('Fallback query for user_id also failed:', errorFallback.message);
          return false;
        }
        return !!dataFallback;
      }

      return !!data;
    } catch (err) {
      console.error('Failed to check product rating existence:', err);
      return false;
    }
  },

  async updateProductRatingStats(productId: string): Promise<{ average: number; count: number }> {
    if (!supabase) return { average: 0, count: 0 };
    
    const { data, error } = await supabase
      .from('product_ratings')
      .select('rating')
      .eq('product_id', productId);
      
    if (error) {
      console.error('Error fetching product ratings stats:', error);
      throw error;
    }
    
    const count = data ? data.length : 0;
    const sum = data ? data.reduce((acc: number, curr: any) => acc + curr.rating, 0) : 0;
    const average = count > 0 ? Number((sum / count).toFixed(1)) : 0;
    
    const { error: updateError } = await supabase
      .from('products')
      .update({
        rating_average: average,
        ratings_count: count
      })
      .eq('id', productId);
      
    if (updateError) {
      console.warn('Could not update products rating_average and ratings_count in database (might not exist):', updateError.message);
    }
    
    return { average, count };
  },

  async getProductRatings(productId: string): Promise<Review[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from("product_ratings")
        .select(`
          id,
          product_id,
          reviewer_user_id,
          rating,
          comment,
          created_at,
          profiles:reviewer_user_id (
            id,
            full_name,
            profile_image
          )
        `)
        .eq("product_id", productId);

      console.log("Supabase Ratings:", data);

      if (error) {
        console.error('Error fetching product ratings:', error.message);
        return [];
      }

      return (data || []).map((r: any) => {
        const profile = r.profiles;
        return {
          id: r.id,
          productId: r.product_id,
          reviewerId: r.reviewer_user_id,
          reviewerName: profile?.full_name || 'عضو فيلوريا',
          reviewerAvatar: profile?.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          rating: r.rating,
          comment: r.comment || '',
          createdAt: r.created_at || new Date().toISOString()
        };
      });
    } catch (err) {
      console.error('Failed to fetch product ratings from database:', err);
      return [];
    }
  },

  async getAllProductRatings(): Promise<Review[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from("product_ratings")
        .select(`
          id,
          product_id,
          reviewer_user_id,
          rating,
          comment,
          created_at,
          profiles:reviewer_user_id (
            id,
            full_name,
            profile_image
          )
        `);

      if (error) {
        console.error('Error fetching all product ratings:', error.message);
        return [];
      }

      return (data || []).map((r: any) => {
        const profile = r.profiles;
        return {
          id: r.id,
          productId: r.product_id,
          reviewerId: r.reviewer_user_id,
          reviewerName: profile?.full_name || 'عضو فيلوريا',
          reviewerAvatar: profile?.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          rating: r.rating,
          comment: r.comment || '',
          createdAt: r.created_at || new Date().toISOString()
        };
      });
    } catch (err) {
      console.error('Failed to fetch all product ratings from database:', err);
      return [];
    }
  },

  async getNotifications(): Promise<Notification[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications from Supabase:', error.message);
        return [];
      }

      return (data || []).map((n: any) => ({
        id: String(n.id),
        userId: n.recipient_id || n.user_id || 'all',
        senderId: n.sender_id,
        recipientId: n.recipient_id,
        sender_id: n.sender_id,
        recipient_id: n.recipient_id,
        audience: n.audience || (n.recipient_id ? 'specific' : 'all'),
        type: n.type || 'system',
        title: n.title || '',
        message: n.message || n.body || '',
        referenceId: n.reference_id,
        link: n.link,
        createdAt: n.created_at || new Date().toISOString(),
        created_at: n.created_at || new Date().toISOString(),
        read: n.is_read || false,
        is_read: n.is_read || false
      })) as Notification[];
    } catch (err) {
      console.error('Failed to fetch notifications from Supabase:', err);
      return [];
    }
  },

  async markNotificationAsRead(notifId: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId);

      if (error) {
        console.warn('Error marking notification as read in Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  },

  async markAllNotificationsAsReadForUser(userId: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured || !userId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .or(`recipient_id.eq.${userId},user_id.eq.${userId}`);

      if (error) {
        console.warn('Error marking all notifications as read in Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    }
  },

  // Activity Logs
  async getActivityLogs(): Promise<any[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching activity_logs from Supabase:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch activity_logs from Supabase:', err);
      return [];
    }
  },

  async addActivityLog(log: {
    user_id?: string | null;
    user_name: string;
    user_email?: string;
    user_role: string;
    operation: string;
    details?: string;
    ip_address?: string | null;
    user_agent?: string;
    device_type?: string;
    status?: string;
    panel?: string;
    target_type?: string | null;
    target_id?: string | null;
    target_name?: string | null;
    target_user_id?: string | null;
    target_user_email?: string | null;
  }) {
    if (!supabase || !isSupabaseConfigured) {
      return null;
    }
    try {
      const payload = {
        user_id: log.user_id || null,
        user_name: log.user_name,
        user_email: log.user_email || '',
        user_role: log.user_role,
        operation: log.operation,
        details: log.details || '',
        ip_address: null,
        user_agent: log.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        device_type: log.device_type || getDeviceType(),
        status: log.status || 'success',
        panel: log.panel || 'Admin',
        target_type: log.target_type || null,
        target_id: log.target_id ? String(log.target_id) : null,
        target_name: log.target_name || null,
        target_user_id: log.target_user_id ? String(log.target_user_id) : null,
        target_user_email: log.target_user_email || null,
      };

      const { data, error } = await supabase
        .from('activity_logs')
        .insert([payload])
        .select('*');

      if (error) {
        console.warn('Error inserting activity log to Supabase:', error.message);
        return null;
      }
      return data?.[0] || null;
    } catch (err) {
      console.warn('Failed to insert activity log to Supabase:', err);
      return null;
    }
  },

  async clearActivityLogs(): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.warn('Error clearing activity_logs in Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Failed to clear activity_logs in Supabase:', err);
      return false;
    }
  }
};

export function getDeviceType(): 'Android' | 'iPhone' | 'Windows' | 'Mac' | 'Linux' | 'Unknown' {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return 'Unknown';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iPhone';
  if (/Win/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

export const defaultAppSettings: AppSettings = {
  // Contact info
  supportEmail: 'support@veloria.org',
  whatsappNumber: '+963 930 000 000',
  telegramLink: 'https://t.me/VeloriaMarket',
  facebookPage: 'https://facebook.com/VeloriaMarket',
  instagramPage: 'https://instagram.com/VeloriaMarket',
  websiteUrl: 'https://veloria.org',
  businessHours: 'الدعم متاح 24/7 لمراجعة الطلبات والرسائل الواردة',
  supportWelcomeMessage: 'يسعدنا تواصلكم معنا دائماً! سواء كنتم بحاجة إلى الدعم الفني، أو ترغبون في الإبلاغ عن مشكلة، أو تودون اقتراح ميزة لتطوير المنصة، فإن فريق فيلوريا هنا للاستماع لآرائكم وتلبية احتياجاتكم.',

  // Platform info
  platformName: 'VELORIA',
  platformLogo: '🛍️',
  platformDescription: 'منصة فيلوريا (VELORIA) هي مبادرة وطنية حرة تهدف لتمكين أصحاب الحرف اليدوية والمشاريع المنزلية من خلال توفير سوق إلكتروني متكامل يعزز التجارة المحلية الشفافة ويسهل التواصل المباشر بين المنتجين والمستهلكين في كافة المدن السورية.',
  currentVersion: 'v1.4.2-PreLaunch',
  copyrightText: 'جميع الحقوق محفوظة © 2026 VELORIA',

  // Donation settings
  shamCashAccount: 'XXXXXXXXXX',
  donationInstructions: 'يرجى تحويل مبلغ المساهمة عبر خدمة "شام كاش" إلى رقم الحساب أعلاه، ثم النقر على زر "لقد قمت بالتحويل" لتسجيل المعاملة.',
  donationMessage: 'هل ساعدتك منصة فيلوريا في إتمام صفقتك بنجاح؟ مساهمتك الاختيارية تعزز استقرار المنصة وتطورها.',
  donationEnabled: true,

  // Legal pages
  privacyPolicy: `١. البيانات التي نجمعها لحفظ استقرار حسابك:
نقوم بحفظ معلومات التسجيل الأساسية مثل الاسم، اسم المستخدم، البريد الإلكتروني، والمدينة لنتمكن من عرض إعلاناتك أمام المتصفحين والباحثين في مدينتك بشكل جغرافي دقيق وفعال.

٢. حماية وتشفير الرسائل والمراسلات:
يتم حفظ جميع الدردشات والمراسلات بشكل آمن وخاص بالكامل بين البائع والمشتري، ولا يتم الاطلاع عليها إلا في حالات النزاع أو تقديم بلاغ رسمي من أحد الأطراف لضمان نزاهة التعاملات.

٣. ملفات تعريف الارتباط والتقنيات المحلية:
نستخدم وحدات التخزين المحلية بالمتصفح (LocalStorage) لحفظ تفضيلات المظهر الداكن والمشرق، وحفظ جلستك النشطة بالمتصفح، وحفظ قائمة المفضلة الخاصة بك لتسريع التصفح.`,

  termsOfUse: `١. شروط التسجيل للتاجر والمشتري:
يجب أن يكون الاسم حقيقياً أو معبراً بشكل مباشر عن هوية المتجر (مثل: ورشة، حلويات منزلية). كما يمنع استخدام أسماء تضليلية أو انتحال شخصيات أخرى أو علامات تجارية مسجلة دون إذن.

٢. سياسة تسعير وعرض المنتجات:
يجب أن يعكس السعر القيمة الفعلية للمنتج بالليرة السورية أو العملة المحلية المتاحة. يمنع منعاً باتاً نشر إعلانات وهمية أو ترويجية بدون نية بيع فعلية، أو استخدام أسعار وهمية لجذب الزوار بشكل مضلل.

٣. الصور وحقوق الملكية الفكرية:
يجب أن تكون الصور حقيقية للمنتج قدر الإمكان لتفادي تضليل المشتري. نوصي بتصوير المنتجات اليدوية بأنفسكم لتعكس الهوية الحقيقية لأعمالكم وتزيد من مستوى تقييمكم وثقتكم بالسوق.

٤. إنهاء وإيقاف الحسابات المخالفة:
يحق للمشرفين ومديري النظام تعليق أو حذف حساب أي بائع يتلقى بلاغات متكررة عن احتيال أو سوء معاملة، أو من يثبت تقديمه لأسعار تختلف بشكل فادح عما تم كتابته بالإعلان الأساسي.`,

  disclaimer: `منصة فيلوريا (VELORIA) هي منصة إلكترونية مفتوحة تهدف لتسهيل عملية التواصل المباشر وربط التجار المحليين بالعملاء والمهتمين بالصناعات اليدوية والمنزلية والمشاريع المتنوعة.

١. آلية عمل فيلوريا ودورها الفعلي:
المنصة تقوم بدور الوسيط أو دليل الإعلانات فقط. نحن لا نمتلك، ولا نبيع، ولا نقوم بمعاينة أو شحن أو تغليف أي من المنتجات والخدمات المعروضة. السعر والاتفاق يتم بالكامل خارج المنصة وبشكل ثنائي مباشر (P2P).

٢. غياب المسؤولية المالية والمصرفية بالكامل:
منصة فيلوريا غير مسؤولة مطلقاً عن أي عمليات دفع إلكتروني أو تحويلات بنكية أو اتفاقات مالية تتم بين الأطراف. ننصح دوماً بالدفع يداً بيد عند المعاينة والاستلام لضمان جودة المنتج وثقتكم الكاملة.

٣. الشحن والتوصيل والتسليم الفعلي:
لا نتحمل أي مسؤولية قانونية أو مدنية تتعلق بتأخير وصول المنتجات، تلفها أثناء الشحن، عيوب الصناعة، أو عدم التزام مندوب التوصيل المستقل بالاتفاق. يرجى الاتفاق بشكل تفصيلي مع البائع عبر نظام الدردشة المفتوح.

٤. حظر إساءة الاستخدام والمنتجات المخالفة:
يتعرض التاجر للمسؤولية القانونية والأخلاقية الكاملة عن كافة الصور والنصوص والأسعار التي يقوم بنشرها، ونقوم بحذف أي محتوى مخالف أو مشبوه بشكل فوري بالتعاون مع المشرفين المعتمدين.`,

  // Homepage announcement
  announcementEnabled: false,
  announcementTitle: 'أهلاً بكم في منصة فيلوريا',
  announcementContent: 'تم إطلاق التحديث التجريبي الجديد لسوق فيلوريا الحر لتمكين المشاريع المنزلية السورية والمشغولات اليدوية مباشرة P2P.',
  announcementColor: 'amber',
  announcementExpiry: '',

  // Maintenance mode
  maintenanceModeEnabled: false,

  // Social media
  socialFacebook: 'https://facebook.com/VeloriaMarket',
  socialInstagram: 'https://instagram.com/VeloriaMarket',
  socialTelegram: 'https://t.me/VeloriaMarket',
  socialYoutube: '',
  socialTiktok: '',
  socialX: ''
};

