-- Add Discord channel mapping to forum channels
ALTER TABLE public.forum_channels ADD COLUMN IF NOT EXISTS discord_channel_id TEXT;
ALTER TABLE public.forum_channels ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;
