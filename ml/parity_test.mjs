// Uji kesamaan: probabilitas TypeScript (Edge Function) harus sama dengan Python (sklearn).
// Jalankan setelah export_model.py:  node ml/parity_test.mjs   (Node 22.6+)
import { readFileSync } from "node:fs";
import { computeRisk } from "../supabase/functions/risk-score/risk.ts";

const cases = JSON.parse(readFileSync(new URL("./parity_cases.json", import.meta.url), "utf8"));
let worst = 0;
for (const { input: i, prob } of cases) {
  const out = computeRisk({
    age_months: i.Age_Months, parity: i.Parity, lactation_stage: i.Lactation_Stage, days_in_milk: i.Days_in_Milk,
    body_condition_score: i.Body_Condition_Score, milk_yield_l: i.Milk_Yield_L, previous_week_avg_yield: i.Previous_Week_Avg_Yield,
    vaccine_count: i.vaccine_count, feed_quantity_kg: i.Feed_Quantity_kg, water_intake_l: i.Water_Intake_L,
    housing_score: i.Housing_Score, season: i.Season, management_system: i.Management_System,
  });
  worst = Math.max(worst, Math.abs(out.prob_sakit - prob));
}
console.log(`kasus: ${cases.length}, selisih terbesar prob_sakit: ${worst.toFixed(6)}`);
if (worst > 0.0006) {
  console.error("GAGAL: implementasi TypeScript berbeda dari Python");
  process.exit(1);
}
console.log("LOLOS");
