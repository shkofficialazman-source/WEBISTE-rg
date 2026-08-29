export const SUPABASE_COLLECTIONS_SQL = `-- ========================================================================
-- Redline Garage: Collections & Product Collections Schema for Supabase
-- Run this in your Supabase Project -> SQL Editor to initialize or update tables
-- ========================================================================

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    tagline TEXT,
    cover_image_url TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    parent_id TEXT,
    badge TEXT,
    icon TEXT DEFAULT 'Car',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create product_collections junction table (many-to-many with display ordering)
CREATE TABLE IF NOT EXISTS public.product_collections (
    id TEXT PRIMARY KEY DEFAULT ('pc_' || gen_random_uuid()::text),
    product_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_collection FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE,
    CONSTRAINT uq_product_collection UNIQUE (product_id, collection_id)
);

-- 3. Create high-performance indexes
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON public.collections(display_order);
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(active);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection ON public.product_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_product ON public.product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_order ON public.product_collections(collection_id, display_order);

-- 4. Enable Row Level Security (RLS) & permissive policies for full-stack admin
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public select on collections') THEN
        CREATE POLICY "Allow public select on collections" ON public.collections FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public modify on collections') THEN
        CREATE POLICY "Allow public modify on collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_collections' AND policyname = 'Allow public select on product_collections') THEN
        CREATE POLICY "Allow public select on product_collections" ON public.product_collections FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_collections' AND policyname = 'Allow public modify on product_collections') THEN
        CREATE POLICY "Allow public modify on product_collections" ON public.product_collections FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. Seed default starter collections (Two-Tier Collection System)
INSERT INTO public.collections (id, name, slug, description, tagline, cover_image_url, display_order, active, parent_id, badge, icon)
VALUES
  -- Primary Tier 1: Scale Models
  ('scale-models', 'Scale Models', 'scale-models', 'Authentic 1:64 scale and collector die-cast vehicles from legendary automotive brands and makers.', 'Precision 1:64 Scale & Premium Die-Cast Vault', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80', 1, true, NULL, 'Scale Models', 'Car'),
  ('hotwheels', 'Hot Wheels', 'hotwheels', 'Mainlines, Premiums, Car Culture, and Treasure Hunts from the world’s most iconic die-cast brand.', 'Official Mattel 1:64 Die-Cast Mainlines & Premiums', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80', 2, true, 'scale-models', 'Hot Wheels', 'Flame'),
  ('minigt', 'Mini GT', 'minigt', 'Precision 1:64 scale collector models with authentic licensed liveries, real rubber tires, and hyper-detailed casting molds.', 'Collector Grade 1:64 Scale Metal Diecast', 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80', 3, true, 'scale-models', 'Mini GT', 'Car'),
  ('majorette', 'Majorette', 'majorette', 'Historic European diecast automotive models featuring opening doors, working suspensions, and collector-edition metal castings.', 'European Heritage Die-Cast Models', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', 4, true, 'scale-models', 'Majorette', 'Car'),

  -- Primary Tier 2: Custom Creations
  ('custom-creations', 'Custom Creations', 'custom-creations', 'Handcrafted gifting and personalized diecast expressions — Bouquets, Custom Photo Blister Cards, and Wall Shadowbox Frames.', 'Handcrafted Custom Diecast Creations', 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80', 5, true, NULL, 'Custom Studio', 'Sparkles'),
  ('bouquets', 'Bouquets', 'bouquets', 'Die-cast cars arranged like luxury floral bouquets. The viral gifting sensation for boyfriends, birthdays, and anniversaries.', 'Hot Wheels Die-Cast Bouquets', 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=800&q=80', 6, true, 'custom-creations', 'Most Gifted', 'Flower2'),
  ('custom-cards', 'Custom Cards', 'custom-cards', 'Your own photo and custom driver credentials printed on an official-style Hot Wheels blister card with a genuine 1:64 diecast car.', 'Personalized Photo Blister Cards', 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=800&q=80', 7, true, 'custom-creations', 'Personalized', 'Sparkles'),
  ('frames', 'Frames', 'frames', 'Museum-grade shadowbox wall frames and acrylic showcases preserving legendary casting lineages & dream garages.', 'Mounted Shadowbox Wall Art', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', 8, true, 'custom-creations', 'Wall Art', 'Frame')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline,
  cover_image_url = EXCLUDED.cover_image_url,
  display_order = EXCLUDED.display_order,
  active = EXCLUDED.active,
  parent_id = EXCLUDED.parent_id,
  badge = EXCLUDED.badge,
  icon = EXCLUDED.icon;
`;
