-- ============================================================================
-- REDLINE GARAGE - COMPLETE SUPABASE POSTGRESQL DATABASE SCHEMA & RLS POLICIES
-- ============================================================================
-- Copy and run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bmuccamypbfrrhealjgq/sql/new
-- ============================================================================

-- 1. ORDERS TABLE (Authoritative Single Source of Truth for Store Orders)
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
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid collision
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select from orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete on orders" ON public.orders;

-- RLS Policies for orders
CREATE POLICY "Allow public insert to orders" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public select from orders" 
ON public.orders FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update on orders" 
ON public.orders FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete on orders" 
ON public.orders FOR DELETE 
TO anon, authenticated 
USING (true);

-- Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;


-- 2. PRODUCTS TABLE (Ensuring Schema & RLS Policies)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 1,
    image TEXT NOT NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    short_tagline TEXT,
    is_bestseller BOOLEAN DEFAULT false,
    is_new_release BOOLEAN DEFAULT false,
    stock_count INTEGER NOT NULL DEFAULT 10,
    requires_photo_upload BOOLEAN DEFAULT false,
    collector_specs JSONB DEFAULT '{}'::jsonb,
    gift_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid collision
DROP POLICY IF EXISTS "Allow public select from products" ON public.products;
DROP POLICY IF EXISTS "Allow public update product stock" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

CREATE POLICY "Allow public select from products" 
ON public.products FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update product stock" 
ON public.products FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public insert products" 
ON public.products FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public delete products" 
ON public.products FOR DELETE 
TO anon, authenticated 
USING (true);

-- Enable Realtime for products table
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;


-- 3. CATEGORIES TABLE (Ensuring Schema & RLS Policies)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    icon TEXT,
    image TEXT,
    badge TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select from categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public delete categories" ON public.categories;

CREATE POLICY "Allow public select from categories" 
ON public.categories FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update categories" 
ON public.categories FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public insert categories" 
ON public.categories FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public delete categories" 
ON public.categories FOR DELETE 
TO anon, authenticated 
USING (true);

-- Enable Realtime for categories table
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;


-- 4. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    source TEXT DEFAULT 'footer',
    tags JSONB DEFAULT '["vip_pit_pass"]'::jsonb,
    coupon_code_issued TEXT DEFAULT 'VIPGARAGE10',
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public insert newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update newsletter_subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Allow public select newsletter_subscribers" 
ON public.newsletter_subscribers FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert newsletter_subscribers" 
ON public.newsletter_subscribers FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public update newsletter_subscribers" 
ON public.newsletter_subscribers FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);


