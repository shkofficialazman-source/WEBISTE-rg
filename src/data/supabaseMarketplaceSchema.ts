export const SUPABASE_MARKETPLACE_SQL = `-- =============================================================
-- REDLINE GARAGE RESELLER MARKETPLACE SCHEMA (SUPABASE POSTGRESQL)
-- Peer-to-Peer die-cast trading with admin-moderated commission
-- =============================================================

-- 1. Reseller Listings Table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id TEXT PRIMARY KEY,
    reseller_id TEXT NOT NULL,
    reseller_name TEXT NOT NULL,
    reseller_phone TEXT NOT NULL,
    reseller_email TEXT,
    reseller_city TEXT,
    reseller_instagram TEXT,
    is_verified_reseller BOOLEAN DEFAULT false,
    car_name TEXT NOT NULL,
    casting_model TEXT,
    series TEXT NOT NULL,
    scale TEXT DEFAULT '1:64',
    condition TEXT NOT NULL,
    condition_details TEXT,
    asking_price NUMERIC NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending_verification',
    listing_fee_amount NUMERIC DEFAULT 99,
    listing_fee_status TEXT DEFAULT 'pending',
    payment_screenshot_url TEXT,
    payment_utr TEXT,
    verified_at TIMESTAMPTZ,
    sold_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    views_count INTEGER DEFAULT 0,
    chats_count INTEGER DEFAULT 0
);

-- 2. Marketplace Messages Table (Live Chat)
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    sender_role TEXT NOT NULL, -- 'buyer', 'reseller', 'admin'
    sender_name TEXT NOT NULL,
    sender_contact TEXT,
    message TEXT NOT NULL,
    is_flagged_for_admin BOOLEAN DEFAULT false,
    admin_flag_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    is_read BOOLEAN DEFAULT false
);

-- 3. Marketplace Conversations Table
CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    listing_title TEXT NOT NULL,
    listing_price NUMERIC NOT NULL,
    listing_image TEXT,
    reseller_name TEXT NOT NULL,
    reseller_phone TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    has_admin_flag BOOLEAN DEFAULT false,
    admin_flagged_at TIMESTAMPTZ,
    admin_flag_resolved BOOLEAN DEFAULT false,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Reseller Reviews Table
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    reseller_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Trust & Safety Reports Table
CREATE TABLE IF NOT EXISTS public.marketplace_reports (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    conversation_id TEXT,
    reporter_role TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    reporter_phone TEXT,
    reported_item_or_user TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. Marketplace Settings Table
CREATE TABLE IF NOT EXISTS public.marketplace_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    listing_fee NUMERIC DEFAULT 99,
    listing_duration_days INTEGER DEFAULT 30,
    upi_id TEXT DEFAULT 'shkofficialazman@okhdfcbank',
    is_marketplace_enabled BOOLEAN DEFAULT true,
    min_asking_price NUMERIC DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Seed default settings
INSERT INTO public.marketplace_settings (id, listing_fee, listing_duration_days, upi_id, is_marketplace_enabled, min_asking_price)
VALUES ('global', 99, 30, 'shkofficialazman@okhdfcbank', true, 100)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for marketplace operations
CREATE POLICY "Public read marketplace listings" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Public insert marketplace listings" ON public.marketplace_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update marketplace listings" ON public.marketplace_listings FOR UPDATE USING (true);

CREATE POLICY "Public read marketplace messages" ON public.marketplace_messages FOR SELECT USING (true);
CREATE POLICY "Public insert marketplace messages" ON public.marketplace_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update marketplace messages" ON public.marketplace_messages FOR UPDATE USING (true);

CREATE POLICY "Public read marketplace conversations" ON public.marketplace_conversations FOR SELECT USING (true);
CREATE POLICY "Public insert marketplace conversations" ON public.marketplace_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update marketplace conversations" ON public.marketplace_conversations FOR UPDATE USING (true);

CREATE POLICY "Public read marketplace reviews" ON public.marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Public insert marketplace reviews" ON public.marketplace_reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read marketplace reports" ON public.marketplace_reports FOR SELECT USING (true);
CREATE POLICY "Public insert marketplace reports" ON public.marketplace_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read marketplace settings" ON public.marketplace_settings FOR SELECT USING (true);
CREATE POLICY "Public update marketplace settings" ON public.marketplace_settings FOR UPDATE USING (true);

-- Enable Realtime Broadcast / postgres_changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
`;
