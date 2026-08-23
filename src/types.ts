export type CategoryId = 'bouquets' | 'frames' | 'custom-cards' | 'scale-models' | string;

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
  icon: string;
  image: string;
  badge: string;
  sortOrder?: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered';

export interface CollectorSpecs {
  scale: string;
  casting: string;
  series: string;
  wheels: string;
  cardCondition: string;
  authenticity: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  galleryImages?: string[];
  description: string;
  shortTagline: string;
  isBestSeller?: boolean;
  isNewRelease?: boolean;
  stockCount: number;
  requiresPhotoUpload?: boolean;
  collectorSpecs: CollectorSpecs;
  giftFeatures: string[];
}

export interface CustomCardConfig {
  photoUrl: string | null;
  originalPhotoUrl?: string | null;
  aiStylizedPhotoUrl?: string | null;
  isAiStylized?: boolean;
  driverName: string;
  carTitle: string;
  cardSubtitle: string;
  carColor: string;
  cardTheme: 'redline-racing' | 'midnight-black' | 'classic-blue' | 'gold-edition' | 'ai-mainline';
  giftMessage?: string;
  selectedCasting: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  customization?: CustomCardConfig;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  customization?: CustomCardConfig | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string; // Date of birth (YYYY-MM-DD)
  role: 'customer' | 'admin';
  createdAt?: any;
}

export interface CollectorSpotlight {
  id?: string;
  collectorName: string; // e.g. "Arjun Mehta"
  instagramHandle?: string; // e.g. "@diecast_art_india"
  photoUrl: string;
  storyQuote: string; // Short story or quote about their collection
  featuredMonth: string; // e.g. "August 2026"
  collectionSize?: string; // e.g. "500+ Hot Wheels Castings"
  favoriteCasting?: string; // e.g. "Nissan Skyline GT-R (R34) RLC"
  active: boolean;
  updatedAt?: string;
}

export interface InvoiceData {
  orderNumber: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  loyaltyDiscount?: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  notes?: string;
  aiVerificationSummary?: string;
}

export interface FirestoreOrder {
  id?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  giftNote?: string;
  status: OrderStatus;
  referralCode?: string;
  referralDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  loyaltyPointsAwarded?: number;
  trackingNumber?: string;
  tracking_number?: string;
  courierName?: string;
  courier_name?: string;
  trackingUrl?: string;
  tracking_url?: string;
  shippedAt?: string;
  shipped_at?: string;
  createdAt: any;
  created_at?: any;
}

// Loyalty System Types
export interface LoyaltyAccount {
  id: string;
  phone: string;
  customerPhone?: string;
  email?: string;
  customerEmail?: string;
  userId?: string;
  customerName?: string;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: string;
}

export interface LoyaltySettings {
  earnRateRupees: number; // e.g. 10 => 1 point per ₹10 spent
  redeemPointValue: number; // e.g. 0.50 => 100 points = ₹50 off
  minPointsToRedeem: number; // e.g. 100 points
  welcomeBonusPoints?: number; // optional signup bonus
  referralBonusPoints?: number; // optional referral bonus
  loyaltyEnabled: boolean;
}

// Referral System Types
export type ReferralDiscountType = 'percentage' | 'flat';

export interface ReferralCode {
  id: string;
  code: string;
  discountType: ReferralDiscountType;
  discountValue: number;
  active: boolean;
  usesCount: number;
  maxUses: number | null;
  minOrderAmount?: number | null;
  totalDiscountGiven?: number;
  isCollectorReferral?: boolean;
  isBirthdayCode?: boolean;
  recipientPhone?: string;
  expiresAt?: string;
  creatorUid?: string;
  creatorEmail?: string;
  creatorName?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string; // e.g., "Gifted to Boyfriend", "Die-Cast Collector"
  avatar: string;
  rating: number;
  comment: string;
  productName: string;
  verified: boolean;
  date: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: CategoryId;
  likes: number;
  customerTag: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'delivery' | 'customization' | 'care' | 'payment';
}

// Newsletter & Marketing Subscriber Types
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  source: string; // e.g. 'footer', 'checkout', 'header'
  tags?: string[];
  couponCodeIssued?: string;
  notes?: string;
}
