// Inferensi Logistic Regression dan penjelasan faktor. Sama dengan backend/app/risk.py (prototipe FastAPI).
import { MODEL } from "./model.ts";

export const DISCLAIMER =
  "Hasil ini adalah estimasi berbasis data historis, bukan diagnosis medis. Untuk risiko Tinggi, hubungi penyuluh atau dokter hewan.";

export type RiskInput = {
  age_months: number;
  parity: number;
  lactation_stage: "Early" | "Mid" | "Late";
  days_in_milk: number;
  body_condition_score: number;
  milk_yield_l: number;
  previous_week_avg_yield: number;
  vaccine_count: number;
  feed_quantity_kg?: number | null;
  water_intake_l?: number | null;
  housing_score?: number | null;
  season?: string | null;
  management_system?: string | null;
};

export type RiskOutput = {
  risk_level: "Rendah" | "Sedang" | "Tinggi";
  confidence: number;
  prob_sakit: number;
  top_factors: { faktor: string; kontribusi: number }[];
  recommended_actions: string;
  is_estimate: true;
  disclaimer: string;
  model_version: string;
};

// Nilai tipikal (median data latih) untuk isian opsional
const DEFAULTS = { feed_quantity_kg: 12, water_intake_l: 65, housing_score: 0.65, season: "Summer", management_system: "Intensive" };

const LABEL: Record<string, string> = {
  Milk_Yield_L: "produksi susu rendah",
  Previous_Week_Avg_Yield: "rata-rata susu minggu lalu rendah",
  yield_drop_ratio: "produksi susu turun dari minggu lalu",
  vaccine_count: "vaksin belum lengkap",
  Body_Condition_Score: "kondisi tubuh (BCS) kurang baik",
  Age_Months: "umur ternak",
  Parity: "jumlah kelahiran (paritas)",
  Days_in_Milk: "hari laktasi",
  Feed_Quantity_kg: "jumlah pakan",
  Water_Intake_L: "konsumsi air",
  Housing_Score: "kualitas kandang",
};

const ACTION = {
  Tinggi: "Periksa kondisi ternak hari ini dan hubungi penyuluh atau dokter hewan.",
  Sedang: "Pantau ternak 2-3 hari ke depan dan lengkapi vaksinasi yang tertinggal.",
  Rendah: "Lanjutkan pencatatan rutin.",
} as const;

const clip = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function computeRisk(r: RiskInput): RiskOutput {
  const drop = clip((r.previous_week_avg_yield - r.milk_yield_l) / Math.max(r.previous_week_avg_yield, 0.1), -1, 1);
  const numVals: Record<string, number> = {
    Age_Months: r.age_months,
    Parity: r.parity,
    Days_in_Milk: r.days_in_milk,
    Body_Condition_Score: r.body_condition_score,
    Milk_Yield_L: r.milk_yield_l,
    Previous_Week_Avg_Yield: r.previous_week_avg_yield,
    yield_drop_ratio: drop,
    vaccine_count: r.vaccine_count,
    Feed_Quantity_kg: r.feed_quantity_kg ?? DEFAULTS.feed_quantity_kg,
    Water_Intake_L: r.water_intake_l ?? DEFAULTS.water_intake_l,
    Housing_Score: r.housing_score ?? DEFAULTS.housing_score,
  };
  const catVals: Record<string, string> = {
    Lactation_Stage: r.lactation_stage,
    Season: r.season ?? DEFAULTS.season,
    Management_System: r.management_system ?? DEFAULTS.management_system,
  };

  // fitur terurut: numerik (di-scale) lalu one-hot kategorikal, sama dengan ColumnTransformer sklearn
  const names: string[] = [];
  const values: number[] = [];
  for (const f of MODEL.numeric) {
    names.push(f.name);
    values.push((numVals[f.name] - f.mean) / f.scale);
  }
  for (const f of MODEL.categorical) {
    for (const c of f.categories) {
      names.push(`${f.name}_${c}`);
      values.push(catVals[f.name] === c ? 1 : 0);
    }
  }

  const contrib = values.map((v, i) => v * MODEL.coef[i]);
  const z = MODEL.intercept + contrib.reduce((a, b) => a + b, 0);
  const p = 1 / (1 + Math.exp(-z));

  const order = contrib.map((c, i) => [c, i] as const).sort((a, b) => b[0] - a[0]).slice(0, 3);
  let pos = order.filter(([c]) => c > 0);
  if (pos.length === 0) pos = [[Math.abs(order[0][0]), order[0][1]]];
  const total = pos.reduce((a, [c]) => a + c, 0) || 1;
  const top_factors = pos.map(([c, i]) => ({
    faktor: LABEL[names[i]] ?? names[i].replaceAll("_", " "),
    kontribusi: Math.round((c / total) * 100) / 100,
  }));

  const level = p >= MODEL.thresholds.tinggi ? "Tinggi" : p >= MODEL.thresholds.sedang ? "Sedang" : "Rendah";
  return {
    risk_level: level,
    confidence: Math.round(Math.max(p, 1 - p) * 100) / 100,
    prob_sakit: Math.round(p * 1000) / 1000,
    top_factors,
    recommended_actions: ACTION[level],
    is_estimate: true,
    disclaimer: DISCLAIMER,
    model_version: MODEL.version,
  };
}

/** Kembalikan pesan galat bila input tidak valid, atau null bila valid. */
export function validate(r: Record<string, unknown>): string | null {
  const num = (k: string, lo: number, hi: number) => typeof r[k] === "number" && (r[k] as number) >= lo && (r[k] as number) <= hi;
  const opt = (k: string, lo: number, hi: number) => r[k] == null || num(k, lo, hi);
  if (!num("age_months", 0, 400)) return "age_months harus 0 sampai 400";
  if (!num("parity", 0, 15)) return "parity harus 0 sampai 15";
  if (!["Early", "Mid", "Late"].includes(r.lactation_stage as string)) return "lactation_stage harus Early, Mid, atau Late";
  if (!num("days_in_milk", 0, 700)) return "days_in_milk harus 0 sampai 700";
  if (!num("body_condition_score", 1, 5)) return "body_condition_score harus 1 sampai 5";
  if (!num("milk_yield_l", 0, 80)) return "milk_yield_l harus 0 sampai 80";
  if (!num("previous_week_avg_yield", 0, 80)) return "previous_week_avg_yield harus 0 sampai 80";
  if (!num("vaccine_count", 0, 8) || !Number.isInteger(r.vaccine_count)) return "vaccine_count harus bilangan bulat 0 sampai 8";
  if (!opt("feed_quantity_kg", 0, 100) || !opt("water_intake_l", 0, 300) || !opt("housing_score", 0, 1)) return "isian opsional di luar rentang";
  const seasons = MODEL.categorical.find((c) => c.name === "Season")!.categories as readonly string[];
  const systems = MODEL.categorical.find((c) => c.name === "Management_System")!.categories as readonly string[];
  if (r.season != null && !seasons.includes(r.season as string)) return "season tidak dikenal";
  if (r.management_system != null && !systems.includes(r.management_system as string)) return "management_system tidak dikenal";
  return null;
}
