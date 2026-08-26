-- ============================================================================
-- MIGRATION: CREATE loyalty_accounts & store_settings TABLES & RLS POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bmuccamypbfrrhealjgq/sql/new
-- ============================================================================

-- 1. LOYALTY ACCOUNTS TABLE (Tracks points balance, lifetime earnings, phone key)
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

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_phone ON public.loyalty_accounts (phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_email ON public.loyalty_accounts (email);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON public.loyalty_accounts (user_id);

-- Enable RLS on loyalty_accounts
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
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

-- Enable Supabase Realtime for loyalty_accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_accounts;


-- 2. STORE SETTINGS TABLE (Key-Value JSON store for Loyalty Rules, Birthday Discounts, etc.)
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on store_settings
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

-- Enable Supabase Realtime for store_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
