"use client";
import Link from "next/link";
import { useState } from "react";
import { ErrorBox, Loading, RiskBadge, TopBar } from "@/components/ui";
import { useLivestock, useRisk } from "@/components/hooks";
import { SEX_LABEL } from "@/lib/helpers";

export default function TernakList() {
  const { list, loading, error, reload } = useLivestock();
  const [risk] = useRisk();
  const [q, setQ] = useState("");

  const shown = list.filter((l) => `${l.id} ${l.name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <TopBar title="Ternak Saya" back="/home" />
      <main className="content">
        <input type="search" placeholder="Cari nama atau nomor tag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari ternak" />
        {loading && <Loading />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {!loading && !error && list.length === 0 && <div className="empty">Belum ada ternak. Ketuk tombol + untuk menambah.</div>}
        {!loading && !error && list.length > 0 && shown.length === 0 && <div className="empty">Tidak ada ternak yang cocok.</div>}
        <div className="list">
          {shown.map((l) => (
            <Link key={l.id} href={`/ternak/${l.id}`} className="card link">
              <div className="row between">
                <div className="grow">
                  <div className="title">{l.name ?? l.id}</div>
                  <div className="muted small">
                    {l.id} · {l.species}
                    {l.sex ? ` · ${SEX_LABEL[l.sex]}` : ""}
                  </div>
                </div>
                <RiskBadge level={risk[l.id]?.risk_level} />
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Link href="/ternak/baru" className="btn fab" style={{ width: 64, height: 64, borderRadius: 32, padding: 0, fontSize: 32 }} aria-label="Tambah ternak">
        +
      </Link>
    </>
  );
}
