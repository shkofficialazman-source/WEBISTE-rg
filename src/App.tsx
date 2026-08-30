import React, { useState, useEffect, Suspense } from 'react';
import { Product, CartItem, CustomCardConfig, CategoryId, UserProfile, PitCrewRole, Category } from './types';
import { fetchProductsFromSupabase, subscribeToProducts, fetchCategoriesFromSupabase, subscribeToCategories } from './supabase';
import { getCachedProducts, saveCachedProducts, getCachedCategories, saveCachedCategories } from './utils/instantCache';
import { updateSEO } from './seo';

import { ScrollProgressCar } from './components/ScrollProgressCar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HomeCollectionsFeature } from './components/HomeCollectionsFeature';
import { HomeSpotlightSection } from './components/HomeSpotlightSection';
import { WhatsAppCommunityBanner } from './components/WhatsAppCommunityBanner';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PageLoadingState } from './components/LoadingSpinner';

// Lazy-load page-level views and heavy modals
const ScaleModelsPage = React.lazy(() => import('./components/ScaleModelsPage').then(m => ({ default: m.ScaleModelsPage })));
const CustomCreationPage = React.lazy(() => import('./components/CustomCreationPage').then(m => ({ default: m.CustomCreationPage })));
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

const ADMIN_EMAIL = 'diecastlane7@gmail.com';
const isUserAdminCheck = (user: any): boolean => {
  return Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [customerUser, setCustomerUser] = useState<any | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Products and Categories loaded immediately from instant cache, then synchronized with Supabase
  const [productsList, setProductsList] = useState<Product[]>(() => getCachedProducts());
  const [categoriesList, setCategoriesList] = useState<Category[]>(() => getCachedCategories());
  const [isInitialDataLoading, setIsInitialDataLoading] = useState<boolean>(() => getCachedProducts().length === 0);
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

  // Deferred Auth State Listener to ensure zero main-thread block on initial render
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { auth, fetchUserProfile } = await import('./firebase');
        const { onAuthStateChanged } = await import('firebase/auth');

        if (!isMounted) return;

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!isMounted) return;
          const isAdmin = isUserAdminCheck(user);
          setAdminUser(isAdmin ? user : null);

          if (user && !isAdmin) {
            setCustomerUser(user);
            try {
              const profile = await fetchUserProfile(user.uid, user.displayName, user.email);
              if (isMounted) {
                setCustomerProfile(profile || {
                  uid: user.uid,
                  name: user.displayName || user.email?.split('@')[0] || 'Customer',
                  email: user.email || '',
                  role: 'customer',
                  createdAt: new Date().toISOString(),
                });
              }
            } catch (err) {
              if (isMounted) {
                setCustomerProfile({
                  uid: user.uid,
                  name: user.displayName || user.email?.split('@')[0] || 'Customer',
                  email: user.email || '',
                  role: 'customer',
                  createdAt: new Date().toISOString(),
                });
              }
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
      } catch (err) {
        console.warn('Deferred auth initialization notice:', err);
      }
    };

    // Run auth listener immediately if on auth-sensitive routes, or defer to idle for homepage visitors
    const pathRoute = getRouteFromPath(window.location.pathname);
    if (pathRoute === 'admin' || pathRoute === 'admin-login' || pathRoute === 'customer-login') {
      initAuth();
    } else if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => initAuth(), { timeout: 1500 });
    } else {
      setTimeout(initAuth, 100);
    }

    const handlePopState = () => {
      const pRoute = getRouteFromPath(window.location.pathname);
      setCurrentRoute(pRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
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
        saveCachedProducts(fetchedProds);
      }
      if (fetchedCats && fetchedCats.length > 0) {
        setCategoriesList(fetchedCats);
        saveCachedCategories(fetchedCats);
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
      if (isMounted && freshProducts && freshProducts.length > 0) {
        setProductsList(freshProducts);
        saveCachedProducts(freshProducts);
        setIsInitialDataLoading(false);
      }
    });

    const unsubCats = subscribeToCategories((freshCats) => {
      if (isMounted && freshCats && freshCats.length > 0) {
        setCategoriesList(freshCats);
        saveCachedCategories(freshCats);
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
      const { customerSignOut } = await import('./firebase');
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
          onLogout={async () => {
            const { customerSignOut } = await import('./firebase');
            await customerSignOut();
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
        onOpenPitCrew={() => setIsChatbotOpen(true)}
        currentRoute={currentRoute}
      />

      {/* Main Content Area Based on Current Route */}
      <main className="flex-1">
        {/* VIEW 1: Scale Models Primary Collection & Sub-Collections */}
        {isScaleModelsView && (
          <Suspense fallback={<PageLoadingState />}>
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
          </Suspense>
        )}

        {/* VIEW 2: Custom Creation Primary Collection (Frames, Bouquets, Custom Cards) */}
        {currentRoute === 'customcreation' && (
          <Suspense fallback={<PageLoadingState />}>
            <CustomCreationPage
              products={productsList}
              onAddToCart={handleAddToCart}
              onQuickView={handleOpenQuickView}
              userProfile={customerProfile}
              onNavigateHome={() => navigateToRoute('home')}
            />
          </Suspense>
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
        {customerProfile?.dob && (
          <BirthdayCelebrationModal
            userProfile={customerProfile}
            onApplyCode={() => {
              setIsCartOpen(true);
            }}
          />
        )}

        {/* Floating AI Pit Crew Assistant Trigger / Chat Window */}
        {!isChatbotOpen ? (
          <button
            id="ai-chatbot-launcher-btn"
            onClick={() => setIsChatbotOpen(true)}
            className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 bg-zinc-950 hover:bg-black text-white p-3 sm:px-4 sm:py-3.5 rounded-full shadow-2xl border-2 border-red-600 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer max-w-[calc(100vw-1.5rem)]"
            title="Ask AI Pit Crew"
            aria-label="Open Ask AI Pit Crew"
          >
            <div className="relative">
              <span className="text-xl">🏎️</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-zinc-950 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1 leading-none">
                Ask AI Pit Crew
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                Turbo, Sparky &amp; Gearbox
              </span>
            </div>
          </button>
        ) : (
          <GeminiChatbot initialOpen={true} onNavigate={handleNavigate} />
        )}
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
