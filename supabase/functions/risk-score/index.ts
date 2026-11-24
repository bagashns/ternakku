// POST /functions/v1/risk-score  (butuh JWT pengguna yang sudah login)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { computeRisk, validate, type RiskInput } from "./risk.ts";

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ detail: "Body harus JSON." }, 400);
  }
  const err = validate(body);
  if (err) return json({ detail: err }, 422);
  return json(computeRisk(body as unknown as RiskInput));
});
