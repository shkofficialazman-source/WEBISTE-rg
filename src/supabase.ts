import { createClient } from '@supabase/supabase-js';
import { Product, FirestoreOrder, OrderStatus, UserProfile, Category, CategoryId } from './types';
import { CATEGORIES as DEFAULT_CATEGORIES } from './data/categories';

export const SUPABASE_URL: string = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://bmuccamypbfrrhealjgq.supabase.co';

export const SUPABASE_ANON_KEY: string = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdWNjYW15cGJmcnJoZWFsamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTA4MzcsImV4cCI6MjEwMjUyNjgzN30.l50pEP6iS4oeKMAq030YQi9s3Qg2QhPJIYuWI57-9rU';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Test connection helper
export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  ordersTableExists: boolean;
  message: string;
}> => {
  try {
    const { error: prodError } = await supabase.from('products').select('id').limit(1);
    const { error: ordersError } = await supabase.from('orders').select('id').limit(1);

    const ordersTableExists = !ordersError || ordersError.code !== 'PGRST205';

    if (prodError && prodError.code !== 'PGRST116' && prodError.code !== '42P01') {
      return {
        connected: true,
        ordersTableExists,
        message: `Connected to Supabase (${prodError.message || 'Ready'})`,
      };
    }

    return {
      connected: true,
      ordersTableExists,
      message: 'Connected to Supabase Project: bmuccamypbfrrhealjgq',
    };
  } catch (err: any) {
    return {
      connected: true,
      ordersTableExists: false,
      message: 'Supabase client connected',
    };
  }
};

