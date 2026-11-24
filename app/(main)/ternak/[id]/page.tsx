"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { ErrorBox, Loading, RiskBadge, TopBar } from "@/components/ui";
import { useConsent, useHealth, useLivestock, useRisk } from "@/components/hooks";
import { SEX_LABEL, displayName, formatDate } from "@/lib/helpers";

export default function TernakDetail() {
  const { id } = useParams<{ id: string }>();
  const { list, loading, error, reload } = useLivestock();
  const [risk] = useRisk();
  const [health] = useHealth();
  const [consent] = useConsent();

  const item = list.find((l) => l.id === id);
  const parent = (pid: string | null) => {
    if (!pid) return "Tidak diketahui";
    const p = list.find((l) => l.id === pid);
    return (
      <Link href={`/ternak/${pid}`} style={{ textDecoration: "underline" }}>
        {p ? displayName(p) : pid}
      </Link>
    );
  };
  const children = list.filter((l) => l.sire_id === id || l.dam_id === id);
  const r = risk[id];
  const h = health[id];

  return (
    <>
      <TopBar title="Detail Ternak" back="/ternak" />
      <main className="content">
        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {!loading && !error && !item && <div className="empty">Ternak {id} tidak ditemukan.</div>}
        {item && (
          <>
            <section className="card">
              <div className="row between">
                <h2>{item.name ?? item.id}</h2>
                <RiskBadge level={r?.risk_level} />
              </div>
              <dl className="kv">
                <dt>Nomor tag</dt>
                <dd>{item.id}</dd>
                <dt>Jenis</dt>
                <dd>{item.species}</dd>
                <dt>Kelamin</dt>
                <dd>{item.sex ? SEX_LABEL[item.sex] : "Belum diisi"}</dd>
                <dt>Pejantan</dt>
                <dd>{parent(item.sire_id)}</dd>
                <dt>Induk</dt>
                <dd>{parent(item.dam_id)}</dd>
                <dt>Keturunan</dt>
                <dd>{children.length === 0 ? "-" : children.map((c) => c.id).join(", ")}</dd>
              </dl>
            </section>

            <section className="card">
              <div className="section-title">Catatan kesehatan terakhir</div>
              {h ? (
                <dl className="kv">
                  <dt>Umur</dt>
                  <dd>{h.age_months} bulan</dd>
                  <dt>Susu hari ini</dt>
                  <dd>{h.milk_yield_l} L</dd>
                  <dt>Susu minggu lalu</dt>
                  <dd>{h.previous_week_avg_yield} L</dd>
                  <dt>Vaksin lengkap</dt>
                  <dd>{h.vaccine_count} dari 8</dd>
                  <dt>Kondisi tubuh</dt>
                  <dd>{h.body_condition_score} dari 5</dd>
                </dl>
              ) : (
                <p className="muted">Belum ada catatan kesehatan.</p>
              )}
              {r && <p className="muted small">Skor terakhir: {formatDate(r.at)}</p>}
            </section>

            <Link href={`/kesehatan/${item.id}`} className="btn">
              <Icon name={consent.ai ? "pulse" : "clipboard"} size={20} /> {consent.ai ? "Cek risiko kesehatan" : "Catat kesehatan"}
            </Link>
          </>
        )}
      </main>
    </>
  );
}
