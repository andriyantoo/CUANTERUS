-- ============================================================
-- MARKET INSIGHTS (PDF uploads with watermarked downloads)
-- ============================================================

CREATE TABLE public.market_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,              -- Supabase Storage URL
  file_name TEXT NOT NULL,             -- Original filename
  category TEXT NOT NULL DEFAULT 'daily'
    CHECK (category IN ('daily', 'weekly', 'monthly', 'special')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read published insights" ON public.market_insights
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

CREATE POLICY "Admins manage insights" ON public.market_insights
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
