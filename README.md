# TernakKu

Aplikasi web mobile (PWA) untuk mencatat ternak dan mendapat **peringatan dini risiko kesehatan** serta **peringatan perkawinan sekerabat**.
Proyek Perancangan Produk AI untuk Pertanian (KEB1322), Kelompok 9.

**Demo:** https://ternakku-tau.vercel.app (daftar dengan email Anda; jika email konfirmasi tidak datang, coba lagi beberapa menit kemudian)

> Hasil AI adalah **estimasi**, bukan diagnosis. Model dilatih pada **data sintetis** (Kaggle), jadi angka performa bukan bukti hasil di lapangan.

## Arsitektur

| Lapisan | Teknologi |
|---|---|
| Antarmuka | Next.js 16 (App Router), React 19, TypeScript, PWA; dideploy di Vercel |
| Backend | Supabase: Auth (email dan kata sandi), Postgres dengan Row Level Security, Edge Functions (Deno) |
| Model AI | Logistic Regression (scikit-learn) diekspor ke JSON lalu dijalankan di Edge Function `risk-score` |
| Inbreeding Alert | Rule-based pada silsilah, Edge Function `inbreeding-check` |

```
Browser (Next.js) ──supabase-js──> Auth + tabel (RLS: tiap peternak hanya melihat datanya sendiri)
                  └─functions.invoke──> risk-score / inbreeding-check (JWT pengguna wajib)
```

Tabel: `profiles` (consent AI, kontak dokter hewan), `livestock` (ternak dan silsilah), `health_records`, `risk_results`, `matings`, `risk_feedback`.
Semua tabel memakai RLS; skema ada di [supabase/migrations](supabase/migrations).

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local   # isi URL dan kunci publishable project Supabase Anda
npm run dev                  # http://localhost:3000
```

Variabel yang dibutuhkan (Supabase: Project Settings > API):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Menyiapkan Supabase sendiri

1. Buat project, lalu jalankan SQL di `supabase/migrations/` (SQL Editor atau `supabase db push`).
2. Deploy fungsi: `supabase functions deploy risk-score` dan `supabase functions deploy inbreeding-check` (JWT verification tetap aktif).
3. Authentication > Providers > Email. Untuk demo cepat, matikan "Confirm email" (batas email bawaan Supabase kecil).

## Model dan pengujian

Notebook pelatihan dan evaluasi ada di [ml/](ml/). Data tidak disertakan di repositori:
unduh `global_cattle_disease_detection_dataset.csv` dari [Kaggle](https://www.kaggle.com/datasets/shahhet2812/cattle-health-and-feeding-data) (sintetis; lisensi tidak tercantum).

- `ml/export_model.py` mengekspor model ke `supabase/functions/risk-score/model.ts`.
- `npm run test:ml` memeriksa hasil TypeScript sama dengan Python (25 kasus) dan 5 kasus kekerabatan.

Hasil pada data uji sintetis (200 peternakan yang tidak dipakai melatih): ternak berlevel Rendah, Sedang, Tinggi ternyata sakit 23,3%, 47,6%, dan 65,3%.
Sedang+Tinggi menangkap 85,1% ternak sakit (precision 54,0%); level Tinggi saja precision 65,3% dan recall 37,5%.

## Data demo

`supabase/seed/demo_herd.sql` mengisi akun pertama dengan kawanan sintetis ±40 ekor (3 generasi), catatan kesehatan, skor risiko, dan riwayat perkawinan (sebagian sekerabat) untuk demo.
File dihasilkan oleh `node ml/make_demo_seed.mjs` (skor memakai model dan aturan yang sama dengan Edge Function). Jalankan di Supabase SQL Editor setelah mendaftar satu akun. Aman diulang; data ini bisa dihapus lewat Pengaturan > Hapus semua data ternak saya.

## Yang belum ada

- Uji dengan peternak sungguhan dan data lapangan yang divalidasi dokter hewan.
- Pengingat jadwal vaksin, push notification, mode offline penuh.
- Deteksi anomali wabah, analisis foto, peta.
