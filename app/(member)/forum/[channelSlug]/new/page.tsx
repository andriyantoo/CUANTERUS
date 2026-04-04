"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import type { ForumChannel } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewThreadPage() {
  const { channelSlug } = useParams<{ channelSlug: string }>();
  const router = useRouter();
  const { user, profile } = useUser();
  const [channel, setChannel] = useState<ForumChannel | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("forum_channels")
        .select("*")
        .eq("slug", channelSlug)
        .single();
      setChannel(data as ForumChannel | null);
    }
    fetch();
  }, [channelSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !channel) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const tagArray = tags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter(Boolean);

    const { data, error: insertError } = await supabase
      .from("forum_threads")
      .insert({
        channel_id: channel.id,
        author_id: user.id,
        title,
        body,
        tags: tagArray,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Sync to Discord if admin
    if (profile?.role === "admin" && channel) {
      fetch("/api/discord/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "thread",
          channel_id: channel.id,
          title,
          body,
          thread_url: `/forum/${channelSlug}/${data.id}`,
        }),
      }).catch(() => {}); // fire and forget
    }

    router.push(`/forum/${channelSlug}/${data.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/forum/${channelSlug}`}>
          <button className="text-[#8B949E] hover:text-[#F0F0F5]">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <h1 className="text-xl font-bold">
          Buat Post Baru
          {channel && (
            <span className="text-[#8B949E] font-normal text-base ml-2">
              di {channel.icon} {channel.name}
            </span>
          )}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="title"
            label="Judul"
            placeholder="Judul post kamu..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#F0F0F5]">
              Isi Post
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis isi post kamu di sini... (supports markdown)"
              required
              rows={10}
              className="w-full px-4 py-3 rounded-xl bg-[#131318] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 focus:border-[#96FC03]/50 resize-y"
            />
          </div>

          <Input
            id="tags"
            label="Tags (opsional, pisahkan dengan koma)"
            placeholder="setup, btc, analisa"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" loading={loading}>
              Posting
            </Button>
            <Link href={`/forum/${channelSlug}`}>
              <Button type="button" variant="ghost">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
