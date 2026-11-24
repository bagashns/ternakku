import { supabase } from "./supabase";
import type { HealthInput, InbreedingResult, Livestock, Mating, RiskResult, StoredRisk } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

type PgErr = { message: string; code?: string } | null;

function fail(e: NonNullable<PgErr>): never {
  if (e.code === "23505") throw new ApiError("Nomor tag itu sudah terdaftar.", 409);
  if (e.code === "23503") throw new ApiError("Pejantan atau induk belum terdaftar. Daftarkan lebih dulu.", 422);
  if (e.code === "23514") throw new ApiError("Data belum benar. Periksa isian lalu coba lagi.", 422);
  if (/fetch|network/i.test(e.message)) throw new ApiError("Tidak bisa terhubung ke server. Periksa sinyal internet lalu coba lagi.");
  throw new ApiError("Terjadi kesalahan. Coba lagi sebentar lagi.");
}

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const b = await ctx.json();
        if (typeof b.detail === "string") throw new ApiError(b.detail, ctx.status);
      } catch (e) {
        if (e instanceof ApiError) throw e;
      }
    }
    throw new ApiError("Tidak bisa terhubung ke server. Periksa sinyal internet lalu coba lagi.");
  }
  return data as T;
}

const LIVESTOCK_COLS = "id, name, species, sex, sire_id, dam_id";
const HEALTH_COLS = "livestock_id, age_months, parity, lactation_stage, days_in_milk, body_condition_score, milk_yield_l, previous_week_avg_yield, vaccine_count";

export type Profile = { display_name: string | null; consent_answered: boolean; ai_enabled: boolean; vet_phone: string | null };

export const api = {
  // ---------- auth ----------
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
    if (error) throw new ApiError(error.message, error.status ?? 0);
    return data;
  },
  async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(error.message === "Invalid login credentials" ? "Email atau kata sandi salah." : error.message, error.status ?? 0);
  },
  async signOut() {
    await supabase.auth.signOut();
  },

  // ---------- profil ----------
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("display_name, consent_answered, ai_enabled, vet_phone").eq("id", userId).maybeSingle();
    if (error) fail(error);
    return data as Profile | null;
  },
  async updateProfile(userId: string, patch: Partial<Profile>) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) fail(error);
  },

  // ---------- ternak ----------
  async listLivestock(): Promise<Livestock[]> {
    const { data, error } = await supabase.from("livestock").select(LIVESTOCK_COLS).order("id");
    if (error) fail(error);
    return (data ?? []) as Livestock[];
  },
  async createLivestock(body: Partial<Livestock> & { id: string }): Promise<Livestock> {
    const { data, error } = await supabase.from("livestock").insert(body).select(LIVESTOCK_COLS).single();
    if (error) fail(error);
    return data as Livestock;
  },

  // ---------- kesehatan dan risiko ----------
  async latestHealth(): Promise<Record<string, HealthInput>> {
    const { data, error } = await supabase.from("health_records").select(HEALTH_COLS).order("recorded_at", { ascending: false }).limit(1000);
    if (error) fail(error);
    const out: Record<string, HealthInput> = {};
    for (const r of data ?? []) {
      if (out[r.livestock_id]) continue;
      const { livestock_id: _id, ...h } = r;
      out[_id] = h as unknown as HealthInput;
    }
    return out;
  },
  async saveHealth(id: string, h: HealthInput) {
    const { error } = await supabase.from("health_records").insert({ livestock_id: id, ...h });
    if (error) fail(error);
  },
  async latestRisk(): Promise<Record<string, StoredRisk>> {
    const { data, error } = await supabase
      .from("risk_results")
      .select("livestock_id, risk_level, confidence, prob_sakit, top_factors, recommended_actions, disclaimer, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) fail(error);
    const out: Record<string, StoredRisk> = {};
    for (const r of data ?? []) {
      if (out[r.livestock_id]) continue;
      out[r.livestock_id] = { ...r, at: r.created_at, is_estimate: true } as unknown as StoredRisk;
    }
    return out;
  },
  /** Hitung skor lewat Edge Function, lalu simpan hasilnya. */
  async riskScore(livestockId: string, h: HealthInput): Promise<StoredRisk> {
    const res = await callFunction<RiskResult & { model_version: string }>("risk-score", h);
    const { data, error } = await supabase
      .from("risk_results")
      .insert({
        livestock_id: livestockId,
        risk_level: res.risk_level,
        confidence: res.confidence,
        prob_sakit: res.prob_sakit,
        top_factors: res.top_factors,
        recommended_actions: res.recommended_actions,
        disclaimer: res.disclaimer,
        model_version: res.model_version,
      })
      .select("created_at")
      .single();
    if (error) fail(error);
    return { ...res, livestock_id: livestockId, at: data.created_at };
  },
  async inbreedingCheck(sire_id: string, dam_id: string): Promise<InbreedingResult> {
    return callFunction<InbreedingResult>("inbreeding-check", { sire_id, dam_id });
  },

  // ---------- perkawinan ----------
  async listMatings(): Promise<Mating[]> {
    const { data, error } = await supabase
      .from("matings")
      .select("id, sire_id, dam_id, mating_date, related, relation, note")
      .order("mating_date", { ascending: false });
    if (error) fail(error);
    return (data ?? []).map((m) => ({ id: m.id, sire_id: m.sire_id, dam_id: m.dam_id, date: m.mating_date, related: m.related, relation: m.relation, note: m.note }));
  },
  async addMating(m: { sire_id: string; dam_id: string; date: string; related: boolean; relation: string; kinship: number; note: string }) {
    const { error } = await supabase.from("matings").insert({
      sire_id: m.sire_id, dam_id: m.dam_id, mating_date: m.date, related: m.related, relation: m.relation, kinship: m.kinship, note: m.note,
    });
    if (error) fail(error);
  },

  // ---------- umpan balik ----------
  async listFeedback(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from("risk_feedback").select("livestock_id, created_at");
    if (error) fail(error);
    return Object.fromEntries((data ?? []).map((r) => [r.livestock_id, r.created_at]));
  },
  async addFeedback(livestockId: string) {
    const { error } = await supabase.from("risk_feedback").insert({ livestock_id: livestockId });
    if (error) fail(error);
  },

  // ---------- privasi ----------
  /** Hapus semua ternak milik pengguna; catatan kesehatan, skor, perkawinan, dan laporan ikut terhapus (cascade). */
  async deleteMyData() {
    const { error } = await supabase.from("livestock").delete().neq("id", "");
    if (error) fail(error);
  },
};
