-- ============================================================
-- MANUAL PAYMENTS (bank transfer)
-- ============================================================

CREATE TABLE public.manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  amount_idr BIGINT NOT NULL,
  unique_code INT NOT NULL DEFAULT 0,          -- e.g. 3 digit unique code added to amount
  total_amount BIGINT NOT NULL,                -- amount + unique_code
  proof_url TEXT,                               -- uploaded proof screenshot
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  admin_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,             -- payment deadline
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_payments_user ON public.manual_payments(user_id);
CREATE INDEX idx_manual_payments_status ON public.manual_payments(status);

ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own manual payments" ON public.manual_payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create manual payments" ON public.manual_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own manual payments" ON public.manual_payments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage manual payments" ON public.manual_payments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
