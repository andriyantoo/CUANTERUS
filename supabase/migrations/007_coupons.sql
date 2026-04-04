-- ============================================================
-- COUPON SYSTEM
-- ============================================================

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value BIGINT NOT NULL,          -- percent (e.g. 50) or fixed IDR amount
  max_uses INT,                             -- NULL = unlimited
  used_count INT NOT NULL DEFAULT 0,
  min_amount BIGINT DEFAULT 0,             -- minimum order to apply
  product_id UUID REFERENCES public.products(id),  -- NULL = all products
  expires_at TIMESTAMPTZ,                  -- NULL = never expires
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track which users used which coupons (1 use per user per coupon)
CREATE TABLE public.coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read active coupons" ON public.coupons
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users read own coupon uses" ON public.coupon_uses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Auth insert coupon uses" ON public.coupon_uses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage coupon uses" ON public.coupon_uses
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
