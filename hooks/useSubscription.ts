"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Subscription } from "@/lib/types";

export function useSubscription(userId: string | undefined) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchSubscriptions() {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, plan:plans(*, product:products(*)), product:products(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const subs = (data ?? []) as Subscription[];
      setSubscriptions(subs);

      const active = subs.find(
        (s) => s.status === "active" && new Date(s.expires_at) > new Date()
      );
      setActiveSubscription(active ?? null);
      setLoading(false);
    }

    fetchSubscriptions();
  }, [userId]);

  return { subscriptions, activeSubscription, loading };
}