-- 5. COLLECTOR SPOTLIGHT TABLE (Collector of the Month Hall of Fame)
CREATE TABLE IF NOT EXISTS public.collector_spotlight (
    id BIGINT PRIMARY KEY DEFAULT 1,
    collector_name TEXT NOT NULL,
    instagram_handle TEXT,
    photo_url TEXT NOT NULL,
    story_quote TEXT NOT NULL,
    featured_month TEXT NOT NULL DEFAULT 'Current Month',
    collection_size TEXT DEFAULT '500+ Castings',
    favorite_casting TEXT DEFAULT 'Nissan Skyline GT-R (BNR34) RLC',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure table has Row Level Security enabled
ALTER TABLE public.collector_spotlight ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Allow public select collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public insert collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public update collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public delete collector_spotlight" ON public.collector_spotlight;

-- Public Read Access (Storefront homepage & visitors)
CREATE POLICY "Allow public select collector_spotlight" 
ON public.collector_spotlight FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admin / authenticated & anon write access for site admin panel upsert
CREATE POLICY "Allow public insert collector_spotlight" 
ON public.collector_spotlight FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public update collector_spotlight" 
ON public.collector_spotlight FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete collector_spotlight" 
ON public.collector_spotlight FOR DELETE 
TO anon, authenticated 
USING (true);

-- Seed initial Collector Spotlight record if empty
INSERT INTO public.collector_spotlight (
    id,
    collector_name,
    instagram_handle,
    photo_url,
    story_quote,
    featured_month,
    collection_size,
    favorite_casting,
    active,
    created_at,
    updated_at
) VALUES (
    1,
    'Rohan Deshmukh (@rohan_diecast_garage)',
    '@rohan_diecast_garage',
    'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80',
    'Started collecting in 2018 with a 1968 Custom Camaro. Now guarding 650+ carded pieces including rare RLC Skylines and Redline Garage bespoke custom cards displayed in UV-safe acrylic frames.',
    'August 2026',
    '650+ Carded Castings',
    'Nissan Skyline GT-R (BNR34) RLC & 71 Datsun 510',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for collector_spotlight table
ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_spotlight;


-- 6. REFERRAL CODES TABLE (Discount Codes & Collector Ambassador Program)
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 10,
    active BOOLEAN NOT NULL DEFAULT true,
    uses_count INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER,
    min_order_amount NUMERIC(10, 2),
    total_discount_given NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_collector_referral BOOLEAN NOT NULL DEFAULT false,
    creator_uid TEXT,
    creator_email TEXT,
    creator_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes (code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_creator_uid ON public.referral_codes (creator_uid);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public insert referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public update referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public delete referral_codes" ON public.referral_codes;

CREATE POLICY "Allow public select referral_codes" 
ON public.referral_codes FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert referral_codes" 
ON public.referral_codes FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public update referral_codes" 
ON public.referral_codes FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete referral_codes" 
ON public.referral_codes FOR DELETE 
TO anon, authenticated 
USING (true);

-- Seed initial referral / promo codes if table is empty
INSERT INTO public.referral_codes (
    code, discount_type, discount_value, active, uses_count, max_uses, min_order_amount, total_discount_given, is_collector_referral, created_at, updated_at
) VALUES 
    ('AZMAN10', 'percentage', 10, true, 14, NULL, 0, 1250, true, NOW(), NOW()),
    ('REDLINE50', 'flat', 50, true, 8, 100, 499, 400, false, NOW(), NOW()),
    ('DIECAST15', 'percentage', 15, true, 5, 50, 999, 680, false, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_codes;


-- 7. LOYALTY & STORE SETTINGS TABLES
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
    id BIGSERIAL PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    user_id TEXT,
    customer_name TEXT NOT NULL DEFAULT 'Hot Wheels Collector',
    points_balance INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_phone ON public.loyalty_accounts (phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_email ON public.loyalty_accounts (email);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON public.loyalty_accounts (user_id);

ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select loyalty_accounts" ON public.loyalty_accounts;
DROP POLICY IF EXISTS "Allow public insert loyalty_accounts" ON public.loyalty_accounts;
DROP POLICY IF EXISTS "Allow public update loyalty_accounts" ON public.loyalty_accounts;
DROP POLICY IF EXISTS "Allow public delete loyalty_accounts" ON public.loyalty_accounts;

CREATE POLICY "Allow public select loyalty_accounts" 
ON public.loyalty_accounts FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert loyalty_accounts" 
ON public.loyalty_accounts FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public update loyalty_accounts" 
ON public.loyalty_accounts FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete loyalty_accounts" 
ON public.loyalty_accounts FOR DELETE 
TO anon, authenticated 
USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_accounts;


CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow public insert store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow public update store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow public delete store_settings" ON public.store_settings;

CREATE POLICY "Allow public select store_settings" 
ON public.store_settings FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert store_settings" 
ON public.store_settings FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public update store_settings" 
ON public.store_settings FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete store_settings" 
ON public.store_settings FOR DELETE 
TO anon, authenticated 
USING (true);

-- Seed default Loyalty Settings
INSERT INTO public.store_settings (key, value, updated_at)
VALUES (
    'loyalty_settings',
    '{"earnRateRupees": 10, "redeemPointValue": 0.5, "minPointsToRedeem": 50, "welcomeBonusPoints": 20, "referralBonusPoints": 30, "loyaltyEnabled": true}'::jsonb,
    NOW()
) ON CONFLICT (key) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;


