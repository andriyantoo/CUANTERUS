"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelative, getInitials } from "@/lib/utils";
import type { ForumChannel, ForumThread } from "@/lib/types";
import { MessageSquare, Pin, CheckCircle, ChevronUp, ArrowLeft, Plus, Lock } from "lucide-react";
import Link from "next/link";

export default function ChannelPage() {
  const { channelSlug } = useParams<{ channelSlug: string }>();
  const { user, profile } = useUser();
  const [channel, setChannel] = useState<ForumChannel | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();

      const { data: ch } = await supabase
        .from("forum_channels")
        .select("*, product:products(*)")
        .eq("slug", channelSlug)
        .single();
      setChannel(ch as ForumChannel | null);

      if (ch) {
        const { data: threads } = await supabase
          .from("forum_threads")
          .select("*, author:profiles(id, full_name, role, avatar_url)")
          .eq("channel_id", ch.id)
          .order("is_pinned", { ascending: false })
          .order("last_activity_at", { ascending: false });
        setThreads((threads ?? []) as ForumThread[]);
      }

      setLoading(false);
    }
    fetch();
  }, [channelSlug]);

  const isAnnouncement = channel?.channel_type === "announcement";
  const canPost = !isAnnouncement || profile?.role === "admin";

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-4xl">
        <p className="text-[#8B949E]">Channel tidak ditemukan.</p>
        <Link href="/forum">
          <Button variant="secondary" size="sm" className="mt-4">
            <ArrowLeft size={14} className="mr-1.5" /> Kembali
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/forum">
            <button className="text-[#8B949E] hover:text-[#F0F0F5]">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {channel.icon} {channel.name}
            </h1>
            {channel.description && (
              <p className="text-xs text-[#8B949E]">{channel.description}</p>
            )}
          </div>
        </div>
        {canPost && (
          <Link href={`/forum/${channelSlug}/new`}>
            <Button size="sm">
              <Plus size={14} className="mr-1.5" /> Buat Post
            </Button>
          </Link>
        )}
      </div>

      {/* Threads */}
      {threads.length === 0 ? (
        <Card className="text-center py-12">
          <MessageSquare size={40} className="mx-auto text-[#222229] mb-3" />
          <p className="text-[#8B949E]">Belum ada post di channel ini.</p>
          {canPost && (
            <Link href={`/forum/${channelSlug}/new`}>
              <Button size="sm" className="mt-4">Jadi yang Pertama</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link key={thread.id} href={`/forum/${channelSlug}/${thread.id}`}>
              <div className="flex items-start gap-3 px-4 py-4 rounded-xl hover:bg-[#131318] border border-transparent hover:border-[#222229] transition-all cursor-pointer group">
                {/* Author avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: thread.author?.role === "admin" ? "#96FC03" + "20" : "#222229",
                    color: thread.author?.role === "admin" ? "#96FC03" : "#8B949E",
                  }}
                >
                  {getInitials(thread.author?.full_name ?? null)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {thread.is_pinned && (
                      <Pin size={12} className="text-[#96FC03]" />
                    )}
                    <h3 className="font-semibold text-sm text-[#F0F0F5] group-hover:text-[#96FC03] transition-colors truncate">
                      {thread.title}
                    </h3>
                    {thread.is_solved && (
                      <Badge variant="lime" className="text-[10px]">Terjawab</Badge>
                    )}
                    {thread.is_locked && (
                      <Lock size={12} className="text-[#8B949E]" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8B949E]">
                    <span className="flex items-center gap-1">
                      {thread.author?.full_name || "Member"}
                      {thread.author?.role === "admin" && (
                        <Badge variant="amber" className="text-[8px] py-0 px-1">Mentor</Badge>
                      )}
                    </span>
                    <span>{formatRelative(thread.last_activity_at)}</span>
                    {thread.tags?.length > 0 && thread.tags.map((tag) => (
                      <span key={tag} className="text-[#96FC03]/60">#{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 text-xs text-[#8B949E]">
                  <div className="flex items-center gap-1" title="Upvotes">
                    <ChevronUp size={14} />
                    {thread.upvote_count}
                  </div>
                  <div className="flex items-center gap-1" title="Replies">
                    <MessageSquare size={14} />
                    {thread.reply_count}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
