import { supabase } from './supabase';
import {
  ResellerListing,
  ResellerListingStatus,
  MarketplaceMessage,
  MarketplaceConversation,
  ResellerReview,
  MarketplaceReport,
  MarketplaceSettings,
  MarketplaceSenderRole,
} from './types';

// Default initial settings
export const DEFAULT_MARKETPLACE_SETTINGS: MarketplaceSettings = {
  listing_fee: 99,
  listing_duration_days: 30,
  upi_id: 'shkofficialazman@okhdfcbank',
  is_marketplace_enabled: true,
  min_asking_price: 100,
};

// Seed authentic listings for instant display
const INITIAL_SEED_LISTINGS: ResellerListing[] = [
  {
    id: 'reseller_th_skyline_r34',
    reseller_id: 'reseller_vikram_m',
    reseller_name: 'Vikram Mehta (DieCastBangalore)',
    reseller_phone: '+91 98451 23098',
    reseller_email: 'vikram.mehta.diecast@gmail.com',
    reseller_city: 'Bangalore, KA',
    reseller_instagram: '@bangalore_diecast_vault',
    is_verified_reseller: true,
    car_name: "Nissan Skyline GT-R (BNR34) - Bayside Blue",
    casting_model: 'Fast & Furious Premium Car Culture',
    series: 'Car Culture / Premium',
    scale: '1:64',
    condition: 'Carded - Mint',
    condition_details: 'Unpunched blister card, pristine corners, stored in Kar Keepers acrylic protector since acquisition. Real Riders rubber tires.',
    asking_price: 1850,
    photos: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Authentic Car Culture release. One of the most sought-after JDM castings in India. Ships bubble-wrapped in heavy cardboard box. Open to reasonable collector trades or cash via chat.',
    status: 'active',
    listing_fee_amount: 99,
    listing_fee_status: 'verified',
    payment_utr: 'UPI/428190384192/HDFC',
    verified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views_count: 142,
    chats_count: 5,
    reseller_rating: 4.9,
    reseller_reviews_count: 8,
  },
  {
    id: 'reseller_sth_camaro_67',
    reseller_id: 'reseller_rohan_pune',
    reseller_name: 'Rohan Deshmukh',
    reseller_phone: '+91 97640 88214',
    reseller_city: 'Pune, MH',
    is_verified_reseller: true,
    car_name: "'67 Camaro Super Treasure Hunt ($TH)",
    casting_model: 'Spectraflame Gold Chase with Real Riders',
    series: 'Super Treasure Hunt ($TH)',
    scale: '1:64',
    condition: 'Carded - Mint',
    condition_details: 'Factory sealed short card with TH flame logo behind the car. Spectraflame gold finish with Goodyear Real Riders.',
    asking_price: 4200,
    photos: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Genuine $TH pulled from fresh case. 100% authentic Mattel. Can ship via DTDC Express with trackable airway bill. Negotiate on live chat.',
    status: 'active',
    listing_fee_amount: 99,
    listing_fee_status: 'verified',
    payment_utr: 'UPI/428019385712/ICICI',
    verified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    views_count: 289,
    chats_count: 9,
    reseller_rating: 5.0,
    reseller_reviews_count: 12,
  },
  {
    id: 'reseller_porsche_911_gt3rs',
    reseller_id: 'reseller_arjun_mumbai',
    reseller_name: 'Arjun Kulkarni',
    reseller_phone: '+91 98201 44552',
    reseller_city: 'Mumbai, MH',
    is_verified_reseller: false,
    car_name: 'Porsche 911 GT3 RS - Lizard Green',
    casting_model: 'Hot Wheels Premium Boulevard Series',
    series: 'Car Culture / Premium',
    scale: '1:64',
    condition: 'Carded - Near Mint',
    condition_details: 'Minor soft corner on bottom left of card. Blister is 100% crack-free and crystal clear.',
    asking_price: 1450,
    photos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Boulevard edition with full metal body & chassis. Kept away from sunlight. Looking to downsize my Porsche sub-collection.',
    status: 'active',
    listing_fee_amount: 99,
    listing_fee_status: 'verified',
    payment_utr: 'UPI/427918237461/PAYTM',
    verified_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    views_count: 98,
    chats_count: 3,
    reseller_rating: 4.8,
    reseller_reviews_count: 3,
  },
  {
    id: 'reseller_datsun_510_wagon',
    reseller_id: 'reseller_kunal_delhi',
    reseller_name: 'Kunal Verma',
    reseller_phone: '+91 98112 34991',
    reseller_city: 'New Delhi, DL',
    is_verified_reseller: true,
    car_name: 'Datsun Bluebird 510 Wagon - Moon Eyes Edition',
    casting_model: 'Car Culture Japan Historics',
    series: 'Car Culture / Premium',
    scale: '1:64',
    condition: 'Carded - Mint',
    condition_details: 'Flawless card and blister in protector case. Yellow Moon Eyes livery.',
    asking_price: 2100,
    photos: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Iconic Japan Historics casting. Selling as a completed deal, already marked sold as a demonstration.',
    status: 'sold',
    listing_fee_amount: 99,
    listing_fee_status: 'verified',
    payment_utr: 'UPI/426810293847/SBI',
    verified_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    sold_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views_count: 320,
    chats_count: 8,
    reseller_rating: 5.0,
    reseller_reviews_count: 5,
  },
];

