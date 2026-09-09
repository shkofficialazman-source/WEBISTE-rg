export type CategoryId = 'bouquets' | 'frames' | 'custom-cards' | 'scale-models' | 'scale-model-diecast' | 'hot-wheels-customize' | string;

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
  description?: string;
  icon: string;
  image: string;
  badge: string;
  sortOrder?: number;
  parentId?: string | null;
  active?: boolean;
}

export interface Collection {
  id: string; // unique collection id / slug
  name: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  image?: string; // alias for coverImageUrl
  displayOrder: number;
  display_order?: number;
  active: boolean;
  parentId?: string | null; // e.g. 'hot-wheels-customize' for child sub-collections
  parent_id?: string | null;
  badge?: string;
  tagline?: string;
  icon?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  productCount?: number;
  product_count?: number;
  productIds?: string[];
}

export interface ProductCollection {
  id?: string;
  productId: string;
  product_id?: string;
  collectionId: string;
  collection_id?: string;
  displayOrder?: number;
  display_order?: number;
  createdAt?: string;
  created_at?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type TrackingStatus = 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | string;

export interface OrderTracking {
  id: string;
  customer_phone: string;
  customerPhone?: string;
  order_id?: string | null;
  orderId?: string | null;
  tracking_id?: string | null;
  trackingId?: string | null;
  tracking_link?: string | null;
  trackingLink?: string | null;
  courier_name?: string | null;
  courierName?: string | null;
  status: TrackingStatus;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Office' | 'Garage' | string;
  recipientName?: string;
  fullName?: string;
  phone: string;
  street?: string;
  addressLine?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  userId?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  customerName?: string;
  userName?: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  verifiedBuyer?: boolean;
  verifiedPurchase?: boolean;
  createdAt: string;
  helpfulCount?: number;
}

export interface SitePromoBanner {
  id?: string;
  enabled: boolean;
  text?: string;
  message?: string;
  highlightCode?: string;
  couponCode?: string;
  badgeText?: string;
  linkUrl?: string;
  linkText?: string;
  dismissible?: boolean;
  theme: 'redline' | 'dark' | 'gold' | 'emerald' | 'amber' | 'red';
  updatedAt?: string;
}

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
  collectionId?: string;
  collection_id?: string;
  collectionIds?: string[];
  collection_ids?: string[];
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  imageUrl?: string;
  galleryImages?: string[];
  description: string;
  shortTagline: string;
  isBestSeller?: boolean;
  isNewRelease?: boolean;
  stockCount: number;
  requiresPhotoUpload?: boolean;
  collectorSpecs: CollectorSpecs;
  giftFeatures: string[];
  series?: string;
  tags?: string[];
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
  addresses?: SavedAddress[];
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

export type AiVerificationStatus = 'AUTHENTIC' | 'UNCLEAR' | 'MISMATCH' | 'NOT_UPLOADED';

export interface AiPaymentVerification {
  status: AiVerificationStatus;
  headline: string;
  isAuthenticLook: boolean;
  detectedApp?: string;
  detectedAmount?: number | null;
  detectedUpiId?: string | null;
  detectedReceiverName?: string | null;
  detectedTxnId?: string | null;
  utrReference?: string | null;
  recipientVpa?: string | null;
  detectedTimestamp?: string | null;
  amountMatches: boolean;
  upiMatches: boolean;
  statusSuccess: boolean;
  editingArtifactsFound: boolean;
  confidenceScore: number;
  notes: string;
  analyzedAt: string;
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
  paymentScreenshotUrl?: string;
  aiVerification?: AiPaymentVerification;
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
  paymentScreenshotUrl?: string;
  payment_screenshot_url?: string;
  aiVerification?: AiPaymentVerification;
  ai_verification?: AiPaymentVerification;
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

export type PitCrewRole = 'turbo' | 'sparky' | 'gearbox';

export interface PitCrewMemberInfo {
  id: PitCrewRole;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  specialty: string;
  description: string;
  welcomeMessage: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  crewMember?: PitCrewRole;
}

// -------------------------------------------------------------
// Reseller Marketplace Peer-to-Peer Types
// -------------------------------------------------------------
export type ResellerListingStatus = 
  | 'pending_verification' // Waiting for admin to verify UPI listing fee
  | 'active'               // Live on Reseller Marketplace
  | 'sold'                 // Deal completed between buyer and seller
  | 'expired'              // Auto-expired after duration
  | 'rejected'             // Payment invalid or item not allowed
  | 'removed';             // Removed by reseller or admin

export type ResellerCondition =
  | 'Carded - Mint'
  | 'Carded - Near Mint'
  | 'Carded - Soft Corners'
  | 'Loose - Mint'
  | 'Loose - Minor Wear'
  | 'Sealed Box / Multi-pack';

export interface ResellerListing {
  id: string;
  reseller_id: string;
  reseller_name: string;
  reseller_phone: string;
  reseller_email?: string;
  reseller_city?: string;
  reseller_instagram?: string;
  is_verified_reseller: boolean;

