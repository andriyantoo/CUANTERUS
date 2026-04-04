-- Add plan_id to payments so webhook can reliably find the plan
-- (needed for coupon discounts where amount != plan price)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);