// Seed initial demo conversation
const INITIAL_SEED_CONVERSATIONS: MarketplaceConversation[] = [
  {
    id: 'conv_demo_skyline_1',
    listing_id: 'reseller_th_skyline_r34',
    listing_title: 'Nissan Skyline GT-R (BNR34) - Bayside Blue',
    listing_price: 1850,
    listing_image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    reseller_name: 'Vikram Mehta (DieCastBangalore)',
    reseller_phone: '+91 98451 23098',
    buyer_name: 'Sameer Sen',
    buyer_phone: '+91 98711 22334',
    has_admin_flag: true,
    admin_flagged_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    admin_flag_resolved: false,
    last_message: '@admin Could you verify if standard speed post or private courier is best for fragile acrylic blister cards?',
    last_message_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_SEED_MESSAGES: MarketplaceMessage[] = [
  {
    id: 'msg_1',
    listing_id: 'reseller_th_skyline_r34',
    conversation_id: 'conv_demo_skyline_1',
    sender_role: 'buyer',
    sender_name: 'Sameer Sen',
    sender_contact: '+91 98711 22334',
    message: 'Hi Vikram! Is this Fast & Furious Bayside Blue Skyline still available?',
    is_flagged_for_admin: false,
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg_2',
    listing_id: 'reseller_th_skyline_r34',
    conversation_id: 'conv_demo_skyline_1',
    sender_role: 'reseller',
    sender_name: 'Vikram Mehta (DieCastBangalore)',
    sender_contact: '+91 98451 23098',
    message: 'Yes Sameer! Mint in protector case. Can ship by tomorrow morning from Bangalore.',
    is_flagged_for_admin: false,
    created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg_3',
    listing_id: 'reseller_th_skyline_r34',
    conversation_id: 'conv_demo_skyline_1',
    sender_role: 'buyer',
    sender_name: 'Sameer Sen',
    sender_contact: '+91 98711 22334',
    message: 'Would you do ₹1,750 all-inclusive with shipping to Mumbai?',
    is_flagged_for_admin: false,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg_4',
    listing_id: 'reseller_th_skyline_r34',
    conversation_id: 'conv_demo_skyline_1',
    sender_role: 'buyer',
    sender_name: 'Sameer Sen',
    sender_contact: '+91 98711 22334',
    message: '@admin Could you verify if standard speed post or private courier is best for fragile acrylic blister cards?',
    is_flagged_for_admin: true,
    admin_flag_reason: 'User mentioned @admin in chat',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

const INITIAL_SEED_REVIEWS: ResellerReview[] = [
  {
    id: 'rev_1',
    listing_id: 'reseller_datsun_510_wagon',
    reseller_id: 'reseller_kunal_delhi',
    buyer_name: 'Karthik Rao',
    buyer_phone: '+91 99002 11223',
    rating: 5,
    comment: 'Spectacular packaging with double bubble wrap and hard cardboard. Car arrived in 100% mint condition as described!',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Local Storage Keys
const STORAGE_KEYS = {
  SETTINGS: 'redline_marketplace_settings',
  LISTINGS: 'redline_marketplace_listings',
  CONVERSATIONS: 'redline_marketplace_conversations',
  MESSAGES: 'redline_marketplace_messages',
  REVIEWS: 'redline_marketplace_reviews',
  REPORTS: 'redline_marketplace_reports',
};

// -------------------------------------------------------------
// Helper: Local Storage Fallback Handlers
// -------------------------------------------------------------
const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error storing ${key} in localStorage:`, err);
  }
};

// -------------------------------------------------------------
// Settings Management
// -------------------------------------------------------------
export const getMarketplaceSettings = async (): Promise<MarketplaceSettings> => {
  try {
    const { data, error } = await supabase
      .from('marketplace_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data) {
      const settings: MarketplaceSettings = {
        listing_fee: Number(data.listing_fee) || 99,
        listing_duration_days: Number(data.listing_duration_days) || 30,
        upi_id: data.upi_id || 'shkofficialazman@okhdfcbank',
        is_marketplace_enabled: data.is_marketplace_enabled !== false,
        min_asking_price: Number(data.min_asking_price) || 100,
      };
      setLocalData(STORAGE_KEYS.SETTINGS, settings);
      return settings;
    }
  } catch (err) {
    // Fallback
  }
  return getLocalData<MarketplaceSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_MARKETPLACE_SETTINGS);
};

export const updateMarketplaceSettings = async (
  newSettings: Partial<MarketplaceSettings>
): Promise<MarketplaceSettings> => {
  const current = await getMarketplaceSettings();
  const updated: MarketplaceSettings = {
    ...current,
    ...newSettings,
  };

  setLocalData(STORAGE_KEYS.SETTINGS, updated);

  try {
    await supabase.from('marketplace_settings').upsert({
      id: 'global',
      listing_fee: updated.listing_fee,
      listing_duration_days: updated.listing_duration_days,
      upi_id: updated.upi_id,
      is_marketplace_enabled: updated.is_marketplace_enabled,
      min_asking_price: updated.min_asking_price,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not save settings to Supabase table, cached locally:', err);
  }

  return updated;
};

// -------------------------------------------------------------
// Listings Management
// -------------------------------------------------------------
export const getMarketplaceListings = async (
  statusFilter?: ResellerListingStatus | 'all'
): Promise<ResellerListing[]> => {
  let listings: ResellerListing[] = [];

  try {
    let query = supabase.from('marketplace_listings').select('*');
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      listings = data.map((item: any) => ({
        id: item.id,
        reseller_id: item.reseller_id || item.resellerId || '',
        reseller_name: item.reseller_name || item.resellerName || 'Independent Reseller',
        reseller_phone: item.reseller_phone || item.resellerPhone || '',
        reseller_email: item.reseller_email || item.resellerEmail,
        reseller_city: item.reseller_city || item.resellerCity,
        reseller_instagram: item.reseller_instagram || item.resellerInstagram,
        is_verified_reseller: Boolean(item.is_verified_reseller ?? item.isVerifiedReseller),
        car_name: item.car_name || item.carName || 'Hot Wheels Casting',
        casting_model: item.casting_model || item.castingModel,
        series: item.series || 'Hot Wheels Mainline',
        scale: item.scale || '1:64',
        condition: item.condition || 'Carded - Mint',
        condition_details: item.condition_details || item.conditionDetails,
        asking_price: Number(item.asking_price || item.askingPrice || 0),
        photos: Array.isArray(item.photos) ? item.photos : [],
        description: item.description || '',
        status: item.status || 'pending_verification',
        listing_fee_amount: Number(item.listing_fee_amount || item.listingFeeAmount || 99),
        listing_fee_status: item.listing_fee_status || item.listingFeeStatus || 'pending',
        payment_screenshot_url: item.payment_screenshot_url || item.paymentScreenshotUrl,
        payment_utr: item.payment_utr || item.paymentUtr,
        verified_at: item.verified_at || item.verifiedAt,
        sold_at: item.sold_at || item.soldAt,
        expires_at: item.expires_at || item.expiresAt,
        created_at: item.created_at || item.createdAt,
        updated_at: item.updated_at || item.updatedAt,
        views_count: Number(item.views_count || item.viewsCount || 0),
        chats_count: Number(item.chats_count || item.chatsCount || 0),
        reseller_rating: Number(item.reseller_rating || 5.0),
        reseller_reviews_count: Number(item.reseller_reviews_count || 0),
      }));

      // Merge with local storage to capture any unsynced offline creations
      const local = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, []);
      const combined = [...listings];
      for (const locItem of local) {
        if (!combined.some(c => c.id === locItem.id)) {
          combined.push(locItem);
        }
      }
      listings = combined;
    } else {
      listings = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_SEED_LISTINGS);
    }
  } catch (err) {
    listings = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_SEED_LISTINGS);
  }

  // Auto-expire listings past expires_at if still active
  const now = new Date().getTime();
  listings = listings.map(l => {
    if (l.status === 'active' && l.expires_at && new Date(l.expires_at).getTime() < now) {
      return { ...l, status: 'expired' as ResellerListingStatus };
    }
    return l;
  });

  setLocalData(STORAGE_KEYS.LISTINGS, listings);

  if (statusFilter && statusFilter !== 'all') {
    return listings.filter(l => l.status === statusFilter);
  }

  return listings;
};

// Create a new Reseller Listing (initially pending fee verification)
export const createResellerListing = async (
  data: Omit<ResellerListing, 'id' | 'status' | 'created_at' | 'updated_at' | 'expires_at' | 'listing_fee_status'>
): Promise<ResellerListing> => {
  const settings = await getMarketplaceSettings();
  const id = `listing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (settings.listing_duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();

  const newListing: ResellerListing = {
    ...data,
    id,
    status: 'pending_verification',
    listing_fee_amount: settings.listing_fee || 99,
    listing_fee_status: 'pending',
    expires_at: expiresAt,
    created_at: nowIso,
    updated_at: nowIso,
    views_count: 0,
    chats_count: 0,
    reseller_rating: 5.0,
    reseller_reviews_count: 0,
  };

  // Update local storage
  const localListings = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_SEED_LISTINGS);
  localListings.unshift(newListing);
  setLocalData(STORAGE_KEYS.LISTINGS, localListings);

  // Sync to Supabase
  try {
    await supabase.from('marketplace_listings').insert({
      id: newListing.id,
      reseller_id: newListing.reseller_id,
      reseller_name: newListing.reseller_name,
      reseller_phone: newListing.reseller_phone,
      reseller_email: newListing.reseller_email,
      reseller_city: newListing.reseller_city,
      reseller_instagram: newListing.reseller_instagram,
      is_verified_reseller: newListing.is_verified_reseller,
      car_name: newListing.car_name,
      casting_model: newListing.casting_model,
      series: newListing.series,
      scale: newListing.scale,
      condition: newListing.condition,
      condition_details: newListing.condition_details,
      asking_price: newListing.asking_price,
      photos: newListing.photos,
      description: newListing.description,
      status: newListing.status,
      listing_fee_amount: newListing.listing_fee_amount,
      listing_fee_status: newListing.listing_fee_status,
      payment_screenshot_url: newListing.payment_screenshot_url,
      payment_utr: newListing.payment_utr,
      expires_at: newListing.expires_at,
      created_at: newListing.created_at,
      updated_at: newListing.updated_at,
      views_count: 0,
      chats_count: 0,
    });
  } catch (err) {
    console.warn('Could not insert to Supabase marketplace_listings, stored in local cache:', err);
  }

  // Automated notification to Admin on high-value listing submission (asking price >= ₹1,500)
  if (newListing.asking_price >= 1500) {
    triggerAdminNotification({
      type: 'high_value_listing',
      listing: newListing,
    }).catch(e => console.warn('Admin high-value notification notice:', e));
  }

  return newListing;
};

// Update Listing Status (e.g. Verify & Activate, Mark Sold, Reject, Remove)
export const updateListingStatus = async (
  listingId: string,
  newStatus: ResellerListingStatus,
  feeStatus?: 'pending' | 'verified' | 'waived' | 'rejected'
): Promise<boolean> => {
  const localListings = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_SEED_LISTINGS);
  const nowIso = new Date().toISOString();

  const idx = localListings.findIndex(l => l.id === listingId);
  if (idx !== -1) {
    localListings[idx].status = newStatus;
    localListings[idx].updated_at = nowIso;
    if (feeStatus) {
      localListings[idx].listing_fee_status = feeStatus;
    }
    if (newStatus === 'active') {
      localListings[idx].verified_at = nowIso;
    }
    if (newStatus === 'sold') {
      localListings[idx].sold_at = nowIso;
    }
    setLocalData(STORAGE_KEYS.LISTINGS, localListings);
  }

  try {
    const updatePayload: any = {
      status: newStatus,
      updated_at: nowIso,
    };
    if (feeStatus) {
      updatePayload.listing_fee_status = feeStatus;
    }
    if (newStatus === 'active') {
      updatePayload.verified_at = nowIso;
      updatePayload.listing_fee_status = 'verified';
    }
    if (newStatus === 'sold') {
      updatePayload.sold_at = nowIso;
    }

    await supabase.from('marketplace_listings').update(updatePayload).eq('id', listingId);
    return true;
  } catch (err) {
    console.warn('Could not update Supabase listing status:', err);
    return true;
  }
};

// Toggle Verified Reseller status for all listings of that reseller
export const toggleResellerVerification = async (
  resellerPhoneOrId: string,
  verified: boolean
): Promise<boolean> => {
  const localListings = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_SEED_LISTINGS);
  localListings.forEach(l => {
    if (l.reseller_id === resellerPhoneOrId || l.reseller_phone === resellerPhoneOrId) {
      l.is_verified_reseller = verified;
    }
  });
  setLocalData(STORAGE_KEYS.LISTINGS, localListings);

  try {
    await supabase
      .from('marketplace_listings')
      .update({ is_verified_reseller: verified })
      .or(`reseller_id.eq.${resellerPhoneOrId},reseller_phone.eq.${resellerPhoneOrId}`);
  } catch (err) {
    console.warn('Could not update verification in Supabase:', err);
  }
  return true;
};

// -------------------------------------------------------------
// Live Chat & Conversations
// -------------------------------------------------------------
export const getMarketplaceConversations = async (): Promise<MarketplaceConversation[]> => {
  let convs: MarketplaceConversation[] = [];
  try {
    const { data, error } = await supabase
      .from('marketplace_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!error && data && data.length > 0) {
      convs = data.map((c: any) => ({
        id: c.id,
        listing_id: c.listing_id || c.listingId,
        listing_title: c.listing_title || c.listingTitle || 'Car Listing',
        listing_price: Number(c.listing_price || c.listingPrice || 0),
        listing_image: c.listing_image || c.listingImage,
        reseller_name: c.reseller_name || c.resellerName,
        reseller_phone: c.reseller_phone || c.resellerPhone,
        buyer_name: c.buyer_name || c.buyerName,
        buyer_phone: c.buyer_phone || c.buyerPhone,
        has_admin_flag: Boolean(c.has_admin_flag || c.hasAdminFlag),
        admin_flagged_at: c.admin_flagged_at || c.adminFlaggedAt,
        admin_flag_resolved: Boolean(c.admin_flag_resolved || c.adminFlagResolved),
        last_message: c.last_message || c.lastMessage,
        last_message_at: c.last_message_at || c.lastMessageAt,
        created_at: c.created_at || c.createdAt,
      }));

      // Merge local
      const local = getLocalData<MarketplaceConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
      for (const loc of local) {
        if (!convs.some(c => c.id === loc.id)) convs.push(loc);
      }
    } else {
      convs = getLocalData<MarketplaceConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_SEED_CONVERSATIONS);
    }
  } catch (err) {
    convs = getLocalData<MarketplaceConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_SEED_CONVERSATIONS);
  }

  setLocalData(STORAGE_KEYS.CONVERSATIONS, convs);
  return convs;
};

export const getOrCreateConversation = async (
  listing: ResellerListing,
  buyerName: string,
  buyerPhone: string
): Promise<MarketplaceConversation> => {
  const convs = await getMarketplaceConversations();
  const existing = convs.find(
    c => c.listing_id === listing.id && (c.buyer_phone === buyerPhone || (c.buyer_name === buyerName && buyerPhone === ''))
  );

  if (existing) {
    return existing;
  }

  const newId = `conv_${listing.id}_${Date.now()}`;
  const newConv: MarketplaceConversation = {
    id: newId,
    listing_id: listing.id,
    listing_title: listing.car_name,
    listing_price: listing.asking_price,
    listing_image: listing.photos[0] || '',
    reseller_name: listing.reseller_name,
    reseller_phone: listing.reseller_phone,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    has_admin_flag: false,
    last_message: 'Chat initiated',
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  convs.unshift(newConv);
  setLocalData(STORAGE_KEYS.CONVERSATIONS, convs);

  try {
    await supabase.from('marketplace_conversations').insert({
      id: newConv.id,
      listing_id: newConv.listing_id,
      listing_title: newConv.listing_title,
      listing_price: newConv.listing_price,
      listing_image: newConv.listing_image,
      reseller_name: newConv.reseller_name,
      reseller_phone: newConv.reseller_phone,
      buyer_name: newConv.buyer_name,
      buyer_phone: newConv.buyer_phone,
      has_admin_flag: false,
      last_message: newConv.last_message,
      last_message_at: newConv.last_message_at,
      created_at: newConv.created_at,
    });
  } catch (err) {
    console.warn('Could not insert conversation into Supabase:', err);
  }

  return newConv;
};

export const getMarketplaceMessages = async (
  conversationId: string
): Promise<MarketplaceMessage[]> => {
  let msgs: MarketplaceMessage[] = [];
  try {
    const { data, error } = await supabase
      .from('marketplace_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      msgs = data.map((m: any) => ({
        id: m.id,
        listing_id: m.listing_id || m.listingId,
        conversation_id: m.conversation_id || m.conversationId,
        sender_role: m.sender_role || m.senderRole || 'buyer',
        sender_name: m.sender_name || m.senderName,
        sender_contact: m.sender_contact || m.senderContact,
        message: m.message,
        is_flagged_for_admin: Boolean(m.is_flagged_for_admin || m.isFlaggedForAdmin),
        admin_flag_reason: m.admin_flag_reason || m.adminFlagReason,
        created_at: m.created_at || m.createdAt,
        is_read: Boolean(m.is_read || m.isRead),
      }));
    } else {
      const allLocal = getLocalData<MarketplaceMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_SEED_MESSAGES);
      msgs = allLocal.filter(m => m.conversation_id === conversationId);
    }
  } catch (err) {
    const allLocal = getLocalData<MarketplaceMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_SEED_MESSAGES);
    msgs = allLocal.filter(m => m.conversation_id === conversationId);
  }

  return msgs;
};

