"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Subscription } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

// Module-level cache — shared across all components, survives route changes
let cache = {
  user: null as User | null,
  profile: null as Profile | null,
  subscription: null as Subscription | null,
  timestamp: 0,
};
const CACHE_TTL = 60000; // 60 seconds

function isCacheFresh() {
  return cache.user && Date.now() - cache.timestamp < CACHE_TTL;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(cache.user);
  const [profile, setProfile] = useState<Profile | null>(cache.profile);
  const [subscription, setSubscription] = useState<Subscription | null>(cache.subscription);
  const [loading, setLoading] = useState(!isCacheFresh());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    if (isCacheFresh()) {
      setUser(cache.user);
      setProfile(cache.profile);
      setSubscription(cache.subscription);
      setLoading(false);
      return;
    }

    async function fetchAll() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          cache = { user: null, profile: null, subscription: null, timestamp: Date.now() };
          setUser(null);
          setProfile(null);
          setSubscription(null);
          setLoading(false);
          return;
        }

        // Fetch profile + active subscription in parallel
        const [profileRes, subRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single(),
          supabase
            .from("subscriptions")
            .select("*, plan:plans(*, product:products(*)), product:products(*)")
            .eq("user_id", session.user.id)
            .eq("status", "active")
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        cache = {
          user: session.user,
          profile: profileRes.data,
          subscription: subRes.data,
          timestamp: Date.now(),
        };

        setUser(session.user);
        setProfile(profileRes.data);
        setSubscription(subRes.data);
      } catch (err) {
        console.error("useUser error:", err);
      }
      setLoading(false);
    }

    fetchAll();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          cache = { user: null, profile: null, subscription: null, timestamp: Date.now() };
          setUser(null);
          setProfile(null);
          setSubscription(null);
          return;
        }
        // Invalidate cache on auth change
        cache.timestamp = 0;
        initialized.current = false;
      }
    );

    return () => authSub.unsubscribe();
  }, []);

  return { user, profile, subscription, loading };
}

// Force refresh (e.g. after profile save)
export function invalidateUserCache() {
  cache.timestamp = 0;
}