  car_name: string;
  casting_model?: string;
  series: string; // e.g. 'Hot Wheels Mainline', 'Car Culture / Premium', 'Super Treasure Hunt ($TH)', 'Treasure Hunt (TH)', 'RLC Exclusive', 'Mini GT', 'Kaido House', 'Other'
  scale: string; // e.g. '1:64'
  condition: ResellerCondition | string;
  condition_details?: string;
  asking_price: number; // in INR (₹)
  photos: string[]; // image URLs
  description: string;

  status: ResellerListingStatus;
  listing_fee_amount: number; // e.g. 99
  listing_fee_status: 'pending' | 'verified' | 'waived' | 'rejected';
  payment_screenshot_url?: string;
  payment_utr?: string;

  verified_at?: string;
  sold_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;

  views_count?: number;
  chats_count?: number;
  reseller_rating?: number;
  reseller_reviews_count?: number;
}

export type MarketplaceSenderRole = 'buyer' | 'reseller' | 'admin';

export interface MarketplaceMessage {
  id: string;
  listing_id: string;
  conversation_id: string;
  sender_role: MarketplaceSenderRole;
  sender_name: string;
  sender_contact?: string; // phone / WhatsApp
  message: string;
  is_flagged_for_admin: boolean;
  admin_flag_reason?: string;
  created_at: string;
  is_read?: boolean;
}

export interface MarketplaceConversation {
  id: string; // unique conversationId
  listing_id: string;
  listing_title: string;
  listing_price: number;
  listing_image?: string;
  reseller_name: string;
  reseller_phone: string;
  buyer_name: string;
  buyer_phone: string;
  has_admin_flag: boolean;
  admin_flagged_at?: string;
  admin_flag_resolved?: boolean;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
}

export interface ResellerReview {
  id: string;
  listing_id: string;
  reseller_id: string;
  buyer_name: string;
  buyer_phone?: string;
  rating: number; // 1 to 5
  comment: string;
  created_at: string;
}

export interface MarketplaceReport {
  id: string;
  listing_id?: string;
  conversation_id?: string;
  reporter_role: 'buyer' | 'reseller' | 'visitor';
  reporter_name: string;
  reporter_phone?: string;
  reported_item_or_user: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface MarketplaceSettings {
  listing_fee: number; // in INR (default ₹99)
  listing_duration_days: number; // default 30 days
  upi_id: string; // default 'shkofficialazman@okhdfcbank'
  is_marketplace_enabled: boolean;
  min_asking_price: number;
}

export interface AdminNotification {
  id: string;
  type: 'high_value_listing' | 'admin_mention' | 'listing_fee_submitted';
  title: string;
  summary: string;
  details: {
    listing_id?: string;
    car_name?: string;
    asking_price?: number;
    reseller_name?: string;
    reseller_phone?: string;
    reseller_email?: string;
    conversation_id?: string;
    sender_name?: string;
    sender_role?: string;
    message_text?: string;
    [key: string]: any;
  };
  recipient_email: string;
  email_sent: boolean;
  email_preview_subject?: string;
  email_html_body?: string;
  status: 'unread' | 'read' | 'resolved';
  created_at: string;
}

