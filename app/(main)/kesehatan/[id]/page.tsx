"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Field, RiskBadge, TopBar } from "@/components/ui";
import { useConsent, useHealth, useRisk } from "@/components/hooks";
import { api } from "@/lib/api";
import type { HealthInput, LactationStage } from "@/lib/types";

const DEFAULT: Record<keyof HealthInput, string> = {
  age_months: "",
  parity: "1",
  lactation_stage: "Mid",
  days_in_milk: "",
  body_condition_score: "3",
  milk_yield_l: "",
  previous_week_avg_yield: "",
  vaccine_count: "0",
};

export default function KesehatanForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [consent] = useConsent();
  const [health, , hReady] = useHealth();
  const [risk, reloadRisk] = useRisk();
  const [form, setForm] = useState<Record<keyof HealthInput, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // isi awal dari catatan terakhir (sekali, setelah data lokal terbaca)
  if (hReady && form === null) {
    const h = health[id];
    setForm(h ? (Object.fromEntries(Object.entries(h).map(([k, v]) => [k, String(v)])) as Record<keyof HealthInput, string>) : DEFAULT);
  }
  if (!form) return null;

  const set = (k: keyof HealthInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const r = risk[id];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    const h: HealthInput = {
      age_months: Number(form.age_months),
      parity: Number(form.parity),
      lactation_stage: form.lactation_stage as LactationStage,
      days_in_milk: Number(form.days_in_milk),
      body_condition_score: Number(form.body_condition_score),
      milk_yield_l: Number(form.milk_yield_l),
      previous_week_avg_yield: Number(form.previous_week_avg_yield),
      vaccine_count: Number(form.vaccine_count),
    };
    setBusy(true);
    try {
      await api.saveHealth(id, h);
      if (!consent.ai) {
        router.replace(`/ternak/${id}`);
        return;
      }
      await api.riskScore(id, h);
      await reloadRisk();
      router.push(`/kesehatan/${id}/faktor`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghitung risiko.");
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title={`Kesehatan ${id}`} back="/kesehatan" />
      <form className="content" onSubmit={submit}>
        {r && (
          <Link href={`/kesehatan/${id}/faktor`} className="card link">
            <div className="row between">
              <span className="muted">Skor terakhir</span>
              <RiskBadge level={r.risk_level} />
            </div>
            <span className="small muted">Lihat faktor dan tindakan →</span>
          </Link>
        )}

        <Field label="Umur ternak (bulan)">
          <input type="number" inputMode="decimal" min={0} max={400} step="any" value={form.age_months} onChange={set("age_months")} required />
        </Field>
        <div className="grid2">
          <Field label="Susu hari ini (liter)">
            <input type="number" inputMode="decimal" min={0} max={80} step="any" value={form.milk_yield_l} onChange={set("milk_yield_l")} required />
          </Field>
          <Field label="Rata-rata susu minggu lalu (liter)">
            <input type="number" inputMode="decimal" min={0} max={80} step="any" value={form.previous_week_avg_yield} onChange={set("previous_week_avg_yield")} required />
          </Field>
        </div>
        <Field label="Vaksin yang sudah lengkap" hint="Dari 8 jenis vaksin (0 sampai 8)">
          <input type="number" inputMode="numeric" min={0} max={8} step={1} value={form.vaccine_count} onChange={set("vaccine_count")} required />
        </Field>
        <Field label="Kondisi tubuh (1 kurus sekali, 5 gemuk sekali)">
          <select value={form.body_condition_score} onChange={set("body_condition_score")}>
            {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid2">
          <Field label="Fase menyusui">
            <select value={form.lactation_stage} onChange={set("lactation_stage")}>
              <option value="Early">Awal</option>
              <option value="Mid">Tengah</option>
              <option value="Late">Akhir</option>
            </select>
          </Field>
          <Field label="Hari sejak melahirkan">
            <input type="number" inputMode="numeric" min={0} max={700} value={form.days_in_milk} onChange={set("days_in_milk")} required />
          </Field>
        </div>
        <Field label="Jumlah kelahiran sebelumnya">
          <input type="number" inputMode="numeric" min={0} max={15} value={form.parity} onChange={set("parity")} required />
        </Field>

        {error && (
          <div className="alert danger" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Menghitung..." : consent.ai ? "Hitung risiko" : "Simpan catatan"}
        </button>
      </form>
    </>
  );
}
