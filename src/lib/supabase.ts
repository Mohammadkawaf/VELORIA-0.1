import { createClient } from '@supabase/supabase-js';
import { Product, User, Category, Order, Review, Message, Report, AppSettings } from '../types';

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
    ratingAverage: Number(p.rating) || 5.0,
    ratingsCount: 0,
    isPremium: p.role === 'admin',
    role: p.role || 'user',
    joinedAt: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    coverImage: p.cover_url || p.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300&q=80',
    badges: (p.user_badges || []).map((ub: any) => ub.badges?.name).filter(Boolean) as any[]
  };
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
  async getProducts(): Promise<Product[]> {
    if (!supabase) return [];
    const {
      data: { session }
    } = await supabase.auth.getSession();

    console.log("getProducts session =", session);
    console.log("getProducts user =", session?.user?.id);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*)
      `);

    console.log("Products from Supabase", data);

    if (error) {
      console.warn('Error fetching products from Supabase:', error);
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
        currency: 'ل.س',
        categoryId: p.category_id,
        images: sortedImages.length > 0 ? sortedImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=400&q=80'],
        sellerId: p.user_id,
        status: p.status as any,
        location: p.location || 'الرياض، المملكة العربية السعودية',
        createdAt: p.created_at,
        rating: p.rating_average !== undefined && p.rating_average !== null ? Number(p.rating_average) : 5.0,
        reviewsCount: p.ratings_count !== undefined && p.ratings_count !== null ? Number(p.ratings_count) : 0,
        viewsCount: p.views_count || 0
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
      is_sold: product.status === 'sold'
    };

    console.log('--- [createProduct START] ---');
    console.log('1- البيانات المرسلة إلى insert:', insertPayload);
    console.log('2- قيمة user_id:', product.sellerId);
    console.log('3- قيمة category_id:', finalCategoryId);

    // Insert Product core
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

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
      currency: 'ل.س',
      categoryId: prodData.category_id,
      images: product.images,
      sellerId: prodData.user_id,
      status: prodData.status,
      location: product.location || 'الرياض، المملكة العربية السعودية',
      createdAt: prodData.created_at,
      rating: 5.0,
      reviewsCount: 0,
      viewsCount: 0
    };
  },

  async updateProductStatus(productId: string, status: 'active' | 'sold' | 'hidden'): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('products')
      .update({
        status,
        is_sold: status === 'sold',
        updated_at: new Date().toISOString()
      })
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

  // Follows
  async getFollowedSellers(userId: string): Promise<string[]> {
    if (!supabase) return [];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) return [];
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (error) throw error;
    return (data || []).map((f: any) => f.following_id);
  },

  async toggleFollow(followerId: string, followingId: string, isFollowing: boolean): Promise<void> {
    if (!supabase) return;
    const isFollowerUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(followerId);
    const isFollowingUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(followingId);
    if (!isFollowerUUID || !isFollowingUUID) return;
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });
      if (error && error.code !== '23505') throw error;
    } else {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      if (error) throw error;
    }
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
        icon: c.icon || 'MoreHorizontal'
      }));
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
      return [];
    }
  },

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    const cached = localStorage.getItem('veloria-app-settings');
    let settings = cached ? JSON.parse(cached) : defaultAppSettings;

    if (!supabase || !isSupabaseConfigured) {
      return settings;
    }

    try {
      const { data, error } = await supabase
        .from('application_settings')
        .select('value')
        .eq('id', 'global')
        .maybeSingle();

      if (error) {
        console.warn('Could not load settings from Supabase (may need table creation):', error.message);
        return settings;
      }

      if (data && data.value) {
        settings = { ...defaultAppSettings, ...data.value };
        localStorage.setItem('veloria-app-settings', JSON.stringify(settings));
      }
    } catch (err: any) {
      console.warn('Error loading settings from Supabase:', err.message);
    }

    return settings;
  },

  async updateAppSettings(settings: AppSettings): Promise<void> {
    localStorage.setItem('veloria-app-settings', JSON.stringify(settings));

    if (!supabase || !isSupabaseConfigured) {
      return;
    }

    try {
      const { error } = await supabase
        .from('application_settings')
        .upsert({ id: 'global', value: settings, updated_at: new Date().toISOString() });

      if (error) {
        console.warn('Error saving settings to Supabase (may need table creation):', error.message);
        throw error;
      }
    } catch (err: any) {
      console.warn('Failed to update app settings in Supabase:', err.message);
      throw err;
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
    if (!supabase) return { average: 5.0, count: 0 };
    
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
    const average = count > 0 ? Number((sum / count).toFixed(1)) : 5.0;
    
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
  }
};

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

