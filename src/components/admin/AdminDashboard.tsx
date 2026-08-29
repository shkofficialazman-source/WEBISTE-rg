import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Product,
  FirestoreOrder,
  OrderStatus,
  CategoryId,
  Category,
  ProductCollection,
} from '../../types';
import {
  auth,
  adminSignOut,
  fetchProductsFromFirestore,
  addProductToFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  fetchOrdersFromFirestore,
  updateOrderStatusInFirestore,
  uploadProductImageToStorage,
  ADMIN_EMAIL
} from '../../firebase';
import {
  supabase,
  uploadImageToSupabase,
  addProductToSupabase,
  updateProductInSupabase,
  updateStockInSupabase,
  deleteProductFromSupabase,
  fetchProductsFromSupabase,
  fetchOrdersFromSupabase,
  updateOrderStatusInSupabase,
  updateOrderTrackingInSupabase,
  subscribeToProducts,
  subscribeToOrders,
  fetchCategoriesFromSupabase,
  updateCategoryInSupabase,
  addCategoryToSupabase,
  deleteCategoryFromSupabase,
  subscribeToCategories,
  reorderCollectionsInSupabase,
  fetchProductCollectionsFromSupabase,
  assignProductToCollectionInSupabase,
  removeProductFromCollectionInSupabase,
  setProductCollectionsInSupabase,
  reorderProductsInCollectionInSupabase,
  subscribeToProductCollections,
  checkSupabaseConnection,
} from '../../supabase';
import { SUPABASE_COLLECTIONS_SQL } from '../../data/supabaseCollectionsSchema';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Truck,
  CheckCheck,
  Calendar,
  Sparkles,
  ChevronDown,
  X,
  ExternalLink,
  Flame,
  Upload,
  Image as ImageIcon,
  Loader2,
  IndianRupee,
  Star,
  Eye,
  LayoutGrid,
  Layers,
  Save,
  Flower2,
  Frame,
  Car,
  FileSpreadsheet,
  Tag,
  Award,
  Mail,
  FileText,
  Printer,
  MessageCircle,
  Share2,
  Crown,
  Crop,
  ShieldCheck,
  ShieldAlert,
  Camera,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Check,
  Copy,
} from 'lucide-react';
import { ImageCropperModal, AspectRatioOption } from './ImageCropperModal';
import { convertUrlToFile } from '../../utils/imageCropUtils';
import { LoyaltySettingsTab } from './LoyaltySettingsTab';
import { SubscribersTab } from './SubscribersTab';
import { CollectorSpotlightTab } from './CollectorSpotlightTab';
import { ReferralCodesTab } from './ReferralCodesTab';
import { PromoBannerTab } from './PromoBannerTab';
import { OrderTrackingTab } from './OrderTrackingTab';
import { OrderStatusChip } from './OrderStatusChip';
import { InvoiceModal } from '../InvoiceModal';
import { RedlineLogo } from '../RedlineLogo';
import { LoadingSpinner } from '../LoadingSpinner';
import { BRAND_ASSETS, BRAND_LOGO_PATH, BRAND_NAME } from '../../brandAssets';
import { awardPointsForOrder } from '../../loyalty';
import {
  signInWithGoogleForSheets,
  disconnectGoogleSheetsAuth,
  getWorkspaceAccessToken,
  createOrdersSpreadsheet,
  syncAllOrdersToGoogleSheet,
  getSavedSheetConfig,
  saveSheetConfig,
  GoogleSheetConfig,
  clearSheetConfig,
  getCachedGoogleUser,
} from '../../googleSheets';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

interface AdminDashboardProps {
  onLogout: () => void;
  onBackToStore: () => void;
}

