"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConsent } from "@/components/hooks";

export default function Onboarding() {
  const router = useRouter();
  const [, setConsent] = useConsent();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(ai: boolean) {
    setBusy(true);
    setError(null);
    try {
      await setConsent({ answered: true, ai });
      router.replace("/home");
    } catch {
      setError("Pilihan belum tersimpan. Periksa sinyal lalu coba lagi.");
      setBusy(false);
    }
  }

  return (
    <div className="public">
      <h1>Bantuan AI untuk ternak Anda</h1>
      <p>TernakKu bisa menganalisis catatan ternak untuk memberi:</p>
      <ul style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6 }}>
        <li>
          <b>Skor risiko kesehatan</b> (Rendah, Sedang, Tinggi) beserta alasannya
        </li>
        <li>
          <b>Peringatan perkawinan sekerabat</b> sebelum data perkawinan disimpan
        </li>
      </ul>

      <div className="alert info">
        <div className="head">Data yang dipakai</div>
        <div>Hanya data ternak yang Anda catat: umur, produksi susu, vaksinasi, kondisi tubuh, dan silsilah (pejantan dan induk). Data tersimpan di akun Anda dan hanya Anda yang bisa melihatnya.</div>
      </div>
      <div className="alert warn">
        <div className="head">Ini estimasi, bukan diagnosis</div>
        <div>Hasil AI dihitung dari data yang tercatat dan bisa keliru. Untuk risiko tinggi, hubungi penyuluh atau dokter hewan.</div>
      </div>
      <p className="muted">Anda bisa mematikan fitur AI kapan saja di menu Pengaturan. TernakKu tetap bisa dipakai sebagai catatan biasa.</p>

      {error && (
        <div className="alert danger" role="alert">
          {error}
        </div>
      )}
      <button className="btn" disabled={busy} onClick={() => choose(true)}>
        Setuju, aktifkan AI
      </button>
      <button className="btn secondary" disabled={busy} onClick={() => choose(false)}>
        Tidak, pakai sebagai catatan saja
      </button>
    </div>
  );
}
