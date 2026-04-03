-- ============================================================
-- FORUM (Discord-style private forum)
-- ============================================================

-- Channel types: 'text' (discussion), 'forum' (thread-based), 'announcement' (admin only)
CREATE TABLE public.forum_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),  -- NULL = accessible to all members
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,                            -- emoji icon
  channel_type TEXT NOT NULL DEFAULT 'text'
    CHECK (channel_type IN ('text', 'forum', 'announcement')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.forum_channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_solved BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  upvote_count INT NOT NULL DEFAULT 0,
  reply_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_threads_channel ON public.forum_threads(channel_id, last_activity_at DESC);
CREATE INDEX idx_threads_author ON public.forum_threads(author_id);

CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  upvote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_replies_thread ON public.forum_replies(thread_id, created_at);

CREATE TABLE public.forum_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'upvote'
    CHECK (reaction_type IN ('upvote', 'helpful', 'fire', 'eyes')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, thread_id, reaction_type),
  UNIQUE(user_id, reply_id, reaction_type),
  CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.forum_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reactions ENABLE ROW LEVEL SECURITY;

-- Channels: authenticated read active
CREATE POLICY "Auth read active channels" ON public.forum_channels
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
CREATE POLICY "Admins manage channels" ON public.forum_channels
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Threads: authenticated CRUD own, read all
CREATE POLICY "Auth read threads" ON public.forum_threads
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth create threads" ON public.forum_threads
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own threads" ON public.forum_threads
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins manage threads" ON public.forum_threads
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Replies: same pattern
CREATE POLICY "Auth read replies" ON public.forum_replies
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth create replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins manage replies" ON public.forum_replies
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reactions
CREATE POLICY "Auth read reactions" ON public.forum_reactions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage own reactions" ON public.forum_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SEED: Channels matching Discord structure
-- ============================================================

-- Cuantroopers channels (product_id = cuantroopers)
INSERT INTO public.forum_channels (product_id, name, slug, icon, channel_type, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Announcement', 'announcement', '🔔', 'announcement', 1),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Moonbag Crypto', 'moonbag-crypto', '🎬', 'text', 2),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Research Crypto', 'research-crypto', '📚', 'text', 3),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Market Insight', 'market-insight-forum', '📚', 'text', 4),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Mencari Ilham', 'mencari-ilham', '👳', 'text', 5),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Crypto Market', 'crypto-market', '🤝', 'forum', 6),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Crypto Discussion', 'crypto-discussion', '🗣️', 'text', 7),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Template Room', 'template-room', '⚠️', 'text', 8),
  ((SELECT id FROM products WHERE slug = 'cuantroopers'), 'Diskusi Analisa', 'diskusi-analisa', '☁️', 'text', 9);

-- Crypto channels
INSERT INTO public.forum_channels (product_id, name, slug, icon, channel_type, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'crypto'), 'Crypto General', 'crypto-general', '💬', 'text', 1),
  ((SELECT id FROM products WHERE slug = 'crypto'), 'Sinyal Crypto', 'sinyal-crypto', '📡', 'text', 2),
  ((SELECT id FROM products WHERE slug = 'crypto'), 'Tanya Jawab Crypto', 'tanya-jawab-crypto', '❓', 'text', 3);

-- Forex channels
INSERT INTO public.forum_channels (product_id, name, slug, icon, channel_type, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'forex'), 'Forex General', 'forex-general', '💬', 'text', 1),
  ((SELECT id FROM products WHERE slug = 'forex'), 'Sinyal Forex', 'sinyal-forex', '📡', 'text', 2),
  ((SELECT id FROM products WHERE slug = 'forex'), 'Tanya Jawab Forex', 'tanya-jawab-forex', '❓', 'text', 3);

-- Global channels (no product restriction)
INSERT INTO public.forum_channels (product_id, name, slug, icon, channel_type, sort_order) VALUES
  (NULL, 'Lounge', 'lounge', '☕', 'text', 1),
  (NULL, 'Perkenalan', 'perkenalan', '👋', 'text', 2),
  (NULL, 'Affiliate', 'affiliate', '💰', 'text', 3);

-- Update forum thread counts function
CREATE OR REPLACE FUNCTION public.update_thread_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_threads
    SET reply_count = reply_count + 1, last_activity_at = now()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reply_change
  AFTER INSERT OR DELETE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_thread_counts();
