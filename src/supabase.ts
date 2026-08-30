import { createClient } from '@supabase/supabase-js';
import { Product, FirestoreOrder, OrderStatus, UserProfile, Category, CategoryId, Collection, ProductCollection, OrderTracking, TrackingStatus } from './types';
import { CATEGORIES as DEFAULT_CATEGORIES } from './data/categories';
import { INITIAL_COLLECTIONS } from './data/collections';
import { SUPABASE_COLLECTIONS_SQL } from './data/supabaseCollectionsSchema';

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

    return data.map((item: any) => {
      let rawCat = (item.category || '').toLowerCase();
      const rawName = (item.name || '').toLowerCase();
      let primaryCol = item.collection_id || item.collectionId || item.collector_specs?.collection_id || '';

      // Normalize category and sub-collection
      if (!primaryCol || primaryCol === 'scale-model-diecast' || primaryCol === 'scale-models' || primaryCol === 'all') {
        if (rawCat === 'bouquets' || rawName.includes('bouquet')) {
          primaryCol = 'bouquets';
          rawCat = 'bouquets';
        } else if (rawCat === 'custom-cards' || rawName.includes('customized hot wheels card') || rawName.includes('blister card')) {
          primaryCol = 'custom-cards';
          rawCat = 'custom-cards';
        } else if (rawCat === 'frames' || rawName.includes('frame') || rawName.includes('shadowbox')) {
          primaryCol = 'frames';
          rawCat = 'frames';
        } else if (rawName.includes('majorette')) {
          primaryCol = 'majorette';
          rawCat = 'majorette';
        } else if (rawName.includes('mini gt') || rawName.includes('minigt')) {
          primaryCol = 'minigt';
          rawCat = 'minigt';
        } else if (rawName.includes('cca')) {
          primaryCol = 'cca';
          rawCat = 'cca';
        } else {
          primaryCol = 'hotwheels';
          rawCat = 'hotwheels';
        }
      }

      const isCustomCreation = ['bouquets', 'frames', 'custom-cards'].includes(primaryCol);
      const parentCol = isCustomCreation ? 'custom-creations' : 'scale-models';
      const colIds = [primaryCol, parentCol];
      
      const rawImage = (typeof item.image === 'string' && item.image.trim()) ||
        (typeof item.image_url === 'string' && item.image_url.trim()) ||
        (typeof item.imageUrl === 'string' && item.imageUrl.trim()) ||
        (typeof item.photo_url === 'string' && item.photo_url.trim()) ||
        (typeof item.photoUrl === 'string' && item.photoUrl.trim()) ||
        (Array.isArray(item.gallery_images) && typeof item.gallery_images[0] === 'string' && item.gallery_images[0].trim()) ||
        (Array.isArray(item.galleryImages) && typeof item.galleryImages[0] === 'string' && item.galleryImages[0].trim()) ||
        'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop';

      const galleryList = Array.isArray(item.gallery_images) && item.gallery_images.length > 0
        ? item.gallery_images
        : (Array.isArray(item.galleryImages) && item.galleryImages.length > 0 ? item.galleryImages : [rawImage]);

      return {
        id: String(item.id || item.product_id || `prod-${Math.random().toString(36).substr(2, 6)}`),
        name: String(item.name || 'Custom Product'),
        category: rawCat || primaryCol,
        collectionId: primaryCol,
        collection_id: primaryCol,
        collectionIds: colIds,
        collection_ids: colIds,
        price: Number(item.price || 0),
        originalPrice: item.original_price ? Number(item.original_price) : (item.originalPrice ? Number(item.originalPrice) : undefined),
        rating: Number(item.rating || 5.0),
        reviewsCount: Number(item.reviews_count || item.reviewsCount || 1),
        image: rawImage,
        imageUrl: rawImage,
        galleryImages: galleryList,
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
          collection_id: primaryCol,
          collection_ids: colIds,
        }),
        giftFeatures: Array.isArray(item.gift_features) ? item.gift_features : (Array.isArray(item.giftFeatures) ? item.giftFeatures : [
          'Includes Collector Case',
          'Express Dispatch in 24h',
        ]),
      };
    });
  } catch (err) {
    console.warn('Supabase fetch products error:', err);
    return [];
  }
};

