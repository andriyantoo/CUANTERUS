-- Trading Journal table
CREATE TABLE public.trade_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  lot_size DECIMAL(10, 4) NOT NULL,
  entry_price DECIMAL(20, 6) NOT NULL,
  stop_loss DECIMAL(20, 6),
  take_profit DECIMAL(20, 6),
  exit_price DECIMAL(20, 6),
  pnl_usd DECIMAL(12, 2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'win', 'loss', 'breakeven')),
  setup TEXT,
  notes TEXT,
  screenshot_url TEXT,
  traded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trades"
  ON public.trade_journal
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_trade_journal_user ON public.trade_journal(user_id, traded_at DESC);
