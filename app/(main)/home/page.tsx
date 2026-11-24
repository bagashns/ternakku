"use client";
import Link from "next/link";
import { ErrorBox, Loading, RiskBadge, TopBar } from "@/components/ui";
import { useConsent, useLivestock, useRisk, useSession } from "@/components/hooks";
import { displayName } from "@/lib/helpers";
import type { RiskLevel } from "@/lib/types";

export default function Home() {
  const [session] = useSession();
  const [consent] = useConsent();
  const [risk] = useRisk();
  const { list, loading, error, reload } = useLivestock();

  const levelOf = (id: string): RiskLevel | null => risk[id]?.risk_level ?? null;
  const count = (lv: RiskLevel | null) => list.filter((l) => levelOf(l.id) === lv).length;
  const highList = list.filter((l) => levelOf(l.id) === "Tinggi");

  return (
    <>
      <TopBar title="TernakKu" />
      <main className="content">
        <div>
          <h2>Halo, {session?.name}</h2>
          <p className="muted">Ringkasan kondisi ternak Anda</p>
        </div>

        {!consent.ai && (
          <div className="alert info">
            <div className="head">Fitur AI dimatikan</div>
            <div>TernakKu dipakai sebagai catatan biasa. Aktifkan lagi di Pengaturan untuk skor risiko dan peringatan.</div>
          </div>
        )}

        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={reload} />}

        {!loading && !error && (
          <>
            <section className="card">
              <div className="section-title">Skor risiko kesehatan</div>
              <div className="grid2">
                {(["Tinggi", "Sedang", "Rendah"] as RiskLevel[]).map((lv) => (
                  <Link key={lv} href="/kesehatan" className="row between">
                    <RiskBadge level={lv} />
                    <b style={{ fontSize: 22 }}>{count(lv)}</b>
                  </Link>
                ))}
                <Link href="/kesehatan" className="row between">
                  <RiskBadge level={null} />
                  <b style={{ fontSize: 22 }}>{count(null)}</b>
                </Link>
              </div>
            </section>

            {highList.length > 0 && (
              <section className="alert danger">
                <div className="head">Perlu perhatian hari ini</div>
                {highList.map((l) => (
                  <Link key={l.id} href={`/kesehatan/${l.id}/faktor`} className="row between">
                    <span>{displayName(l)}</span>
                    <span>Lihat →</span>
                  </Link>
                ))}
              </section>
            )}

            {list.length === 0 && (
              <div className="empty">
                Belum ada ternak. <br />
                <Link href="/ternak/baru" className="btn small" style={{ marginTop: 12 }}>
                  Tambah ternak pertama
                </Link>
              </div>
            )}
          </>
        )}

        <div className="section-title">Pintasan</div>
        <Link href="/kesehatan" className="btn">
          🩺 Cek risiko kesehatan
        </Link>
        <Link href="/perkawinan/baru" className="btn secondary">
          🧬 Catat perkawinan
        </Link>
        <Link href="/ternak/baru" className="btn secondary">
          ➕ Tambah ternak
        </Link>
      </main>
    </>
  );
}
