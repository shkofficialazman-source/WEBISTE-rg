// ========================================================================
// Redline Garage: Order Tracking Table Schema for Supabase
// Run this in your Supabase Project -> SQL Editor to initialize the table
// ========================================================================

export const SUPABASE_ORDER_TRACKING_SQL = `-- ========================================================================
-- 1. Create order_tracking table
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  order_id TEXT,
  tracking_id TEXT,
  tracking_link TEXT,
  courier_name TEXT,
  status TEXT DEFAULT 'Processing', -- Processing, Shipped, Out for Delivery, Delivered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- 2. Create Index on customer_phone for fast customer lookups
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_customer_phone ON public.order_tracking(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking(created_at DESC);

-- ========================================================================
-- 3. Enable Row Level Security (RLS)
-- ========================================================================
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- 4. Public read policy (allows customer-side lookup filtered by customer_phone without auth)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_tracking' AND policyname = 'Allow public read on order_tracking') THEN
        CREATE POLICY "Allow public read on order_tracking" ON public.order_tracking FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_tracking' AND policyname = 'Allow admin all on order_tracking') THEN
        CREATE POLICY "Allow admin all on order_tracking" ON public.order_tracking FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
`;
