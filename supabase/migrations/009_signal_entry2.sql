-- Add entry_price_2 for range entry signals
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS entry_price_2 DECIMAL(20, 8);
