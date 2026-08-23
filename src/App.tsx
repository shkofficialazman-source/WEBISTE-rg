import React, { useState, useEffect, Suspense } from 'react';
import { Product, CartItem, CustomCardConfig, CategoryId, UserProfile } from './types';
import { auth, isUserAdmin, fetchProductsFromFirestore, fetchUserProfile, customerSignOut } from './firebase';
import { fetchProductsFromSupabase, subscribeToProducts } from './supabase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { updateSEO } from './seo';

import { ScrollProgressCar } from './components/ScrollProgressCar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductCatalog } from './components/ProductCatalog';
import { ValueScanner } from './components/ValueScanner';
import { WhyRedline } from './components/WhyRedline';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CollectorSpotlightSection } from './components/CollectorSpotlightSection';
import { BirthdayCelebrationModal } from './components/BirthdayCelebrationModal';
import { OrderAndContactSection } from './components/OrderAndContactSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

// Code-split heavy modals, drawers, chatbot and admin portals for fast mobile loading
const CartDrawer = React.lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const QuickViewModal = React.lazy(() => import('./components/QuickViewModal').then(m => ({ default: m.QuickViewModal })));
const CustomerOrdersModal = React.lazy(() => import('./components/CustomerOrdersModal').then(m => ({ default: m.CustomerOrdersModal })));
const WishlistDrawer = React.lazy(() => import('./components/WishlistDrawer').then(m => ({ default: m.WishlistDrawer })));
const GeminiChatbot = React.lazy(() => import('./components/GeminiChatbot').then(m => ({ default: m.GeminiChatbot })));
const CustomerAuth = React.lazy(() => import('./components/CustomerAuth').then(m => ({ default: m.CustomerAuth })));
const AdminLogin = React.lazy(() => import('./components/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

type AppRoute = 'store' | 'customer-login' | 'admin-login' | 'admin';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('store');
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Products loaded from live Supabase database
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Determine initial route from URL path
  const getRouteFromPath = (path: string): AppRoute => {
    const cleanPath = path.toLowerCase().replace(/\/$/, '');
    if (cleanPath === '/admin/login') return 'admin-login';
    if (cleanPath === '/admin') return 'admin';
    if (cleanPath === '/login') return 'customer-login';
    return 'store';
  };

  // Synchronize URL and Routing
  const navigateToRoute = (route: AppRoute) => {
    let path = '/';
    if (route === 'admin-login') path = '/admin/login';
    if (route === 'admin') path = '/admin';
    if (route === 'customer-login') path = '/login';

    window.history.pushState({}, '', path);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const isAdmin = isUserAdmin(user);
      setAdminUser(isAdmin ? user : null);

      if (user && !isAdmin) {
        setCustomerUser(user);
        try {
          const profile = await fetchUserProfile(user.uid);
          if (profile) {
            setCustomerProfile(profile);
          } else {
            setCustomerProfile({
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Customer',
              email: user.email || '',
              role: 'customer',
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          setCustomerProfile({
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Customer',
            email: user.email || '',
            role: 'customer',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setCustomerUser(null);
        setCustomerProfile(null);
      }

      const pathRoute = getRouteFromPath(window.location.pathname);
      if (pathRoute === 'admin') {
        if (!isAdmin) {
          // If someone who is not logged in tries to open /admin, redirect them to homepage
          navigateToRoute('store');
        } else {
          setCurrentRoute('admin');
        }
      } else if (pathRoute === 'admin-login') {
        if (isAdmin) {
          navigateToRoute('admin');
        } else {
          setCurrentRoute('admin-login');
        }
      } else if (pathRoute === 'customer-login') {
        if (user && !isAdmin) {
          navigateToRoute('store');
        } else {
          setCurrentRoute('customer-login');
        }
      } else {
        setCurrentRoute('store');
      }
    });

    const handlePopState = () => {
      const pathRoute = getRouteFromPath(window.location.pathname);
      if (pathRoute === 'admin' && (!auth.currentUser || !isUserAdmin(auth.currentUser))) {
        navigateToRoute('store');
      } else {
        setCurrentRoute(pathRoute);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch live products directly from Supabase & keep live sync
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        const supabaseProds = await fetchProductsFromSupabase();
        if (isMounted) {
          setProductsList(supabaseProds);
        }
      } catch (err) {
        console.warn('Error loading live products from Supabase:', err);
      }
    };
    loadProducts();

    const unsub = subscribeToProducts((freshProducts) => {
      if (isMounted) {
        setProductsList(freshProducts);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentRoute]);

  // Dynamic SEO metadata update for Google, WhatsApp & Social link previews
  useEffect(() => {
    if (quickViewProduct) {
      updateSEO({ product: quickViewProduct });
    } else if (currentRoute === 'admin' || currentRoute === 'admin-login') {
      updateSEO({
        title: 'Admin Console | Redline Garage India',
        description: 'Secure garage manager dashboard for orders, products, inventory, referral codes, and Google Sheets sync.',
      });
    } else if (currentRoute === 'customer-login') {
      updateSEO({
        title: 'Customer Sign In & Order Tracking | Redline Garage',
        description: 'Access your past Hot Wheels orders, shipping tracking numbers, and account details on Redline Garage.',
      });
    } else {
      updateSEO({
        title: 'Redline Garage — Buy Hot Wheels, Die-Cast Bouquets & Custom Cards in India',
        description: "India's premier destination for rare Hot Wheels, custom die-cast bouquets, acrylic collector frames, personalized blister cards, and AI rarity scanner. Fast shipping across India with genuine authentic collectibles.",
      });
    }
  }, [currentRoute, quickViewProduct]);


  // Hero flagship & Custom Card products (from live database)
  const heroProduct = productsList.length > 0 ? productsList[0] : null;
  const customCardProduct = productsList.find(p => p.id === 'custom-card-personal' || p.category === 'custom-cards') || (productsList.length > 0 ? productsList[0] : null);

  // Customer signout handler
  const handleCustomerSignOut = async () => {
    try {
      await customerSignOut();
      setCustomerUser(null);
      setCustomerProfile(null);
    } catch (err) {
      console.error('Customer sign out failed:', err);
    }
  };

  // Add standard or customized product to cart
  const handleAddToCart = (product: Product, quantity: number = 1, customization?: CustomCardConfig) => {
    setCartItems(prev => {
      if (customization) {
        return [
          ...prev,
          {
            id: `custom-cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            product,
            quantity: quantity || 1,
            customization,
          }
        ];
      }
      const existing = prev.find(item => item.product.id === product.id && !item.customization);
      if (existing) {
        return prev.map(item =>
          item.id === existing.id ? { ...item, quantity: item.quantity + (quantity || 1) } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product,
          quantity: quantity || 1,
        }
      ];
    });
    setIsCartOpen(true);
  };

  // Add customized card product to cart
  const handleAddToCartWithCustomization = (product: Product, config: CustomCardConfig) => {
    const newItem: CartItem = {
      id: `custom-cart-${Date.now()}`,
      product,
      quantity: 1,
      customization: config,
    };
    setCartItems(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  // Cart item management
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Section smooth scrolling
  const handleNavigate = (sectionId: string) => {
    if (currentRoute !== 'store') {
      navigateToRoute('store');
      setTimeout(() => {
        const elem = document.getElementById(sectionId);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Select category and jump to catalog
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    handleNavigate('catalog');
  };

  // -------------------------------------------------------------
  // ROUTE 1: CUSTOMER LOGIN/SIGNUP PAGE (/login)
  // -------------------------------------------------------------
  if (currentRoute === 'customer-login') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white font-mono text-xs">Loading login...</div>}>
        <CustomerAuth
          onSuccess={(profile) => {
            setCustomerProfile(profile);
            navigateToRoute('store');
          }}
          onBackToStore={() => navigateToRoute('store')}
        />
      </Suspense>
    );
  }

  // -------------------------------------------------------------
  // ROUTE 2: ADMIN LOGIN PAGE (/admin/login)
  // -------------------------------------------------------------
  if (currentRoute === 'admin-login') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white font-mono text-xs">Loading admin portal...</div>}>
        <AdminLogin
          onLoginSuccess={() => navigateToRoute('admin')}
          onBackToStore={() => navigateToRoute('store')}
        />
      </Suspense>
    );
  }

  // -------------------------------------------------------------
  // ROUTE 3: ADMIN DASHBOARD PAGE (/admin)
  // -------------------------------------------------------------
  if (currentRoute === 'admin') {
    // If not logged in as authorized admin, silently redirect to homepage
    if (!adminUser) {
      setTimeout(() => navigateToRoute('store'), 0);
      return null;
    }

    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white font-mono text-xs">Loading admin console...</div>}>
        <AdminDashboard
          onLogout={() => navigateToRoute('store')}
          onBackToStore={() => navigateToRoute('store')}
        />
      </Suspense>
    );
  }

  // -------------------------------------------------------------
  // ROUTE 4: CUSTOMER STOREFRONT (/)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans antialiased selection:bg-red-600 selection:text-white pb-20 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Scroll Progress Driving Car Bar */}
      <ScrollProgressCar />

      {/* Header Navigation with Customer Auth & Past Orders */}
      <Navbar
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAdmin={() => navigateToRoute(adminUser ? 'admin' : 'admin-login')}
        userProfile={customerProfile}
        onOpenCustomerLogin={() => navigateToRoute('customer-login')}
        onOpenMyOrders={() => setIsOrdersModalOpen(true)}
        onCustomerLogout={handleCustomerSignOut}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      {/* Hero Section */}
      <div id="hero">
        <HeroSection
          heroProduct={heroProduct}
          products={productsList}
          onSelectProduct={(p) => setQuickViewProduct(p)}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Category Grid Section */}
      <CategoryGrid onSelectCategory={(catId: CategoryId) => handleSelectCategory(catId)} />

      {/* Product Catalog & Shop Grid */}
      <ProductCatalog
        products={productsList}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddToCart={handleAddToCart}
        onQuickView={(p) => setQuickViewProduct(p)}
        searchQuery={searchQuery}
        userProfile={customerProfile}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      {/* AI Hot Wheels Value & Rarity Scanner */}
      <div id="scanner">
        <ValueScanner />
      </div>

      {/* Why Redline Garage Trust Section */}
      <WhyRedline />

      {/* Collector of the Month Community Spotlight */}
      <CollectorSpotlightSection />

      {/* Verified Testimonials */}
      <TestimonialsSection />

      {/* Order & Contact Channels Section */}
      <OrderAndContactSection onOpenCart={() => setIsCartOpen(true)} />

      {/* FAQ Accordion Section */}
      <FAQSection />

      {/* Birthday Celebration Auto-Discount Modal */}
      <BirthdayCelebrationModal
        userProfile={customerProfile}
        onApplyCode={() => {
          setIsCartOpen(true);
        }}
      />

      {/* Showroom Footer with Admin Portal Access & Track Order */}
      <Footer
        onNavigate={handleNavigate}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => navigateToRoute(adminUser ? 'admin' : 'admin-login')}
        onOpenMyOrders={() => setIsOrdersModalOpen(true)}
      />

      {/* Lazy Modals & Drawers */}
      <Suspense fallback={null}>
        {/* Shopping Cart Drawer with User Connection */}
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            userProfile={customerProfile}
          />
        )}

        {/* Customer Past Orders Modal */}
        {isOrdersModalOpen && (
          <CustomerOrdersModal
            isOpen={isOrdersModalOpen}
            onClose={() => setIsOrdersModalOpen(false)}
            userProfile={customerProfile}
          />
        )}

        {/* Wishlist Drawer */}
        {isWishlistOpen && (
          <WishlistDrawer
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            products={productsList}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            userProfile={customerProfile}
            onOpenCustomerLogin={() => navigateToRoute('customer-login')}
          />
        )}

        {/* Quick View Product Modal */}
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Redline Garage AI Pit Crew Chatbot */}
        <GeminiChatbot />
      </Suspense>

      {/* Mobile Floating Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        userProfile={customerProfile}
        onOpenOrders={() => setIsOrdersModalOpen(true)}
        onOpenCustomerLogin={() => navigateToRoute('customer-login')}
      />
    </div>
  );
}

