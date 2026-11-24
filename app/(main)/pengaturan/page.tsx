"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/ui";
import { useAuth } from "@/components/auth";
import { useConsent, useHealth, useRisk, useSession } from "@/components/hooks";
import { api } from "@/lib/api";

export default function Pengaturan() {
  const router = useRouter();
  const [session, setSession] = useSession();
  const [consent, setConsent] = useConsent();
  const { profile, updateProfile } = useAuth();
  const [risk, reloadRisk] = useRisk();
  const [health, reloadHealth] = useHealth();
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setPhone(profile?.vet_phone ?? "");
  }, [profile?.vet_phone]);

  const highs = Object.values(risk).filter((r) => r.risk_level === "Tinggi");
  const vaccines = Object.entries(health).filter(([, h]) => h.vaccine_count < 8);

  function logout() {
    setSession(null);
    router.replace("/login");
  }

  async function savePhone() {
    try {
      await updateProfile({ vet_phone: phone.trim() || null });
      setMsg("Nomor tersimpan.");
    } catch {
      setMsg("Belum tersimpan. Coba lagi.");
    }
  }

  async function wipe() {
    if (!window.confirm("Hapus SEMUA data ternak Anda (ternak, silsilah, catatan kesehatan, skor risiko, riwayat perkawinan)? Ini tidak bisa dibatalkan.")) return;
    try {
      await api.deleteMyData();
      await Promise.all([reloadRisk(), reloadHealth()]);
      setMsg("Semua data ternak sudah dihapus.");
    } catch {
      setMsg("Data belum terhapus. Coba lagi.");
    }
  }

  return (
    <>
      <TopBar title="Notifikasi & Pengaturan" back="/home" />
      <main className="content">
        <div className="section-title">Notifikasi peringatan</div>
        {highs.length === 0 && vaccines.length === 0 && <div className="empty">Tidak ada peringatan saat ini.</div>}
        <div className="list">
          {highs.map((r) => (
            <Link key={r.livestock_id} href={`/kesehatan/${r.livestock_id}/faktor`} className="alert danger">
              <div className="head">■ {r.livestock_id}: risiko Tinggi</div>
              <div className="small">{r.recommended_actions}</div>
            </Link>
          ))}
          {vaccines.map(([id, h]) => (
            <Link key={id} href={`/kesehatan/${id}`} className="alert warn">
              <div className="head">▲ {id}: vaksin belum lengkap</div>
              <div className="small">Baru {h.vaccine_count} dari 8 vaksin tercatat lengkap.</div>
            </Link>
          ))}
        </div>

        <div className="section-title">Privasi dan fitur AI</div>
        <section className="card">
          <div className="toggle">
            <div className="grow">
              <div className="title">Fitur AI</div>
              <div className="muted small">Skor risiko kesehatan dan peringatan perkawinan sekerabat</div>
            </div>
            <button
              className="switch"
              role="switch"
              aria-checked={consent.ai}
              aria-label="Fitur AI"
              onClick={() => setConsent({ answered: true, ai: !consent.ai })}
            />
          </div>
          <p className="muted small">
            {consent.ai
              ? "AI aktif. Data yang dipakai: umur, produksi susu, vaksinasi, kondisi tubuh, dan silsilah. Hasilnya estimasi, bukan diagnosis."
              : "AI mati. TernakKu dipakai sebagai catatan biasa."}
          </p>
        </section>

        <div className="section-title">Kontak dokter hewan / penyuluh</div>
        <section className="card">
          <label className="field">
            Nomor telepon
            <input type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className="hint">Dipakai untuk tombol Hubungi di hasil risiko Tinggi. Disimpan di akun Anda.</span>
          </label>
          <button className="btn secondary small" onClick={savePhone}>
            Simpan nomor
          </button>
        </section>

        <div className="section-title">Akun</div>
        <section className="card">
          <div className="row between">
            <span>Nama</span>
            <b>{session?.name}</b>
          </div>
          <div className="row between">
            <span>Email</span>
            <b style={{ overflowWrap: "anywhere" }}>{session?.email}</b>
          </div>
          {msg && (
            <div className="alert info small" role="status">
              {msg}
            </div>
          )}
          <button className="btn secondary" onClick={logout}>
            Keluar
          </button>
          <button className="btn ghost" onClick={wipe}>
            Hapus semua data ternak saya
          </button>
        </section>
      </main>
    </>
  );
}
