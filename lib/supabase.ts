import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  // Pesan jelas saat variabel lingkungan belum diisi (lihat .env.example)
  throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diatur.");
}

/** Klien browser. Kunci publishable aman di sisi klien; akses data dibatasi Row Level Security. */
export const supabase = createClient(url, key);
