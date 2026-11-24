// POST /functions/v1/inbreeding-check  body: { sire_id, dam_id }
// Membaca silsilah milik pengguna yang login (Row Level Security berlaku lewat JWT pengguna).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { inbreedingCheck, MAX_GEN, type Ped } from "./pedigree.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ detail: "Gunakan POST." }, 405);

  let body: { sire_id?: unknown; dam_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ detail: "Body harus JSON." }, 400);
  }
  const sire = body.sire_id;
  const dam = body.dam_id;
  if (typeof sire !== "string" || typeof dam !== "string" || !sire || !dam) return json({ detail: "sire_id dan dam_id wajib diisi." }, 422);
  if (sire === dam) return json({ detail: "Pejantan dan induk tidak boleh sama." }, 422);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  // ambil silsilah ke atas, generasi demi generasi
  const ped: Ped = {};
  let frontier = [sire, dam];
  for (let gen = 0; gen <= MAX_GEN && frontier.length; gen++) {
    const ids = [...new Set(frontier)].filter((i) => !(i in ped));
    if (!ids.length) break;
    const { data, error } = await supabase.from("livestock").select("id, sire_id, dam_id").in("id", ids);
    if (error) return json({ detail: "Gagal membaca silsilah." }, 500);
    const found = new Map((data ?? []).map((r) => [r.id as string, [r.sire_id, r.dam_id] as [string | null, string | null]]));
    for (const i of ids) ped[i] = found.get(i) ?? [null, null];
    if (gen === 0) {
      for (const i of [sire, dam]) if (!found.has(i)) return json({ detail: `Ternak ${i} tidak ditemukan.` }, 404);
    }
    frontier = [...found.values()].flat().filter((p): p is string => !!p);
  }
  return json(inbreedingCheck(sire, dam, ped));
});
