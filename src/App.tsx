import React, { useState, useEffect, Suspense } from 'react';
import { Product, CartItem, CustomCardConfig, CategoryId, UserProfile, PitCrewRole, Category } from './types';
import { auth, isUserAdmin, fetchProductsFromFirestore, fetchUserProfile, customerSignOut } from './firebase';
import { fetchProductsFromSupabase, subscribeToProducts, fetchCategoriesFromSupabase, subscribeToCategories } from './supabase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { updateSEO } from './seo';

import { ScrollProgressCar } from './components/ScrollProgressCar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturedHotWheelsSection } from './components/FeaturedHotWheelsSection';
import { CollectorPicksSection } from './components/CollectorPicksSection';
import { PremiumRareSection } from './components/PremiumRareSection';
import { OtherCollectionsSection } from './components/OtherCollectionsSection';
import { FinalCTASection } from './components/FinalCTASection';
import { ProductCatalog } from './components/ProductCatalog';
import { WhatsAppCommunityBanner } from './components/WhatsAppCommunityBanner';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BrandedLoadingScreen } from './components/BrandedLoadingScreen';
import { BRAND_ASSETS, BRAND_NAME } from './brandAssets';

// Code-split heavy interactive components, modals, drawers, chatbot and admin portals for lightning initial load
const WhyRedline = React.lazy(() => import('./components/WhyRedline').then(m => ({ default: m.WhyRedline })));
const ValueScanner = React.lazy(() => import('./components/ValueScanner').then(m => ({ default: m.ValueScanner })));
const AskAiPitCrewSection = React.lazy(() => import('./components/AskAiPitCrewSection').then(m => ({ default: m.AskAiPitCrewSection })));
const AskAiPitCrewModal = React.lazy(() => import('./components/AskAiPitCrewModal').then(m => ({ default: m.AskAiPitCrewModal })));
const CollectorSpotlightSection = React.lazy(() => import('./components/CollectorSpotlightSection').then(m => ({ default: m.CollectorSpotlightSection })));
const TestimonialsSection = React.lazy(() => import('./components/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const OrderAndContactSection = React.lazy(() => import('./components/OrderAndContactSection').then(m => ({ default: m.OrderAndContactSection })));
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

type AppRoute = 'store' | 'customer-login' | 'admin-login' | 'admin';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('store');
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isPitCrewModalOpen, setIsPitCrewModalOpen] = useState(false);
  const [pitCrewRole, setPitCrewRole] = useState<PitCrewRole>('turbo');

  // Products and Categories loaded from live Supabase database
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isInitialDataLoading, setIsInitialDataLoading] = useState<boolean>(true);
  const [isDataSyncing, setIsDataSyncing] = useState<boolean>(false);

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

    // Detect legacy/external hash-based URLs (e.g. /#catalog, /#categories, /#scanner, /#faq)
    // and map them into clean state/scroll actions while normalizing the browser history
    const processHashRouting = () => {
      const rawHash = window.location.hash ? window.location.hash.replace(/^#\/?/, '').toLowerCase() : '';
      if (!rawHash) return;

      const categorySlugs = ['bouquets', 'frames', 'custom-cards', 'scale-models'];
      if (categorySlugs.includes(rawHash)) {
        setSelectedCategory(rawHash);
        const newUrl = new URL(window.location.href);
        newUrl.hash = '';
        newUrl.searchParams.set('category', rawHash);
        window.history.replaceState({}, '', newUrl.toString());
        setTimeout(() => {
          const catalogElem = document.getElementById('catalog');
          if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }

      if (rawHash === 'catalog' || rawHash === 'categories' || rawHash === 'shop') {
        const newUrl = new URL(window.location.href);
        newUrl.hash = '';
        window.history.replaceState({}, '', newUrl.toString());
        setTimeout(() => {
          const target = document.getElementById(rawHash === 'categories' ? 'categories' : 'catalog');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return;
      }

      const matchingElem = document.getElementById(rawHash);
      if (matchingElem) {
        const newUrl = new URL(window.location.href);
        newUrl.hash = '';
        window.history.replaceState({}, '', newUrl.toString());
        setTimeout(() => {
          matchingElem.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    };

    processHashRouting();

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', processHashRouting);
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', processHashRouting);
    };
  }, []);

  // Trigger subtle, non-intrusive sync status indicator
  const triggerSyncNotice = () => {
    setIsDataSyncing(true);
    setTimeout(() => {
      setIsDataSyncing(false);
    }, 1800);
  };

  // Fetch live products & categories directly from Supabase & keep live sync
  const loadStoreData = async (showNotice = false) => {
    if (showNotice) {
      setIsDataSyncing(true);
    }
    try {
      const [supabaseProds, supabaseCats] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchCategoriesFromSupabase(),
      ]);
      setProductsList(supabaseProds || []);
      setCategoriesList(supabaseCats || []);
    } catch (err) {
      console.warn('Error loading live store data from Supabase:', err);
    } finally {
      setIsInitialDataLoading(false);
      if (showNotice) {
        setTimeout(() => setIsDataSyncing(false), 1200);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadStoreData();

    const unsubProds = subscribeToProducts((freshProducts) => {
      if (isMounted) {
        setProductsList(freshProducts || []);
        setIsInitialDataLoading(false);
        triggerSyncNotice();
      }
    });

    const unsubCats = subscribeToCategories((freshCats) => {
      if (isMounted) {
        setCategoriesList(freshCats || []);
        setIsInitialDataLoading(false);
        triggerSyncNotice();
      }
    });

    return () => {
      isMounted = false;
      unsubProds();
      unsubCats();
    };
  }, []);

  // Deep-link product & category query parameters on initial load & popstate
  useEffect(() => {
    if (productsList.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productIdParam = urlParams.get('product');
    const categoryParam = urlParams.get('category');

    if (productIdParam) {
      const found = productsList.find(p => p.id === productIdParam || p.id.toLowerCase() === productIdParam.toLowerCase());
      if (found && (!quickViewProduct || quickViewProduct.id !== found.id)) {
        setQuickViewProduct(found);
      }
    }

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [productsList]);

  // Handle QuickView product modal state & URL synchronization
  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('product', product.id);
      window.history.pushState({ productId: product.id }, '', newUrl.toString());
    } catch (err) {
      console.warn('URL sync note:', err);
    }
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('product');
      window.history.pushState({}, '', newUrl.toString());
    } catch (err) {
      console.warn('URL sync note:', err);
    }
  };

  // Dynamic SEO metadata update for Google, WhatsApp & Social link previews
  useEffect(() => {
    if (quickViewProduct) {
      updateSEO({ 
        product: quickViewProduct,
        pageType: 'product',
        categoryName: quickViewProduct.category,
      });
    } else if (currentRoute === 'admin' || currentRoute === 'admin-login') {
      updateSEO({
        pageType: 'admin',
      });
    } else if (currentRoute === 'customer-login') {
      updateSEO({
        pageType: 'login',
      });
    } else if (selectedCategory && selectedCategory !== 'all') {
      updateSEO({
        pageType: 'shop',
        title: `Shop Hot Wheels ${selectedCategory.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Online in India | Redline Garage`,
      });
    } else if (searchQuery.trim()) {
      updateSEO({
        pageType: 'shop',
        title: `Search: "${searchQuery}" — Hot Wheels Die-Cast Models | Redline Garage`,
      });
    } else {
      updateSEO({
        pageType: 'home',
      });
    }
  }, [currentRoute, quickViewProduct, selectedCategory, searchQuery]);


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
      <Suspense fallback={<BrandedLoadingScreen message="Accessing Collector Portal..." submessage="Preparing your garage credentials & orders" />}>
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
      <Suspense fallback={<BrandedLoadingScreen message="Opening Admin Portal..." submessage="Verifying authorized owner credentials" />}>
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
      <Suspense fallback={<BrandedLoadingScreen message={`Loading ${BRAND_NAME} Command Center...`} submessage="Syncing products, orders, inventory & Supabase database" />}>
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
  if (isInitialDataLoading && productsList.length === 0) {
    return (
      <BrandedLoadingScreen
        fullScreen={true}
        message="Loading Authentic Die-Cast Collection..."
        submessage="Connecting to Redline Garage Vault & Live Inventory"
        onRetry={loadStoreData}
      />
    );
  }

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
        onOpenPitCrew={(role) => {
          if (role) setPitCrewRole(role);
          setIsPitCrewModalOpen(true);
        }}
      />

      {/* 1. Hero Section (Hot Wheels Focused) */}
      <div id="hero">
        <HeroSection
          heroProduct={heroProduct}
          products={productsList}
          onSelectProduct={(p) => handleOpenQuickView(p)}
          onNavigate={handleNavigate}
        />
      </div>

      {/* 2. Featured Hot Wheels Collection (Immediate Focus) */}
      <FeaturedHotWheelsSection
        products={productsList}
        onAddToCart={handleAddToCart}
        onQuickView={(p) => handleOpenQuickView(p)}
        onNavigateToCatalog={(cat) => {
          if (cat) setSelectedCategory(cat);
          handleNavigate('catalog');
        }}
        userProfile={customerProfile}
      />

      {/* Highlighted WhatsApp Collector VIP Community Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12">
        <WhatsAppCommunityBanner />
      </section>

      {/* 3. Best Sellers & Collector Picks */}
      <CollectorPicksSection
        products={productsList}
        onAddToCart={handleAddToCart}
        onQuickView={(p) => handleOpenQuickView(p)}
        onNavigateToCatalog={(cat) => {
          if (cat) setSelectedCategory(cat);
          handleNavigate('catalog');
        }}
        userProfile={customerProfile}
      />

      {/* 4. Premium & Rare Hot Wheels (Real Riders & Chases) */}
      <PremiumRareSection
        products={productsList}
        onAddToCart={handleAddToCart}
        onQuickView={(p) => handleOpenQuickView(p)}
        onNavigateToCatalog={(cat) => {
          if (cat) setSelectedCategory(cat);
          handleNavigate('catalog');
        }}
        userProfile={customerProfile}
      />

      {/* 5. Other Diecast Collections (Bouquets, Frames, Custom Cards) */}
      <OtherCollectionsSection
        categories={categoriesList}
        isLoading={isInitialDataLoading}
        onSelectCategory={(catId: CategoryId) => handleSelectCategory(catId)}
      />

      {/* Full Interactive Product Catalog & Search Grid */}
      <ProductCatalog
        products={productsList}
        categories={categoriesList}
        isLoading={isInitialDataLoading}
        onRetry={loadStoreData}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddToCart={handleAddToCart}
        onQuickView={(p) => handleOpenQuickView(p)}
        searchQuery={searchQuery}
        userProfile={customerProfile}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />

      {/* Below-the-fold lazy sections with minimal skeleton fallback */}
      <Suspense fallback={<div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" /></div>}>
        {/* AI Hot Wheels Value & Rarity Scanner */}
        <div id="scanner">
          <ValueScanner />
        </div>

        {/* Ask AI Pit Crew Interactive Team Showcase Section */}
        <AskAiPitCrewSection
          onOpenChat={(role) => {
            if (role) setPitCrewRole(role);
            setIsPitCrewModalOpen(true);
          }}
        />

        {/* 6. Why Shop With Us (The Redline Standard) */}
        <WhyRedline />

        {/* Collector of the Month Community Spotlight */}
        <CollectorSpotlightSection />

        {/* 7. Customer Reviews & Collector Feedback */}
        <TestimonialsSection />

        {/* 8. Final CTA (Ready to Level Up Your Hot Wheels Collection?) */}
        <FinalCTASection onNavigate={handleNavigate} />

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
      </Suspense>

      {/* 9. Showroom Footer with Admin Portal Access & Track Order */}
      <Footer
        onNavigate={handleNavigate}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => navigateToRoute(adminUser ? 'admin' : 'admin-login')}
        onOpenMyOrders={() => setIsOrdersModalOpen(true)}
        isDataSyncing={isDataSyncing}
        onForceSync={() => loadStoreData(true)}
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
            onQuickView={(p) => handleOpenQuickView(p)}
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

        {/* Dedicated Full Ask AI Pit Crew Modal */}
        {isPitCrewModalOpen && (
          <AskAiPitCrewModal
            isOpen={isPitCrewModalOpen}
            onClose={() => setIsPitCrewModalOpen(false)}
            onNavigate={handleNavigate}
            initialRole={pitCrewRole}
          />
        )}

        {/* Floating Redline Garage AI Pit Crew Chatbot */}
        {!isPitCrewModalOpen && (
          <GeminiChatbot onNavigate={handleNavigate} />
        )}
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