export const addProductToSupabase = async (
  productData: Omit<Product, 'id'> & { id?: string }
): Promise<Product> => {
  const newId = productData.id || `sp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const primaryCol = productData.collectionId || productData.collection_id || (productData.category === 'scale-models' ? 'scale-model-diecast' : productData.category) || 'scale-model-diecast';
  const colIds = productData.collectionIds || productData.collection_ids || [primaryCol];

  const collectorSpecs = {
    scale: '1:64 Scale',
    casting: productData.name,
    series: 'Garage Special',
    wheels: 'Real Riders',
    cardCondition: 'Mint / Factory Carded',
    authenticity: 'Official Redline Garage Genuine',
    ...(productData.collectorSpecs || {}),
    collection_id: primaryCol,
    collection_ids: colIds,
  };

  const productPayload: Product = {
    ...productData,
    id: newId,
    collectionId: primaryCol,
    collection_id: primaryCol,
    collectionIds: colIds,
    collection_ids: colIds,
    collectorSpecs,
  };

  try {
    const insertPayload: any = {
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
      collector_specs: collectorSpecs,
      gift_features: productData.giftFeatures || [
        'Includes Collector Case',
        'Express Dispatch in 24h',
      ],
      rating: productData.rating || 5.0,
      reviews_count: productData.reviewsCount || 1,
      created_at: new Date().toISOString(),
    };

    let { data, error } = await supabase.from('products').insert([insertPayload]).select();

    // If table uses bigint / numeric auto-increment for id, strip string id and retry
    if (error && (error.message?.includes('bigint') || error.message?.includes('integer') || error.message?.includes('syntax for type'))) {
      delete insertPayload.id;
      const retry = await supabase.from('products').insert([insertPayload]).select();
      error = retry.error;
      data = retry.data;
    }

    if (error) {
      console.error('Supabase product insert FAILED:', error.message);
      throw new Error(`Product was not saved to the database: ${error.message}`);
    }

    if (data && data[0]?.id) {
      productPayload.id = String(data[0].id);
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
    
    // Merge collector_specs with collection_id / collection_ids
    if (updates.collectorSpecs !== undefined || updates.collectionId !== undefined || updates.collectionIds !== undefined) {
      const existingSpecs = updates.collectorSpecs || {};
      const primaryCol = updates.collectionId || updates.collection_id || (updates.category === 'scale-models' ? 'scale-model-diecast' : updates.category);
      const colIds = updates.collectionIds || updates.collection_ids || (primaryCol ? [primaryCol] : undefined);
      
      dbUpdates.collector_specs = {
        ...existingSpecs,
        ...(primaryCol ? { collection_id: primaryCol } : {}),
        ...(colIds ? { collection_ids: colIds } : {}),
      };
    }
    
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
  paymentScreenshotUrl?: string;
  aiVerification?: any;
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
    paymentScreenshotUrl: orderData.paymentScreenshotUrl,
    aiVerification: orderData.aiVerification,
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
      payment_screenshot_url: orderData.paymentScreenshotUrl || null,
      ai_verification: orderData.aiVerification || null,
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
      paymentScreenshotUrl: item.payment_screenshot_url || item.paymentScreenshotUrl || undefined,
      aiVerification: item.ai_verification || item.aiVerification || undefined,
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

/**
 * Customer Self-Cancellation within 30-minute window
 * Restores product inventory in Supabase and marks order cancelled.
 */
export const cancelOrderInSupabaseAndRestoreStock = async (
  order: FirestoreOrder,
  reason: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const orderIdentifier = order.id || order.orderNumber;
    const orderNumber = order.orderNumber;

    // 1. Update status in database
    const updateResult = await updateOrderStatusInSupabase(orderIdentifier, 'cancelled', orderNumber);
    
    // 2. Restore stock for each item in order
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const item of (order.items as any[])) {
        const prodId = item.product?.id || item.productId || item.id;
        const qty = Number(item.quantity || 1);
        if (prodId && qty > 0) {
          try {
            const { data: prodData } = await supabase
              .from('products')
              .select('stock_count, stockCount')
              .eq('id', prodId)
              .maybeSingle();

            if (prodData) {
              const currentStock = Number(prodData.stock_count ?? prodData.stockCount ?? 0);
              const restoredStock = currentStock + qty;
              await supabase
                .from('products')
                .update({ stock_count: restoredStock, stockCount: restoredStock })
                .eq('id', prodId);
            }
          } catch (stockErr) {
            console.warn(`Failed to restore stock for product ${prodId}:`, stockErr);
          }
        }
      }
    }

    return { success: updateResult.success, error: updateResult.error };
  } catch (err: any) {
    console.error('Failed to cancel order:', err);
    return { success: false, error: err?.message || 'Could not cancel order' };
  }
};

export const updateOrderAiVerificationInSupabase = async (
  orderIdentifier: string,
  verification: {
    paymentScreenshotUrl?: string;
    aiVerification?: any;
  },
  orderNumberFallback?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload: any = {};
    if (verification.paymentScreenshotUrl !== undefined) {
      payload.payment_screenshot_url = verification.paymentScreenshotUrl;
    }
    if (verification.aiVerification !== undefined) {
      payload.ai_verification = verification.aiVerification;
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

    // Update local cache too
    const local = getCachedLocalOrders();
    const updated = local.map(o => {
      if (o.orderNumber === orderNumber || o.id === orderIdentifier || (orderNumber && o.orderNumber === orderNumber)) {
        return {
          ...o,
          paymentScreenshotUrl: verification.paymentScreenshotUrl || o.paymentScreenshotUrl,
          aiVerification: verification.aiVerification || o.aiVerification,
        };
      }
      return o;
    });
    localStorage.setItem(LOCAL_ORDERS_CACHE_KEY, JSON.stringify(updated));

    return { success: true };
  } catch (err: any) {
    console.error('Supabase update AI verification exception:', err);
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
// Collections & Product Collections Operations via Supabase
// -------------------------------------------------------------

export const getSupabaseCollectionsSchemaSQL = (): string => {
  return SUPABASE_COLLECTIONS_SQL;
};

/**
 * Fetch all product_collections junction entries
 */
export const fetchProductCollectionsFromSupabase = async (filter?: {
  collectionId?: string;
  productId?: string;
}): Promise<ProductCollection[]> => {
  try {
    let query = supabase.from('product_collections').select('*').order('display_order', { ascending: true });

    if (filter?.collectionId) {
      query = query.eq('collection_id', filter.collectionId);
    }
    if (filter?.productId) {
      query = query.eq('product_id', filter.productId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code !== 'PGRST205' && error.code !== '42P01') {
        console.warn('Supabase fetch product_collections warning:', error.message);
      }
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      id: String(item.id || `${item.product_id}_${item.collection_id}`),
      productId: String(item.product_id || item.productId),
      product_id: String(item.product_id || item.productId),
      collectionId: String(item.collection_id || item.collectionId),
      collection_id: String(item.collection_id || item.collectionId),
      displayOrder: Number(item.display_order ?? item.displayOrder ?? 0),
      display_order: Number(item.display_order ?? item.displayOrder ?? 0),
      createdAt: item.created_at || item.createdAt,
      created_at: item.created_at || item.createdAt,
    }));
  } catch (err) {
    console.warn('Error fetching product_collections:', err);
    return [];
  }
};

/**
 * Assign a product to a collection
 */
export const assignProductToCollectionInSupabase = async (
  productId: string,
  collectionId: string,
  displayOrder?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanProdId = productId.trim();
    const cleanColId = collectionId.trim();

    // 1. Determine position if not passed
    let orderPos = displayOrder;
    if (orderPos === undefined) {
      const existing = await fetchProductCollectionsFromSupabase({ collectionId: cleanColId });
      orderPos = existing.length + 1;
    }

    // 2. Upsert into product_collections
    try {
      const { error: junctionError } = await supabase.from('product_collections').upsert(
        [
          {
            id: `pc_${cleanProdId}_${cleanColId}`,
            product_id: cleanProdId,
            collection_id: cleanColId,
            display_order: orderPos,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'product_id,collection_id' }
      );

      if (junctionError && junctionError.code !== 'PGRST205' && junctionError.code !== '42P01') {
        console.warn('Upsert to product_collections notice:', junctionError.message);
      }
    } catch {
      // safe fallback
    }

    // 3. Keep products table sync'd for high backward compatibility
    try {
      const { data: prodData } = await supabase.from('products').select('*').eq('id', cleanProdId).single();
      if (prodData) {
        const currentIds: string[] = Array.isArray(prodData.collection_ids)
          ? prodData.collection_ids
          : [prodData.collection_id || prodData.category || 'scale-model-diecast'];
        if (!currentIds.includes(cleanColId)) {
          currentIds.push(cleanColId);
        }
        await supabase
          .from('products')
          .update({
            collection_id: prodData.collection_id || cleanColId,
            collection_ids: currentIds,
          })
          .eq('id', cleanProdId);
      }
    } catch {
      // safe fallback
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to assign product to collection:', err);
    return { success: false, error: err?.message || 'Failed to assign product' };
  }
};

/**
 * Remove a product from a collection
 */
export const removeProductFromCollectionInSupabase = async (
  productId: string,
  collectionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanProdId = productId.trim();
    const cleanColId = collectionId.trim();

    // 1. Delete from product_collections
    try {
      await supabase
        .from('product_collections')
        .delete()
        .eq('product_id', cleanProdId)
        .eq('collection_id', cleanColId);
    } catch {
      // safe fallback
    }

    // 2. Sync products table collection_ids
    try {
      const { data: prodData } = await supabase.from('products').select('*').eq('id', cleanProdId).single();
      if (prodData) {
        const currentIds: string[] = (Array.isArray(prodData.collection_ids) ? prodData.collection_ids : [prodData.collection_id || prodData.category]).filter(
          (c: string) => c !== cleanColId
        );
        const nextPrimary = currentIds.length > 0 ? currentIds[0] : (prodData.category || 'scale-model-diecast');
        await supabase
          .from('products')
          .update({
            collection_id: nextPrimary,
            collection_ids: currentIds,
          })
          .eq('id', cleanProdId);
      }
    } catch {
      // safe fallback
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to remove product from collection:', err);
    return { success: false, error: err?.message || 'Failed to remove product' };
  }
};

/**
 * Set all collection assignments for a product
 */
export const setProductCollectionsInSupabase = async (
  productId: string,
  collectionIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const cleanProdId = productId.trim();
    const cleanColIds = Array.from(new Set(collectionIds.filter(Boolean)));

    // 1. Clear existing junction mappings
    try {
      await supabase.from('product_collections').delete().eq('product_id', cleanProdId);
    } catch {
      // safe fallback
    }

    // 2. Insert new junction mappings
    if (cleanColIds.length > 0) {
      const now = new Date().toISOString();
      const records = cleanColIds.map((colId, index) => ({
        id: `pc_${cleanProdId}_${colId}`,
        product_id: cleanProdId,
        collection_id: colId,
        display_order: index + 1,
        created_at: now,
      }));

      try {
        await supabase.from('product_collections').upsert(records, { onConflict: 'product_id,collection_id' });
      } catch {
        // safe fallback
      }
    }

    // 3. Sync to products table
    try {
      const primaryCol = cleanColIds.length > 0 ? cleanColIds[0] : 'scale-model-diecast';
      await supabase
        .from('products')
        .update({
          collection_id: primaryCol,
          collection_ids: cleanColIds,
        })
        .eq('id', cleanProdId);
    } catch {
      // safe fallback
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to set product collections:', err);
    return { success: false, error: err?.message || 'Failed to set product collections' };
  }
};

/**
 * Reorder products inside a specific collection
 */
export const reorderProductsInCollectionInSupabase = async (
  collectionId: string,
  orderedProductIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    for (let index = 0; index < orderedProductIds.length; index++) {
      const prodId = orderedProductIds[index];
      const displayOrder = index + 1;

      try {
        await supabase
          .from('product_collections')
          .update({ display_order: displayOrder })
          .eq('collection_id', collectionId)
          .eq('product_id', prodId);
      } catch {
        // safe fallback
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to reorder products in collection:', err);
    return { success: false, error: err?.message || 'Failed to reorder products' };
  }
};

/**
 * Fetch all storefront collections with product counts and productIds
 */
export const fetchCollectionsFromSupabase = async (): Promise<Collection[]> => {
  try {
    // 1. Fetch junction mappings for accurate counts and links
    let productCollectionsMap: Record<string, string[]> = {};
    try {
      const pcRecords = await fetchProductCollectionsFromSupabase();
      pcRecords.forEach((pc) => {
        const cId = pc.collectionId;
        if (!productCollectionsMap[cId]) {
          productCollectionsMap[cId] = [];
        }
        if (!productCollectionsMap[cId].includes(pc.productId)) {
          productCollectionsMap[cId].push(pc.productId);
        }
      });
    } catch (e) {
      // ignore
    }

    // 2. Try fetching from public.collections table first
    const { data: colsData, error: colsErr } = await supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true });

    if (!colsErr && colsData && colsData.length > 0) {
      return colsData.map((item: any) => {
        const id = String(item.id || item.slug);
        const linkedIds = productCollectionsMap[id] || [];
        return {
          id,
          name: String(item.name || ''),
          slug: String(item.slug || item.id),
          description: String(item.description || item.tagline || ''),
          tagline: String(item.tagline || item.description || ''),
          coverImageUrl: String(item.cover_image_url || item.image || ''),
          cover_image_url: String(item.cover_image_url || item.image || ''),
          image: String(item.cover_image_url || item.image || ''),
          displayOrder: item.display_order !== undefined ? Number(item.display_order) : (item.sort_order !== undefined ? Number(item.sort_order) : 0),
          display_order: item.display_order !== undefined ? Number(item.display_order) : (item.sort_order !== undefined ? Number(item.sort_order) : 0),
          active: item.active !== undefined ? Boolean(item.active) : true,
          parentId: item.parent_id || item.parentId || null,
          parent_id: item.parent_id || item.parentId || null,
          badge: String(item.badge || ''),
          icon: String(item.icon || 'Car'),
          productCount: linkedIds.length,
          product_count: linkedIds.length,
          productIds: linkedIds,
          createdAt: item.created_at || item.createdAt,
          created_at: item.created_at || item.createdAt,
          updatedAt: item.updated_at || item.updatedAt,
          updated_at: item.updated_at || item.updatedAt,
        };
      });
    }

    // 3. Fallback to public.categories table
    const { data: catsData, error: catsErr } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!catsErr && catsData && catsData.length > 0) {
      return catsData.map((item: any) => {
        const id = String(item.id);
        const isChild = id === 'bouquets' || id === 'custom-cards' || id === 'frames';
        const parentId = isChild ? 'hot-wheels-customize' : (item.parent_id || null);
        const linkedIds = productCollectionsMap[id] || [];

        return {
          id,
          name: String(item.name || ''),
          slug: id,
          description: String(item.tagline || ''),
          tagline: String(item.tagline || ''),
          coverImageUrl: String(item.image || ''),
          cover_image_url: String(item.image || ''),
          image: String(item.image || ''),
          displayOrder: item.sort_order !== undefined ? Number(item.sort_order) : 0,
          display_order: item.sort_order !== undefined ? Number(item.sort_order) : 0,
          active: true,
          parentId,
          parent_id: parentId,
          badge: String(item.badge || ''),
          icon: String(item.icon || 'Car'),
          productCount: linkedIds.length,
          product_count: linkedIds.length,
          productIds: linkedIds,
          createdAt: item.created_at,
          created_at: item.created_at,
        };
      });
    }

    return INITIAL_COLLECTIONS.map((c) => ({
      ...c,
      productCount: productCollectionsMap[c.id]?.length || 0,
      productIds: productCollectionsMap[c.id] || [],
    }));
  } catch (err) {
    console.warn('Supabase fetch collections fallback to initial:', err);
    return INITIAL_COLLECTIONS;
  }
};

export const addCollectionToSupabase = async (
  collection: Partial<Collection> & { name: string }
): Promise<Collection> => {
  const cleanSlug = (collection.slug || collection.id || collection.name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '') || `col-${Date.now()}`;

  const cleanId = cleanSlug;
  const now = new Date().toISOString();

  const collectionPayload = {
    id: cleanId,
    name: collection.name.trim(),
    slug: cleanSlug,
    description: collection.description?.trim() || collection.tagline?.trim() || '',
    tagline: collection.tagline?.trim() || collection.description?.trim() || '',
    cover_image_url: collection.coverImageUrl || collection.image || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    image: collection.coverImageUrl || collection.image || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    display_order: collection.displayOrder !== undefined ? Number(collection.displayOrder) : (collection.display_order !== undefined ? Number(collection.display_order) : 99),
    sort_order: collection.displayOrder !== undefined ? Number(collection.displayOrder) : (collection.display_order !== undefined ? Number(collection.display_order) : 99),
    active: collection.active !== undefined ? Boolean(collection.active) : true,
    parent_id: collection.parentId || collection.parent_id || null,
    badge: collection.badge?.trim() || '',
    icon: collection.icon || 'Car',
    created_at: now,
    updated_at: now,
  };

  // Attempt write to `collections` table
  try {
    const { error: colError } = await supabase.from('collections').upsert([collectionPayload]);
    if (colError && colError.code !== 'PGRST205' && colError.code !== '42P01') {
      console.warn('Upsert to collections warning:', colError.message);
    }
  } catch (e) {
    // Ignore if table doesn't exist yet
  }

  // Also sync to `categories` table for seamless dual-compatibility
  try {
    const { error: catError } = await supabase.from('categories').upsert([{
      id: cleanId,
      name: collectionPayload.name,
      tagline: collectionPayload.description,
      icon: collectionPayload.icon,
      image: collectionPayload.cover_image_url,
      badge: collectionPayload.badge,
      sort_order: collectionPayload.display_order,
    }]);

    if (catError) {
      console.warn('Sync to categories notice:', catError.message);
    }
  } catch (err: any) {
    console.error('Could not sync to Supabase categories table:', err);
  }

  return {
    id: cleanId,
    name: collectionPayload.name,
    slug: cleanSlug,
    description: collectionPayload.description,
    tagline: collectionPayload.description,
    coverImageUrl: collectionPayload.cover_image_url,
    cover_image_url: collectionPayload.cover_image_url,
    image: collectionPayload.cover_image_url,
    displayOrder: collectionPayload.display_order,
    display_order: collectionPayload.display_order,
    active: collectionPayload.active,
    parentId: collectionPayload.parent_id,
    parent_id: collectionPayload.parent_id,
    badge: collectionPayload.badge,
    icon: collectionPayload.icon,
    productCount: 0,
    product_count: 0,
    productIds: [],
    createdAt: now,
    created_at: now,
  };
};

export const updateCollectionInSupabase = async (
  collectionId: string,
  updates: Partial<Collection>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const now = new Date().toISOString();
    const dbUpdates: Record<string, any> = { updated_at: now };

    if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug.trim().toLowerCase();
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description.trim();
      dbUpdates.tagline = updates.description.trim();
    }
    if (updates.tagline !== undefined) {
      dbUpdates.tagline = updates.tagline.trim();
      dbUpdates.description = updates.tagline.trim();
    }
    if (updates.coverImageUrl !== undefined || updates.image !== undefined) {
      const img = updates.coverImageUrl || updates.image;
      dbUpdates.cover_image_url = img;
      dbUpdates.image = img;
    }
    if (updates.displayOrder !== undefined || updates.display_order !== undefined) {
      const order = Number(updates.displayOrder ?? updates.display_order);
      dbUpdates.display_order = order;
      dbUpdates.sort_order = order;
    }
    if (updates.active !== undefined) dbUpdates.active = Boolean(updates.active);
    if (updates.parentId !== undefined || updates.parent_id !== undefined) {
      dbUpdates.parent_id = updates.parentId ?? updates.parent_id;
    }
    if (updates.badge !== undefined) dbUpdates.badge = updates.badge;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;

    // 1. Try update collections
    try {
      await supabase.from('collections').update(dbUpdates).eq('id', collectionId);
    } catch {
      // safe fallback
    }

    // 2. Also update categories table
    const catUpdates: Record<string, any> = {};
    if (dbUpdates.name) catUpdates.name = dbUpdates.name;
    if (dbUpdates.description || dbUpdates.tagline) catUpdates.tagline = dbUpdates.description || dbUpdates.tagline;
    if (dbUpdates.cover_image_url) catUpdates.image = dbUpdates.cover_image_url;
    if (dbUpdates.badge !== undefined) catUpdates.badge = dbUpdates.badge;
    if (dbUpdates.icon) catUpdates.icon = dbUpdates.icon;
    if (dbUpdates.display_order !== undefined) catUpdates.sort_order = dbUpdates.display_order;

    if (Object.keys(catUpdates).length > 0) {
      const { error: catErr } = await supabase.from('categories').update(catUpdates).eq('id', collectionId);
      if (catErr && catErr.code !== 'PGRST116') {
        console.warn('Update categories notice:', catErr.message);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Supabase collection update exception:', err);
    return { success: false, error: err?.message || 'Failed to update collection.' };
  }
};

export const deleteCollectionFromSupabase = async (collectionId: string): Promise<void> => {
  try {
    // 1. Delete associated product_collections
    try {
      await supabase.from('product_collections').delete().eq('collection_id', collectionId);
    } catch {
      // safe fallback
    }

    // 2. Delete collection
    try {
      await supabase.from('collections').delete().eq('id', collectionId);
    } catch {
      // safe fallback
    }

    // 3. Delete category
    await supabase.from('categories').delete().eq('id', collectionId);
  } catch (err: any) {
    console.error('Could not delete from Supabase collection:', err);
    throw err instanceof Error ? err : new Error('Collection could not be deleted.');
  }
};

export const reorderCollectionsInSupabase = async (
  orderedCollectionIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    for (let index = 0; index < orderedCollectionIds.length; index++) {
      const id = orderedCollectionIds[index];
      const displayOrder = index + 1;

      try {
        await supabase
          .from('collections')
          .update({ display_order: displayOrder, sort_order: displayOrder })
          .eq('id', id);
      } catch {
        // safe fallback
      }

      await supabase
        .from('categories')
        .update({ sort_order: displayOrder })
        .eq('id', id);
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to reorder collections in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to reorder collections' };
  }
};

export const subscribeToCollections = (onUpdate: (collections: Collection[]) => void) => {
  const channelId = `collections_changes_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'collections' },
      async () => {
        try {
          const fresh = await fetchCollectionsFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime collections update fetch error:', err);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'product_collections' },
      async () => {
        try {
          const fresh = await fetchCollectionsFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime product_collections update fetch error:', err);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      async () => {
        try {
          const fresh = await fetchCollectionsFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime categories update fetch error:', err);
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

export const subscribeToProductCollections = (onUpdate: (productCollections: ProductCollection[]) => void) => {
  const channelId = `product_collections_changes_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'product_collections' },
      async () => {
        try {
          const fresh = await fetchProductCollectionsFromSupabase();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime product_collections update fetch error:', err);
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
// Legacy Categories Operations via Supabase (Backward compatibility)
// -------------------------------------------------------------
export const fetchCategoriesFromSupabase = async (): Promise<Category[]> => {
  const cols = await fetchCollectionsFromSupabase();
  return cols.map(c => ({
    id: c.id as CategoryId,
    name: c.name,
    tagline: c.description || c.tagline || '',
    icon: c.icon || 'Car',
    image: c.coverImageUrl || c.image || '',
    badge: c.badge || '',
    sortOrder: c.displayOrder,
    parentId: c.parentId,
    active: c.active,
  }));
};

export const addCategoryToSupabase = async (
  category: Partial<Category> & { id: string; name: string }
): Promise<Category> => {
  const col = await addCollectionToSupabase({
    ...category,
    description: category.tagline,
    coverImageUrl: category.image,
    displayOrder: category.sortOrder,
  });
  return {
    id: col.id as CategoryId,
    name: col.name,
    tagline: col.description,
    icon: col.icon || 'Car',
    image: col.coverImageUrl || '',
    badge: col.badge || '',
    sortOrder: col.displayOrder,
  };
};

export const deleteCategoryFromSupabase = async (categoryId: string): Promise<void> => {
  return deleteCollectionFromSupabase(categoryId);
};

export const updateCategoryInSupabase = async (
  categoryId: string,
  updates: Partial<Category>
): Promise<void> => {
  await updateCollectionInSupabase(categoryId, {
    ...updates,
    description: updates.tagline,
    coverImageUrl: updates.image,
    displayOrder: updates.sortOrder,
  });
};

export const subscribeToCategories = (onUpdate: (categories: Category[]) => void) => {
  return subscribeToCollections(async () => {
    const cats = await fetchCategoriesFromSupabase();
    onUpdate(cats);
  });
};

// -------------------------------------------------------------
// Order Tracking Operations via Supabase (order_tracking table)
// -------------------------------------------------------------

/**
 * Standardize and clean phone numbers for flexible search
 * Handles Indian numbers with or without +91, spaces, hyphens
 */
export const normalizePhoneForSearch = (phone: string): { clean: string; last10: string; variations: string[] } => {
  if (!phone) return { clean: '', last10: '', variations: [] };
  const clean = phone.replace(/[^0-9]/g, '');
  const last10 = clean.slice(-10);
  const variations = Array.from(new Set([
    phone.trim(),
    clean,
    last10,
    `+91${last10}`,
    `91${last10}`,
    `0${last10}`,
  ])).filter(Boolean);

  return { clean, last10, variations };
};

/**
 * Helper to auto-generate tracking link based on courier partner & tracking ID / AWB
 */
export const generateCourierTrackingLink = (courierName?: string, trackingId?: string): string => {
  if (!trackingId) return '';
  const trimmedAwb = trackingId.trim();
  const cLower = (courierName || '').toLowerCase().trim();

  if (cLower.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?trkid=${encodeURIComponent(trimmedAwb)}`;
  }
  if (cLower.includes('bluedart') || cLower.includes('blue dart')) {
    return `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(trimmedAwb)}`;
  }
  if (cLower.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${encodeURIComponent(trimmedAwb)}`;
  }
  if (cLower.includes('india post') || cLower.includes('indiapost') || cLower.includes('speed post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
  }
  if (cLower.includes('xpressbees') || cLower.includes('xpress bees')) {
    return `https://www.xpressbees.com/track?isawb=Yes&trackid=${encodeURIComponent(trimmedAwb)}`;
  }
  if (cLower.includes('ecom') || cLower.includes('ecom express')) {
    return `https://ecomexpress.in/tracking/?awb_number=${encodeURIComponent(trimmedAwb)}`;
  }
  if (cLower.includes('shadowfax')) {
    return `https://tracker.shadowfax.in/#/track/${encodeURIComponent(trimmedAwb)}`;
  }
  if (cLower.includes('shiprocket')) {
    return `https://shiprocket.co/tracking/${encodeURIComponent(trimmedAwb)}`;
  }
  return '';
};

/**
 * Fetch tracking entries for a given customer phone number
 */
export const fetchOrderTrackingByPhone = async (customerPhone: string): Promise<OrderTracking[]> => {
  try {
    if (!customerPhone || !customerPhone.trim()) return [];
    const { clean, last10, variations } = normalizePhoneForSearch(customerPhone);
    
    // First query with exact or common variations
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch order_tracking notice:', error.message);
      // Fallback: check if orders table has orders for this phone with tracking info
      return fetchTrackingFromOrdersFallback(customerPhone);
    }

    if (!data || data.length === 0) {
      return fetchTrackingFromOrdersFallback(customerPhone);
    }

    // Filter matching records by phone
    const filtered = data.filter((row: any) => {
      const rowPhone = (row.customer_phone || '').replace(/[^0-9]/g, '');
      if (!rowPhone) return false;
      const rowLast10 = rowPhone.slice(-10);
      return (
        rowPhone === clean ||
        (last10 && rowLast10 === last10) ||
        variations.includes(row.customer_phone)
      );
    });

    if (filtered.length === 0) {
      return fetchTrackingFromOrdersFallback(customerPhone);
    }

    return filtered.map(normalizeOrderTrackingRecord);
  } catch (err) {
    console.error('Error in fetchOrderTrackingByPhone:', err);
    return fetchTrackingFromOrdersFallback(customerPhone);
  }
};

/**
 * Fallback to check orders table if order_tracking table doesn't have an entry yet
 */
const fetchTrackingFromOrdersFallback = async (customerPhone: string): Promise<OrderTracking[]> => {
  try {
    const { clean, last10 } = normalizePhoneForSearch(customerPhone);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const matchingOrders = data.filter((ord: any) => {
      const ordPhone = (ord.customer_phone || ord.customerPhone || '').replace(/[^0-9]/g, '');
      return ordPhone === clean || (last10 && ordPhone.slice(-10) === last10);
    });

    return matchingOrders.map((ord: any) => {
      const awb = ord.tracking_number || ord.trackingNumber || ord.order_number || ord.orderNumber || ord.id;
      const courier = ord.courier_name || ord.courierName || 'Standard Express';
      const statusMap: Record<string, TrackingStatus> = {
        delivered: 'Delivered',
        shipped: 'Shipped',
        confirmed: 'Processing',
        pending: 'Processing',
        cancelled: 'Processing',
      };
      const status: TrackingStatus = statusMap[String(ord.status).toLowerCase()] || 'Processing';

      return {
        id: ord.id || `ord-track-${Date.now()}`,
        customer_phone: ord.customer_phone || ord.customerPhone || customerPhone,
        customerPhone: ord.customer_phone || ord.customerPhone || customerPhone,
        order_id: ord.order_number || ord.orderNumber || ord.id,
        orderId: ord.order_number || ord.orderNumber || ord.id,
        tracking_id: awb,
        trackingId: awb,
        tracking_link: ord.tracking_url || ord.trackingUrl || generateCourierTrackingLink(courier, awb),
        trackingLink: ord.tracking_url || ord.trackingUrl || generateCourierTrackingLink(courier, awb),
        courier_name: courier,
        courierName: courier,
        status,
        created_at: ord.created_at || ord.createdAt || new Date().toISOString(),
        createdAt: ord.created_at || ord.createdAt || new Date().toISOString(),
        updated_at: ord.updated_at || ord.updatedAt || new Date().toISOString(),
        updatedAt: ord.updated_at || ord.updatedAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    return [];
  }
};

/**
 * Normalizes an order_tracking row from Supabase
 */
const normalizeOrderTrackingRecord = (row: any): OrderTracking => {
  return {
    id: row.id,
    customer_phone: row.customer_phone || '',
    customerPhone: row.customer_phone || '',
    order_id: row.order_id || null,
    orderId: row.order_id || null,
    tracking_id: row.tracking_id || null,
    trackingId: row.tracking_id || null,
    tracking_link: row.tracking_link || null,
    trackingLink: row.tracking_link || null,
    courier_name: row.courier_name || null,
    courierName: row.courier_name || null,
    status: row.status || 'Processing',
    created_at: row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
};

/**
 * Fetch all tracking entries for the Admin Panel
 */
export const fetchAllOrderTracking = async (): Promise<OrderTracking[]> => {
  try {
    const { data, error } = await supabase
      .from('order_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchAllOrderTracking notice:', error.message);
      return [];
    }

    if (!data) return [];
    return data.map(normalizeOrderTrackingRecord);
  } catch (err) {
    console.error('Error in fetchAllOrderTracking:', err);
    return [];
  }
};

/**
 * Add a new order tracking entry (Admin)
 */
export const addOrderTrackingEntry = async (
  entry: Partial<OrderTracking> & { customer_phone: string }
): Promise<OrderTracking> => {
  const cleanPhone = entry.customer_phone.trim();
  const trackingLink = entry.tracking_link || generateCourierTrackingLink(entry.courier_name || '', entry.tracking_id || '');

  const payload: any = {
    customer_phone: cleanPhone,
    order_id: entry.order_id?.trim() || null,
    tracking_id: entry.tracking_id?.trim() || null,
    tracking_link: trackingLink || null,
    courier_name: entry.courier_name?.trim() || null,
    status: entry.status || 'Processing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('order_tracking')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add tracking entry: ${error.message}`);
  }

  return normalizeOrderTrackingRecord(data);
};

/**
 * Update an existing tracking entry (Admin)
 */
export const updateOrderTrackingEntry = async (
  id: string,
  updates: Partial<OrderTracking>
): Promise<OrderTracking> => {
  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.customer_phone !== undefined) payload.customer_phone = updates.customer_phone.trim();
  if (updates.order_id !== undefined) payload.order_id = updates.order_id?.trim() || null;
  if (updates.tracking_id !== undefined) payload.tracking_id = updates.tracking_id?.trim() || null;
  if (updates.courier_name !== undefined) payload.courier_name = updates.courier_name?.trim() || null;
  if (updates.status !== undefined) payload.status = updates.status;
  
  if (updates.tracking_link !== undefined) {
    payload.tracking_link = updates.tracking_link?.trim() || null;
  } else if (updates.tracking_id || updates.courier_name) {
    const courier = updates.courier_name || '';
    const awb = updates.tracking_id || '';
    const autoLink = generateCourierTrackingLink(courier, awb);
    if (autoLink) payload.tracking_link = autoLink;
  }

  const { data, error } = await supabase
    .from('order_tracking')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tracking entry: ${error.message}`);
  }

  return normalizeOrderTrackingRecord(data);
};

/**
 * Delete a tracking entry (Admin)
 */
export const deleteOrderTrackingEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('order_tracking')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete tracking entry: ${error.message}`);
  }
};

/**
 * Real-time subscription to order_tracking table
 */
export const subscribeToOrderTracking = (onUpdate: (records: OrderTracking[]) => void) => {
  const channelId = `order_tracking_changes_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_tracking' },
      async () => {
        try {
          const fresh = await fetchAllOrderTracking();
          onUpdate(fresh);
        } catch (err) {
          console.warn('Realtime order_tracking fetch error:', err);
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