// Send message & handle @admin flag
export const sendMarketplaceMessage = async (
  conversationId: string,
  listingId: string,
  senderRole: MarketplaceSenderRole,
  senderName: string,
  senderContact: string,
  messageText: string
): Promise<MarketplaceMessage> => {
  const trimmed = messageText.trim();
  const isAdminMentioned = /@admin/i.test(trimmed);
  const nowIso = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newMsg: MarketplaceMessage = {
    id: messageId,
    listing_id: listingId,
    conversation_id: conversationId,
    sender_role: senderRole,
    sender_name: senderName,
    sender_contact: senderContact,
    message: trimmed,
    is_flagged_for_admin: isAdminMentioned,
    admin_flag_reason: isAdminMentioned ? 'User summoned @admin via chat' : undefined,
    created_at: nowIso,
    is_read: false,
  };

  // Local storage save
  const allLocal = getLocalData<MarketplaceMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_SEED_MESSAGES);
  allLocal.push(newMsg);
  setLocalData(STORAGE_KEYS.MESSAGES, allLocal);

  // Update conversation last_message and admin flag
  const convs = getLocalData<MarketplaceConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_SEED_CONVERSATIONS);
  const convIdx = convs.findIndex(c => c.id === conversationId);
  if (convIdx !== -1) {
    convs[convIdx].last_message = trimmed;
    convs[convIdx].last_message_at = nowIso;
    if (isAdminMentioned) {
      convs[convIdx].has_admin_flag = true;
      convs[convIdx].admin_flagged_at = nowIso;
      convs[convIdx].admin_flag_resolved = false;
    }
    setLocalData(STORAGE_KEYS.CONVERSATIONS, convs);
  }

  // Supabase persist
  try {
    await supabase.from('marketplace_messages').insert({
      id: newMsg.id,
      listing_id: newMsg.listing_id,
      conversation_id: newMsg.conversation_id,
      sender_role: newMsg.sender_role,
      sender_name: newMsg.sender_name,
      sender_contact: newMsg.sender_contact,
      message: newMsg.message,
      is_flagged_for_admin: newMsg.is_flagged_for_admin,
      admin_flag_reason: newMsg.admin_flag_reason,
      created_at: newMsg.created_at,
    });

    const convUpdatePayload: any = {
      last_message: trimmed,
      last_message_at: nowIso,
    };
    if (isAdminMentioned) {
      convUpdatePayload.has_admin_flag = true;
      convUpdatePayload.admin_flagged_at = nowIso;
      convUpdatePayload.admin_flag_resolved = false;
    }
    await supabase.from('marketplace_conversations').update(convUpdatePayload).eq('id', conversationId);

    // Broadcast on channel for instantaneous multi-client delivery
    const channel = supabase.channel(`marketplace_chat_${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'new-message',
      payload: newMsg,
    });
  } catch (err) {
    console.warn('Could not sync message to Supabase, stored locally:', err);
  }

  // Automated notification to Admin on @admin summon
  if (isAdminMentioned) {
    triggerAdminNotification({
      type: 'admin_mention',
      message: newMsg,
      senderName,
      senderContact,
    }).catch(e => console.warn('Admin mention notification notice:', e));
  }

  return newMsg;
};

// =============================================================
// Automated Admin Notification Trigger
// =============================================================
export const triggerAdminNotification = async (payload: {
  type: 'high_value_listing' | 'admin_mention' | 'listing_fee_submitted';
  listing?: ResellerListing;
  message?: MarketplaceMessage;
  conversation?: MarketplaceConversation;
  senderName?: string;
  senderContact?: string;
  customNote?: string;
}): Promise<boolean> => {
  try {
    const res = await fetch('/api/marketplace/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Admin notification trigger error:', err);
    return false;
  }
};

// =============================================================
// Real-time Chat Typing Indicators & Read Receipts
// =============================================================
export const broadcastTypingStatus = (
  conversationId: string,
  senderRole: MarketplaceSenderRole,
  senderName: string,
  isTyping: boolean
) => {
  try {
    const channel = supabase.channel(`marketplace_chat_${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing-status',
      payload: {
        conversationId,
        senderRole,
        senderName,
        isTyping,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    // Non-blocking fallback
  }
};

export const markMarketplaceMessagesAsRead = async (
  conversationId: string,
  readerRole: MarketplaceSenderRole
): Promise<void> => {
  // Update local storage
  const allLocal = getLocalData<MarketplaceMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_SEED_MESSAGES);
  let updatedCount = 0;
  for (const m of allLocal) {
    if (m.conversation_id === conversationId && m.sender_role !== readerRole && !m.is_read) {
      m.is_read = true;
      updatedCount++;
    }
  }
  if (updatedCount > 0) {
    setLocalData(STORAGE_KEYS.MESSAGES, allLocal);
  }

  // Update Supabase
  try {
    await supabase
      .from('marketplace_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_role', readerRole);

    // Broadcast read receipt so the sender's UI updates ticks immediately
    const channel = supabase.channel(`marketplace_chat_${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'messages-read',
      payload: {
        conversationId,
        readerRole,
        readAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Non-blocking fallback
  }
};


// Resolve admin flag on conversation
export const resolveAdminFlag = async (conversationId: string): Promise<boolean> => {
  const convs = getLocalData<MarketplaceConversation[]>(STORAGE_KEYS.CONVERSATIONS, INITIAL_SEED_CONVERSATIONS);
  const convIdx = convs.findIndex(c => c.id === conversationId);
  if (convIdx !== -1) {
    convs[convIdx].has_admin_flag = false;
    convs[convIdx].admin_flag_resolved = true;
    setLocalData(STORAGE_KEYS.CONVERSATIONS, convs);
  }

  try {
    await supabase
      .from('marketplace_conversations')
      .update({ has_admin_flag: false, admin_flag_resolved: true })
      .eq('id', conversationId);
  } catch (err) {
    console.warn('Could not resolve admin flag in Supabase:', err);
  }
  return true;
};

// -------------------------------------------------------------
// Reviews and Ratings
// -------------------------------------------------------------
export const submitResellerReview = async (
  review: Omit<ResellerReview, 'id' | 'created_at'>
): Promise<ResellerReview> => {
  const id = `rev_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const newRev: ResellerReview = {
    ...review,
    id,
    created_at: nowIso,
  };

  const reviews = getLocalData<ResellerReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_SEED_REVIEWS);
  reviews.push(newRev);
  setLocalData(STORAGE_KEYS.REVIEWS, reviews);

  // Recalculate reseller rating
  const resellerRevs = reviews.filter(r => r.reseller_id === review.reseller_id);
  const avg = resellerRevs.reduce((acc, curr) => acc + curr.rating, 0) / resellerRevs.length;

  const listings = getLocalData<ResellerListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_SEED_LISTINGS);
  listings.forEach(l => {
    if (l.reseller_id === review.reseller_id) {
      l.reseller_rating = Number(avg.toFixed(1));
      l.reseller_reviews_count = resellerRevs.length;
    }
  });
  setLocalData(STORAGE_KEYS.LISTINGS, listings);

  try {
    await supabase.from('marketplace_reviews').insert({
      id: newRev.id,
      listing_id: newRev.listing_id,
      reseller_id: newRev.reseller_id,
      buyer_name: newRev.buyer_name,
      buyer_phone: newRev.buyer_phone,
      rating: newRev.rating,
      comment: newRev.comment,
      created_at: newRev.created_at,
    });
  } catch (err) {
    console.warn('Could not save review to Supabase:', err);
  }

  return newRev;
};

export const getResellerReviews = async (resellerId: string): Promise<ResellerReview[]> => {
  try {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as ResellerReview[];
    }
  } catch (err) {}
  const allLocal = getLocalData<ResellerReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_SEED_REVIEWS);
  return allLocal.filter(r => r.reseller_id === resellerId);
};

