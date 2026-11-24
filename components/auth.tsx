"use client";
import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type Profile } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type AuthState = {
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const Ctx = createContext<AuthState>({ user: null, profile: null, ready: false, updateProfile: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async (u: User | null) => {
      if (!alive) return;
      setUser(u);
      if (u) {
        try {
          setProfile(await api.getProfile(u.id));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      if (alive) setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      // hindari panggilan Supabase langsung di dalam callback (bisa deadlock); tunda satu tick
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return;
      await api.updateProfile(user.id, patch);
      setProfile((p) => (p ? { ...p, ...patch } : p));
    },
    [user]
  );

  const value = useMemo(() => ({ user, profile, ready, updateProfile }), [user, profile, ready, updateProfile]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
