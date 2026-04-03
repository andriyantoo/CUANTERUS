-- Add chart_url to signals for TradingView / analysis links
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS chart_url TEXT;
