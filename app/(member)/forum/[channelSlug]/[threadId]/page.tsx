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
import type { ForumThread, ForumReply, ForumReaction } from "@/lib/types";
import {
  ArrowLeft, ChevronUp, Pin, CheckCircle, Lock,
  Flame, Eye, ThumbsUp, Send,
} from "lucide-react";
import Link from "next/link";

const reactionIcons: Record<string, typeof ThumbsUp> = {
  upvote: ChevronUp,
  helpful: ThumbsUp,
  fire: Flame,
  eyes: Eye,
};

const reactionEmojis: Record<string, string> = {
  upvote: "👍",
  helpful: "💡",
  fire: "🔥",
  eyes: "👀",
};

export default function ThreadPage() {
  const { channelSlug, threadId } = useParams<{ channelSlug: string; threadId: string }>();
  const { user, profile } = useUser();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [reactions, setReactions] = useState<ForumReaction[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  async function fetchThread() {
    const { data: t } = await supabase
      .from("forum_threads")
      .select("*, author:profiles(id, full_name, role, avatar_url), channel:forum_channels(slug, name, icon)")
      .eq("id", threadId)
      .single();
    setThread(t as ForumThread | null);

    const { data: r } = await supabase
      .from("forum_replies")
      .select("*, author:profiles(id, full_name, role, avatar_url)")
      .eq("thread_id", threadId)
      .order("created_at");
    setReplies((r ?? []) as ForumReply[]);

    if (user) {
      const { data: rx } = await supabase
        .from("forum_reactions")
        .select("*")
        .eq("user_id", user.id);
      setReactions((rx ?? []) as ForumReaction[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchThread();
  }, [threadId, user?.id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !replyBody.trim() || thread?.is_locked) return;

    setSubmitting(true);
    await supabase.from("forum_replies").insert({
      thread_id: threadId,
      author_id: user.id,
      body: replyBody,
    });
    setReplyBody("");
    setSubmitting(false);
    fetchThread();
  }

  async function toggleReaction(targetId: string, type: "thread" | "reply", reactionType: string) {
    if (!user) return;

    const existing = reactions.find(
      (r) =>
        r.reaction_type === reactionType &&
        (type === "thread" ? r.thread_id === targetId : r.reply_id === targetId)
    );

    if (existing) {
      await supabase.from("forum_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("forum_reactions").insert({
        user_id: user.id,
        thread_id: type === "thread" ? targetId : null,
        reply_id: type === "reply" ? targetId : null,
        reaction_type: reactionType,
      });
    }

    // Update upvote count
    if (reactionType === "upvote") {
      const delta = existing ? -1 : 1;
      if (type === "thread") {
        await supabase.from("forum_threads").update({ upvote_count: (thread?.upvote_count ?? 0) + delta }).eq("id", targetId);
      } else {
        const reply = replies.find((r) => r.id === targetId);
        if (reply) {
          await supabase.from("forum_replies").update({ upvote_count: reply.upvote_count + delta }).eq("id", targetId);
        }
      }
    }

    fetchThread();
  }

  async function toggleSolved() {
    if (!thread || profile?.role !== "admin") return;
    await supabase.from("forum_threads").update({ is_solved: !thread.is_solved }).eq("id", thread.id);
    fetchThread();
  }

  async function togglePin() {
    if (!thread || profile?.role !== "admin") return;
    await supabase.from("forum_threads").update({ is_pinned: !thread.is_pinned }).eq("id", thread.id);
    fetchThread();
  }

  function hasReacted(targetId: string, type: "thread" | "reply", reactionType: string) {
    return reactions.some(
      (r) =>
        r.reaction_type === reactionType &&
        (type === "thread" ? r.thread_id === targetId : r.reply_id === targetId)
    );
  }

  function renderAuthor(author: ForumThread["author"] | ForumReply["author"]) {
    const isAdmin = author?.role === "admin";
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: isAdmin ? "#96FC03" + "20" : "#222229",
            color: isAdmin ? "#96FC03" : "#8B949E",
          }}
        >
          {getInitials(author?.full_name ?? null)}
        </div>
        <div>
          <span className="text-sm font-medium text-[#F0F0F5] flex items-center gap-1.5">
            {author?.full_name || "Member"}
            {isAdmin && <Badge variant="amber" className="text-[8px] py-0 px-1">Mentor</Badge>}
          </span>
        </div>
      </div>
    );
  }

  function renderReactions(targetId: string, type: "thread" | "reply") {
    return (
      <div className="flex items-center gap-1 mt-3">
        {(["upvote", "helpful", "fire", "eyes"] as const).map((rt) => {
          const active = hasReacted(targetId, type, rt);
          return (
            <button
              key={rt}
              onClick={() => toggleReaction(targetId, type, rt)}
              className={`flex items-center gap-1 text-sm px-3 py-2 min-h-[44px] rounded-lg transition-colors ${
                active
                  ? "bg-[#96FC03]/10 text-[#96FC03]"
                  : "text-[#8B949E] hover:bg-[#222229] hover:text-[#F0F0F5]"
              }`}
            >
              {reactionEmojis[rt]}
            </button>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-4xl">
        <p className="text-[#8B949E]">Thread tidak ditemukan.</p>
        <Link href={`/forum/${channelSlug}`}>
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
      <div className="flex items-center gap-3">
        <Link href={`/forum/${channelSlug}`}>
          <button className="text-[#8B949E] hover:text-[#F0F0F5]">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <span className="text-sm text-[#8B949E]">
          {thread.channel?.icon} {thread.channel?.name}
        </span>
      </div>

      {/* Thread */}
      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {thread.is_pinned && <Pin size={14} className="text-[#96FC03]" />}
              <h1 className="text-xl font-bold text-[#F0F0F5]">{thread.title}</h1>
              {thread.is_solved && <Badge variant="lime">Terjawab</Badge>}
              {thread.is_locked && <Badge variant="gray"><Lock size={10} className="mr-1" />Locked</Badge>}
            </div>
            {renderAuthor(thread.author)}
            <p className="text-xs text-[#8B949E] mt-1">
              {formatRelative(thread.created_at)}
            </p>
          </div>

          {/* Admin actions */}
          {profile?.role === "admin" && (
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={togglePin}>
                <Pin size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={toggleSolved}>
                <CheckCircle size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        {thread.tags?.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {thread.tags.map((tag) => (
              <span key={tag} className="text-xs text-[#96FC03]/70 bg-[#96FC03]/5 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="text-sm text-[#F0F0F5]/90 leading-relaxed whitespace-pre-wrap">
          {thread.body}
        </div>

        {renderReactions(thread.id, "thread")}
      </Card>

      {/* Replies */}
      <div>
        <h2 className="text-sm font-semibold text-[#8B949E] mb-3">
          {thread.reply_count} Balasan
        </h2>

        <div className="space-y-3">
          {replies.map((reply) => (
            <Card key={reply.id} className={reply.is_best_answer ? "border-[#96FC03]/30 bg-[#96FC03]/5" : ""}>
              <div className="flex items-start justify-between mb-2">
                {renderAuthor(reply.author)}
                <div className="flex items-center gap-2">
                  {reply.is_best_answer && (
                    <Badge variant="lime" className="text-[10px]">Best Answer</Badge>
                  )}
                  <span className="text-xs text-[#8B949E]">
                    {formatRelative(reply.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-[#F0F0F5]/90 leading-relaxed whitespace-pre-wrap ml-0 sm:ml-10">
                {reply.body}
              </div>
              <div className="ml-0 sm:ml-10">
                {renderReactions(reply.id, "reply")}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {!thread.is_locked ? (
        <Card>
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Tulis balasan..."
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0F] border border-[#222229] text-[#F0F0F5] text-sm placeholder:text-[#8B949E]/60 focus:outline-none focus:ring-2 focus:ring-[#96FC03]/30 resize-y"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={submitting}>
                <Send size={14} className="mr-1.5" /> Kirim
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="text-center py-6">
          <Lock size={20} className="mx-auto text-[#8B949E] mb-2" />
          <p className="text-sm text-[#8B949E]">Thread ini sudah dikunci.</p>
        </Card>
      )}
    </div>
  );
}