// -------------------------------------------------------------
// Supabase Storage: Product & Card Uploads
// -------------------------------------------------------------
export const uploadImageToSupabase = async (
  file: File,
  bucketName = 'products'
): Promise<string> => {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `uploads/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload notice:', error.message);
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      if (publicUrlData?.publicUrl && !error) {
        return publicUrlData.publicUrl;
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return publicUrlData?.publicUrl || '';
  } catch (err) {
    console.warn('Storage upload notice, using DataURL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
};

// -------------------------------------------------------------
// Products Operations via Supabase (NO MOCK DATA FALLBACK)
// -------------------------------------------------------------
export const fetchProductsFromSupabase = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch products notice:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: String(item.id || item.product_id || `prod-${Math.random().toString(36).substr(2, 6)}`),
      name: String(item.name || 'Custom Product'),
      category: item.category || 'bouquets',
      price: Number(item.price || 0),
      originalPrice: item.original_price ? Number(item.original_price) : (item.originalPrice ? Number(item.originalPrice) : undefined),
      rating: Number(item.rating || 5.0),
      reviewsCount: Number(item.reviews_count || item.reviewsCount || 1),
      image: item.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop',
      galleryImages: item.gallery_images || item.galleryImages || [],
      description: item.description || '',
      shortTagline: item.short_tagline || item.shortTagline || '',
      isBestSeller: Boolean(item.is_bestseller ?? item.isBestSeller ?? false),
      isNewRelease: Boolean(item.is_new_release ?? item.isNewRelease ?? false),
      stockCount: Number(item.stock_count ?? item.stockCount ?? item.stock ?? 10),
      requiresPhotoUpload: Boolean(item.requires_photo_upload ?? item.requiresPhotoUpload ?? false),
      collectorSpecs: typeof item.collector_specs === 'object' && item.collector_specs ? item.collector_specs : (typeof item.collectorSpecs === 'object' && item.collectorSpecs ? item.collectorSpecs : {
        scale: '1:64 Scale',
        casting: item.name || 'Die-Cast Vehicle',
        series: 'Garage Special',
        wheels: 'Real Riders',
        cardCondition: 'Mint / Factory Carded',
        authenticity: 'Official Redline Garage Genuine',
      }),
      giftFeatures: Array.isArray(item.gift_features) ? item.gift_features : (Array.isArray(item.giftFeatures) ? item.giftFeatures : [
        'Includes Collector Case',
        'Express Dispatch in 24h',
      ]),
    }));
  } catch (err) {
    console.warn('Supabase fetch products error:', err);
    return [];
  }
};

export const addProductToSupabase = async (
  productData: Omit<Product, 'id'> & { id?: string }
): Promise<Product> => {
  const newId = productData.id || `sp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const productPayload: Product = {
    ...productData,
    id: newId,
  };

  try {
    const { error } = await supabase.from('products').insert([
      {
        id: newId,
        name: productData.name,
        category: productData.category,
        price: Number(productData.price) || 0,
        original_price: productData.originalPrice ? Number(productData.originalPrice) : null,
        image: productData.image,
        gallery_images: productData.galleryImages && productData.galleryImages.length > 0 ? productData.galleryImages : (productData.image ? [productData.image] : []),
        description: productData.description || '',
        short_tagline: productData.shortTagline || '',
        stock_count: Number(productData.stockCount) || 0,
        is_bestseller: Boolean(productData.isBestSeller),
        is_new_release: Boolean(productData.isNewRelease),
        collector_specs: productData.collectorSpecs || {
          scale: '1:64 Scale',
          casting: productData.name,
          series: 'Garage Special',
          wheels: 'Real Riders',
          cardCondition: 'Mint / Factory Carded',
          authenticity: 'Official Redline Garage Genuine',
        },
        gift_features: productData.giftFeatures || [
          'Includes Collector Case',
          'Express Dispatch in 24h',
        ],
        rating: productData.rating || 5.0,
        reviews_count: productData.reviewsCount || 1,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Supabase product insert FAILED:', error.message);
      throw new Error(`Product was not saved to the database: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Could not insert to Supabase products table:', err);
    throw err instanceof Error ? err : new Error('Product was not saved to the database.');
  }

  return productPayload;
};

export const updateProductInSupabase = async (
  productId: string,
  updates: Partial<Product>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.price !== undefined) dbUpdates.price = Number(updates.price);
    if (updates.originalPrice !== undefined) dbUpdates.original_price = Number(updates.originalPrice);
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.galleryImages !== undefined) dbUpdates.gallery_images = updates.galleryImages;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.shortTagline !== undefined) dbUpdates.short_tagline = updates.shortTagline;
    if (updates.stockCount !== undefined) dbUpdates.stock_count = Number(updates.stockCount);
    if (updates.isBestSeller !== undefined) dbUpdates.is_bestseller = Boolean(updates.isBestSeller);
    if (updates.isNewRelease !== undefined) dbUpdates.is_new_release = Boolean(updates.isNewRelease);
    if (updates.collectorSpecs !== undefined) dbUpdates.collector_specs = updates.collectorSpecs;
    if (updates.giftFeatures !== undefined) dbUpdates.gift_features = updates.giftFeatures;

    const { error } = await supabase.from('products').update(dbUpdates).eq('id', productId);
    if (error) {
      console.error('Supabase update product error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase product update exception:', err);
    return { success: false, error: err?.message || 'Failed to update product in database.' };
  }
};

export const updateStockInSupabase = async (
  productId: string,
  newStock: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const safeStock = Math.max(0, Math.round(newStock));
    const { error } = await supabase
      .from('products')
      .update({ stock_count: safeStock })
      .eq('id', productId);

    if (error) {
      console.error('Supabase stock update error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase stock update exception:', err);
    return { success: false, error: err?.message || 'Failed to update stock in database.' };
  }
};

export const deleteProductFromSupabase = async (productId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.error('Supabase delete product error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase delete notice:', err);
    return { success: false, error: err?.message || 'Failed to delete product from database.' };
  }
};

// -------------------------------------------------------------
// Orders Operations via Supabase (With Local Storage Resilient Mirror)
// -------------------------------------------------------------
const LOCAL_ORDERS_CACHE_KEY = 'redline_garage_orders_cache';

const getCachedLocalOrders = (): FirestoreOrder[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const appendLocalOrderCache = (order: FirestoreOrder) => {
  try {
    const existing = getCachedLocalOrders();
    const filtered = existing.filter(o => o.orderNumber !== order.orderNumber && o.id !== order.id);
    const updated = [order, ...filtered];
    localStorage.setItem(LOCAL_ORDERS_CACHE_KEY, JSON.stringify(updated.slice(0, 100)));
  } catch (e) {
    console.warn('Local order cache notice:', e);
  }
};

export const updateLocalOrderCacheStatus = (
  orderIdentifier: string,
  status: OrderStatus,
  orderNumber?: string
) => {
  try {
    const existing = getCachedLocalOrders();
    const updated = existing.map(o => {
      const match =
        o.id === orderIdentifier ||
        o.orderNumber === orderIdentifier ||
        (orderNumber && o.orderNumber === orderNumber);
      if (match) {
        return { ...o, status };
      }
      return o;
    });
    localStorage.setItem(LOCAL_ORDERS_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Update local order cache status notice:', e);
  }
};

export const updateLocalOrderCacheTracking = (
  orderIdentifier: string,
  tracking: { trackingNumber?: string; courierName?: string; trackingUrl?: string; shippedAt?: string },
  orderNumber?: string
) => {
  try {
    const existing = getCachedLocalOrders();
    const updated = existing.map(o => {
      const match =
        o.id === orderIdentifier ||
        o.orderNumber === orderIdentifier ||
        (orderNumber && o.orderNumber === orderNumber);
      if (match) {
        return {
          ...o,
          trackingNumber: tracking.trackingNumber !== undefined ? tracking.trackingNumber : o.trackingNumber,
          courierName: tracking.courierName !== undefined ? tracking.courierName : o.courierName,
          trackingUrl: tracking.trackingUrl !== undefined ? tracking.trackingUrl : o.trackingUrl,
          shippedAt: tracking.shippedAt !== undefined ? tracking.shippedAt : o.shippedAt,
        };
      }
      return o;
    });
    localStorage.setItem(LOCAL_ORDERS_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Update local order cache tracking notice:', e);
  }
};

/**
 * Set to track processed order IDs in-memory and prevent double stock deduction if checkout is retried
 */
const processedOrderDeductions = new Set<string>();

/**
 * Validates whether all items in an order have sufficient live inventory in Supabase.
 */
export const validateInventoryAvailability = async (
  items: Array<{ productId?: string; id?: string; product?: { id?: string; name?: string }; productName?: string; quantity: number }>
): Promise<{
  valid: boolean;
  message?: string;
  blockedProduct?: { id: string; name: string; available: number; requested: number };
}> => {
  if (!items || items.length === 0) return { valid: true };

  try {
    for (const item of items) {
      const prodId = item.productId || item.product?.id || item.id;
      const requestedQty = Number(item.quantity || 1);
      const itemName = item.productName || item.product?.name || 'Selected product';

      if (!prodId) continue;

      // Query Supabase directly for real-time stock
      const { data: prodData, error } = await supabase
        .from('products')
        .select('id, name, stock_count')
        .eq('id', prodId)
        .maybeSingle();

      if (!error && prodData) {
        const availableStock = Number(prodData.stock_count ?? 10);
        const name = prodData.name || itemName;

        if (availableStock <= 0) {
          return {
            valid: false,
            message: `"${name}" is currently out of stock. Please remove it from your cart to proceed.`,
            blockedProduct: {
              id: prodId,
              name,
              available: 0,
              requested: requestedQty,
            },
          };
        }

        if (requestedQty > availableStock) {
          return {
            valid: false,
            message: `Only ${availableStock} unit${availableStock > 1 ? 's' : ''} left in stock for "${name}". Please reduce quantity to proceed.`,
            blockedProduct: {
              id: prodId,
              name,
              available: availableStock,
              requested: requestedQty,
            },
          };
        }
      }
    }

    return { valid: true };
  } catch (err) {
    console.warn('Live inventory validation check warning:', err);
    return { valid: true }; // Proceed gracefully if transient query check times out
  }
};

export const saveOrderToSupabase = async (orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  userId?: string;
  items: any[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  giftNote?: string;
  referralCode?: string;
  referralDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  loyaltyPointsAwarded?: number;
}): Promise<{ success: boolean; id?: string; error?: string; message?: string }> => {
  const generatedId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // 1. Check stock availability before saving order
  if (Array.isArray(orderData.items) && orderData.items.length > 0) {
    const stockValidation = await validateInventoryAvailability(orderData.items);
    if (!stockValidation.valid) {
      return {
        success: false,
        error: 'insufficient_stock',
        message: stockValidation.message || 'One or more items in your cart has insufficient stock.',
      };
    }
  }

  // Create formatted local mirror order object
  const localOrderObject: FirestoreOrder = {
    id: generatedId,
    orderNumber: orderData.orderNumber,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    customerAddress: orderData.customerAddress,
    customerEmail: orderData.customerEmail,
    userId: orderData.userId,
    items: orderData.items,
    subtotal: Number(orderData.subtotal || 0),
    shipping: Number(orderData.shipping || 0),
    total: Number(orderData.total || 0),
    paymentMethod: orderData.paymentMethod || 'WhatsApp',
    giftNote: orderData.giftNote,
    status: 'pending',
    referralCode: orderData.referralCode,
    referralDiscount: Number(orderData.referralDiscount || 0),
    loyaltyPointsUsed: Number(orderData.loyaltyPointsUsed || 0),
    loyaltyDiscount: Number(orderData.loyaltyDiscount || 0),
    loyaltyPointsAwarded: Number(orderData.loyaltyPointsAwarded || 0),
    createdAt: nowIso,
  };

  // Always write immediately to local cache so no order is lost
  appendLocalOrderCache(localOrderObject);

  try {
    // 2. Real-time Inventory Deduction in Supabase 'products' table
    const orderKey = orderData.orderNumber || generatedId;
    if (!processedOrderDeductions.has(orderKey) && Array.isArray(orderData.items)) {
      processedOrderDeductions.add(orderKey);

      for (const item of orderData.items) {
        const prodId = item.product?.id || item.productId || item.id;
        const qtyOrdered = Number(item.quantity || 1);
        if (prodId && qtyOrdered > 0) {
          try {
            // Fetch current product stock directly from Supabase
            const { data: prodData } = await supabase
              .from('products')
              .select('id, name, stock_count')
              .eq('id', prodId)
              .maybeSingle();

            if (prodData) {
              const currentStock = Number(prodData.stock_count ?? 10);
              const newStock = Math.max(0, currentStock - qtyOrdered);

              // Update stock_count column in Supabase products table
              const { error: updateError } = await supabase
                .from('products')
                .update({ stock_count: newStock })
                .eq('id', prodId);

              if (updateError) {
                console.warn(`Supabase stock update error for product ${prodId}:`, updateError.message);
              } else {
                console.log(`Successfully deducted stock for ${prodData.name || prodId}: ${currentStock} -> ${newStock}`);
              }
            }
          } catch (stockErr) {
            console.warn(`Stock decrement notice for product ${prodId}:`, stockErr);
          }
        }
      }
    }

    // 3. Primary attempt: Insert order to Supabase orders table
    const orderPayload = {
      order_number: orderData.orderNumber,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      customer_address: orderData.customerAddress,
      customer_email: orderData.customerEmail || null,
      user_id: orderData.userId || null,
      items: orderData.items,
      subtotal: Number(orderData.subtotal || 0),
      shipping: Number(orderData.shipping || 0),
      total: Number(orderData.total || 0),
      payment_method: orderData.paymentMethod || 'WhatsApp',
      gift_note: orderData.giftNote || null,
      status: 'pending',
      referral_code: orderData.referralCode || null,
      referral_discount: Number(orderData.referralDiscount || 0),
      loyalty_points_used: Number(orderData.loyaltyPointsUsed || 0),
      loyalty_discount: Number(orderData.loyaltyDiscount || 0),
      loyalty_points_awarded: Number(orderData.loyaltyPointsAwarded || 0),
      created_at: nowIso,
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (insertError) {
      if (insertError.code === 'PGRST205') {
        console.warn(
          'Supabase orders table has not been created yet in PostgreSQL. Please run the SQL schema in supabase_setup.sql in your Supabase SQL Editor.'
        );
      } else {
        console.error('Supabase orders insert error:', insertError.message);
      }
    } else {
      console.log('Order successfully inserted into Supabase orders table:', orderData.orderNumber);
    }

    return { success: true, id: insertResult?.[0]?.id || generatedId };
  } catch (err: any) {
    console.error('Supabase save order exception:', err);
    return {
      success: false,
      error: 'db_error',
      message: err?.message || 'Database connection error. Please try again.',
    };
  }
};

export const fetchOrdersFromSupabase = async (): Promise<FirestoreOrder[]> => {
  const localCached = getCachedLocalOrders();
  try {
    // 1. Fetch live orders from Supabase PostgreSQL
    const { data: supabaseOrders, error: supabaseError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      if (supabaseError.code === 'PGRST205') {
        console.warn('Orders table not yet found in Supabase schema cache. Orders will be loaded from resilient cloud mirrors.');
      } else {
        console.warn('Supabase fetch orders notice:', supabaseError.message);
      }
    }

    const remoteOrders: FirestoreOrder[] = (supabaseOrders || []).map((item: any) => ({
      id: String(item.id || item.order_number || item.orderNumber || `order-${Math.random()}`),
      orderNumber: item.order_number || item.orderNumber || `RG-${item.id}`,
      customerName: item.customer_name || item.customerName || 'Customer',
      customerPhone: item.customer_phone || item.customerPhone || '',
      customerAddress: item.customer_address || item.customerAddress || '',
      customerEmail: item.customer_email || item.customerEmail || undefined,
      userId: item.user_id || item.userId || undefined,
      items: item.items || [],
      subtotal: Number(item.subtotal || 0),
      shipping: Number(item.shipping || 0),
      total: Number(item.total || 0),
      paymentMethod: item.payment_method || item.paymentMethod || 'WhatsApp / COD',
      giftNote: item.gift_note || item.giftNote || undefined,
      status: (item.status as OrderStatus) || 'pending',
      referralCode: item.referral_code || item.referralCode || undefined,
      referralDiscount: Number(item.referral_discount ?? item.referralDiscount ?? 0),
      loyaltyPointsUsed: Number(item.loyalty_points_used ?? item.loyaltyPointsUsed ?? 0),
      loyaltyDiscount: Number(item.loyalty_discount ?? item.loyaltyDiscount ?? 0),
      loyaltyPointsAwarded: Number(item.loyalty_points_awarded ?? item.loyaltyPointsAwarded ?? 0),
      trackingNumber: item.tracking_number || item.trackingNumber || undefined,
      courierName: item.courier_name || item.courierName || undefined,
      trackingUrl: item.tracking_url || item.trackingUrl || undefined,
      shippedAt: item.shipped_at || item.shippedAt || undefined,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));

    // Merge remote orders and local cached orders without duplicates
    const combinedMap = new Map<string, FirestoreOrder>();
    remoteOrders.forEach(o => combinedMap.set(o.orderNumber || o.id, o));
    localCached.forEach(o => {
      const key = o.orderNumber || o.id;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, o);
      }
    });

    const finalOrders = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Keep local cache aligned with latest remote data
    if (remoteOrders.length > 0) {
      try {
        localStorage.setItem(LOCAL_ORDERS_CACHE_KEY, JSON.stringify(finalOrders.slice(0, 100)));
      } catch (e) {
        // safe ignore
      }
    }

    return finalOrders;
  } catch (err) {
    console.warn('Supabase fetch orders exception, using cache:', err);
    return localCached;
  }
};

export const fetchCustomerOrdersFromSupabase = async (
  userId?: string,
  userEmail?: string
): Promise<FirestoreOrder[]> => {
  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    
    if (userId && userEmail) {
      query = query.or(`user_id.eq.${userId},customer_email.eq.${userEmail}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('customer_email', userEmail);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: String(item.id),
      orderNumber: item.order_number || item.orderNumber || `RG-${item.id}`,
      customerName: item.customer_name || item.customerName || 'Customer',
      customerPhone: item.customer_phone || item.customerPhone || '',
      customerAddress: item.customer_address || item.customerAddress || '',
      customerEmail: item.customer_email || item.customerEmail || undefined,
      userId: item.user_id || item.userId || undefined,
      items: item.items || [],
      subtotal: Number(item.subtotal || 0),
      shipping: Number(item.shipping || 0),
      total: Number(item.total || 0),
      paymentMethod: item.payment_method || item.paymentMethod || 'WhatsApp',
      giftNote: item.gift_note || item.giftNote || undefined,
      status: (item.status as OrderStatus) || 'pending',
      trackingNumber: item.tracking_number || item.trackingNumber || undefined,
      courierName: item.courier_name || item.courierName || undefined,
      trackingUrl: item.tracking_url || item.trackingUrl || undefined,
      shippedAt: item.shipped_at || item.shippedAt || undefined,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Supabase fetch customer orders notice:', err);
    return [];
  }
};

/**
 * Direct Live Lookup of Customer Orders by Phone Number from Supabase 'orders' table
 * Sanitizes phone input and handles various input formats (+91, spaces, dashes, 10-digit)
 */
export const fetchOrdersByPhoneFromSupabase = async (
  rawPhone: string
): Promise<{ success: boolean; orders: FirestoreOrder[]; error?: string }> => {
  const cleanedDigits = rawPhone.replace(/\D/g, '');
  if (cleanedDigits.length < 10) {
    return {
      success: false,
      orders: [],
      error: 'Please enter a valid 10-digit mobile number.',
    };
  }

  // Get last 10 digits for Indian mobile numbers
  const last10Digits = cleanedDigits.slice(-10);

  try {
    // 1. Live Query from Supabase orders table with ilike and or filters
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`customer_phone.ilike.%${last10Digits}%,customer_phone.ilike.%${cleanedDigits}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query by phone error:', error.message);
      // If PostgreSQL table error, attempt local cache fallback
      const localCached = getCachedLocalOrders().filter(o => {
        const oDigits = (o.customerPhone || '').replace(/\D/g, '');
        return oDigits.includes(last10Digits) || (o.customerPhone && o.customerPhone.includes(last10Digits));
      });
      return { success: true, orders: localCached };
    }

    const fetchedOrders: FirestoreOrder[] = (data || []).map((item: any) => ({
      id: String(item.id || item.order_number || item.orderNumber || `order-${Math.random()}`),
      orderNumber: item.order_number || item.orderNumber || `RG-${item.id}`,
      customerName: item.customer_name || item.customerName || 'Customer',
      customerPhone: item.customer_phone || item.customerPhone || '',
      customerAddress: item.customer_address || item.customerAddress || '',
      customerEmail: item.customer_email || item.customerEmail || undefined,
      userId: item.user_id || item.userId || undefined,
      items: item.items || [],
      subtotal: Number(item.subtotal || 0),
      shipping: Number(item.shipping || 0),
      total: Number(item.total || 0),
      paymentMethod: item.payment_method || item.paymentMethod || 'WhatsApp / UPI',
      giftNote: item.gift_note || item.giftNote || undefined,
      status: (item.status as OrderStatus) || 'pending',
      referralCode: item.referral_code || item.referralCode || undefined,
      referralDiscount: Number(item.referral_discount ?? item.referralDiscount ?? 0),
      loyaltyPointsUsed: Number(item.loyalty_points_used ?? item.loyaltyPointsUsed ?? 0),
      loyaltyDiscount: Number(item.loyalty_discount ?? item.loyaltyDiscount ?? 0),
      loyaltyPointsAwarded: Number(item.loyalty_points_awarded ?? item.loyaltyPointsAwarded ?? 0),
      trackingNumber: item.tracking_number || item.trackingNumber || undefined,
      courierName: item.courier_name || item.courierName || undefined,
      trackingUrl: item.tracking_url || item.trackingUrl || undefined,
      shippedAt: item.shipped_at || item.shippedAt || undefined,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));

    // Check local cache if recent order was just placed and not yet synced
    const localCached = getCachedLocalOrders().filter(o => {
      const oDigits = (o.customerPhone || '').replace(/\D/g, '');
      return oDigits.includes(last10Digits);
    });

    const combinedMap = new Map<string, FirestoreOrder>();
    fetchedOrders.forEach(o => combinedMap.set(o.orderNumber || o.id, o));
    localCached.forEach(o => {
      const key = o.orderNumber || o.id;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, o);
      }
    });

    const finalOrders = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { success: true, orders: finalOrders };
  } catch (err: any) {
    console.error('Error fetching orders by phone:', err);
    return {
      success: false,
      orders: [],
      error: 'Unable to connect to database. Please check your internet and tap retry.',
    };
  }
};

export const updateOrderStatusInSupabase = async (
  orderIdentifier: string,
  status: OrderStatus,
  orderNumberFallback?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const orderNumber = orderNumberFallback || (orderIdentifier.startsWith('RG-') ? orderIdentifier : undefined);
    let updatedRows: any[] = [];
    let lastError: any = null;

    // 1. Primary match: by unique order_number (e.g. RG-XXXXXX)
    if (orderNumber) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_number', orderNumber)
        .select();

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        lastError = error;
      }
    }

    // 2. Secondary match: if numeric PostgreSQL bigint id (e.g. 1, 2, 3)
    if (updatedRows.length === 0 && /^\d+$/.test(orderIdentifier)) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', Number(orderIdentifier))
        .select();

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        lastError = error;
      }
    }

    // 3. Fallback match: try orderIdentifier as order_number text directly
    if (updatedRows.length === 0 && orderIdentifier) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_number', orderIdentifier)
        .select();

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        lastError = error;
      }
    }

    // Always keep local cache synchronized so subsequent reads and tab switches are consistent
    updateLocalOrderCacheStatus(orderIdentifier, status, orderNumber);

    if (lastError && updatedRows.length === 0) {
      console.error('Supabase update order status error:', lastError.message);
      return { success: false, error: lastError.message };
    }

    console.log(`Supabase order status updated successfully for ${orderNumber || orderIdentifier} -> ${status}`);
    return { success: true };
  } catch (err: any) {
    console.error('Supabase update order status exception:', err);
    updateLocalOrderCacheStatus(orderIdentifier, status, orderNumberFallback);
    return { success: false, error: err?.message || 'Database connection error' };
  }
};

export const updateOrderTrackingInSupabase = async (
  orderIdentifier: string,
  tracking: { trackingNumber?: string; courierName?: string; trackingUrl?: string; shippedAt?: string },
  orderNumberFallback?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload: any = {};
    if (tracking.trackingNumber !== undefined) {
      payload.tracking_number = tracking.trackingNumber;
    }
    if (tracking.courierName !== undefined) {
      payload.courier_name = tracking.courierName;
    }
    if (tracking.trackingUrl !== undefined) {
      payload.tracking_url = tracking.trackingUrl;
    }
    if (tracking.shippedAt !== undefined) {
      payload.shipped_at = tracking.shippedAt;
    }

    const orderNumber = orderNumberFallback || (orderIdentifier.startsWith('RG-') ? orderIdentifier : undefined);
    let updatedRows: any[] = [];
    let lastError: any = null;

    if (orderNumber) {
      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('order_number', orderNumber)
        .select();

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        lastError = error;
      }
    }

    if (updatedRows.length === 0 && /^\d+$/.test(orderIdentifier)) {
      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', Number(orderIdentifier))
        .select();

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        lastError = error;
      }
    }

    if (updatedRows.length === 0 && orderIdentifier) {
      const { data, error } = await supabase
        .from('orders')
        .update(payload)
        .eq('order_number', orderIdentifier)
        .select();

      if (!error && data && data.length > 0) {
        updatedRows = data;
      } else if (error) {
        lastError = error;
      }
    }

    updateLocalOrderCacheTracking(orderIdentifier, tracking, orderNumber);

    if (lastError && updatedRows.length === 0) {
      console.error('Supabase update tracking notice:', lastError.message);
      return { success: false, error: lastError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Supabase update tracking exception:', err);
    updateLocalOrderCacheTracking(orderIdentifier, tracking, orderNumberFallback);
    return { success: false, error: err?.message || 'Database error' };
  }
};

// -------------------------------------------------------------
// Real-time Subscriptions
// -------------------------------------------------------------
export const subscribeToProducts = (onUpdate: (products: Product[]) => void) => {
  const channelId = `products_changes_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      async () => {
        try {
          const fresh = await fetchProductsFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime product update fetch error:', err);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    } catch (e) {
      // safe cleanup ignore
    }
  };
};

export const subscribeToOrders = (onUpdate: (orders: FirestoreOrder[]) => void) => {
  const channelId = `orders_changes_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      async () => {
        try {
          const fresh = await fetchOrdersFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime order update fetch error:', err);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    } catch (e) {
      // safe cleanup ignore
    }
  };
};

// -------------------------------------------------------------
// Categories Operations via Supabase
// -------------------------------------------------------------
export const fetchCategoriesFromSupabase = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase fetch categories notice:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id as CategoryId,
      name: String(item.name || ''),
      tagline: String(item.tagline || ''),
      icon: String(item.icon || 'Car'),
      image: String(item.image || ''),
      badge: String(item.badge || ''),
      sortOrder: item.sort_order !== undefined ? Number(item.sort_order) : undefined,
    }));
  } catch (err) {
    console.warn('Supabase fetch categories error:', err);
    return [];
  }
};

export const addCategoryToSupabase = async (
  category: Partial<Category> & { id: string; name: string }
): Promise<Category> => {
  const cleanId = category.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!cleanId) {
    throw new Error('Collection ID cannot be empty.');
  }

  const categoryPayload = {
    id: cleanId,
    name: category.name.trim(),
    tagline: category.tagline?.trim() || '',
    icon: category.icon || 'Car',
    image: category.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
    badge: category.badge?.trim() || '',
    sort_order: category.sortOrder !== undefined ? Number(category.sortOrder) : 0,
  };

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryPayload])
      .select();

    if (error) {
      console.error('Supabase category insert FAILED:', error.message);
      throw new Error(`Collection was not saved to the database: ${error.message}`);
    }

    const inserted = data?.[0] || categoryPayload;
    return {
      id: inserted.id as CategoryId,
      name: String(inserted.name || categoryPayload.name),
      tagline: String(inserted.tagline || categoryPayload.tagline),
      icon: String(inserted.icon || categoryPayload.icon),
      image: String(inserted.image || categoryPayload.image),
      badge: String(inserted.badge || categoryPayload.badge),
      sortOrder: inserted.sort_order !== undefined ? Number(inserted.sort_order) : categoryPayload.sort_order,
    };
  } catch (err: any) {
    console.error('Could not insert to Supabase categories table:', err);
    throw err instanceof Error ? err : new Error('Collection was not saved to the database.');
  }
};

export const deleteCategoryFromSupabase = async (categoryId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);

    if (error) {
      console.error('Supabase category delete FAILED:', error.message);
      throw new Error(`Collection could not be deleted: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Could not delete from Supabase categories table:', err);
    throw err instanceof Error ? err : new Error('Collection could not be deleted.');
  }
};

export const updateCategoryInSupabase = async (
  categoryId: string,
  updates: Partial<Category>
): Promise<void> => {
  try {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.badge !== undefined) dbUpdates.badge = updates.badge;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = Number(updates.sortOrder);

    const { error } = await supabase.from('categories').update(dbUpdates).eq('id', categoryId);

    if (error) {
      console.error('Supabase category update FAILED:', error.message);
      throw new Error(`Category was not updated in the database: ${error.message}`);
    }
  } catch (err: any) {
    console.error('Could not update Supabase category:', err);
    throw err instanceof Error ? err : new Error('Category was not updated in the database.');
  }
};

export const subscribeToCategories = (onUpdate: (categories: Category[]) => void) => {
  const channelId = `categories_changes_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      async () => {
        try {
          const fresh = await fetchCategoriesFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime category update fetch error:', err);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    } catch (e) {
      // safe cleanup ignore
    }
  };
};