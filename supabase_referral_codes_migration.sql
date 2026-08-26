-- ============================================================================
-- MIGRATION: CREATE referral_codes TABLE & RLS POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bmuccamypbfrrhealjgq/sql/new
-- ============================================================================

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

-- Index for fast lookup by promo/referral code and creator
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes (code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_creator_uid ON public.referral_codes (creator_uid);

-- Enable Row Level Security (RLS)
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Allow public select referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public insert referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public update referral_codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Allow public delete referral_codes" ON public.referral_codes;

-- Public Read Access (for checkout discount validation & admin overview)
CREATE POLICY "Allow public select referral_codes" 
ON public.referral_codes FOR SELECT 
TO anon, authenticated 
USING (true);

-- Insert & Update Access (for Admin dashboard & automatic Collector code creation)
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

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_codes;
