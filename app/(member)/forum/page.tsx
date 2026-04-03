"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRODUCT_NAMES } from "@/lib/constants";
import type { ForumChannel } from "@/lib/types";
import { Hash, Megaphone, MessageSquare, Lock } from "lucide-react";
import Link from "next/link";

const channelTypeIcons: Record<string, typeof Hash> = {
  text: Hash,
  forum: MessageSquare,
  announcement: Megaphone,
};

export default function ForumPage() {
  const { user } = useUser();
  const { activeSubscription } = useSubscription(user?.id);
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("forum_channels")
        .select("*, product:products(*)")
        .eq("is_active", true)
        .order("sort_order");
      setChannels((data ?? []) as ForumChannel[]);
      setLoading(false);
    }
    fetch();
  }, []);

  const hasAccess = (channel: ForumChannel) => {
    if (!channel.product_id) return true; // global channel
    if (!activeSubscription) return false;
    if (new Date(activeSubscription.expires_at) < new Date()) return false;
    if (activeSubscription.product?.slug === "cuantroopers") return true;
    return activeSubscription.product_id === channel.product_id;
  };

  // Group channels by product
  const grouped: Record<string, ForumChannel[]> = {};
  channels.forEach((ch) => {
    const key = ch.product_id
      ? PRODUCT_NAMES[ch.product?.slug ?? ""] ?? "Other"
      : "General";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ch);
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Forum</h1>
        <p className="text-sm text-[#8B949E] mt-1">
          Diskusi, sharing, dan belajar bareng sesama member.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([group, chs]) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#8B949E]">
                {group}
              </h2>
              {group !== "General" && (
                <Badge variant="gray" className="text-[10px]">{group}</Badge>
              )}
            </div>
            <div className="space-y-1">
              {chs.map((channel) => {
                const canAccess = hasAccess(channel);
                const Icon = channelTypeIcons[channel.channel_type] || Hash;

                if (!canAccess) {
                  return (
                    <div
                      key={channel.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#8B949E]/50 cursor-not-allowed"
                    >
                      <Lock size={16} />
                      <span className="text-sm">{channel.icon} {channel.name}</span>
                      <Badge variant="gray" className="ml-auto text-[10px]">Upgrade</Badge>
                    </div>
                  );
                }

                return (
                  <Link key={channel.id} href={`/forum/${channel.slug}`}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#131318] transition-colors group cursor-pointer">
                      <Icon size={16} className="text-[#8B949E] group-hover:text-[#96FC03] transition-colors flex-shrink-0" />
                      <span className="text-sm font-medium text-[#F0F0F5] flex items-center gap-2">
                        <span>{channel.icon}</span>
                        {channel.name}
                      </span>
                      {channel.description && (
                        <span className="text-xs text-[#8B949E] hidden sm:inline ml-2 truncate">
                          {channel.description}
                        </span>
                      )}
                      {channel.channel_type === "announcement" && (
                        <Badge variant="amber" className="ml-auto text-[10px]">Announcement</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
