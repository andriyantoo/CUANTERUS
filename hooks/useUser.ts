"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

// Cache to avoid refetching on every route change
let cachedUser: User | null = null;
let cachedProfile: Profile | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

export function useUser() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedUser || Date.now() - cacheTimestamp > CACHE_TTL);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    // If cache is fresh, skip fetch
    if (cachedUser && Date.now() - cacheTimestamp < CACHE_TTL) {
      setUser(cachedUser);
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    async function getUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          cachedUser = null;
          cachedProfile = null;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        cachedUser = session.user;
        setUser(session.user);

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        cachedProfile = data;
        cacheTimestamp = Date.now();
        setProfile(data);
      } catch (err) {
        console.error("useUser error:", err);
      }
      setLoading(false);
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        cachedUser = session?.user ?? null;
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          cachedProfile = data;
          cacheTimestamp = Date.now();
          setProfile(data);
        } else {
          cachedProfile = null;
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}
