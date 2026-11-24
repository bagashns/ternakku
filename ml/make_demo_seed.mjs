// Membuat data demo (kawanan ±40 ekor, 3 generasi) sebagai SQL: supabase/seed/demo_herd.sql
// Skor risiko dihitung dengan model yang sama dengan Edge Function; kekerabatan dengan aturan yang sama.
// Jalankan: node ml/make_demo_seed.mjs   (Node 22.6+). Data sintetis, bukan data peternak sungguhan.
import { mkdirSync, writeFileSync } from "node:fs";
import { computeRisk } from "../supabase/functions/risk-score/risk.ts";
import { inbreedingCheck } from "../supabase/functions/inbreeding-check/pedigree.ts";

// pembangkit acak deterministik supaya hasil selalu sama
let seed = 20261124;
const rnd = () => ((seed = (seed + 0x6d2b79f5) | 0), (((t) => ((t ^ (t >>> 14)) >>> 0) / 4294967296)(Math.imul(seed ^ (seed >>> 15), 1 | seed))));
const U = (a, b) => a + (b - a) * rnd();
const I = (a, b) => Math.floor(U(a, b + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const r1 = (x) => Math.round(x * 10) / 10;
const q = (s) => "'" + String(s).replaceAll("'", "''") + "'";

const tag = (n) => "SPI-" + String(n).padStart(3, "0");
const M_NAMES = ["Banteng", "Jaka", "Bima", "Gatot", "Arjuna", "Bagas", "Raden", "Kumbo", "Joko", "Sapto", "Wira", "Dharma", "Pandu"];
const F_NAMES = ["Sri", "Wati", "Bunga", "Melati", "Dewi", "Lestari", "Mawar", "Kenanga", "Sari", "Ayu", "Rina", "Tutik", "Mirah", "Cempaka", "Laras", "Ningsih", "Sekar", "Pertiwi", "Kemuning", "Anggrek", "Dahlia", "Flamboyan", "Seruni", "Teratai", "Wulan"];
const usedM = [], usedF = [];
const nameOf = (sex) => { const pool = sex === "J" ? M_NAMES : F_NAMES, used = sex === "J" ? usedM : usedF; const n = pool[used.length % pool.length] + (used.length >= pool.length ? " " + (Math.floor(used.length / pool.length) + 1) : ""); used.push(n); return n; };

// ---------- silsilah ----------
const herd = []; // {id,name,sex,sire,dam,age}
let n = 1;
const add = (sex, sire, dam, age) => { const a = { id: tag(n++), name: nameOf(sex), sex, sire, dam, age }; herd.push(a); return a; };
const g1m = Array.from({ length: 4 }, () => add("J", null, null, I(100, 140)));
const g1f = Array.from({ length: 8 }, () => add("B", null, null, I(96, 140)));
const g2 = [];
for (let i = 0; i < 16; i++) g2.push(add(rnd() < 0.4 ? "J" : "B", pick(g1m).id, pick(g1f).id, I(50, 90)));
const g2m = g2.filter((a) => a.sex === "J"), g2f = g2.filter((a) => a.sex === "B");
const g3 = [];
// dua anak dari pasangan setengah saudara (satu pejantan sama) agar demo alert punya contoh nyata
const sibSire = g1m[0];
const halfA = g2m.find((a) => a.sire === sibSire.id) ?? g2m[0];
const halfB = g2f.find((a) => a.sire === sibSire.id && a.dam !== halfA.dam) ?? g2f[0];
g3.push(add("B", halfA.id, halfB.id, I(24, 30)));
for (let i = 0; i < 11; i++) g3.push(add(rnd() < 0.4 ? "J" : "B", pick(g2m).id, pick(g2f).id, I(24, 40)));

const ped = Object.fromEntries(herd.map((a) => [a.id, [a.sire, a.dam]]));

// ---------- catatan kesehatan dan skor ----------
const stageOf = (d) => (d <= 90 ? "Early" : d <= 200 ? "Mid" : "Late");
function profile(kind, age) {
  const prev = kind === "sehat" ? U(9, 22) : kind === "turun" ? U(8, 18) : U(6, 15);
  const today = kind === "sehat" ? prev * U(0.95, 1.08) : kind === "turun" ? U(2.8, 7) : U(0.4, 3.6);
  const dim = I(5, 290);
  return {
    age_months: age,
    parity: Math.min(6, Math.max(1, Math.round((age - 24) / 14) + 1)),
    lactation_stage: stageOf(dim),
    days_in_milk: dim,
    body_condition_score: pick(kind === "sehat" ? [3, 3.5, 3.5, 4] : kind === "turun" ? [2.5, 3, 3, 3.5] : [2, 2.5, 2.5, 3]),
    milk_yield_l: r1(today),
    previous_week_avg_yield: r1(prev),
    vaccine_count: kind === "sehat" ? I(5, 8) : kind === "turun" ? I(3, 6) : I(1, 4),
  };
}
const health = []; // {id, recs:[{days_ago, input, risk}]}
for (const a of herd.filter((x) => x.sex === "B")) {
  const kind = pick(["sehat", "sehat", "sehat", "sehat", "turun", "turun", "turun", "sakit", "sakit"]);
  const now = profile(kind, a.age);
  const before = { ...profile("sehat", a.age), days_in_milk: Math.max(1, now.days_in_milk - 7) };
  before.lactation_stage = stageOf(before.days_in_milk);
  const recs = kind === "sehat" ? [{ days: 7, input: before }, { days: 0, input: now }] : [{ days: 7, input: before }, { days: 0, input: now }];
  for (const r of recs) r.risk = computeRisk(r.input);
  health.push({ id: a.id, recs });
}

// ---------- perkawinan ----------
const adultsM = herd.filter((a) => a.sex === "J" && a.age >= 24), adultsF = herd.filter((a) => a.sex === "B" && a.age >= 24);
const matings = [];
const seen = new Set();
let related = 0, unrelated = 0, guard = 0;
while ((related < 4 || unrelated < 8) && guard++ < 4000) {
  const s = pick(adultsM), d = pick(adultsF);
  const key = s.id + d.id;
  if (seen.has(key) || s.id === d.id) continue;
  const res = inbreedingCheck(s.id, d.id, ped);
  if (res.is_related && res.relation !== "orang tua dan anak" && related < 4) { related++; seen.add(key); matings.push({ s: s.id, d: d.id, res }); }
  else if (!res.is_related && unrelated < 8) { unrelated++; seen.add(key); matings.push({ s: s.id, d: d.id, res }); }
}
matings.forEach((m, i) => (m.days = 5 + i * 7 + I(0, 4)));

// ---------- SQL ----------
const cnt = { Rendah: 0, Sedang: 0, Tinggi: 0 };
health.forEach((h) => cnt[h.recs[1].risk.risk_level]++);
const L = [];
L.push("-- Data demo TernakKu (sintetis): kawanan ±40 ekor, 3 generasi. DIHASILKAN oleh ml/make_demo_seed.mjs.");
L.push("-- Dipasang ke akun pertama di auth.users. Aman dijalankan ulang (menghapus tag SPI-001 sampai SPI-040 milik akun itu lebih dulu).");
L.push("do $$");
L.push("declare v_owner uuid;");
L.push("begin");
L.push("  select id into v_owner from auth.users order by created_at limit 1;");
L.push("  if v_owner is null then raise exception 'Belum ada akun. Daftar dulu lewat aplikasi.'; end if;");
L.push(`  delete from public.livestock where owner_id = v_owner and id in (${herd.map((a) => q(a.id)).join(",")});`);
const gens = [herd.filter((a) => !a.sire), herd.filter((a) => a.sire && g2.includes(a)), herd.filter((a) => g3.includes(a))];
for (const g of gens) {
  L.push("  insert into public.livestock (owner_id, id, name, species, sex, sire_id, dam_id) values");
  L.push(g.map((a) => `    (v_owner, ${q(a.id)}, ${q(a.name)}, 'sapi', ${q(a.sex)}, ${a.sire ? q(a.sire) : "null"}, ${a.dam ? q(a.dam) : "null"})`).join(",\n") + ";");
}
const hRows = [], rRows = [];
for (const h of health) for (const r of h.recs) {
  const i = r.input, ago = `now() - interval '${r.days} days'`;
  hRows.push(`    (v_owner, ${q(h.id)}, ${i.age_months}, ${i.parity}, ${q(i.lactation_stage)}, ${i.days_in_milk}, ${i.body_condition_score}, ${i.milk_yield_l}, ${i.previous_week_avg_yield}, ${i.vaccine_count}, ${ago})`);
  const k = r.risk;
  rRows.push(`    (v_owner, ${q(h.id)}, ${q(k.risk_level)}, ${k.confidence}, ${k.prob_sakit}, ${q(JSON.stringify(k.top_factors))}::jsonb, ${q(k.recommended_actions)}, ${q(k.disclaimer)}, ${q(k.model_version)}, ${ago})`);
}
L.push("  insert into public.health_records (owner_id, livestock_id, age_months, parity, lactation_stage, days_in_milk, body_condition_score, milk_yield_l, previous_week_avg_yield, vaccine_count, recorded_at) values");
L.push(hRows.join(",\n") + ";");
L.push("  insert into public.risk_results (owner_id, livestock_id, risk_level, confidence, prob_sakit, top_factors, recommended_actions, disclaimer, model_version, created_at) values");
L.push(rRows.join(",\n") + ";");
L.push("  insert into public.matings (owner_id, sire_id, dam_id, mating_date, related, relation, kinship, note) values");
L.push(matings.map((m) => `    (v_owner, ${q(m.s)}, ${q(m.d)}, current_date - ${m.days}, ${m.res.is_related}, ${q(m.res.is_related ? m.res.relation : "")}, ${m.res.kinship}, ${q(m.res.is_related ? "Dicatat setelah peringatan; peternak memilih tetap menyimpan" : "")})`).join(",\n") + ";");
L.push("end");
L.push("$$;");

mkdirSync(new URL("../supabase/seed/", import.meta.url), { recursive: true });
writeFileSync(new URL("../supabase/seed/demo_herd.sql", import.meta.url), L.join("\n") + "\n");
console.log(`ternak: ${herd.length} (jantan ${herd.filter((a) => a.sex === "J").length}, betina ${herd.filter((a) => a.sex === "B").length})`);
console.log(`catatan kesehatan: ${hRows.length}, skor: ${rRows.length}; level terbaru`, cnt);
console.log(`perkawinan: ${matings.length} (sekerabat ${related}, aman ${unrelated})`);