// -------------------------------------------------------------
// Trust & Safety Reports
// -------------------------------------------------------------
export const submitMarketplaceReport = async (
  report: Omit<MarketplaceReport, 'id' | 'created_at' | 'status'>
): Promise<MarketplaceReport> => {
  const id = `rep_${Date.now()}`;
  const nowIso = new Date().toISOString();
  const newReport: MarketplaceReport = {
    ...report,
    id,
    status: 'pending',
    created_at: nowIso,
  };

  const reports = getLocalData<MarketplaceReport[]>(STORAGE_KEYS.REPORTS, []);
  reports.unshift(newReport);
  setLocalData(STORAGE_KEYS.REPORTS, reports);

  try {
    await supabase.from('marketplace_reports').insert({
      id: newReport.id,
      listing_id: newReport.listing_id,
      conversation_id: newReport.conversation_id,
      reporter_role: newReport.reporter_role,
      reporter_name: newReport.reporter_name,
      reporter_phone: newReport.reporter_phone,
      reported_item_or_user: newReport.reported_item_or_user,
      reason: newReport.reason,
      details: newReport.details,
      status: 'pending',
      created_at: nowIso,
    });
  } catch (err) {
    console.warn('Could not save report to Supabase:', err);
  }

  return newReport;
};

export const getMarketplaceReports = async (): Promise<MarketplaceReport[]> => {
  try {
    const { data, error } = await supabase
      .from('marketplace_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as MarketplaceReport[];
    }
  } catch (err) {}
  return getLocalData<MarketplaceReport[]>(STORAGE_KEYS.REPORTS, []);
};
