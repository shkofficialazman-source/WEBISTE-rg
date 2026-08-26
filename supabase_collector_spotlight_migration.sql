-- ============================================================================
-- MIGRATION: CREATE collector_spotlight TABLE & RLS POLICIES
-- ============================================================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bmuccamypbfrrhealjgq/sql/new
-- ============================================================================

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

-- Enable RLS
ALTER TABLE public.collector_spotlight ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if present to prevent duplicate errors
DROP POLICY IF EXISTS "Allow public select collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public insert collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public update collector_spotlight" ON public.collector_spotlight;
DROP POLICY IF EXISTS "Allow public delete collector_spotlight" ON public.collector_spotlight;

-- Public Read Access for website visitors & homepage
CREATE POLICY "Allow public select collector_spotlight" 
ON public.collector_spotlight FOR SELECT 
TO anon, authenticated 
USING (true);

-- Admin write & update access for admin console
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

-- Insert default featured spotlight entry if table is empty
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
