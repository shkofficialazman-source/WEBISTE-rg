import React, { useState, useEffect, Suspense } from 'react';
import { Product, CartItem, CustomCardConfig, CategoryId, UserProfile, PitCrewRole, Category } from './types';
import { auth, isUserAdmin, fetchUserProfile, customerSignOut } from './firebase';
import { fetchProductsFromSupabase, subscribeToProducts, fetchCategoriesFromSupabase, subscribeToCategories } from './supabase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { updateSEO } from './seo';

import { ScrollProgressCar } from './components/ScrollProgressCar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HomeCollectionsFeature } from './components/HomeCollectionsFeature';
import { HomeSpotlightSection } from './components/HomeSpotlightSection';
import { ScaleModelsPage } from './components/ScaleModelsPage';
import { CustomCreationPage } from './components/CustomCreationPage';
import { WhatsAppCommunityBanner } from './components/WhatsAppCommunityBanner';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PageLoadingState } from './components/LoadingSpinner';

// Lazy-load secondary and modal components
const ValueScanner = React.lazy(() => import('./components/ValueScanner').then(m => ({ default: m.ValueScanner })));
const TrackOrderPage = React.lazy(() => import('./components/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const WhyRedline = React.lazy(() => import('./components/WhyRedline').then(m => ({ default: m.WhyRedline })));
const FAQSection = React.lazy(() => import('./components/FAQSection').then(m => ({ default: m.FAQSection })));
const BirthdayCelebrationModal = React.lazy(() => import('./components/BirthdayCelebrationModal').then(m => ({ default: m.BirthdayCelebrationModal })));
const CartDrawer = React.lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const QuickViewModal = React.lazy(() => import('./components/QuickViewModal').then(m => ({ default: m.QuickViewModal })));
const CustomerOrdersModal = React.lazy(() => import('./components/CustomerOrdersModal').then(m => ({ default: m.CustomerOrdersModal })));
const WishlistDrawer = React.lazy(() => import('./components/WishlistDrawer').then(m => ({ default: m.WishlistDrawer })));
const GeminiChatbot = React.lazy(() => import('./components/GeminiChatbot').then(m => ({ default: m.GeminiChatbot })));
const CustomerAuth = React.lazy(() => import('./components/CustomerAuth').then(m => ({ default: m.CustomerAuth })));
const AdminLogin = React.lazy(() => import('./components/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

type AppRoute = 'home' | 'scalemodels' | 'hotwheels' | 'majorette' | 'minigt' | 'cca' | 'customcreation' | 'valuescanner' | 'track-order' | 'customer-login' | 'admin-login' | 'admin';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Products and Categories loaded from live Supabase database
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isInitialDataLoading, setIsInitialDataLoading] = useState<boolean>(true);
  const [isDataSyncing, setIsDataSyncing] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Determine initial route from URL path
  const getRouteFromPath = (path: string): AppRoute => {
    const cleanPath = path.toLowerCase().replace(/\/$/, '');
    if (cleanPath === '/admin/login') return 'admin-login';
    if (cleanPath === '/admin') return 'admin';
    if (cleanPath === '/login') return 'customer-login';
    if (cleanPath === '/scalemodels' || cleanPath === '/scale-models') return 'scalemodels';
    if (cleanPath === '/hotwheels' || cleanPath === '/hot-wheels') return 'hotwheels';
    if (cleanPath === '/majorette') return 'majorette';
    if (cleanPath === '/minigt' || cleanPath === '/mini-gt') return 'minigt';
    if (cleanPath === '/cca') return 'cca';
    if (cleanPath === '/customcreation' || cleanPath === '/custom-creation') return 'customcreation';
    if (cleanPath === '/valuescanner' || cleanPath === '/value-scanner' || cleanPath === '/scanner') return 'valuescanner';
    if (cleanPath === '/track-order' || cleanPath === '/trackorder' || cleanPath === '/tracking' || cleanPath === '/track') return 'track-order';
    return 'home';
  };

  // Synchronize URL and Routing
  const navigateToRoute = (route: AppRoute, subParam?: string) => {
    let path = '/';
    if (route === 'admin-login') path = '/admin/login';
    if (route === 'admin') path = '/admin';
    if (route === 'customer-login') path = '/login';
    if (route === 'scalemodels') path = '/scalemodels';
    if (route === 'hotwheels') path = '/hotwheels';
    if (route === 'majorette') path = '/majorette';
    if (route === 'minigt') path = '/minigt';
    if (route === 'cca') path = '/cca';
    if (route === 'customcreation') path = '/customcreation';
    if (route === 'valuescanner') path = '/valuescanner';
    if (route === 'track-order') path = '/track-order';

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
          navigateToRoute('home');
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
          navigateToRoute('home');
        } else {
          setCurrentRoute('customer-login');
        }
      } else {
        setCurrentRoute(pathRoute);
      }
    });

    const handlePopState = () => {
      const pathRoute = getRouteFromPath(window.location.pathname);
      if (pathRoute === 'admin' && (!auth.currentUser || !isUserAdmin(auth.currentUser))) {
        navigateToRoute('home');
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

  // Load products & categories from Supabase
  const loadStoreData = async (showSyncSpinner = false) => {
    if (showSyncSpinner) setIsDataSyncing(true);
    try {
      const [fetchedProds, fetchedCats] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchCategoriesFromSupabase(),
      ]);

      if (fetchedProds && fetchedProds.length > 0) {
        setProductsList(fetchedProds);
      }
      if (fetchedCats && fetchedCats.length > 0) {
        setCategoriesList(fetchedCats);
      }
    } catch (err) {
      console.error('Failed to load store data from Supabase:', err);
    } finally {
      setIsInitialDataLoading(false);
      if (showSyncSpinner) {
        setTimeout(() => setIsDataSyncing(false), 800);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadStoreData();

    const unsubProds = subscribeToProducts((freshProducts) => {
      if (isMounted && freshProducts) {
        setProductsList(freshProducts);
        setIsInitialDataLoading(false);
      }
    });

    const unsubCats = subscribeToCategories((freshCats) => {
      if (isMounted && freshCats) {
        setCategoriesList(freshCats);
        setIsInitialDataLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubProds();
      unsubCats();
    };
  }, []);

  // QuickView product modal state & URL synchronization
  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  // Dynamic SEO metadata update
  useEffect(() => {
    if (quickViewProduct) {
      updateSEO({ 
        product: quickViewProduct,
        pageType: 'product',
        categoryName: quickViewProduct.category,
      });
    } else if (currentRoute === 'admin' || currentRoute === 'admin-login') {
      updateSEO({ pageType: 'admin' });
    } else if (currentRoute === 'customer-login') {
      updateSEO({ pageType: 'login' });
    } else if (currentRoute === 'scalemodels' || currentRoute === 'hotwheels' || currentRoute === 'majorette' || currentRoute === 'minigt' || currentRoute === 'cca') {
      updateSEO({
        pageType: 'shop',
        title: `Scale Models 1:64 Die-Cast Collection | Redline Garage India`,
      });
    } else if (currentRoute === 'customcreation') {
      updateSEO({
        pageType: 'shop',
        title: `Custom Creation Handcrafted Studio — Frames, Bouquets & Custom Cards | Redline Garage`,
      });
    } else if (currentRoute === 'valuescanner') {
      updateSEO({
        pageType: 'scanner',
        title: `AI Die-Cast Value Scanner — Instant Hot Wheels & Model Pricing | Redline Garage`,
        description: `Instant AI appraisal for Hot Wheels, Mini GT, Majorette and CCA die-cast models in Indian secondary market with real-time Gemini vision.`
      });
    } else {
      updateSEO({ pageType: 'home' });
    }
  }, [currentRoute, quickViewProduct]);

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

  // Navigation router helper
  const handleNavigate = (routeOrSection: string, subParam?: string) => {
    if (['home', 'scalemodels', 'hotwheels', 'majorette', 'minigt', 'cca', 'customcreation', 'valuescanner', 'customer-login', 'admin-login', 'admin'].includes(routeOrSection)) {
      navigateToRoute(routeOrSection as AppRoute, subParam);
      return;
    }
    if (routeOrSection === 'hero') {
      navigateToRoute('home');
      return;
    }
    if (routeOrSection === 'valuescanner' || routeOrSection === 'scanner') {
      navigateToRoute('valuescanner');
      return;
    }
    // If it's a section on home page
    if (currentRoute !== 'home') {
      navigateToRoute('home');
      setTimeout(() => {
        const elem = document.getElementById(routeOrSection);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const elem = document.getElementById(routeOrSection);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Show loading indicator on first start
  if (isInitialDataLoading && productsList.length === 0) {
    return <PageLoadingState />;
  }

  // Admin Views
  if (currentRoute === 'admin') {
    return (
      <Suspense fallback={<PageLoadingState />}>
        <AdminDashboard
          onLogout={() => {
            customerSignOut();
            navigateToRoute('home');
          }}
          onBackToStore={() => navigateToRoute('home')}
        />
      </Suspense>
    );
  }

  if (currentRoute === 'admin-login') {
    return (
      <Suspense fallback={<PageLoadingState />}>
        <AdminLogin
          onLoginSuccess={() => navigateToRoute('admin')}
          onBackToStore={() => navigateToRoute('home')}
        />
      </Suspense>
    );
  }

  if (currentRoute === 'customer-login') {
    return (
      <Suspense fallback={<PageLoadingState />}>
        <CustomerAuth
          onSuccess={() => navigateToRoute('home')}
          onBackToStore={() => navigateToRoute('home')}
        />
      </Suspense>
    );
  }

  const isScaleModelsView = ['scalemodels', 'hotwheels', 'majorette', 'minigt', 'cca'].includes(currentRoute);
  const scaleSubCol = currentRoute === 'scalemodels' ? 'all' : (currentRoute as 'hotwheels' | 'majorette' | 'minigt' | 'cca');

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col selection:bg-red-600 selection:text-white font-sans antialiased">
      <ScrollProgressCar />

      {/* Main Apple-Style Top Navigation */}
      <Navbar
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userProfile={customerProfile}
        onOpenCustomerLogin={() => navigateToRoute('customer-login')}
        onOpenMyOrders={() => setIsOrdersModalOpen(true)}
        onCustomerLogout={handleCustomerSignOut}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        currentRoute={currentRoute}
      />

      {/* Main Content Area Based on Current Route */}
      <main className="flex-1">
        {/* VIEW 1: Scale Models Primary Collection & Sub-Collections */}
        {isScaleModelsView && (
          <ScaleModelsPage
            products={productsList}
            currentSubCollection={scaleSubCol}
            onSelectSubCollection={(sub) => {
              if (sub === 'all') navigateToRoute('scalemodels');
              else navigateToRoute(sub);
            }}
            onAddToCart={handleAddToCart}
            onQuickView={handleOpenQuickView}
            userProfile={customerProfile}
            onNavigateHome={() => navigateToRoute('home')}
          />
        )}

        {/* VIEW 2: Custom Creation Primary Collection (Frames, Bouquets, Custom Cards) */}
        {currentRoute === 'customcreation' && (
          <CustomCreationPage
            products={productsList}
            onAddToCart={handleAddToCart}
            onQuickView={handleOpenQuickView}
            userProfile={customerProfile}
            onNavigateHome={() => navigateToRoute('home')}
          />
        )}

        {/* VIEW 3: Dedicated AI Value Scanner Page */}
        {currentRoute === 'valuescanner' && (
          <Suspense fallback={<PageLoadingState />}>
            <ValueScanner onNavigate={handleNavigate} />
          </Suspense>
        )}

        {/* VIEW 4: Dedicated Track Your Order Page */}
        {currentRoute === 'track-order' && (
          <Suspense fallback={<PageLoadingState />}>
            <TrackOrderPage onNavigate={handleNavigate} />
          </Suspense>
        )}

        {/* VIEW 4: Clean Apple-Style Minimalist Homepage */}
        {currentRoute === 'home' && (
          <div>
            {/* 1. Hero Section with Direct Scale Models & Custom Creation Actions */}
            <HeroSection
              products={productsList}
              onSelectProduct={handleOpenQuickView}
              onNavigate={handleNavigate}
            />

            {/* 2. Apple-Style Collection Feature Cards (Two Primary Paths) */}
            <HomeCollectionsFeature
              onNavigateToScaleModels={() => navigateToRoute('scalemodels')}
              onNavigateToCustomCreation={() => navigateToRoute('customcreation')}
            />

            {/* 3. Curated Homepage Spotlight (Small hand-picked section) */}
            <HomeSpotlightSection
              products={productsList}
              onAddToCart={handleAddToCart}
              onQuickView={handleOpenQuickView}
              onNavigateToScaleModels={() => navigateToRoute('scalemodels')}
              onNavigateToCustomCreation={() => navigateToRoute('customcreation')}
              userProfile={customerProfile}
            />

            {/* 4. The Redline Standard & Quality Commitment */}
            <Suspense fallback={null}>
              <WhyRedline />
            </Suspense>

            {/* 5. Highlighted WhatsApp Collector VIP Community Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12">
              <WhatsAppCommunityBanner />
            </section>

            {/* 6. FAQ Section */}
            <Suspense fallback={null}>
              <div id="faq">
                <FAQSection />
              </div>
            </Suspense>
          </div>
        )}
      </main>

      {/* Showroom Footer */}
      <Footer
        onNavigate={handleNavigate}
        onSelectCategory={(cat) => {
          if (['frames', 'bouquets', 'custom-cards'].includes(cat)) {
            navigateToRoute('customcreation', cat);
          } else if (['hotwheels', 'majorette', 'minigt', 'cca'].includes(cat)) {
            navigateToRoute(cat as AppRoute);
          } else {
            navigateToRoute('scalemodels');
          }
        }}
        onOpenAdmin={() => navigateToRoute(adminUser ? 'admin' : 'admin-login')}
        onOpenMyOrders={() => setIsOrdersModalOpen(true)}
        isDataSyncing={isDataSyncing}
        onForceSync={() => loadStoreData(true)}
      />

      {/* Global Modals & Drawers */}
      <Suspense fallback={null}>
        {/* Shopping Cart Drawer */}
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
            onQuickView={handleOpenQuickView}
            userProfile={customerProfile}
            onOpenCustomerLogin={() => navigateToRoute('customer-login')}
          />
        )}

        {/* Quick View Product Modal */}
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={handleCloseQuickView}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* Birthday Celebration Auto-Discount Modal */}
        <BirthdayCelebrationModal
          userProfile={customerProfile}
          onApplyCode={() => {
            setIsCartOpen(true);
          }}
        />

        {/* Floating AI Pit Crew Assistant */}
        <GeminiChatbot onNavigate={handleNavigate} />
      </Suspense>

      {/* Mobile Floating Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        userProfile={customerProfile}
        onOpenOrders={() => setIsOrdersModalOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        currentRoute={currentRoute}
      />
    </div>
  );
}
