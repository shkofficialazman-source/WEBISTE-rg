import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { Product, FirestoreOrder, OrderStatus, UserProfile, NewsletterSubscriber } from './types';

// Redline Garage Firebase Config
export const firebaseConfig = {
  apiKey: "AIzaSyBSmsm-oi8FNsLj3izYZz56jVCtvMzJJxU",
  authDomain: "redline-garage-shop.firebaseapp.com",
  projectId: "redline-garage-shop",
  storageBucket: "redline-garage-shop.firebasestorage.app",
  messagingSenderId: "859066562808",
  appId: "1:859066562808:web:11793d30ff8d110152e30d",
  measurementId: "G-WKQVG346ME"
};

// Target Authorized Admin Email
export const ADMIN_EMAIL = "diecastlane7@gmail.com";

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Helper to upload product image to Firebase Storage with resilient fallback
export const uploadProductImageToStorage = async (file: File): Promise<string> => {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `products/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage direct upload notice, using resilient DataURL fallback:', error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
};

// -------------------------------------------------------------
// Customer Authentication & User Profile Functions
// -------------------------------------------------------------
export const customerSignUpWithEmailPassword = async (
  name: string,
  email: string,
  pass: string,
  dob?: string,
  phone?: string
): Promise<{ user: User; profile: UserProfile }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  // Set Auth display name
  try {
    await updateProfile(user, { displayName: cleanName });
  } catch (err) {
    console.warn('Profile name update error:', err);
  }

  // Create Firestore document in "users" collection with role "customer"
  const userProfileData: UserProfile = {
    uid: user.uid,
    name: cleanName,
    email: cleanEmail,
    role: 'customer',
    ...(dob ? { dob } : {}),
    ...(phone ? { phone } : {}),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), {
      ...userProfileData,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore user doc write error:', err);
  }

  return { user, profile: userProfileData };
};

export const customerSignInWithEmailPassword = async (
  email: string,
  pass: string
): Promise<{ user: User; profile: UserProfile | null }> => {
  const cleanEmail = email.trim().toLowerCase();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  const profile = await fetchUserProfile(user.uid, user.displayName, user.email);
  return { user, profile };
};

export const fetchUserProfile = async (
  uid: string,
  fallbackName?: string | null,
  fallbackEmail?: string | null
): Promise<UserProfile> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error fetching user profile doc:', err);
  }

  // Fallback if doc didn't exist
  return {
    uid,
    name: fallbackName || 'Customer',
    email: fallbackEmail || '',
    role: 'customer',
  };
};

export const customerSignOut = async (): Promise<void> => {
  await signOut(auth);
};

// Fetch customer's own order history
export const fetchCustomerOrdersFromFirestore = async (
  userId: string,
  email?: string
): Promise<FirestoreOrder[]> => {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const customerOrders: FirestoreOrder[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const matchUser = data.userId && data.userId === userId;
      const matchEmail = email && data.customerEmail && data.customerEmail.toLowerCase() === email.toLowerCase();
      
      if (matchUser || matchEmail) {
        customerOrders.push({
          id: docSnap.id,
          orderNumber: data.orderNumber || `RG-${docSnap.id.substring(0, 6).toUpperCase()}`,
          customerName: data.customerName || 'Customer',
          customerPhone: data.customerPhone || 'N/A',
          customerAddress: data.customerAddress || 'N/A',
          customerEmail: data.customerEmail || '',
          userId: data.userId || '',
          items: data.items || [],
          subtotal: data.subtotal || 0,
          shipping: data.shipping || 0,
          total: data.total || 0,
          paymentMethod: data.paymentMethod || 'WHATSAPP',
          giftNote: data.giftNote || '',
          status: data.status || 'pending',
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString(),
        });
      }
    });

    return customerOrders;
  } catch (err) {
    console.warn('Error fetching customer orders:', err);
    return [];
  }
};

// -------------------------------------------------------------
// Admin Authentication Functions
// -------------------------------------------------------------
export const adminLoginWithEmailPassword = async (email: string, pass: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  
  if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error(`Access Denied: Only authorized administrator (${ADMIN_EMAIL}) is permitted.`);
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return userCredential.user;
  } catch (error: any) {
    // If admin account does not exist in Firebase Authentication yet, create it on first setup
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/wrong-password'
    ) {
      try {
        const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        // Create admin doc in users
        await setDoc(doc(db, 'users', newCredential.user.uid), {
          uid: newCredential.user.uid,
          name: 'Redline Garage Admin',
          email: cleanEmail,
          role: 'admin',
          createdAt: serverTimestamp(),
        });
        return newCredential.user;
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          const retryCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          return retryCredential.user;
        }
        throw new Error(createErr.message || 'Authentication failed. Please verify password.');
      }
    }
    throw new Error(error.message || 'Failed to sign in.');
  }
};

export const adminSignOut = async (): Promise<void> => {
  await signOut(auth);
};

export const isUserAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

// -------------------------------------------------------------
// Products Collection Firestore CRUD
// -------------------------------------------------------------
export const fetchProductsFromFirestore = async (): Promise<Product[]> => {
  try {
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    if (snapshot.empty) {
      return [];
    }

    const fetchedProducts: Product[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Product;
      fetchedProducts.push({
        ...data,
        id: docSnap.id,
        stockCount: typeof data.stockCount === 'number' ? data.stockCount : 5,
      });
    });

    return fetchedProducts;
  } catch (error) {
    console.warn('Firestore fetch products notice:', error);
    return [];
  }
};

export const addProductToFirestore = async (product: Omit<Product, 'id'> & { id?: string }): Promise<Product> => {
  const prodId = product.id || `rg-prod-${Date.now()}`;
  const fullProduct: Product = {
    ...product,
    id: prodId,
    stockCount: Number(product.stockCount) || 0,
    price: Number(product.price) || 0,
    rating: product.rating || 5.0,
    reviewsCount: product.reviewsCount || 0,
    collectorSpecs: product.collectorSpecs || {
      scale: '1:64 Scale',
      casting: 'Authentic Die-Cast',
      series: 'Mainline Hot Wheels',
      wheels: 'Real Riders / Factory OEM',
      cardCondition: 'Mint on Card (MOC)',
      authenticity: '100% Guaranteed Genuine Mattel',
    },
    giftFeatures: product.giftFeatures || [
      'Custom Satin Bow & Redline Badge',
      'Protective Display Clamshell Casing',
      'Certificate of Authenticity'
    ]
  };

  try {
    await setDoc(doc(db, 'products', prodId), fullProduct);
  } catch (err) {
    console.error('Firestore add product error:', err);
  }
  return fullProduct;
};

export const updateProductInFirestore = async (productId: string, updates: Partial<Product>): Promise<void> => {
  try {
    if (!productId) return;
    const prodRef = doc(db, 'products', productId);
    await setDoc(prodRef, updates, { merge: true });
  } catch (err: any) {
    console.warn('Firestore update product notice:', err?.message || err);
  }
};

export const deleteProductFromFirestore = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.error('Firestore delete product error:', err);
  }
};

// -------------------------------------------------------------
// Orders Collection Firestore CRUD
// -------------------------------------------------------------
export const fetchOrdersFromFirestore = async (): Promise<FirestoreOrder[]> => {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const orders: FirestoreOrder[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      orders.push({
        id: docSnap.id,
        orderNumber: data.orderNumber || `RG-${docSnap.id.substring(0, 6).toUpperCase()}`,
        customerName: data.customerName || 'Customer',
        customerPhone: data.customerPhone || 'N/A',
        customerAddress: data.customerAddress || 'N/A',
        customerEmail: data.customerEmail || '',
        items: data.items || [],
        subtotal: data.subtotal || 0,
        shipping: data.shipping || 0,
        total: data.total || 0,
        paymentMethod: data.paymentMethod || 'WHATSAPP',
        giftNote: data.giftNote || '',
        status: data.status || 'pending',
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()) : new Date().toISOString(),
      });
    });

    return orders;
  } catch (error) {
    console.warn('Firestore fetch orders notice:', error);
    return [];
  }
};

export const updateOrderStatusInFirestore = async (
  orderIdentifier: string,
  status: OrderStatus,
  orderNumberFallback?: string
): Promise<void> => {
  try {
    const targets = Array.from(new Set([orderIdentifier, orderNumberFallback].filter(Boolean) as string[]));
    for (const targetId of targets) {
      try {
        const orderRef = doc(db, 'orders', String(targetId));
        await setDoc(orderRef, { status, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        // continue
      }
    }
  } catch (err: any) {
    console.warn('Firestore update order status notice:', err?.message || err);
  }
};

export const saveOrderToFirestore = async (orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  userId?: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    customization?: any;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  giftNote?: string;
}) => {
  try {
    const ordersCollection = collection(db, 'orders');
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      status: 'pending', // Starts as pending as requested
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.warn('Could not save order directly to Firestore:', error);
    return { success: false, error };
  }
};

// -------------------------------------------------------------
// Newsletter & Marketing Subscribers Firestore Collection
// -------------------------------------------------------------

export interface SubscribeResult {
  success: boolean;
  isNew: boolean;
  couponCode?: string;
  message: string;
  subscriberId?: string;
}

export const subscribeToNewsletterInFirestore = async (
  email: string,
  name?: string,
  source: string = 'footer',
  tags: string[] = ['vip_pit_pass', 'collector_drops']
): Promise<SubscribeResult> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return {
      success: false,
      isNew: false,
      message: 'Please provide a valid email address.',
    };
  }

  const welcomeCoupon = 'VIPGARAGE10';

  try {
    const subscribersCol = collection(db, 'newsletter_subscribers');
    // Check if email already exists
    const q = query(subscribersCol, where('email', '==', cleanEmail));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      const data = existingDoc.data();
      
      // If inactive/unsubscribed, reactivate
      if (data.status === 'unsubscribed') {
        await updateDoc(doc(db, 'newsletter_subscribers', existingDoc.id), {
          status: 'active',
          updatedAt: serverTimestamp(),
          source: source || data.source || 'footer',
        });
        return {
          success: true,
          isNew: false,
          couponCode: welcomeCoupon,
          message: 'Welcome back! Your VIP Pit Pass subscription has been reactivated.',
          subscriberId: existingDoc.id,
        };
      }

      return {
        success: true,
        isNew: false,
        couponCode: welcomeCoupon,
        message: 'You are already subscribed to the VIP Pit Pass! Use code VIPGARAGE10 for 10% off.',
        subscriberId: existingDoc.id,
      };
    }

    // Add new subscriber
    const newDoc = await addDoc(subscribersCol, {
      email: cleanEmail,
      name: (name || '').trim(),
      status: 'active',
      source: source || 'footer',
      tags: tags && tags.length > 0 ? tags : ['vip_pit_pass'],
      couponCodeIssued: welcomeCoupon,
      subscribedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      isNew: true,
      couponCode: welcomeCoupon,
      message: 'Welcome to the Redline Garage VIP Pit Pass! Check your discount code below.',
      subscriberId: newDoc.id,
    };
  } catch (error: any) {
    console.warn('Firestore newsletter subscription fallback:', error);
    // Fallback: save to localStorage if offline/network restricted
    try {
      const localSubs = JSON.parse(localStorage.getItem('rg_newsletter_subscribers') || '[]');
      const exists = localSubs.some((s: any) => s.email === cleanEmail);
      if (!exists) {
        localSubs.push({
          id: `sub_${Date.now()}`,
          email: cleanEmail,
          name: (name || '').trim(),
          status: 'active',
          source,
          subscribedAt: new Date().toISOString(),
          couponCodeIssued: welcomeCoupon,
        });
        localStorage.setItem('rg_newsletter_subscribers', JSON.stringify(localSubs));
      }
      return {
        success: true,
        isNew: !exists,
        couponCode: welcomeCoupon,
        message: !exists
          ? 'Welcome to the Redline Garage VIP Pit Pass! Enjoy your 10% discount.'
          : 'You are already subscribed to the VIP Pit Pass! Use code VIPGARAGE10.',
      };
    } catch {
      return {
        success: true,
        isNew: true,
        couponCode: welcomeCoupon,
        message: 'Welcome to the Redline Garage VIP Pit Pass! Enjoy your 10% discount.',
      };
    }
  }
};

export const fetchNewsletterSubscribersFromFirestore = async (): Promise<NewsletterSubscriber[]> => {
  try {
    const subscribersCol = collection(db, 'newsletter_subscribers');
    const snapshot = await getDocs(subscribersCol);

    const subscribers: NewsletterSubscriber[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      subscribers.push({
        id: docSnap.id,
        email: data.email || '',
        name: data.name || '',
        status: data.status || 'active',
        subscribedAt: data.subscribedAt
          ? (data.subscribedAt.toDate ? data.subscribedAt.toDate().toISOString() : data.subscribedAt)
          : new Date().toISOString(),
        source: data.source || 'footer',
        tags: data.tags || ['vip_pit_pass'],
        couponCodeIssued: data.couponCodeIssued || 'VIPGARAGE10',
        notes: data.notes || '',
      });
    });

    // Merge with any local offline cache if exists
    try {
      const localSubs = JSON.parse(localStorage.getItem('rg_newsletter_subscribers') || '[]');
      localSubs.forEach((localSub: NewsletterSubscriber) => {
        if (!subscribers.some((s) => s.email.toLowerCase() === localSub.email.toLowerCase())) {
          subscribers.push(localSub);
        }
      });
    } catch (e) {
      console.warn('Local subscribers read error:', e);
    }

    return subscribers.sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
  } catch (error) {
    console.warn('Error fetching newsletter subscribers from Firestore:', error);
    try {
      const localSubs = JSON.parse(localStorage.getItem('rg_newsletter_subscribers') || '[]');
      return localSubs;
    } catch {
      return [];
    }
  }
};

export const updateNewsletterSubscriberInFirestore = async (
  subscriberId: string,
  updates: Partial<NewsletterSubscriber>
): Promise<void> => {
  try {
    const subRef = doc(db, 'newsletter_subscribers', subscriberId);
    await updateDoc(subRef, { ...updates, updatedAt: serverTimestamp() });
  } catch (error) {
    console.warn('Error updating subscriber in Firestore:', error);
  }
};

export const deleteNewsletterSubscriberFromFirestore = async (subscriberId: string): Promise<void> => {
  try {
    const subRef = doc(db, 'newsletter_subscribers', subscriberId);
    await deleteDoc(subRef);
  } catch (error) {
    console.warn('Error deleting subscriber from Firestore:', error);
    // Remove from localStorage if present
    try {
      const localSubs = JSON.parse(localStorage.getItem('rg_newsletter_subscribers') || '[]');
      const filtered = localSubs.filter((s: any) => s.id !== subscriberId);
      localStorage.setItem('rg_newsletter_subscribers', JSON.stringify(filtered));
    } catch {}
  }
};