type TabType = 'dashboard' | 'products' | 'collections' | 'orders' | 'tracking' | 'inventory' | 'referrals' | 'promo' | 'loyalty' | 'spotlight' | 'subscribers';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onBackToStore }) => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCollections, setProductCollections] = useState<ProductCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Collections Management & Schema State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [managingCategoryProducts, setManagingCategoryProducts] = useState<Category | null>(null);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);
  const [isReorderingProductsInCollection, setIsReorderingProductsInCollection] = useState(false);
  const [categoryProductSearch, setCategoryProductSearch] = useState('');
  const [showCollectionsSqlModal, setShowCollectionsSqlModal] = useState(false);
  const [copiedCollectionsSql, setCopiedCollectionsSql] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    tagline: '',
    badge: '',
    image: '',
    icon: 'Car',
    parentId: '' as string,
    active: true,
    sortOrder: 0,
  });
  const [isUploadingCategoryCover, setIsUploadingCategoryCover] = useState(false);
  const [categoryUploadSuccess, setCategoryUploadSuccess] = useState(false);
  const [categoryUploadError, setCategoryUploadError] = useState('');
  const [categorySaveError, setCategorySaveError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categorySaveSuccess, setCategorySaveSuccess] = useState(false);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [productDeleteError, setProductDeleteError] = useState<string | null>(null);
  const [updatingStockProductId, setUpdatingStockProductId] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);

  // Image Upload & Gallery State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Universal Cropper Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingCropFiles, setPendingCropFiles] = useState<File[]>([]);
  const [cropTarget, setCropTarget] = useState<
    | { type: 'product_gallery' }
    | { type: 'category_cover' }
    | { type: 'gallery_replace'; index: number }
  >({ type: 'product_gallery' });
  const [cropDefaultRatio, setCropDefaultRatio] = useState<AspectRatioOption>('1:1');
  const [cropModalTitle, setCropModalTitle] = useState('Crop Product Photo');
  const [cropModalSubtitle, setCropModalSubtitle] = useState('Frame your diecast item for catalog cards (1:1 square recommended).');
  const [isPreparingReCrop, setIsPreparingReCrop] = useState(false);

  // Form state for Add/Edit product with multi-image gallery and multi-collection assignment support
  const [formData, setFormData] = useState({
    name: '',
    category: 'bouquets' as CategoryId,
    assignedCollectionIds: ['bouquets'] as string[],
    price: 499,
    originalPrice: 599,
    stockCount: 10,
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop',
    galleryImages: ['https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop'] as string[],
    shortTagline: 'Collector Edition Hot Wheels Gift',
    description: 'Premium die-cast vehicle presented in protective collector presentation packaging.',
    isBestSeller: false,
    isNewRelease: false,
  });

  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    ordersTableExists: boolean;
    message: string;
  }>({
    connected: true,
    ordersTableExists: true,
    message: 'Supabase Connected',
  });
  const [copiedSql, setCopiedSql] = useState(false);

  const SUPABASE_ORDERS_SQL = `-- 1. ORDERS TABLE (Authoritative Single Source of Truth)
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_email TEXT,
    user_id TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'WhatsApp / COD',
    gift_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    referral_code TEXT,
    referral_discount NUMERIC(10, 2) DEFAULT 0,
    loyalty_points_used NUMERIC(10, 2) DEFAULT 0,
    loyalty_discount NUMERIC(10, 2) DEFAULT 0,
    loyalty_points_awarded NUMERIC(10, 2) DEFAULT 0,
    tracking_number TEXT,
    courier_name TEXT,
    tracking_url TEXT,
    shipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS and public policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select from orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete on orders" ON public.orders;

CREATE POLICY "Allow public insert to orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public select from orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on orders" ON public.orders FOR DELETE TO anon, authenticated USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`;

  const handleCopySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_ORDERS_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 4000);
  };

  // Google Sheets Integration State
  const [googleSheetConfig, setGoogleSheetConfig] = useState<GoogleSheetConfig | null>(() => getSavedSheetConfig());
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(() => getCachedGoogleUser()?.email || null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncingToSheets, setIsSyncingToSheets] = useState(false);
  const [sheetsSyncSuccess, setSheetsSyncSuccess] = useState<string | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Order Status & Tracking Operations State
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderStatusFeedback, setOrderStatusFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<FirestoreOrder | null>(null);
  const [trackingForm, setTrackingForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '' });
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [copiedTrackingOrderId, setCopiedTrackingOrderId] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<FirestoreOrder | null>(null);
  const [inspectingVerificationOrder, setInspectingVerificationOrder] = useState<FirestoreOrder | null>(null);

  // Helper to copy tracking link to clipboard
  const handleCopyTrackingLink = (order: FirestoreOrder) => {
    const courier = order.courierName || 'Courier';
    const awb = order.trackingNumber || '';
    const trackingUrl = order.trackingUrl || getCourierTrackingLink(courier, awb);
    if (!trackingUrl) return;

    navigator.clipboard.writeText(trackingUrl);
    setCopiedTrackingOrderId(order.id || order.orderNumber);
    setTimeout(() => setCopiedTrackingOrderId(null), 2500);
  };

  // Helper to build direct courier tracking URL
  const getCourierTrackingLink = (courierName: string, trackingNumber: string): string => {
    if (!trackingNumber) return '';
    const norm = courierName.toLowerCase();
    if (norm.includes('dtdc')) {
      return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${encodeURIComponent(trackingNumber)}`;
    }
    if (norm.includes('blue') || norm.includes('dart')) {
      return `https://www.bluedart.com/tracking?track=${encodeURIComponent(trackingNumber)}`;
    }
    if (norm.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${encodeURIComponent(trackingNumber)}`;
    }
    if (norm.includes('post') || norm.includes('india')) {
      return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    }
    if (norm.includes('ekart')) {
      return `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(trackingNumber)}`;
    }
    if (norm.includes('shiprocket')) {
      return `https://shiprocket.co/tracking/${encodeURIComponent(trackingNumber)}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(`${courierName} tracking ${trackingNumber}`)}`;
  };

  // Helper to trigger WhatsApp tracking message to customer
  const handleShareTrackingWhatsApp = (
    order: FirestoreOrder,
    courier?: string,
    awb?: string,
    customUrl?: string
  ) => {
    const rawPhone = order.customerPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const effectiveCourier = courier || order.courierName || 'Courier';
    const effectiveAwb = awb || order.trackingNumber || '';
    const effectiveUrl = customUrl || order.trackingUrl || getCourierTrackingLink(effectiveCourier, effectiveAwb);

    const message = `🏎️ *REDLINE GARAGE — Order Tracking Update*

Hello *${order.customerName || 'Collector'}*,
Your Hot Wheels order *#${order.orderNumber}* has been dispatched and is on its way!

📦 *Courier Partner:* ${effectiveCourier}
🏷️ *Tracking / AWB No:* ${effectiveAwb}
${effectiveUrl ? `🔗 *Track Shipment Online:*\n${effectiveUrl}\n` : ''}
📍 *Delivery Address:* ${order.customerAddress || 'Customer Address'}
💰 *Total Amount:* ₹${order.total?.toFixed(2) || '0.00'}

If you need any assistance with your shipment, feel free to reply directly to this chat. Thank you for collecting with Redline Garage! 🏁`;

    const encoded = encodeURIComponent(message);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConnectGoogleSheets = async () => {
    setIsGoogleSigningIn(true);
    setSheetsError(null);
    setSheetsSyncSuccess(null);
    try {
      const res = await signInWithGoogleForSheets();
      setGoogleUserEmail(res.user.email || 'Connected Google Account');
      let config = getSavedSheetConfig();
      if (!config) {
        setIsCreatingSheet(true);
        const newSheet = await createOrdersSpreadsheet('Redline Garage - Live Orders Log', res.accessToken);
        config = getSavedSheetConfig();
        setGoogleSheetConfig(config);
        setSheetsSyncSuccess(`Connected and created spreadsheet "${newSheet.name}"!`);
      } else {
        setGoogleSheetConfig(config);
        setSheetsSyncSuccess(`Connected with Google Sheets successfully!`);
      }
    } catch (err: any) {
      console.error('Google Sheets connection error:', err);
      setSheetsError(err?.message || 'Failed to connect Google Sheets. Please check popup permissions.');
    } finally {
      setIsGoogleSigningIn(false);
      setIsCreatingSheet(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreatingSheet(true);
    setSheetsError(null);
    setSheetsSyncSuccess(null);
    try {
      const newSheet = await createOrdersSpreadsheet(`Redline Garage Orders (${new Date().toLocaleDateString('en-GB')})`);
      setGoogleSheetConfig(getSavedSheetConfig());
      setSheetsSyncSuccess(`Created new spreadsheet: ${newSheet.name}`);
    } catch (err: any) {
      setSheetsError(err?.message || 'Failed to create spreadsheet');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncAllOrdersToSheet = async () => {
    if (!orders || orders.length === 0) {
      setSheetsError('No orders found to sync.');
      return;
    }
    setIsSyncingToSheets(true);
    setSheetsError(null);
    setSheetsSyncSuccess(null);
    try {
      const res = await syncAllOrdersToGoogleSheet(orders);
      setSheetsSyncSuccess(`Successfully synced ${res.syncedCount} orders to Google Sheets!`);
    } catch (err: any) {
      setSheetsError(err?.message || 'Failed to sync orders to Google Sheets. Please connect Google account first.');
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  const handleDisconnectGoogleSheets = async () => {
    await disconnectGoogleSheetsAuth();
    clearSheetConfig();
    setGoogleSheetConfig(null);
    setGoogleUserEmail(null);
    setSheetsSyncSuccess('Google Sheets disconnected.');
  };

  // Load Database Data on Mount (Direct from Supabase)
  const loadData = async () => {
    try {
      setIsRefreshing(true);
      
      // Check Supabase connection status
      checkSupabaseConnection().then(status => {
        setSupabaseStatus(status);
      }).catch(() => {});

      const [fetchedProducts, fetchedOrders, fetchedCategories, fetchedProductCollections] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchOrdersFromSupabase(),
        fetchCategoriesFromSupabase(),
        fetchProductCollectionsFromSupabase().catch(() => [] as ProductCollection[]),
      ]);
      setProducts(fetchedProducts);
      setOrders(fetchedOrders);
      setCategories(fetchedCategories);
      setProductCollections(fetchedProductCollections);
    } catch (err) {
      console.error('Error loading Supabase data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time synchronization
    const unsubProducts = subscribeToProducts((freshProducts) => {
      setProducts(freshProducts);
    });

    const unsubOrders = subscribeToOrders((freshOrders) => {
      setOrders(freshOrders);
    });

    const unsubCategories = subscribeToCategories((freshCategories) => {
      setCategories(freshCategories);
    });

    const unsubProductCollections = subscribeToProductCollections((freshProductCols) => {
      setProductCollections(freshProductCols);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubCategories();
      unsubProductCollections();
    };
  }, []);

  // Proactive sync whenever Admin opens the Orders tab
  useEffect(() => {
    if (currentTab === 'orders') {
      fetchOrdersFromSupabase().then(freshOrders => {
        setOrders(freshOrders);
      }).catch(() => {});
    }
  }, [currentTab]);

  // Handle Logout
  const handleSignOutClick = async () => {
    try {
      await adminSignOut();
      onLogout();
    } catch (err) {
      console.error('Sign out error:', err);
      onLogout();
    }
  };

  // -------------------------------------------------------------
  // Product Operations (With Multi-Image Gallery Support)
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    const defaultImg = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop';
    const primaryCat = (categories[0]?.id as CategoryId) || 'bouquets';
    setFormData({
      name: '',
      category: primaryCat,
      assignedCollectionIds: [primaryCat],
      price: 499,
      originalPrice: 599,
      stockCount: 10,
      image: defaultImg,
      galleryImages: [defaultImg],
      shortTagline: 'Collector Edition Hot Wheels Gift',
      description: 'Premium die-cast vehicle presented in protective collector presentation packaging.',
      isBestSeller: false,
      isNewRelease: true,
    });
    setEditingProduct(null);
    setUploadSuccess(false);
    setUploadError('');
    setUploadProgressText('');
    setManualImageUrl('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);

    // Collect all gallery images or fallback to primary image
    let initialGallery: string[] = [];
    if (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0) {
      initialGallery = [...product.galleryImages];
    } else if (product.image) {
      initialGallery = [product.image];
    }

    // Ensure the main image is included in galleryImages
    if (product.image && !initialGallery.includes(product.image)) {
      initialGallery = [product.image, ...initialGallery];
    }

    const mainImage = product.image || initialGallery[0] || '';

    // Collect existing collection assignments from productCollections junction state + product model
    const junctionColIds = productCollections
      .filter(pc => (pc.productId === product.id || pc.product_id === product.id))
      .map(pc => pc.collectionId || pc.collection_id || '');
    
    const combinedColIds = Array.from(
      new Set([
        product.category,
        product.collectionId,
        ...(product.collectionIds || []),
        ...junctionColIds,
      ].filter(Boolean))
    ) as string[];

    setFormData({
      name: product.name,
      category: product.category,
      assignedCollectionIds: combinedColIds.length > 0 ? combinedColIds : [product.category],
      price: product.price,
      originalPrice: product.originalPrice || Math.round(product.price * 1.2),
      stockCount: product.stockCount,
      image: mainImage,
      galleryImages: initialGallery,
      shortTagline: product.shortTagline,
      description: product.description,
      isBestSeller: !!product.isBestSeller,
      isNewRelease: !!product.isNewRelease,
    });
    setUploadSuccess(false);
    setUploadError('');
    setUploadProgressText('');
    setManualImageUrl('');
    setIsAddModalOpen(true);
  };

  // Handle multi-image file selection & launch interactive cropping tool
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const validFiles: File[] = fileList.filter((f: File) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      setUploadError('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    setPendingCropFiles(validFiles);
    setCropTarget({ type: 'product_gallery' });
    setCropDefaultRatio('1:1');
    setCropModalTitle(validFiles.length > 1 ? `Crop ${validFiles.length} Product Photos` : 'Crop Product Photo');
    setCropModalSubtitle('Frame diecast vehicle, blister card, or packaging (1:1 square recommended).');
    setCropModalOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Re-crop an existing photo in the product gallery
  const handleReCropGalleryImage = async (index: number, imgUrl: string) => {
    try {
      setIsPreparingReCrop(true);
      const file = await convertUrlToFile(imgUrl, `product_photo_${index + 1}.jpg`);
      setPendingCropFiles([file]);
      setCropTarget({ type: 'gallery_replace', index });
      setCropDefaultRatio('1:1');
      setCropModalTitle('Re-Crop Product Photo');
      setCropModalSubtitle('Adjust framing, zoom, or aspect ratio for this product image.');
      setCropModalOpen(true);
    } catch (err: any) {
      console.error('Failed to prepare image for re-cropping:', err);
      setUploadError('Could not load image for re-cropping. You can upload a fresh photo.');
    } finally {
      setIsPreparingReCrop(false);
    }
  };

  // Handle category cover file selection & launch interactive cropping tool
  const handleCategoryCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCategoryUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setPendingCropFiles([file]);
    setCropTarget({ type: 'category_cover' });
    setCropDefaultRatio('16:9');
    setCropModalTitle('Crop Collection Cover Banner');
    setCropModalSubtitle('Frame your collection showcase banner (16:9 widescreen recommended).');
    setCropModalOpen(true);

    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = '';
    }
  };

  // Re-crop existing category cover image
  const handleReCropCategoryCover = async () => {
    if (!categoryFormData.image) return;
    try {
      setIsPreparingReCrop(true);
      const file = await convertUrlToFile(categoryFormData.image, 'category_cover.jpg');
      setPendingCropFiles([file]);
      setCropTarget({ type: 'category_cover' });
      setCropDefaultRatio('16:9');
      setCropModalTitle('Re-Crop Collection Banner');
      setCropModalSubtitle('Adjust framing, zoom, or aspect ratio for this collection cover.');
      setCropModalOpen(true);
    } catch (err: any) {
      console.error('Failed to prepare category cover for re-cropping:', err);
      setCategoryUploadError('Could not load cover for re-cropping. You can upload a fresh image.');
    } finally {
      setIsPreparingReCrop(false);
    }
  };

  // Universal handler called when cropped files are confirmed from ImageCropperModal
  const handleCropComplete = async (croppedFiles: File[]) => {
    if (croppedFiles.length === 0) return;

    // TARGET 1: Category Cover
    if (cropTarget.type === 'category_cover') {
      try {
        setIsUploadingCategoryCover(true);
        setCategoryUploadError('');
        setCategoryUploadSuccess(false);

        const file = croppedFiles[0];
        let downloadUrl = '';
        try {
          downloadUrl = await uploadImageToSupabase(file, 'products');
        } catch (e) {
          console.warn('Supabase storage upload notice:', e);
        }

        if (!downloadUrl) {
          downloadUrl = await uploadProductImageToStorage(file);
        }

        if (downloadUrl) {
          setCategoryFormData(prev => ({ ...prev, image: downloadUrl }));
          setCategoryUploadSuccess(true);
        } else {
          setCategoryUploadError('Failed to upload cropped cover.');
        }
      } catch (err: any) {
        console.error('Category cover upload error:', err);
        setCategoryUploadError(err.message || 'Failed to upload cover image.');
      } finally {
        setIsUploadingCategoryCover(false);
      }
      return;
    }

    // TARGET 2: Single Photo Replacement in Product Gallery
    if (cropTarget.type === 'gallery_replace') {
      try {
        setIsUploadingImage(true);
        setUploadError('');
        setUploadSuccess(false);
        setUploadProgressText('Uploading re-cropped photo...');

        const file = croppedFiles[0];
        let downloadUrl = '';
        try {
          downloadUrl = await uploadImageToSupabase(file, 'products');
        } catch (storageErr) {
          console.warn('Supabase storage attempt notice:', storageErr);
        }

        if (!downloadUrl) {
          downloadUrl = await uploadProductImageToStorage(file);
        }

        if (downloadUrl) {
          const targetIndex = cropTarget.index;
          setFormData(prev => {
            const currentGallery = [...(prev.galleryImages || [])];
            const oldUrl = currentGallery[targetIndex];
            currentGallery[targetIndex] = downloadUrl;
            const newCover = prev.image === oldUrl ? downloadUrl : prev.image;

            return {
              ...prev,
              galleryImages: currentGallery,
              image: newCover,
            };
          });
          setUploadSuccess(true);
        } else {
          setUploadError('Failed to upload re-cropped image.');
        }
      } catch (err: any) {
        console.error('Re-crop upload failed:', err);
        setUploadError('Failed to upload re-cropped image.');
      } finally {
        setIsUploadingImage(false);
        setUploadProgressText('');
      }
      return;
    }

    // TARGET 3: Product Gallery (Upload all cropped files in batch)
    try {
      setIsUploadingImage(true);
      setUploadError('');
      setUploadSuccess(false);

      const uploadedUrls: string[] = [];

      for (let i = 0; i < croppedFiles.length; i++) {
        const file = croppedFiles[i];
        setUploadProgressText(`Uploading cropped image ${i + 1} of ${croppedFiles.length}...`);

        let downloadUrl = '';
        try {
          downloadUrl = await uploadImageToSupabase(file, 'products');
        } catch (storageErr) {
          console.warn('Supabase storage attempt notice, trying secondary:', storageErr);
        }

        if (!downloadUrl) {
          downloadUrl = await uploadProductImageToStorage(file);
        }

        if (downloadUrl) {
          uploadedUrls.push(downloadUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => {
          const currentGallery = prev.galleryImages || [];
          const updatedGallery = [...currentGallery, ...uploadedUrls];
          // If current image is placeholder or empty, set the first uploaded as cover
          const isPlaceholder = !prev.image || prev.image.includes('unsplash.com/photo-1594787318286');
          const newCover = isPlaceholder ? uploadedUrls[0] : prev.image;

          return {
            ...prev,
            galleryImages: updatedGallery,
            image: newCover,
          };
        });
        setUploadSuccess(true);
      } else {
        setUploadError('Failed to upload cropped images. Please check network/storage.');
      }
    } catch (err: any) {
      console.error('Cropped image upload failed:', err);
      setUploadError('Failed to upload image(s). Please try again.');
    } finally {
      setIsUploadingImage(false);
      setUploadProgressText('');
    }
  };

  // Add image URL manually to gallery
  const handleAddManualImageUrl = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;

    setUploadError('');
    setFormData(prev => {
      const currentGallery = prev.galleryImages || [];
      const updatedGallery = [...currentGallery, trimmed];
      const isPlaceholder = !prev.image || prev.image.includes('unsplash.com/photo-1594787318286');
      const newCover = isPlaceholder ? trimmed : prev.image;

      return {
        ...prev,
        galleryImages: updatedGallery,
        image: newCover,
      };
    });
    setManualImageUrl('');
    setUploadSuccess(true);
  };

  // Set selected gallery image as Main/Cover
  const handleSetCoverImage = (imgUrl: string) => {
    setFormData(prev => {
      const currentGallery = prev.galleryImages || [];
      const filtered = currentGallery.filter(u => u !== imgUrl);
      return {
        ...prev,
        image: imgUrl,
        galleryImages: [imgUrl, ...filtered],
      };
    });
  };

  // Remove individual photo from gallery
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setFormData(prev => {
      const currentGallery = [...(prev.galleryImages || [])];
      const removedUrl = currentGallery[indexToRemove];
      currentGallery.splice(indexToRemove, 1);

      let newCover = prev.image;
      if (prev.image === removedUrl) {
        newCover = currentGallery[0] || '';
      }

      return {
        ...prev,
        galleryImages: currentGallery,
        image: newCover,
      };
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Clean up gallery images list
    const cleanGallery = Array.from(
      new Set((formData.galleryImages || []).filter(url => Boolean(url && url.trim())))
    );

    const defaultPlaceholder = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=800&auto=format&fit=crop';
    const finalCover = formData.image || cleanGallery[0] || defaultPlaceholder;

    // Ensure cover is in gallery and ordered first
    const finalGallery = cleanGallery.includes(finalCover)
      ? [finalCover, ...cleanGallery.filter(u => u !== finalCover)]
      : [finalCover, ...cleanGallery];

    setIsSavingProduct(true);
    setProductSaveError(null);

    try {
      const assignedCols = Array.from(
        new Set([
          formData.category,
          ...(formData.assignedCollectionIds || []),
        ].filter(Boolean))
      );

      if (editingProduct) {
        // Update existing product in Supabase
        const updates: Partial<Product> = {
          name: formData.name,
          category: formData.category,
          collectionId: formData.category,
          collectionIds: assignedCols,
          price: Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          stockCount: Number(formData.stockCount),
          image: finalCover,
          galleryImages: finalGallery,
          shortTagline: formData.shortTagline,
          description: formData.description,
          isBestSeller: formData.isBestSeller,
          isNewRelease: formData.isNewRelease,
        };
        const res = await updateProductInSupabase(editingProduct.id, updates);
        if (!res.success) {
          throw new Error(res.error || 'Failed to save product updates in database');
        }

        // Sync to product_collections table
        await setProductCollectionsInSupabase(editingProduct.id, assignedCols);

        updateProductInFirestore(editingProduct.id, updates).catch(err =>
          console.warn('Firestore mirror notice:', err)
        );
        const [fresh, freshPc] = await Promise.all([
          fetchProductsFromSupabase(),
          fetchProductCollectionsFromSupabase().catch(() => []),
        ]);
        setProducts(fresh);
        if (freshPc && freshPc.length > 0) setProductCollections(freshPc);
      } else {
        // Add new product directly to Supabase
        const newProductPayload = {
          name: formData.name,
          category: formData.category,
          collectionId: formData.category,
          collectionIds: assignedCols,
          price: Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          stockCount: Number(formData.stockCount),
          image: finalCover,
          galleryImages: finalGallery,
          shortTagline: formData.shortTagline,
          description: formData.description,
          isBestSeller: formData.isBestSeller,
          isNewRelease: formData.isNewRelease,
          rating: 5.0,
          reviewsCount: 1,
          collectorSpecs: {
            casting: formData.name,
            scale: '1:64 Scale',
            series: 'Garage Special',
            wheels: 'Real Riders',
            cardCondition: 'Mint / Factory Carded',
            authenticity: 'Official Redline Garage Genuine',
          },
          giftFeatures: ['Includes Premium Packaging', 'Collector Display Case'],
        };

        const newProduct = await addProductToSupabase(newProductPayload);

        // Sync to product_collections table
        await setProductCollectionsInSupabase(newProduct.id, assignedCols);
        
        // Mirror to Firestore in background
        addProductToFirestore({ ...newProductPayload, id: newProduct.id }).catch(err => 
          console.warn('Firestore mirror notice:', err)
        );

        const [fresh, freshPc] = await Promise.all([
          fetchProductsFromSupabase(),
          fetchProductCollectionsFromSupabase().catch(() => []),
        ]);
        setProducts(fresh);
        if (freshPc && freshPc.length > 0) setProductCollections(freshPc);
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setProductSaveError(err?.message || 'Error saving product. Please check connection and try again.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setIsDeletingProduct(true);
    setProductDeleteError(null);
    try {
      const res = await deleteProductFromSupabase(productId);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete product from database');
      }
      deleteProductFromFirestore(productId).catch(err =>
        console.warn('Firestore delete mirror notice:', err)
      );
      setProducts(prev => prev.filter(p => p.id !== productId));
      setDeletingProductId(null);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setProductDeleteError(err?.message || 'Error deleting product from database.');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleUpdateStockQuick = async (productId: string, delta: number) => {
    const currentProd = products.find(p => p.id === productId);
    if (!currentProd) return;
    const newStock = Math.max(0, currentProd.stockCount + delta);
    setUpdatingStockProductId(productId);
    try {
      const res = await updateStockInSupabase(productId, newStock);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update stock in database');
      }
      updateProductInFirestore(productId, { stockCount: newStock }).catch(err =>
        console.warn('Firestore stock update mirror notice:', err)
      );
      setProducts(prev => prev.map(p => (p.id === productId ? { ...p, stockCount: newStock } : p)));
    } catch (err: any) {
      console.error('Stock update failed:', err);
      alert(err?.message || 'Failed to update stock.');
    } finally {
      setUpdatingStockProductId(null);
    }
  };

  // -------------------------------------------------------------
  // Order Operations
  // -------------------------------------------------------------
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, explicitOrderNumber?: string) => {
    const targetOrder = orders.find(
      o => o.id === orderId || o.orderNumber === orderId || (explicitOrderNumber && o.orderNumber === explicitOrderNumber)
    );
    const effectiveOrderNumber = explicitOrderNumber || targetOrder?.orderNumber;

    setUpdatingOrderId(orderId);
    setOrderStatusFeedback(null);

    try {
      // 1. Authoritative write to Supabase PostgreSQL orders table
      const res = await updateOrderStatusInSupabase(orderId, newStatus, effectiveOrderNumber);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update order in Supabase database.');
      }

      // 2. Resilient mirror write to Firestore
      updateOrderStatusInFirestore(orderId, newStatus, effectiveOrderNumber).catch(err => {
        console.warn('Firestore mirror update notice:', err);
      });

      // 3. Update React state immediately upon verified database write
      setOrders(prev =>
        prev.map(o => {
          const match =
            o.id === orderId ||
            o.orderNumber === orderId ||
            (effectiveOrderNumber && o.orderNumber === effectiveOrderNumber);
          return match ? { ...o, status: newStatus } : o;
        })
      );

      setOrderStatusFeedback({
        id: orderId,
        message: `Order #${effectiveOrderNumber || orderId} marked as ${newStatus.toUpperCase()}`,
        type: 'success',
      });
      setTimeout(() => setOrderStatusFeedback(null), 3500);

      // Automatically award loyalty points when status is Confirmed or Delivered
      if (newStatus === 'confirmed' || newStatus === 'delivered') {
        if (targetOrder) {
          awardPointsForOrder(targetOrder).then(awardRes => {
            if (awardRes.awarded) {
              console.log(`Awarded ${awardRes.points} loyalty points to customer for order ${targetOrder.orderNumber}`);
            }
          }).catch(e => console.warn('Loyalty points auto-award notice:', e));
        }
      }
    } catch (err: any) {
      console.error('Failed to update order status in Supabase:', err);
      setOrderStatusFeedback({
        id: orderId,
        message: `DB write failed: ${err?.message || 'Database error'}`,
        type: 'error',
      });
      alert(`Database Error: Could not save order status to Supabase.\n\nDetails: ${err?.message || 'Check database connection'}\n\nPlease check your Supabase credentials or network connection.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenTrackingModal = (order: FirestoreOrder) => {
    setTrackingModalOrder(order);
    setTrackingForm({
      courierName: order.courierName || '',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
    });
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;
    setIsSavingTracking(true);
    try {
      const orderId = trackingModalOrder.id;
      const orderNumber = trackingModalOrder.orderNumber;
      const courier = trackingForm.courierName.trim();
      const trackingNum = trackingForm.trackingNumber.trim();
      const trackingUrl = trackingForm.trackingUrl.trim() || getCourierTrackingLink(courier, trackingNum);

      const res = await updateOrderTrackingInSupabase(
        orderId,
        {
          courierName: courier || undefined,
          trackingNumber: trackingNum || undefined,
          trackingUrl: trackingUrl || undefined,
          shippedAt: new Date().toISOString(),
        },
        orderNumber
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to save tracking details to Supabase.');
      }

      // Auto-update order status to 'shipped' if it is pending or confirmed
      let nextStatus = trackingModalOrder.status;
      if (trackingModalOrder.status === 'pending' || trackingModalOrder.status === 'confirmed') {
        nextStatus = 'shipped';
        updateOrderStatusInSupabase(orderId, 'shipped', orderNumber).catch(e =>
          console.warn('Supabase status auto-ship notice:', e)
        );
        updateOrderStatusInFirestore(orderId, 'shipped', orderNumber).catch(e =>
          console.warn('Firestore mirror auto-ship notice:', e)
        );
      }

      setOrders(prev =>
        prev.map(o => {
          const match = o.id === orderId || o.orderNumber === orderNumber;
          return match
            ? {
                ...o,
                status: nextStatus,
                courierName: courier || undefined,
                trackingNumber: trackingNum || undefined,
                trackingUrl: trackingUrl || undefined,
              }
            : o;
        })
      );

      setOrderStatusFeedback({
        id: orderId,
        message: `Tracking info saved & Order #${orderNumber} marked as ${nextStatus.toUpperCase()}!`,
        type: 'success',
      });
      setTimeout(() => setOrderStatusFeedback(null), 3500);
      setTrackingModalOrder(null);
    } catch (err: any) {
      console.error('Failed to save tracking details:', err);
      alert(`Could not save tracking details: ${err?.message || 'Database error'}`);
    } finally {
      setIsSavingTracking(false);
    }
  };

  // -------------------------------------------------------------
  // Collections (Categories) Operations
  // -------------------------------------------------------------
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      id: '',
      name: '',
      tagline: '',
      badge: '',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop',
      icon: 'Car',
      parentId: '',
      active: true,
      sortOrder: categories.length + 1,
    });
    setCategoryUploadError('');
    setCategoryUploadSuccess(false);
    setCategorySaveError('');
    setCategorySaveSuccess(false);
    setIsEditCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({
      id: cat.id,
      name: cat.name,
      tagline: cat.tagline,
      badge: cat.badge || '',
      image: cat.image,
      icon: cat.icon || 'Car',
      parentId: cat.parentId || '',
      active: cat.active !== false,
      sortOrder: cat.sortOrder || 0,
    });
    setCategoryUploadError('');
    setCategoryUploadSuccess(false);
    setCategorySaveError('');
    setCategorySaveSuccess(false);
    setIsEditCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setCategorySaveError('Collection title cannot be empty.');
      return;
    }

    try {
      setIsSavingCategory(true);
      setCategorySaveError('');
      setCategorySaveSuccess(false);

      if (editingCategory) {
        // Update existing collection
        await updateCategoryInSupabase(editingCategory.id, {
          name: categoryFormData.name,
          tagline: categoryFormData.tagline,
          badge: categoryFormData.badge,
          image: categoryFormData.image,
          icon: categoryFormData.icon,
          parentId: categoryFormData.parentId || null,
          active: categoryFormData.active,
          sortOrder: categoryFormData.sortOrder,
        });

        setCategories(prev =>
          prev.map(c =>
            c.id === editingCategory.id
              ? {
                  ...c,
                  name: categoryFormData.name,
                  tagline: categoryFormData.tagline,
                  badge: categoryFormData.badge,
                  image: categoryFormData.image,
                  icon: categoryFormData.icon,
                  parentId: categoryFormData.parentId || null,
                  active: categoryFormData.active,
                  sortOrder: categoryFormData.sortOrder,
                }
              : c
          )
        );
      } else {
        // Add new collection
        const slugId = categoryFormData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        if (!slugId) {
          setCategorySaveError('Please provide a unique Collection ID slug (e.g. keychains, dioramas).');
          setIsSavingCategory(false);
          return;
        }

        if (categories.some(c => c.id.toLowerCase() === slugId)) {
          setCategorySaveError(`Collection ID "${slugId}" already exists. Please choose a different slug.`);
          setIsSavingCategory(false);
          return;
        }

        const newCat = await addCategoryToSupabase({
          id: slugId,
          name: categoryFormData.name,
          tagline: categoryFormData.tagline,
          badge: categoryFormData.badge,
          image: categoryFormData.image,
          icon: categoryFormData.icon,
          parentId: categoryFormData.parentId || null,
          active: categoryFormData.active,
          sortOrder: categories.length + 1,
        });

        setCategories(prev => [...prev, newCat]);
      }

      setCategorySaveSuccess(true);
      setTimeout(() => {
        setIsEditCategoryModalOpen(false);
        setEditingCategory(null);
        setCategorySaveSuccess(false);
      }, 400);
    } catch (err: any) {
      console.error('Error saving collection:', err);
      setCategorySaveError(err.message || 'Failed to save collection to Supabase.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setIsDeletingCategory(true);
    setCategoryDeleteError(null);
    try {
      await deleteCategoryFromSupabase(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setDeletingCategoryId(null);
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      setCategoryDeleteError(err.message || 'Could not delete collection from database.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleReorderCategory = async (catId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === catId);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const [moved] = newCategories.splice(currentIndex, 1);
    newCategories.splice(targetIndex, 0, moved);

    // Update sortOrder numbers
    const updated = newCategories.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
    setCategories(updated);

    setIsReorderingCategories(true);
    try {
      await reorderCollectionsInSupabase(updated.map(c => c.id));
    } catch (err) {
      console.warn('Supabase reorder notice:', err);
    } finally {
      setIsReorderingCategories(false);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    const nextActive = cat.active === false ? true : false;
    setCategories(prev => prev.map(c => (c.id === cat.id ? { ...c, active: nextActive } : c)));
    try {
      await updateCategoryInSupabase(cat.id, { active: nextActive });
    } catch (err) {
      console.warn('Failed to update category active status:', err);
    }
  };

  const handleAssignProductToCategory = async (productId: string, targetCategoryId: string) => {
    await handleAssignProductToCollection(productId, targetCategoryId);
  };

  const getProductsInCollection = (collectionId: string): Product[] => {
    // 1. Find productCollections mappings for this collection, ordered by displayOrder
    const mappings = productCollections
      .filter(pc => (pc.collectionId === collectionId || pc.collection_id === collectionId))
      .sort((a, b) => ((a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0)));

    const matchedProductIds = mappings.map(m => m.productId || m.product_id || '');
    
    // 2. Map found products
    const mappedProducts: Product[] = [];
    matchedProductIds.forEach(pId => {
      const prod = products.find(p => p.id === pId);
      if (prod && !mappedProducts.some(mp => mp.id === prod.id)) {
        mappedProducts.push(prod);
      }
    });

    // 3. Include products that have collectionId or category or collectionIds matching
    const fallbackProducts = products.filter(p => {
      const isDirectMatch = (p.category === collectionId || p.collectionId === collectionId || (p.collectionIds && p.collectionIds.includes(collectionId)));
      return isDirectMatch && !mappedProducts.some(mp => mp.id === p.id);
    });

    return [...mappedProducts, ...fallbackProducts];
  };

  const handleAssignProductToCollection = async (productId: string, collectionId: string) => {
    try {
      await assignProductToCollectionInSupabase(productId, collectionId);
      setProductCollections(prev => {
        const exists = prev.some(pc => (pc.productId === productId || pc.product_id === productId) && (pc.collectionId === collectionId || pc.collection_id === collectionId));
        if (exists) return prev;
        return [...prev, { productId, collectionId, displayOrder: prev.length + 1 }];
      });
      setProducts(prev =>
        prev.map(p => {
          if (p.id === productId) {
            const currentIds = p.collectionIds || [p.category];
            const newIds = currentIds.includes(collectionId) ? currentIds : [...currentIds, collectionId];
            return { ...p, collectionIds: newIds };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Failed to assign product to collection:', err);
      alert(`Could not assign product: ${err?.message || 'Database error'}`);
    }
  };

  const handleRemoveProductFromCollection = async (productId: string, collectionId: string) => {
    try {
      await removeProductFromCollectionInSupabase(productId, collectionId);
      setProductCollections(prev =>
        prev.filter(pc => !((pc.productId === productId || pc.product_id === productId) && (pc.collectionId === collectionId || pc.collection_id === collectionId)))
      );
      setProducts(prev =>
        prev.map(p => {
          if (p.id === productId) {
            const newIds = (p.collectionIds || [p.category]).filter(id => id !== collectionId);
            return { ...p, collectionIds: newIds };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Failed to remove product from collection:', err);
      alert(`Could not remove product from collection: ${err?.message || 'Database error'}`);
    }
  };

  const handleReorderProductInCollection = async (collectionId: string, productId: string, direction: 'up' | 'down') => {
    const collectionItems = getProductsInCollection(collectionId);
    const currentIndex = collectionItems.findIndex(p => p.id === productId);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= collectionItems.length) return;

    const reordered = [...collectionItems];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderedIds = reordered.map(p => p.id);

    // Optimistically update productCollections display orders
    setProductCollections(prev => {
      return prev.map(pc => {
        if (pc.collectionId === collectionId || pc.collection_id === collectionId) {
          const pId = pc.productId || pc.product_id || '';
          const newOrder = orderedIds.indexOf(pId) + 1;
          if (newOrder > 0) {
            return { ...pc, displayOrder: newOrder, display_order: newOrder };
          }
        }
        return pc;
      });
    });

    setIsReorderingProductsInCollection(true);
    try {
      await reorderProductsInCollectionInSupabase(collectionId, orderedIds);
    } catch (err) {
      console.warn('Failed to reorder products in collection:', err);
    } finally {
      setIsReorderingProductsInCollection(false);
    }
  };

  const handleCopyCollectionsSqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_COLLECTIONS_SQL);
    setCopiedCollectionsSql(true);
    setTimeout(() => setCopiedCollectionsSql(false), 4000);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flower2': return <Flower2 className="w-5 h-5 text-red-500" />;
      case 'Frame': return <Frame className="w-5 h-5 text-red-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-red-500" />;
      case 'Car': return <Car className="w-5 h-5 text-red-500" />;
      default: return <Car className="w-5 h-5 text-red-500" />;
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryFilter, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const matchesSearch =
        (o.customerName && o.customerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.customerPhone && o.customerPhone.includes(orderSearch)) ||
        (o.id && o.id.toLowerCase().includes(orderSearch.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // -------------------------------------------------------------
  // Inventory Calculations
  // -------------------------------------------------------------
  const inventoryMetrics = useMemo(() => {
    const totalStockValue = products.reduce((acc, p) => acc + (p.price * (p.stockCount || 0)), 0);
    const totalUnits = products.reduce((acc, p) => acc + (p.stockCount || 0), 0);
    const outOfStockProducts = products.filter(p => p.stockCount <= 0);
    const lowStockProducts = products.filter(p => p.stockCount > 0 && p.stockCount < 3);

    return {
      totalStockValue,
      totalUnits,
      outOfStockProducts,
      lowStockProducts,
      skuCount: products.length,
    };
  }, [products]);

  // -------------------------------------------------------------
  // Analytics Calculations
  // -------------------------------------------------------------
  const analyticsData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let ordersToday = 0;
    let ordersThisWeek = 0;
    let revenueToday = 0;
    let revenueThisWeek = 0;
    let revenueThisMonth = 0;
    let totalRevenue = 0;
    const productSalesMap: { [name: string]: { count: number; revenue: number } } = {};

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).getTime();
      const orderTotal = Number(order.total) || 0;

      totalRevenue += orderTotal;

      if (orderDate >= startOfToday) {
        ordersToday += 1;
        revenueToday += orderTotal;
      }

      if (orderDate >= sevenDaysAgo) {
        ordersThisWeek += 1;
        revenueThisWeek += orderTotal;
      }

      if (orderDate >= startOfMonth) {
        revenueThisMonth += orderTotal;
      }

      // Track item sales
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const name = item.productName || (item as any).name || (item as any).product?.name || 'Custom Die-Cast Item';
          if (!productSalesMap[name]) {
            productSalesMap[name] = { count: 0, revenue: 0 };
          }
          productSalesMap[name].count += item.quantity || 1;
          productSalesMap[name].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    // Top 5 Best Selling Products
    const top5BestSellers = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const bestSeller = top5BestSellers.length > 0
      ? top5BestSellers[0]
      : { name: 'No sales yet', count: 0, revenue: 0 };

    // Recent 10 orders
    const last10Orders = orders.slice(0, 10);

    // Generate 7-day trend data
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayOrders = orders.filter(o => {
        const t = new Date(o.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const dayRevenue = dayOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      last7DaysData.push({
        date: dayLabel,
        orders: dayOrders.length,
        revenue: dayRevenue,
      });
    }

    return {
      totalOrders: orders.length,
      ordersToday,
      ordersThisWeek,
      revenueToday,
      revenueThisWeek,
      revenueThisMonth,
      totalRevenue,
      bestSeller,
      top5BestSellers,
      last10Orders,
      last7DaysData,
    };
  }, [orders]);

  // Helper for Order Status Badges
  const getStatusBadge = (
    status: OrderStatus,
    orderId?: string,
    orderNumber?: string,
    interactive: boolean = false,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    return (
      <OrderStatusChip
        status={status}
        orderId={orderId}
        orderNumber={orderNumber}
        isUpdating={orderId ? updatingOrderId === orderId : false}
        onStatusChange={
          interactive && orderId
            ? (newStatus) => handleStatusChange(orderId, newStatus, orderNumber)
            : undefined
        }
        size={size}
        interactive={interactive}
      />
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-red-600 selection:text-white flex flex-col">
      
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RedlineLogo variant="full" theme="light" />
            <div className="hidden sm:block pl-2 border-l border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  ADMIN CONSOLE
                </span>
                <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {ADMIN_EMAIL}
                </span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Supabase Connected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Admin Navigation and Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-mono font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-zinc-200 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Refresh Databases & Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>


          <button
            onClick={onBackToStore}
            className="bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-mono font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-zinc-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Store</span>
          </button>

          <button
            onClick={handleSignOutClick}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs font-mono font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Tabs Navigation Bar */}
      <div className="border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-2.5 no-scrollbar">
          
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'products'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products ({products.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('collections')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'collections'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Collections ({categories.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'orders'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Orders ({orders.length})</span>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('tracking')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'tracking'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Order Tracking</span>
          </button>

          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'inventory'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventory Valuation</span>
            {inventoryMetrics.lowStockProducts.length + inventoryMetrics.outOfStockProducts.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                {inventoryMetrics.lowStockProducts.length + inventoryMetrics.outOfStockProducts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('referrals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'referrals'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Referral Codes</span>
          </button>

          <button
            onClick={() => setCurrentTab('promo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'promo'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Promo Banner</span>
          </button>

          <button
            onClick={() => setCurrentTab('loyalty')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'loyalty'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Loyalty Program</span>
          </button>

          <button
            onClick={() => setCurrentTab('spotlight')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'spotlight'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Collector Spotlight</span>
          </button>

          <button
            onClick={() => setCurrentTab('subscribers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'subscribers'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>VIP Subscribers</span>
          </button>

        </div>
      </div>

      {/* Content Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {isLoading ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 shadow-xs flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" label="Syncing Redline Garage Database & live inventory..." />
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 0: COMMAND CENTER LIVE DASHBOARD */}
            {/* ========================================================= */}
            {currentTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Real-time Status Pulse Banner */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                    <div>
                      <h2 className="font-extrabold font-mono text-sm uppercase text-zinc-900 tracking-wide">
                        Redline Garage Command Center
                      </h2>
                      <p className="text-xs font-mono text-zinc-500 mt-0.5">
                        Authoritative source: Supabase PostgreSQL • Realtime sync active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={loadData}
                      disabled={isRefreshing}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-mono text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isRefreshing ? 'Syncing...' : 'Live Refresh'}</span>
                    </button>
                    <button
                      onClick={handleOpenAddModal}
                      className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>

                {/* 4 Primary Live KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Orders */}
                  <div
                    onClick={() => setCurrentTab('orders')}
                    className="bg-white border border-zinc-200 hover:border-red-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-zinc-500 text-xs font-mono mb-2">
                        <span className="font-bold group-hover:text-red-600 transition-colors">TOTAL ORDERS</span>
                        <ShoppingCart className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="text-3xl font-black font-mono text-zinc-900">
                        {analyticsData.totalOrders}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-zinc-100 mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">TODAY</span>
                        <span className="font-bold text-zinc-800">{analyticsData.ordersToday}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">THIS WEEK</span>
                        <span className="font-bold text-zinc-800">{analyticsData.ordersThisWeek}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Revenue */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-zinc-500 text-xs font-mono mb-2">
                        <span className="font-bold">TOTAL REVENUE</span>
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-600">
                        ₹{analyticsData.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-zinc-100 mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">TODAY</span>
                        <span className="font-bold text-emerald-700">₹{analyticsData.revenueToday.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">THIS WEEK</span>
                        <span className="font-bold text-emerald-700">₹{analyticsData.revenueThisWeek.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Pending Orders Attention */}
                  <div
                    onClick={() => {
                      setOrderStatusFilter('pending');
                      setCurrentTab('orders');
                    }}
                    className={`rounded-2xl p-5 shadow-xs flex flex-col justify-between transition cursor-pointer border ${
                      orders.filter(o => o.status === 'pending').length > 0
                        ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-amber-800 text-xs font-mono mb-2">
                        <span className="font-bold">PENDING FULFILLMENT</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="text-3xl font-black font-mono text-amber-900 flex items-center gap-2">
                        <span>{orders.filter(o => o.status === 'pending').length}</span>
                        {orders.filter(o => o.status === 'pending').length > 0 && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            Action Needed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-amber-200/60 mt-3 flex items-center justify-between text-[11px] font-mono text-amber-900 font-bold">
                      <span>Review WhatsApp Orders</span>
                      <span>&rarr;</span>
                    </div>
                  </div>

                  {/* Card 4: Inventory Units & Low Stock Status */}
                  <div
                    onClick={() => setCurrentTab('inventory')}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between text-zinc-500 text-xs font-mono mb-2">
                        <span className="font-bold">INVENTORY HEALTH</span>
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black font-mono text-zinc-900">
                        {inventoryMetrics.totalUnits} <span className="text-xs font-normal text-zinc-500">Units in Stock</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-zinc-100 mt-3 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500">Low Stock SKUs:</span>
                      <span className={`font-bold ${inventoryMetrics.lowStockProducts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {inventoryMetrics.lowStockProducts.length} items (&le; 3)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Command Shortcuts */}
                <div className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    <span className="font-bold uppercase tracking-wider">Quick Actions:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleOpenAddModal}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-red-400" />
                      <span>Add Product</span>
                    </button>
                    <button
                      onClick={() => {
                        setOrderStatusFilter('pending');
                        setCurrentTab('orders');
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3 h-3 text-amber-400" />
                      <span>Fulfill Orders ({orders.filter(o => o.status === 'pending').length})</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('loyalty')}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3 h-3 text-yellow-400" />
                      <span>Loyalty Settings</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('orders')}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg transition border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-green-400" />
                      <span>Google Sheets Sync</span>
                    </button>
                  </div>
                </div>

                {/* Grid: 7-Day Trend Chart + Top 5 Best-Sellers */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: 7-Day Activity & Orders Trend (lg:col-span-7) */}
                  <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                      <div>
                        <h3 className="text-base font-black uppercase font-mono tracking-tight text-zinc-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-600" />
                          <span>Orders Trend (Last 7 Days)</span>
                        </h3>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                          Daily customer order transaction volume
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-mono px-3 py-1 rounded-lg">
                        7 Days Rolling Window
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="dashboardOrderGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#e4e4e7' }}
                          />
                          <YAxis
                            stroke="#71717a"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#e4e4e7' }}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderColor: '#e4e4e7',
                              borderRadius: '0.75rem',
                              color: '#18181b',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                            formatter={(value: any) => [`${value} Orders`, 'Daily Volume']}
                          />
                          <Area
                            type="monotone"
                            dataKey="orders"
                            stroke="#dc2626"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#dashboardOrderGrad)"
                            dot={{ stroke: '#dc2626', strokeWidth: 2, fill: '#fff', r: 4 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Top 5 Best-Selling Products (lg:col-span-5) */}
                  <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-600" />
                        <h3 className="font-extrabold uppercase font-mono text-base text-zinc-900">
                          Top Best Sellers
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">By Units Sold</span>
                    </div>

                    {analyticsData.top5BestSellers.length === 0 ? (
                      <div className="py-8 text-center text-xs font-mono text-zinc-400">
                        No product sales recorded yet. Top performers will appear here as orders are placed.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {analyticsData.top5BestSellers.slice(0, 5).map((item, index) => {
                          const maxCount = analyticsData.top5BestSellers[0]?.count || 1;
                          const percent = Math.min(100, Math.round((item.count / maxCount) * 100));
                          return (
                            <div key={index} className="space-y-1 font-mono">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 max-w-[70%]">
                                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                    #{index + 1}
                                  </span>
                                  <span className="font-bold text-zinc-900 truncate">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-zinc-900">{item.count} units</span>
                                  <span className="text-[10px] text-zinc-400 ml-1">(₹{item.revenue.toFixed(0)})</span>
                                </div>
                              </div>
                              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-red-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Recent 10 Orders Feed */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-red-600" />
                      <h3 className="font-extrabold uppercase font-mono text-base text-zinc-900">
                        Recent Customer Orders
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentTab('orders')}
                      className="text-xs font-mono text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                    >
                      View All Orders ({orders.length}) &rarr;
                    </button>
                  </div>

                  {analyticsData.last10Orders.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-zinc-400">
                      No customer orders recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
                            <th className="py-2.5 px-3">Order #</th>
                            <th className="py-2.5 px-3">Customer</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Items</th>
                            <th className="py-2.5 px-3">Total</th>
                            <th className="py-2.5 px-3">Status Dropdown</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {analyticsData.last10Orders.map((o) => (
                            <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                              <td className="py-3 px-3 font-bold text-red-600">#{o.orderNumber}</td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-zinc-800">{o.customerName}</div>
                                <div className="text-[10px] text-zinc-400">{o.customerPhone}</div>
                              </td>
                              <td className="py-3 px-3 text-zinc-500 text-[11px]">
                                {new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-3 text-zinc-600">
                                {o.items?.length || 1} {o.items?.length === 1 ? 'item' : 'items'}
                              </td>
                              <td className="py-3 px-3 font-bold text-zinc-900">
                                ₹{Number(o.total || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3">
                                <OrderStatusChip
                                  status={o.status}
                                  orderId={o.id}
                                  orderNumber={o.orderNumber}
                                  isUpdating={updatingOrderId === o.id}
                                  onStatusChange={(newStatus) => handleStatusChange(o.id!, newStatus, o.orderNumber)}
                                  size="sm"
                                  interactive={true}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 1: PRODUCTS TABLE (CRUD + LOW STOCK HIGHLIGHT < 3) */}
            {/* ========================================================= */}
            {currentTab === 'products' && (
              <div className="space-y-6">
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs">
                  
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search products by title, ID or description..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 placeholder:text-zinc-400 rounded-xl pl-10 pr-4 py-2 text-xs font-mono focus:outline-hidden"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {['all', ...categories.map(c => c.id)].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer ${
                          selectedCategoryFilter === cat
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Add Product Button */}
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Products Table Card */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-3.5 px-4">Item</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">Price (₹)</th>
                          <th className="py-3.5 px-4">Stock Count</th>
                          <th className="py-3.5 px-4 text-center">Tags</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-zinc-500">
                              No products found matching your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((prod) => {
                            const isLowStock = prod.stockCount < 3;
                            const isOutOfStock = prod.stockCount <= 0;

                            return (
                              <tr key={prod.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={prod.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'}
                                      alt={prod.name}
                                      className="w-12 h-12 object-cover rounded-lg border border-zinc-200 shrink-0 bg-zinc-100"
                                    />
                                    <div>
                                      <div className="font-bold text-zinc-900 text-sm line-clamp-1">
                                        {prod.name}
                                      </div>
                                      <div className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">
                                        ID: {prod.id}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                    {prod.category}
                                  </span>
                                </td>

                                <td className="py-3 px-4 font-bold text-sm text-zinc-900">
                                  ₹{prod.price.toFixed(2)}
                                </td>

                                {/* Stock Count Column - HIGHLIGHTED IN RED IF < 3 */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black ${
                                        isOutOfStock
                                          ? 'bg-red-50 text-red-700 border border-red-300 animate-pulse'
                                          : isLowStock
                                          ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      {updatingStockProductId === prod.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600 shrink-0" />
                                      ) : isLowStock ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      ) : null}
                                      <span>{prod.stockCount} units</span>
                                    </span>

                                    {/* Quick Increment / Decrement stock */}
                                    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden">
                                      <button
                                        type="button"
                                        disabled={updatingStockProductId === prod.id}
                                        onClick={() => handleUpdateStockQuick(prod.id, -1)}
                                        className="px-2 py-0.5 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 text-xs font-bold cursor-pointer disabled:opacity-40"
                                        title="Decrease stock by 1"
                                      >
                                        -
                                      </button>
                                      <button
                                        type="button"
                                        disabled={updatingStockProductId === prod.id}
                                        onClick={() => handleUpdateStockQuick(prod.id, 1)}
                                        className="px-2 py-0.5 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 text-xs font-bold border-l border-zinc-200 cursor-pointer disabled:opacity-40"
                                        title="Increase stock by 1"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {prod.isBestSeller && (
                                      <span className="bg-amber-50 text-amber-800 border border-amber-300 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                        BESTSELLER
                                      </span>
                                    )}
                                    {prod.isNewRelease && (
                                      <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditModal(prod)}
                                      className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 rounded-lg transition-colors border border-zinc-200 cursor-pointer"
                                      title="Edit Product"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingProductId(prod.id)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors border border-red-200 cursor-pointer"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: MANAGE COLLECTIONS (CATEGORIES) */}
            {/* ========================================================= */}
            {currentTab === 'collections' && (
              <div className="space-y-6">
                {/* Header info */}
                <div className="bg-white border border-zinc-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-red-600 font-mono text-xs font-bold uppercase tracking-widest">
                      <LayoutGrid className="w-4 h-4" />
                      <span>Showroom Collections</span>
                    </div>
                    <h2 className="text-xl font-black uppercase text-zinc-900 mt-1">
                      Manage Storefront Collections
                    </h2>
                    <p className="text-xs text-zinc-600 mt-1 max-w-2xl font-light">
                      Customize cover images, names, taglines, and badges for collections or add brand new categories. Edits synchronize live with your Supabase database.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCollectionsSqlModal(true)}
                      className="bg-zinc-900 hover:bg-black text-zinc-200 hover:text-white text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all border border-zinc-700 shadow-xs cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-red-500" />
                      <span>SQL Schema</span>
                    </button>

                    <button
                      onClick={handleOpenAddCategory}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-red-600/20 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Collection</span>
                    </button>

                    <button
                      onClick={loadData}
                      disabled={isRefreshing}
                      className="bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-colors border border-zinc-200 shadow-xs shrink-0 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
                      <span>Sync</span>
                    </button>
                  </div>
                </div>

                {/* Collections Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map((cat, index) => {
                    const linkedProductsCount = products.filter(
                      p =>
                        p.category === cat.id ||
                        p.collectionId === cat.id ||
                        (p.collectionIds && p.collectionIds.includes(cat.id))
                    ).length;

                    return (
                      <div
                        key={cat.id}
                        className={`group bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                          cat.active === false
                            ? 'border-zinc-300 opacity-75 bg-zinc-50/50'
                            : 'border-zinc-200 hover:border-red-600/60'
                        }`}
                      >
                        {/* Image Preview Area */}
                        <div className="relative aspect-4/3 overflow-hidden bg-zinc-100">
                          <img
                            src={cat.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'}
                            alt={cat.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                          {/* Order Position Badge + Reordering Buttons */}
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/75 backdrop-blur-xs text-white px-2 py-1 rounded-lg border border-white/20 text-[10px] font-mono font-bold">
                            <span>#{index + 1}</span>
                            <div className="flex items-center ml-1 border-l border-white/20 pl-1">
                              <button
                                type="button"
                                disabled={index === 0 || isReorderingCategories}
                                onClick={() => handleReorderCategory(cat.id, 'up')}
                                title="Move Up in Storefront Order"
                                className="p-0.5 hover:text-red-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === categories.length - 1 || isReorderingCategories}
                                onClick={() => handleReorderCategory(cat.id, 'down')}
                                title="Move Down in Storefront Order"
                                className="p-0.5 hover:text-red-400 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Active / Hidden Status Pill */}
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat)}
                            title="Click to toggle Active / Hidden on storefront"
                            className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition border ${
                              cat.active !== false
                                ? 'bg-emerald-600/90 text-white border-emerald-400/50 hover:bg-emerald-700'
                                : 'bg-zinc-800/90 text-zinc-300 border-zinc-600 hover:bg-zinc-900'
                            }`}
                          >
                            {cat.active !== false ? (
                              <>
                                <Eye className="w-3 h-3 text-emerald-200" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-zinc-400" />
                                <span>Hidden</span>
                              </>
                            )}
                          </button>

                          {/* Badge if present */}
                          {cat.badge && (
                            <div className="absolute bottom-3 left-3 bg-red-600 text-white font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded shadow-md">
                              {cat.badge}
                            </div>
                          )}
                        </div>

                        {/* Info & Details */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(cat.icon)}
                              <h3 className="text-sm font-black uppercase text-zinc-900 font-sans tracking-tight">
                                {cat.name}
                              </h3>
                            </div>

                            {cat.parentId && (
                              <div className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded inline-block">
                                ↳ Sub-collection of: <span className="font-bold text-zinc-700">{cat.parentId}</span>
                              </div>
                            )}

                            <p className="text-xs text-zinc-600 leading-relaxed font-light line-clamp-2">
                              {cat.tagline}
                            </p>
                          </div>

                          {/* Action Buttons & Manage Products */}
                          <div className="pt-3 border-t border-zinc-200 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-zinc-500">
                                {linkedProductsCount} linked item{linkedProductsCount === 1 ? '' : 's'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setManagingCategoryProducts(cat);
                                  setCategoryProductSearch('');
                                }}
                                className="text-red-600 hover:text-red-700 font-bold underline cursor-pointer hover:bg-red-50 px-1.5 py-0.5 rounded"
                              >
                                Manage Products →
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[10px] font-mono text-zinc-400 truncate">
                                ID: {cat.id}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="bg-zinc-100 hover:bg-red-600 hover:text-white text-zinc-700 font-mono text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingCategoryId(cat.id)}
                                  title="Delete Collection"
                                  className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: ORDERS TABLE */}
            {/* ========================================================= */}
            {currentTab === 'orders' && (
              <div className="space-y-6">
                {/* Google Sheets Live Sync Banner Card */}
                <div className="bg-linear-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-heading font-black text-white text-base md:text-lg tracking-tight">
                            Google Sheets Live Order Sync
                          </h3>
                          {googleSheetConfig ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active Live Sync
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                              Not Connected
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl font-sans">
                          Every customer checkout order (Standard, UPI, WhatsApp) is automatically logged in real-time as a row in your Google Spreadsheet.
                        </p>
                        {googleUserEmail && (
                          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 pt-0.5">
                            <span>Connected: <strong className="text-zinc-200">{googleUserEmail}</strong></span>
                            {googleSheetConfig?.spreadsheetName && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span>Sheet: <strong className="text-emerald-300">{googleSheetConfig.spreadsheetName}</strong></span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                      {!googleUserEmail ? (
                        <button
                          onClick={handleConnectGoogleSheets}
                          disabled={isGoogleSigningIn}
                          className="bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-sans text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isGoogleSigningIn ? (
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                          ) : (
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          )}
                          <span>{isGoogleSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                        </button>
                      ) : (
                        <>
                          {googleSheetConfig?.spreadsheetUrl && (
                            <a
                              href={googleSheetConfig.spreadsheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Google Sheet</span>
                            </a>
                          )}

                          <button
                            onClick={handleSyncAllOrdersToSheet}
                            disabled={isSyncingToSheets}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-mono text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isSyncingToSheets ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>{isSyncingToSheets ? 'Syncing...' : `Sync All (${orders.length})`}</span>
                          </button>

                          <button
                            onClick={handleCreateNewSheet}
                            disabled={isCreatingSheet}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Create a fresh dedicated Spreadsheet"
                          >
                            {isCreatingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>New Sheet</span>
                          </button>

                          <button
                            onClick={handleDisconnectGoogleSheets}
                            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-2 rounded-xl transition text-xs cursor-pointer"
                            title="Disconnect Google Sheets"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Feedback Notifications */}
                  {sheetsSyncSuccess && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{sheetsSyncSuccess}</span>
                      </div>
                      <button onClick={() => setSheetsSyncSuccess(null)} className="text-zinc-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {sheetsError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-mono flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{sheetsError}</span>
                      </div>
                      <button onClick={() => setSheetsError(null)} className="text-zinc-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Supabase Orders Database Status Notice */}
                {!supabaseStatus.ordersTableExists && (
                  <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 md:p-6 text-zinc-900 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-heading font-black text-amber-900 text-sm md:text-base">
                            Supabase PostgreSQL Orders Table Setup Required
                          </h4>
                          <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                            Your PostgreSQL database needs the <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono text-[11px]">public.orders</code> table created to permanently store customer orders in Supabase.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                          onClick={handleCopySqlScript}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer w-full sm:w-auto justify-center"
                        >
                          {copiedSql ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>SQL Script Copied!</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>1-Click Copy SQL Schema</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={loadData}
                          disabled={isRefreshing}
                          className="bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-xs font-bold p-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          title="Re-check database status"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-100/60 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 font-mono space-y-1">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-amber-800">Quick 10-Second Setup:</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-amber-800 text-[11px]">
                        <li>Click <strong>1-Click Copy SQL Schema</strong> above (or check <code className="font-bold">supabase_setup.sql</code>).</li>
                        <li>Open <a href="https://supabase.com/dashboard/project/bmuccamypbfrrhealjgq/sql/new" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-900 hover:text-black">Supabase SQL Editor <ExternalLink className="inline w-3 h-3 ml-0.5" /></a>.</li>
                        <li>Paste and click <strong>RUN</strong>. Return here and click refresh!</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Orders Filter Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search orders by customer name, order # or phone..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 placeholder:text-zinc-400 rounded-xl pl-10 pr-4 py-2 text-xs font-mono focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all shrink-0 cursor-pointer ${
                          orderStatusFilter === status
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List Table */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200">
                        <tr>
                          <th className="py-3.5 px-4">Order ID & Date</th>
                          <th className="py-3.5 px-4">Customer</th>
                          <th className="py-3.5 px-4">Items Ordered</th>
                          <th className="py-3.5 px-4">Total (₹)</th>
                          <th className="py-3.5 px-4">Status & Status Dropdown</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-zinc-500">
                              No orders found.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => {
                            const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            return (
                              <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-4 px-4 align-top">
                                  <div className="font-extrabold text-sm text-red-600">
                                    #{order.orderNumber}
                                  </div>
                                  <div className="text-[11px] text-zinc-600 flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3 text-zinc-400" />
                                    <span>{dateFormatted}</span>
                                  </div>
                                  <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">
                                    Payment: {order.paymentMethod || 'WhatsApp / COD'}
                                  </div>

                                  {/* AI Payment Verification & Screenshot Badge */}
                                  {order.paymentScreenshotUrl ? (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        onClick={() => setInspectingVerificationOrder(order)}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition shadow-2xs cursor-pointer border ${
                                          order.aiVerification?.status === 'AUTHENTIC'
                                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                                            : order.aiVerification?.status === 'UNCLEAR'
                                            ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                                            : order.aiVerification?.status === 'MISMATCH'
                                            ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
                                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                                        }`}
                                      >
                                        {order.aiVerification?.status === 'AUTHENTIC' ? (
                                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                        ) : order.aiVerification?.status === 'UNCLEAR' ? (
                                          <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                                        ) : order.aiVerification?.status === 'MISMATCH' ? (
                                          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                        ) : (
                                          <Camera className="w-3 h-3 text-blue-600 shrink-0" />
                                        )}
                                        <span>
                                          {order.aiVerification?.status === 'AUTHENTIC'
                                            ? `AI Verified (${order.aiVerification.confidenceScore || 98}%)`
                                            : order.aiVerification?.status === 'UNCLEAR'
                                            ? `AI Review Needed`
                                            : order.aiVerification?.status === 'MISMATCH'
                                            ? `AI Mismatch`
                                            : 'View UPI Proof'}
                                        </span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[9px] text-zinc-400 font-mono">
                                      No screenshot uploaded
                                    </div>
                                  )}
                                </td>

                                <td className="py-4 px-4 align-top">
                                  <div className="font-bold text-zinc-900 text-sm">
                                    {order.customerName}
                                  </div>
                                  <div className="text-zinc-600 text-xs mt-0.5">
                                    📞 {order.customerPhone}
                                  </div>
                                  <div className="text-zinc-500 text-[11px] mt-1 max-w-xs leading-tight">
                                    📍 {order.customerAddress}
                                  </div>
                                  {order.giftNote && (
                                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-1.5 text-[10px] text-amber-800 italic max-w-xs">
                                      Gift Note: "{order.giftNote}"
                                    </div>
                                  )}
                                </td>

                                <td className="py-4 px-4 align-top">
                                  <div className="space-y-1.5">
                                    {order.items?.map((item, idx) => (
                                      <div key={idx} className="bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-[11px]">
                                        <div className="font-bold text-zinc-800">
                                          {item.quantity}x {item.productName}
                                        </div>
                                        <div className="text-zinc-500 text-[10px]">
                                          ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        {item.customization && (
                                          <div className="mt-1 pt-1 border-t border-zinc-200 text-[10px] text-red-600">
                                            <div>Custom: {item.customization.driverName} • {item.customization.carTitle}</div>
                                            {(item.customization.isAiStylized || item.customization.cardTheme === 'ai-mainline') && (
                                              <div className="text-amber-600 font-bold text-[9px] mt-0.5">✨ AI Mainline Comic Art</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                <td className="py-4 px-4 align-top">
                                  <div className="font-black text-base text-zinc-900">
                                    ₹{order.total.toFixed(2)}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">
                                    Subtotal: ₹{order.subtotal?.toFixed(2)}
                                  </div>
                                  {order.referralCode && (
                                    <div className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                      Promo ({order.referralCode}): -₹{(order.referralDiscount || 0).toFixed(2)}
                                    </div>
                                  )}
                                  {order.loyaltyPointsUsed && (
                                    <div className="text-[10px] text-amber-800 font-bold mt-0.5 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                      Loyalty ({order.loyaltyPointsUsed} pts): -₹{(order.loyaltyDiscount || 0).toFixed(2)}
                                    </div>
                                  )}
                                </td>

                                {/* Status & Fulfillment Column */}
                                <td className="py-4 px-4 align-top">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <div>{getStatusBadge(order.status, order.id, order.orderNumber, true, 'md')}</div>
                                      {updatingOrderId === order.id && (
                                        <div className="flex items-center gap-1 text-[10px] text-red-600 font-mono animate-pulse">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>Saving DB...</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Feedback message for this specific order */}
                                    {orderStatusFeedback && orderStatusFeedback.id === order.id && (
                                      <div
                                        className={`text-[10px] font-mono px-2 py-1 rounded border leading-tight ${
                                          orderStatusFeedback.type === 'success'
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                            : 'bg-red-50 border-red-300 text-red-800'
                                        }`}
                                      >
                                        {orderStatusFeedback.message}
                                      </div>
                                    )}

                                    {/* One-click Verify Payment Action */}
                                    {order.status === 'pending' && (
                                      <button
                                        type="button"
                                        disabled={updatingOrderId === order.id}
                                        onClick={() => handleStatusChange(order.id!, 'confirmed', order.orderNumber)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                                        title="Manually verify WhatsApp payment screenshot and mark Confirmed"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                        <span>Verify Payment</span>
                                      </button>
                                    )}

                                    {/* Status Change Dropdown */}
                                    <div className="relative">
                                      <select
                                        value={order.status}
                                        disabled={updatingOrderId === order.id}
                                        onChange={(e) => handleStatusChange(order.id!, e.target.value as OrderStatus, order.orderNumber)}
                                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs rounded-lg px-2.5 py-1.5 focus:border-red-600 focus:outline-hidden appearance-none cursor-pointer disabled:opacity-50"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    {/* Tracking Info & Edit / WhatsApp Button */}
                                    {order.trackingNumber ? (
                                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-[10px] space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-sky-900 flex items-center gap-1">
                                            <Truck className="w-3 h-3 text-sky-600" />
                                            {order.courierName || 'Courier'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenTrackingModal(order)}
                                            className="text-sky-700 hover:text-sky-900 underline text-[9px] cursor-pointer"
                                          >
                                            Edit
                                          </button>
                                        </div>
                                        <div className="font-mono text-sky-800 break-all select-all font-semibold text-[10px]">
                                          AWB: {order.trackingNumber}
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                          <button
                                            type="button"
                                            onClick={() => handleCopyTrackingLink(order)}
                                            className="flex-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-sky-300 font-mono text-[9px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                                            title="Copy direct tracking URL to clipboard"
                                          >
                                            {copiedTrackingOrderId === (order.id || order.orderNumber) ? (
                                              <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span className="text-emerald-700">Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3 text-sky-600" />
                                                <span>Copy Link</span>
                                              </>
                                            )}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleShareTrackingWhatsApp(order)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] font-bold py-1 px-1.5 rounded flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                                          >
                                            <MessageCircle className="w-3 h-3 text-white" />
                                            <span>WhatsApp</span>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      (order.status === 'shipped' || order.status === 'confirmed') && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenTrackingModal(order)}
                                          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-mono text-[10px] font-medium py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer border border-zinc-200"
                                        >
                                          <Truck className="w-3 h-3 text-zinc-500" />
                                          <span>+ Add Tracking / AWB</span>
                                        </button>
                                      )
                                    )}

                                    {/* Generate / Print Official Invoice */}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInvoiceOrder(order)}
                                      className="w-full bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-mono text-[10px] font-medium py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                                    >
                                      <FileText className="w-3 h-3 text-red-600" />
                                      <span>Print / Share Invoice</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: INVENTORY VALUATION & OUT-OF-STOCK ALERTS */}
            {/* ========================================================= */}
            {currentTab === 'inventory' && (
              <div className="space-y-8">
                {/* Key Inventory Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-zinc-500 text-xs font-mono mb-2">
                      <span>TOTAL STOCK VALUE</span>
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-zinc-900">
                      ₹{inventoryMetrics.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">
                      Based on retail prices across {inventoryMetrics.skuCount} active SKUs
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-zinc-500 text-xs font-mono mb-2">
                      <span>TOTAL UNITS ON HAND</span>
                      <Boxes className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-zinc-900">
                      {inventoryMetrics.totalUnits} Units
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-1">
                      Available die-cast & bouquet items
                    </div>
                  </div>

                  <div className="bg-red-50/50 border border-red-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-red-700 text-xs font-mono mb-2">
                      <span>OUT OF STOCK ITEMS</span>
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-red-600">
                      {inventoryMetrics.outOfStockProducts.length} Items
                    </div>
                    <div className="text-[10px] text-red-700 font-mono mt-1">
                      0 stock remaining
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between text-amber-800 text-xs font-mono mb-2">
                      <span>LOW STOCK WARNING (&lt; 3)</span>
                      <Flame className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-800">
                      {inventoryMetrics.lowStockProducts.length} Items
                    </div>
                    <div className="text-[10px] text-amber-700 font-mono mt-1">
                      Requires urgent restock
                    </div>
                  </div>
                </div>

                {/* Section 1: Out of Stock List */}
                <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-extrabold uppercase font-mono text-base text-zinc-900">
                        Out-of-Stock Products ({inventoryMetrics.outOfStockProducts.length})
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-red-600">Restock to re-enable instant checkout</span>
                  </div>

                  {inventoryMetrics.outOfStockProducts.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center text-xs font-mono text-emerald-800 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All products currently have inventory on hand! Zero out-of-stock items.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-200">
                      {inventoryMetrics.outOfStockProducts.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-zinc-200 bg-zinc-100" />
                            <div>
                              <div className="font-bold text-sm text-zinc-900">{p.name}</div>
                              <div className="text-[11px] text-zinc-500 font-mono">Price: ₹{p.price.toFixed(2)} • {p.category}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUpdateStockQuick(p.id, 5)}
                            className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-red-600/20 cursor-pointer"
                          >
                            +5 Quick Restock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Low Stock List (< 3 Units) */}
                <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-600" />
                      <h3 className="font-extrabold uppercase font-mono text-base text-zinc-900">
                        Low Stock Alert (&lt; 3 Units Remaining)
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-amber-700">Critical replenishment threshold</span>
                  </div>

                  {inventoryMetrics.lowStockProducts.length === 0 ? (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-center text-xs font-mono text-zinc-500">
                      No items currently in low-stock state.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-200">
                      {inventoryMetrics.lowStockProducts.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-zinc-200 bg-zinc-100" />
                            <div>
                              <div className="font-bold text-sm text-zinc-900">{p.name}</div>
                              <div className="text-[11px] text-red-600 font-mono font-bold">Only {p.stockCount} units remaining in stock</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStockQuick(p.id, 5)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              +5 Add Stock
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: ORDER TRACKING & COURIER DISPATCH */}
            {/* ========================================================= */}
            {currentTab === 'tracking' && <OrderTrackingTab />}

            {/* ========================================================= */}
            {/* TAB: REFERRAL & PROMO CODES */}
            {/* ========================================================= */}
            {currentTab === 'referrals' && <ReferralCodesTab />}

            {/* ========================================================= */}
            {/* TAB: PROMO BANNER SETTINGS */}
            {/* ========================================================= */}
            {currentTab === 'promo' && <PromoBannerTab />}

            {/* ========================================================= */}
            {/* TAB 5: LOYALTY & REWARDS PROGRAM */}
            {/* ========================================================= */}
            {currentTab === 'loyalty' && <LoyaltySettingsTab />}

            {/* ========================================================= */}
            {/* TAB 7: VIP NEWSLETTER & SUBSCRIBERS */}
            {/* ========================================================= */}
            {currentTab === 'subscribers' && <SubscribersTab />}

            {/* ========================================================= */}
            {/* TAB 8: COLLECTOR SPOTLIGHT */}
            {/* ========================================================= */}
            {currentTab === 'spotlight' && <CollectorSpotlightTab />}
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* ADD / EDIT PRODUCT MODAL WITH IMAGE UPLOAD & PREVIEW */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono text-xs">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black uppercase text-zinc-900 font-mono mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-red-600" />
              <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] mb-1 font-bold">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. The 'Godzilla' Skyline GT-R R34 Bouquet"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 placeholder:text-zinc-400 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] mb-1 font-bold">Primary Collection</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as CategoryId;
                      const currentAssigned = formData.assignedCollectionIds || [];
                      const updatedAssigned = currentAssigned.includes(newCat)
                        ? currentAssigned
                        : [...currentAssigned, newCat];
                      setFormData({
                        ...formData,
                        category: newCat,
                        assignedCollectionIds: updatedAssigned,
                      });
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] mb-1 font-bold">Price (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] mb-1 font-bold">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Multi-Collection Selection (Junction table mapping) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold">
                    Assigned Showroom Collections ({formData.assignedCollectionIds?.length || 1})
                  </label>
                  <span className="text-[9px] text-zinc-500">
                    Product appears in all checked collections
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categories.map(c => {
                    const isSelected = (formData.assignedCollectionIds || []).includes(c.id);
                    const isPrimary = formData.category === c.id;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const currentList = formData.assignedCollectionIds || [];
                          let nextList: string[];
                          if (isSelected) {
                            // Don't allow removing if it's the only one or primary
                            if (currentList.length <= 1) return;
                            nextList = currentList.filter(id => id !== c.id);
                            // If we deselected the primary category, switch primary to first remaining
                            if (isPrimary && nextList.length > 0) {
                              setFormData({
                                ...formData,
                                category: nextList[0] as CategoryId,
                                assignedCollectionIds: nextList,
                              });
                              return;
                            }
                          } else {
                            nextList = [...currentList, c.id];
                          }
                          setFormData({
                            ...formData,
                            assignedCollectionIds: nextList,
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition border cursor-pointer ${
                          isSelected
                            ? isPrimary
                              ? 'bg-red-600 text-white border-red-600 font-bold shadow-xs'
                              : 'bg-zinc-900 text-white border-zinc-900 font-bold'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-current" />}
                        <span>{c.name}</span>
                        {isPrimary && (
                          <span className="bg-black/40 text-[9px] px-1 py-0.2 rounded uppercase">
                            Primary
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MULTI-IMAGE GALLERY UPLOAD & MANAGEMENT SECTION */}
              <div className="space-y-3 pt-1 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-800 uppercase text-[10px] font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-red-600" />
                    <span>Product Gallery & Showcase Images</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full font-bold">
                    {formData.galleryImages?.length || 0} photo{formData.galleryImages?.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Upload & Add Controls Box */}
                <div className="bg-zinc-50 border border-dashed border-zinc-300 hover:border-red-500 rounded-xl p-4 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFilesChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full sm:w-auto bg-white hover:bg-red-600 hover:text-white text-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold font-mono inline-flex items-center justify-center gap-2 transition-all border border-zinc-300 hover:border-red-600 cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          <span>{uploadProgressText || 'Uploading Images...'}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-red-600" />
                          <span>Upload Photos (Select Multiple)</span>
                        </>
                      )}
                    </button>

                    <div className="text-[10px] text-zinc-500 text-center sm:text-left flex-1">
                      Upload multiple angles, packaging details, and blister card shots.
                    </div>
                  </div>

                  {/* Direct Add Image URL row */}
                  <div className="pt-2 border-t border-zinc-200 flex flex-col sm:flex-row gap-2 items-center">
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="Or paste external image URL (https://...)"
                      className="w-full sm:flex-1 bg-white border border-zinc-200 focus:border-red-600 text-zinc-900 placeholder:text-zinc-400 rounded-lg px-3 py-1.5 text-xs focus:outline-hidden"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualImageUrl();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddManualImageUrl}
                      disabled={!manualImageUrl.trim()}
                      className="w-full sm:w-auto bg-zinc-200 hover:bg-zinc-300 disabled:opacity-40 text-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer shrink-0"
                    >
                      + Add URL
                    </button>
                  </div>

                  {uploadSuccess && (
                    <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Image(s) updated in gallery successfully!</span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="text-[10px] text-red-600 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Gallery Thumbnails Grid */}
                <div>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase mb-2 flex items-center justify-between">
                    <span className="font-bold">Gallery Photos ({formData.galleryImages?.length || 0}):</span>
                    <span className="text-[9px] text-zinc-500">★ Click &apos;Set Cover&apos; to change primary storefront photo</span>
                  </div>

                  {formData.galleryImages && formData.galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.galleryImages.map((imgUrl, idx) => {
                        const isMainCover = formData.image === imgUrl;
                        return (
                          <div
                            key={`${imgUrl}-${idx}`}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-zinc-100 ${
                              isMainCover
                                ? 'border-red-600 shadow-md ring-2 ring-red-500/20'
                                : 'border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            <div className="aspect-square w-full">
                              <img
                                src={imgUrl}
                                alt={`Gallery item ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Main Cover Badge / Button */}
                            {isMainCover ? (
                              <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black font-mono px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-white text-white" />
                                <span>MAIN COVER</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(imgUrl)}
                                title="Set as Main Cover Image"
                                className="absolute top-1.5 left-1.5 opacity-90 group-hover:opacity-100 bg-black/75 hover:bg-red-600 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <Star className="w-2.5 h-2.5 text-amber-300" />
                                <span>Set Cover</span>
                              </button>
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              title="Remove photo from gallery"
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition opacity-90 group-hover:opacity-100 cursor-pointer shadow-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            {/* Crop / Re-Crop Button */}
                            <button
                              type="button"
                              onClick={() => handleReCropGalleryImage(idx, imgUrl)}
                              disabled={isPreparingReCrop || isUploadingImage}
                              title="Re-Crop & Adjust Framing"
                              className="absolute bottom-1.5 left-1.5 opacity-90 group-hover:opacity-100 bg-black/75 hover:bg-amber-600 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Crop className="w-2.5 h-2.5 text-amber-300" />
                              <span>Crop</span>
                            </button>

                            {/* Image Index Number */}
                            <div className="absolute bottom-1 right-1.5 text-[8px] font-mono text-white/90 bg-black/60 px-1 rounded">
                              #{idx + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-zinc-400 text-xs font-mono">
                      No photos in gallery. Upload images above.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 uppercase text-[10px] mb-1 font-bold">Short Tagline</label>
                <input
                  type="text"
                  value={formData.shortTagline}
                  onChange={(e) => setFormData({ ...formData, shortTagline: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-zinc-700 uppercase text-[10px] mb-1 font-bold">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="accent-red-600 rounded w-4 h-4"
                  />
                  <span className="text-zinc-800 font-bold">Mark as Best Seller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewRelease}
                    onChange={(e) => setFormData({ ...formData, isNewRelease: e.target.checked })}
                    className="accent-red-600 rounded w-4 h-4"
                  />
                  <span className="text-zinc-800 font-bold">Mark as New Release</span>
                </label>
              </div>

              {/* Product Save Error Notice */}
              {productSaveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Error saving product: </span>
                    <span>{productSaveError}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  disabled={isSavingProduct}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition font-mono cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage || isSavingProduct}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md shadow-red-600/20 font-mono uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT / ADD COLLECTION (CATEGORY) MODAL */}
      {/* ========================================================= */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative font-mono">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsEditCategoryModalOpen(false);
                setEditingCategory(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-zinc-900 font-sans">
                  {editingCategory ? `Edit Collection: ${editingCategory.name}` : 'Add New Collection'}
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {editingCategory ? (
                    <>Collection Key: <span className="text-red-600 font-bold">{editingCategory.id}</span></>
                  ) : (
                    <span>Create a new category for your storefront</span>
                  )}
                </p>
              </div>
            </div>

            {/* Real Supabase Error Display */}
            {categorySaveError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold uppercase">Supabase Operation Failed:</div>
                  <div className="text-[11px] text-red-700 mt-0.5">{categorySaveError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* Collection ID / Slug (only for new categories) */}
              {!editingCategory && (
                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                    Collection Slug / ID * (e.g. keychains, dioramas, apparel)
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.id}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, id: e.target.value })}
                    placeholder="e.g. keychains"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Unique lower-case slug used for routing and product categorization.
                  </span>
                </div>
              )}

              {/* Collection Name */}
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                  Collection Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="e.g. Hot Wheels Bouquets"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                  Tagline / Subtitle *
                </label>
                <textarea
                  rows={2}
                  required
                  value={categoryFormData.tagline}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, tagline: e.target.value })}
                  placeholder="Brief description displayed under title on storefront"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              {/* Parent Collection & Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                    Parent Collection (Optional)
                  </label>
                  <select
                    value={categoryFormData.parentId}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, parentId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                  >
                    <option value="">None (Top-Level Collection)</option>
                    {categories
                      .filter(c => (!editingCategory || c.id !== editingCategory.id) && (!c.parentId || c.parentId === 'root'))
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id})
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    e.g. Choose "Hot Wheels Customize" for Bouquets, Cards, Frames.
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1">
                    Display Order / Sequence
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={categoryFormData.sortOrder}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Controls position on the storefront navigation bar.
                  </span>
                </div>
              </div>

              {/* Active Toggle & Icon Picker */}
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryFormData.active}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, active: e.target.checked })}
                      className="accent-red-600 rounded w-4 h-4"
                    />
                    <span className="text-zinc-800 font-bold text-xs">Active on Storefront</span>
                  </label>
                </div>

                <div>
                  <label className="block text-zinc-700 uppercase text-[10px] font-bold mb-1.5">
                    Collection Icon
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { name: 'Car', icon: <Car className="w-4 h-4" /> },
                      { name: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
                      { name: 'Flower2', icon: <Flower2 className="w-4 h-4" /> },
                      { name: 'Frame', icon: <Frame className="w-4 h-4" /> },
                      { name: 'Flame', icon: <Flame className="w-4 h-4" /> },
                      { name: 'Star', icon: <Star className="w-4 h-4" /> },
                      { name: 'Package', icon: <Package className="w-4 h-4" /> },
                    ].map(item => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, icon: item.name })}
                        className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-mono transition cursor-pointer ${
                          categoryFormData.icon === item.name
                            ? 'bg-red-50 border-red-600 text-red-600 font-bold'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* COVER IMAGE UPLOAD & PREVIEW */}
              <div className="space-y-2 pt-1">
                <label className="block text-zinc-700 uppercase text-[10px] font-bold">
                  Cover Image (Upload from computer or specify URL)
                </label>

                <div className="bg-zinc-50 border border-dashed border-zinc-300 hover:border-red-500 rounded-xl p-4 transition-colors">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual Image Preview */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 relative flex items-center justify-center group">
                      {categoryFormData.image ? (
                        <>
                          <img
                            src={categoryFormData.image}
                            alt="Cover Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleReCropCategoryCover}
                            disabled={isPreparingReCrop || isUploadingCategoryCover}
                            title="Re-Crop Cover Banner"
                            className="absolute bottom-1.5 right-1.5 bg-black/80 hover:bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 opacity-90 group-hover:opacity-100 shadow-xs"
                          >
                            <Crop className="w-2.5 h-2.5 text-amber-300" />
                            <span>Crop</span>
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-400" />
                      )}
                      {isUploadingCategoryCover && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1 text-zinc-900">
                          <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                          <span className="text-[8px] font-mono">Uploading...</span>
                        </div>
                      )}
                    </div>

                    {/* File Upload Trigger */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <input
                        ref={categoryFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryCoverFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => categoryFileInputRef.current?.click()}
                        disabled={isUploadingCategoryCover}
                        className="w-full sm:w-auto bg-white hover:bg-red-600 hover:text-white text-zinc-800 px-4 py-2 rounded-xl text-xs font-bold font-mono inline-flex items-center justify-center gap-2 transition-all border border-zinc-300 hover:border-red-600 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-red-600" />
                        <span>{isUploadingCategoryCover ? 'Uploading...' : 'Choose Cover Image File'}</span>
                      </button>

                      <div className="text-[10px] text-zinc-500">
                        Uploads directly to Supabase storage.
                      </div>

                      {categoryUploadSuccess && (
                        <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cover image uploaded!</span>
                        </div>
                      )}

                      {categoryUploadError && (
                        <div className="text-[10px] text-red-600 flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{categoryUploadError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct URL input */}
                <div className="pt-1">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">
                    Or edit direct image URL:
                  </div>
                  <input
                    type="url"
                    required
                    value={categoryFormData.image}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-red-600 text-zinc-900 placeholder:text-zinc-400 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingCategoryCover || isSavingCategory}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md shadow-red-600/20 font-mono uppercase cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingCategory ? 'Save Changes' : 'Create Collection'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MANAGE COLLECTION PRODUCTS MODAL */}
      {/* ========================================================= */}
      {managingCategoryProducts && (() => {
        const collectionProducts = getProductsInCollection(managingCategoryProducts.id);
        const assignedIds = collectionProducts.map(p => p.id);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white border border-zinc-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative font-mono max-h-[90vh] flex flex-col">
              {/* Close Button */}
              <button
                onClick={() => setManagingCategoryProducts(null)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-200 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  {getCategoryIcon(managingCategoryProducts.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black uppercase text-zinc-900 font-sans">
                      {managingCategoryProducts.name}
                    </h3>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                      {managingCategoryProducts.id}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-sans">
                    Manage product assignments, display sequence, and ordering in this collection.
                  </p>
                </div>
              </div>

              <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
                {/* Quick Add Product to this Collection */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 uppercase flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-red-600" />
                      Add Product to this Collection
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Search catalog to assign products
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={categoryProductSearch}
                      onChange={(e) => setCategoryProductSearch(e.target.value)}
                      placeholder="Search product name or SKU to assign to this collection..."
                      className="w-full bg-white border border-zinc-200 focus:border-red-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden"
                    />
                  </div>

                  {/* Filtered Search Results for Unassigned Products */}
                  {categoryProductSearch.trim().length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2 border-t border-zinc-200">
                      {products
                        .filter(
                          p =>
                            !assignedIds.includes(p.id) &&
                            (p.name.toLowerCase().includes(categoryProductSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(categoryProductSearch.toLowerCase()))
                        )
                        .slice(0, 8)
                        .map(prod => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl p-2 hover:border-zinc-300 transition text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={prod.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover border border-zinc-200 shrink-0"
                              />
                              <div className="truncate">
                                <span className="font-bold text-zinc-900 font-sans block truncate">{prod.name}</span>
                                <span className="text-[10px] text-zinc-500">Primary: {prod.category} • ₹{prod.price}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleAssignProductToCollection(prod.id, managingCategoryProducts.id);
                                setCategoryProductSearch('');
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add to Collection</span>
                            </button>
                          </div>
                        ))}
                      {products.filter(
                        p =>
                          !assignedIds.includes(p.id) &&
                          p.name.toLowerCase().includes(categoryProductSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-center text-xs text-zinc-400 py-2">
                          No other unassigned products matching "{categoryProductSearch}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Current Products in this Collection with Sequence & Ordering */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase">
                      Products in this Collection ({collectionProducts.length})
                    </h4>
                    <span className="text-[10px] text-zinc-500">
                      Use Up/Down arrows to control display sequence
                    </span>
                  </div>

                  {collectionProducts.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-zinc-300 text-center space-y-2 bg-zinc-50">
                      <Package className="w-8 h-8 text-zinc-400 mx-auto" />
                      <p className="text-xs text-zinc-600 font-sans">
                        No products are currently assigned to <strong>{managingCategoryProducts.name}</strong>.
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Use the search bar above to assign products, or edit any product in the Products tab.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {collectionProducts.map((prod, pIndex) => (
                        <div
                          key={prod.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-2xl p-3 hover:border-zinc-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Sequence Badge + Order Controls */}
                            <div className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-lg border border-zinc-200 text-[10px] font-mono font-bold text-zinc-700 shrink-0">
                              <span>#{pIndex + 1}</span>
                              <div className="flex items-center ml-1 border-l border-zinc-300 pl-1">
                                <button
                                  type="button"
                                  disabled={pIndex === 0 || isReorderingProductsInCollection}
                                  onClick={() => handleReorderProductInCollection(managingCategoryProducts.id, prod.id, 'up')}
                                  title="Move Earlier in this Collection"
                                  className="p-0.5 hover:text-red-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={pIndex === collectionProducts.length - 1 || isReorderingProductsInCollection}
                                  onClick={() => handleReorderProductInCollection(managingCategoryProducts.id, prod.id, 'down')}
                                  title="Move Later in this Collection"
                                  className="p-0.5 hover:text-red-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=75'}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0"
                            />
                            <div className="truncate">
                              <span className="font-bold text-zinc-900 font-sans text-xs block truncate">
                                {prod.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                                <span>₹{prod.price}</span>
                                <span>•</span>
                                <span>Stock: {prod.stockCount ?? 0}</span>
                                {prod.category === managingCategoryProducts.id && (
                                  <span className="bg-red-50 text-red-700 text-[9px] px-1.5 py-0.2 rounded font-bold border border-red-200">
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions: Remove & Primary Reassign */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveProductFromCollection(prod.id, managingCategoryProducts.id)}
                              className="px-2.5 py-1 text-[11px] font-mono font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer flex items-center gap-1"
                              title="Remove product from this collection"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-zinc-400">
                  Changes save automatically to database
                </span>
                <button
                  type="button"
                  onClick={() => setManagingCategoryProducts(null)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl transition font-mono uppercase text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* COLLECTIONS & PRODUCT_COLLECTIONS SUPABASE SQL MODAL */}
      {/* ========================================================= */}
      {showCollectionsSqlModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative font-mono text-xs text-zinc-200 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowCollectionsSqlModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold uppercase mb-1">
              <Tag className="w-4 h-4" />
              <span>Supabase Relational Database Setup</span>
            </div>

            <h3 className="text-base font-black uppercase text-white font-sans mb-1">
              Collections & Product-Collections Tables SQL
            </h3>

            <p className="text-zinc-400 text-[11px] mb-4 font-sans leading-relaxed">
              Run this SQL script in your <strong>Supabase Project &gt; SQL Editor</strong> to create the dedicated <code className="text-red-400 bg-zinc-900 px-1 py-0.5 rounded">collections</code> and <code className="text-red-400 bg-zinc-900 px-1 py-0.5 rounded">product_collections</code> relational tables with RLS policies and seed data.
            </p>

            <div className="relative flex-1 min-h-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col mb-4">
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
                <span className="text-[10px] text-zinc-500 font-mono">schema.sql</span>
                <button
                  type="button"
                  onClick={handleCopyCollectionsSqlScript}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedCollectionsSql ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-y-auto font-mono text-[11px] text-emerald-400 leading-relaxed flex-1 selection:bg-red-600/30">
                {SUPABASE_COLLECTIONS_SQL}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 shrink-0">
              <span className="text-[10px] text-zinc-500">
                Supports dual-write backward compatibility
              </span>
              <button
                type="button"
                onClick={() => setShowCollectionsSqlModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl font-mono text-xs text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 uppercase">Confirm Delete</h4>
            <p className="text-zinc-600">
              Are you sure you want to permanently delete this product?
            </p>

            {productDeleteError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-left text-red-800 text-[11px]">
                <span className="font-bold">Error: </span>
                <span>{productDeleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => {
                  setDeletingProductId(null);
                  setProductDeleteError(null);
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => handleDeleteProduct(deletingProductId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE COLLECTION CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deletingCategoryId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl font-mono text-xs text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 uppercase">Delete Collection</h4>
            <p className="text-zinc-600">
              Are you sure you want to delete collection <span className="text-red-600 font-bold">"{deletingCategoryId}"</span> from Supabase?
            </p>

            {categoryDeleteError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-left text-red-800 text-[11px]">
                <span className="font-bold">Error: </span>
                <span>{categoryDeleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => {
                  setDeletingCategoryId(null);
                  setCategoryDeleteError(null);
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => handleDeleteCategory(deletingCategoryId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingCategory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ORDER TRACKING & FULFILLMENT MODAL */}
      {/* ========================================================= */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 uppercase">
                    Order Tracking #{trackingModalOrder.orderNumber}
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Customer: {trackingModalOrder.customerName} ({trackingModalOrder.customerPhone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Courier Partner
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {['DTDC', 'BlueDart', 'Delhivery', 'Shiprocket', 'India Post', 'Ekart'].map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => setTrackingForm({ ...trackingForm, courierName: cName })}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium transition cursor-pointer text-center ${
                        trackingForm.courierName === cName
                          ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {cName}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={trackingForm.courierName}
                  onChange={(e) => setTrackingForm({ ...trackingForm, courierName: e.target.value })}
                  placeholder="Or custom courier name..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-sky-500 text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Tracking / AWB Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  placeholder="e.g. D39102948 / 9823102319"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-sky-500 text-zinc-900 font-mono rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-600 mb-1">
                  Direct Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={trackingForm.trackingUrl}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })}
                  placeholder="https://track.dtdc.com/... or auto-computed"
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-sky-500 text-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                />
                <p className="text-[9px] text-zinc-500 mt-1">
                  Leave blank to auto-generate tracking link based on courier partner.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  disabled={!trackingForm.trackingNumber.trim()}
                  onClick={() =>
                    handleShareTrackingWhatsApp(
                      trackingModalOrder,
                      trackingForm.courierName,
                      trackingForm.trackingNumber,
                      trackingForm.trackingUrl
                    )
                  }
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Tracking Info</span>
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackingModalOrder(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTracking || !trackingForm.trackingNumber.trim()}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    {isSavingTracking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving DB...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Mark Shipped</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* AI-GENERATED OFFICIAL INVOICE MODAL */}
      {/* ========================================================= */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* ========================================================= */}
      {/* AI PAYMENT SCREENSHOT VERIFICATION INSPECTOR MODAL */}
      {/* ========================================================= */}
      {inspectingVerificationOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl font-mono text-xs space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 uppercase">
                    UPI Payment Verification — #{inspectingVerificationOrder.orderNumber}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Customer: {inspectingVerificationOrder.customerName} ({inspectingVerificationOrder.customerPhone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingVerificationOrder(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Screenshot Image + AI Forensic Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Full Screenshot Image */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Uploaded Payment Proof
                </div>
                {inspectingVerificationOrder.paymentScreenshotUrl ? (
                  <div className="relative rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-900 group">
                    <img
                      src={inspectingVerificationOrder.paymentScreenshotUrl}
                      alt="Customer Payment Screenshot"
                      className="w-full max-h-[360px] object-contain mx-auto bg-zinc-950"
                    />
                    <a
                      href={inspectingVerificationOrder.paymentScreenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Full View</span>
                    </a>
                  </div>
                ) : (
                  <div className="h-48 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-zinc-400 gap-2">
                    <Camera className="w-8 h-8 opacity-40" />
                    <span>No screenshot image provided</span>
                  </div>
                )}
              </div>

              {/* Right Column: AI Analysis Verdict */}
              <div className="space-y-3 font-sans">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                  Gemini AI Forensic Verdict
                </div>

                {inspectingVerificationOrder.aiVerification ? (
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      inspectingVerificationOrder.aiVerification.status === 'AUTHENTIC'
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                        : inspectingVerificationOrder.aiVerification.status === 'UNCLEAR'
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                        : 'bg-rose-50/90 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        {inspectingVerificationOrder.aiVerification.status === 'AUTHENTIC' ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        ) : inspectingVerificationOrder.aiVerification.status === 'UNCLEAR' ? (
                          <ShieldAlert className="w-5 h-5 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                        )}
                        <span className="uppercase font-mono">
                          {inspectingVerificationOrder.aiVerification.status === 'AUTHENTIC'
                            ? 'Likely Authentic'
                            : inspectingVerificationOrder.aiVerification.status === 'UNCLEAR'
                            ? 'Manual Inspection Required'
                            : 'Potential Mismatch'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded-full">
                        {inspectingVerificationOrder.aiVerification.confidenceScore || 90}% Match
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">
                      {inspectingVerificationOrder.aiVerification.headline || inspectingVerificationOrder.aiVerification.notes}
                    </p>

                    {/* Forensic Details List */}
                    <div className="bg-white/80 rounded-xl p-3 space-y-1.5 text-xs font-mono border border-current/10">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Detected App:</span>
                        <span className="font-bold">{inspectingVerificationOrder.aiVerification.detectedApp || 'UPI App'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Detected Amount:</span>
                        <span className="font-bold text-emerald-700">
                          {inspectingVerificationOrder.aiVerification.detectedAmount
                            ? `₹${inspectingVerificationOrder.aiVerification.detectedAmount}`
                            : 'Not readable'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Order Amount:</span>
                        <span className="font-bold text-red-600">₹{inspectingVerificationOrder.total.toFixed(2)}</span>
                      </div>
                      {inspectingVerificationOrder.aiVerification.utrReference && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">UTR / Ref No:</span>
                          <span className="font-bold select-all">{inspectingVerificationOrder.aiVerification.utrReference}</span>
                        </div>
                      )}
                      {inspectingVerificationOrder.aiVerification.recipientVpa && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Recipient VPA:</span>
                          <span className="font-bold truncate max-w-[150px]">{inspectingVerificationOrder.aiVerification.recipientVpa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-600">
                    Screenshot uploaded before AI verification integration or manual payment.
                  </div>
                )}

                {/* Important Admin Disclaimer */}
                <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-[10px] text-zinc-600 font-sans leading-normal">
                  <strong>Notice:</strong> AI analysis provides a rapid automated check. Final confirmation of payment credit remains a manual admin authorization against the bank statement.
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 font-mono">
              <a
                href={`https://wa.me/${inspectingVerificationOrder.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hi ${inspectingVerificationOrder.customerName}, regarding your Redline Garage order #${inspectingVerificationOrder.orderNumber}: We are checking your UPI payment of ₹${inspectingVerificationOrder.total}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Message Customer on WhatsApp</span>
              </a>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingVerificationOrder(null)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition cursor-pointer text-xs"
                >
                  Close
                </button>
                {inspectingVerificationOrder.status === 'pending' && (
                  <button
                    type="button"
                    disabled={updatingOrderId === inspectingVerificationOrder.id}
                    onClick={async () => {
                      await handleStatusChange(inspectingVerificationOrder.id!, 'confirmed', inspectingVerificationOrder.orderNumber);
                      setInspectingVerificationOrder(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Confirm Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* UNIVERSAL ADMIN IMAGE CROPPER MODAL */}
      {/* ========================================================= */}
      <ImageCropperModal
        isOpen={cropModalOpen}
        files={pendingCropFiles}
        defaultAspectRatio={cropDefaultRatio}
        title={cropModalTitle}
        subtitle={cropModalSubtitle}
        onClose={() => {
          setCropModalOpen(false);
          setPendingCropFiles([]);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
