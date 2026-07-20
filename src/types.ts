export type UserRole = 'visitor' | 'user' | 'moderator' | 'admin';

export type UserBadge = 'verified' | 'active_seller' | 'featured_seller' | 'official_store';

export interface PremiumConfig {
  primaryColor: string;
  coverImage: string;
  logo: string;
  avatarBorder: string;
  customSlug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  badges: UserBadge[];
  isPremium: boolean;
  premiumConfig?: PremiumConfig;
  followersCount: number;
  ratingAverage: number;
  ratingsCount: number;
  role: UserRole;
  joinedAt: string;
  username?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  whatsapp_number?: string;
  coverImage?: string;
  salesCount?: number;
  trustLevel?: string; // e.g. "مستوى برونزي", "مستوى ذهبي", "موثوق جداً"
  status?: 'active' | 'suspended' | 'banned' | 'deactivated';
  lastUsernameChangeDate?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name string
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  images: string[];
  sellerId: string;
  status: 'active' | 'hidden' | 'sold' | 'expired';
  isSold?: boolean;
  city?: string | null;
  createdAt: string;
  rating: number;
  reviewsCount: number;
  viewsCount?: number;
}

export interface Review {
  id: string;
  productId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'delivered' | 'completed' | 'cancelled' | 'contacted' | 'processing' | 'ready';
  notes?: string;
  buyerMessage?: string;
  productPrice?: number;
  createdAt: string;
  updatedAt?: string;
  order_number?: string;
  orderNumber?: string;
  sellerRating?: number;
  productRating?: number;
  ratingComment?: string;
  cancellationReason?: string;
}

export interface Report {
  id: string;
  type: 'product' | 'user';
  targetId: string; // Product ID or User ID
  targetName: string; // Title or User Name for quick reference
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'follow' | 'review' | 'system' | 'contribution' | 'admin' | 'announcement';
  title: string;
  body: string;
  createdAt: string;
  created_at?: string;
  read: boolean;
}

export interface Contribution {
  id: string;
  user_id: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  payment_method: 'Sham Cash';
  account_number: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface VerificationRequest {
  id: string;
  storeId: string;
  storeName: string;
  storeUsername: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  type: 'general' | 'problem' | 'feature';
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'archived';
  createdAt: string;
  adminNotes?: string;
}

export interface AppSettings {
  // Contact info
  supportEmail: string;
  whatsappNumber: string;
  telegramLink: string;
  facebookPage: string;
  instagramPage: string;
  websiteUrl: string;
  businessHours: string;
  supportWelcomeMessage: string;

  // Platform info
  platformName: string;
  platformLogo: string;
  platformDescription: string;
  currentVersion: string;
  copyrightText: string;

  // Donation settings
  shamCashAccount: string;
  donationInstructions: string;
  donationMessage: string;
  donationEnabled: boolean;

  // Legal pages
  privacyPolicy: string;
  termsOfUse: string;
  disclaimer: string;

  // Homepage announcement
  announcementEnabled: boolean;
  announcementTitle: string;
  announcementContent: string;
  announcementColor: string;
  announcementExpiry?: string;

  // Maintenance mode
  maintenanceModeEnabled: boolean;

  // Social media
  socialFacebook: string;
  socialInstagram: string;
  socialTelegram: string;
  socialYoutube: string;
  socialTiktok: string;
  socialX: string;
}

export interface ProductFilterOptions {
  status?: string;
  categoryId?: string | number | null;
  searchTerm?: string | null;
  sortBy?: string;
  productIds?: string[];
  
  // Future extendable filters
  priceMin?: number | null;
  priceMax?: number | null;
  city?: string | null;
  isVerified?: boolean | null;
  isFeatured?: boolean | null;
  hasOffer?: boolean | null;
  condition?: string | null;
  delivery?: boolean | null;
  currency?: string | null;
}


