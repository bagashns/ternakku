"use client";
import Link from "next/link";
import { ErrorBox, Loading, RiskBadge, TopBar } from "@/components/ui";
import { useConsent, useLivestock, useRisk } from "@/components/hooks";
import { formatDate } from "@/lib/helpers";
import type { RiskLevel } from "@/lib/types";

const ORDER: Record<string, number> = { Tinggi: 0, Sedang: 1, Rendah: 2, none: 3 };

export default function Kesehatan() {
  const { list, loading, error, reload } = useLivestock();
  const [risk] = useRisk();
  const [consent] = useConsent();

  const sorted = [...list].sort((a, b) => ORDER[risk[a.id]?.risk_level ?? "none"] - ORDER[risk[b.id]?.risk_level ?? "none"]);

  return (
    <>
      <TopBar title="Kesehatan & Risiko" back="/home" />
      <main className="content">
        {!consent.ai && (
          <div className="alert info">
            <div className="head">Fitur AI dimatikan</div>
            <div>Skor risiko tidak dihitung. Anda tetap bisa mencatat kesehatan ternak.</div>
          </div>
        )}
        <p className="muted">Pilih ternak untuk memasukkan data hari ini dan melihat skor risikonya.</p>
        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {!loading && !error && list.length === 0 && (
          <div className="empty">
            Belum ada ternak.{" "}
            <Link href="/ternak/baru" style={{ textDecoration: "underline" }}>
              Tambah ternak
            </Link>
          </div>
        )}
        <div className="list">
          {sorted.map((l) => {
            const r = risk[l.id];
            return (
              <Link key={l.id} href={r ? `/kesehatan/${l.id}/faktor` : `/kesehatan/${l.id}`} className="card link">
                <div className="row between">
                  <div className="grow">
                    <div className="title">{l.name ?? l.id}</div>
                    <div className="muted small">{r ? `Dicek ${formatDate(r.at)}` : l.id}</div>
                  </div>
                  <RiskBadge level={r?.risk_level as RiskLevel | undefined} />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
