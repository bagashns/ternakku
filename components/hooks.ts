"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { api } from "@/lib/api";
import type { HealthInput, Livestock, Mating, StoredRisk } from "@/lib/types";

export type Session = { name: string; email: string } | null;
export type Consent = { answered: boolean; ai: boolean };

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Terjadi kesalahan.";
}

export function useLivestock() {
  const { user } = useAuth();
  const [list, setList] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setList(await api.listLivestock());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  return { list, loading, error, reload };
}

/** [sesi, setSesi, siap]. setSesi(null) = keluar. */
export function useSession() {
  const { user, profile, ready } = useAuth();
  const session: Session = user ? { name: profile?.display_name || user.email?.split("@")[0] || "Peternak", email: user.email ?? "" } : null;
  const set = useCallback((s: Session) => {
    if (s === null) void api.signOut();
  }, []);
  return [session, set, ready] as const;
}

/** [consent, setConsent, siap]; disimpan di tabel profiles. */
export function useConsent() {
  const { profile, ready, updateProfile } = useAuth();
  const consent: Consent = { answered: profile?.consent_answered ?? false, ai: profile?.ai_enabled ?? true };
  const set = useCallback((c: Consent) => updateProfile({ consent_answered: c.answered, ai_enabled: c.ai }), [updateProfile]);
  return [consent, set, ready] as const;
}

function useRemote<T>(load: () => Promise<T>, initial: T) {
  const { user } = useAuth();
  const [data, setData] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const reload = useCallback(async () => {
    try {
      setData(await load());
    } catch {
      /* biarkan data lama; halaman lain menampilkan galat */
    } finally {
      setReady(true);
    }
  }, [load]);
  useEffect(() => {
    if (user) void reload();
  }, [user, reload]);
  return [data, reload, ready] as const;
}

const loadHealth = () => api.latestHealth();
const loadRisk = () => api.latestRisk();
const loadMatings = () => api.listMatings();
const loadFeedback = () => api.listFeedback();
const EMPTY_H: Record<string, HealthInput> = {};
const EMPTY_R: Record<string, StoredRisk> = {};
const EMPTY_M: Mating[] = [];
const EMPTY_F: Record<string, string> = {};

/** [catatan terbaru per ternak, muat ulang, siap] */
export const useHealth = () => useRemote(loadHealth, EMPTY_H);
/** [skor terbaru per ternak, muat ulang, siap] */
export const useRisk = () => useRemote(loadRisk, EMPTY_R);
export const useMatings = () => useRemote(loadMatings, EMPTY_M);
export const useFeedback = () => useRemote(loadFeedback, EMPTY_F);

/** Arahkan ke /login atau /onboarding bila belum siap. Mengembalikan true bila halaman boleh tampil. */
export function useGuard() {
  const router = useRouter();
  const [session, , sReady] = useSession();
  const [consent] = useConsent();
  const { profile } = useAuth();
  const ready = sReady && (!session || profile !== null);
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
    else if (!consent.answered) router.replace("/onboarding");
  }, [ready, session, consent, router]);
  return ready && !!session && consent.answered;
}
