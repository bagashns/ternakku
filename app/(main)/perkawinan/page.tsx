"use client";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { TopBar } from "@/components/ui";
import { useMatings } from "@/components/hooks";

export default function Perkawinan() {
  const [matings] = useMatings();

  return (
    <>
      <TopBar title="Perkawinan" back="/home" />
      <main className="content">
        <Link href="/perkawinan/baru" className="btn">
          <Icon name="fork" size={20} /> Catat perkawinan baru
        </Link>
        <div className="section-title">Riwayat perkawinan</div>
        {matings.length === 0 && <div className="empty">Belum ada catatan perkawinan.</div>}
        <div className="list">
          {matings.map((m) => (
            <div key={m.id} className="card">
              <div className="row between">
                <div className="title">
                  {m.sire_id} × {m.dam_id}
                </div>
                <span className={`badge ${m.related ? "Tinggi" : "Rendah"}`}>{m.related ? "▲ Sekerabat" : "● Aman"}</span>
              </div>
              <div className="muted small">
                {new Date(m.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                {m.related ? ` · ${m.relation}` : ""}
              </div>
              {m.note && <div className="small">{m.note}</div>}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
