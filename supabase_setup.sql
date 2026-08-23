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
