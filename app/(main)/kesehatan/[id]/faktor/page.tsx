"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Disclaimer, RiskBadge, TopBar } from "@/components/ui";
import { useAuth } from "@/components/auth";
import { useFeedback, useRisk } from "@/components/hooks";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/helpers";

function certainty(c: number) {
  if (c >= 0.8) return { label: "Cukup yakin", note: null };
  if (c >= 0.65) return { label: "Lumayan yakin", note: "Pantau ternak langsung untuk memastikan." };
  return { label: "Kurang yakin", note: "Hasil ini kurang pasti. Jangan hanya mengandalkan skor, periksa ternak langsung atau tanya penyuluh." };
}

export default function Faktor() {
  const { id } = useParams<{ id: string }>();
  const [risk] = useRisk();
  const { profile } = useAuth();
  const vet = { phone: profile?.vet_phone ?? "" };
  const [feedback, reloadFeedback] = useFeedback();
  const [copied, setCopied] = useState(false);
  const r = risk[id];

  if (!r) {
    return (
      <>
        <TopBar title="Faktor Risiko" back={`/kesehatan/${id}`} />
        <main className="content">
          <div className="empty">Belum ada skor untuk ternak ini.</div>
          <Link href={`/kesehatan/${id}`} className="btn">
            Hitung risiko
          </Link>
        </main>
      </>
    );
  }

  const cert = certainty(r.confidence);
  const summary = `Ternak ${id}: risiko ${r.risk_level} (estimasi, keyakinan ${Math.round(r.confidence * 100)}%). Faktor: ${r.top_factors.map((f) => f.faktor).join(", ")}.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      window.prompt("Salin ringkasan ini:", summary);
    }
  }

  return (
    <>
      <TopBar title="Faktor Risiko & Tindakan" back={`/kesehatan/${id}`} />
      <main className="content">
        <section className="card center" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="muted">{id}</div>
          <RiskBadge level={r.risk_level} big />
          <div className="muted small">Dihitung {formatDate(r.at)}</div>
          <div style={{ width: "100%" }}>
            <div className="row between small">
              <span>
                Tingkat keyakinan: <b>{cert.label}</b>
              </span>
              <b>{Math.round(r.confidence * 100)}%</b>
            </div>
            <div className="bar" aria-hidden>
              <span style={{ width: `${Math.round(r.confidence * 100)}%` }} />
            </div>
          </div>
        </section>

        {cert.note && (
          <div className="alert warn small">
            <div className="head">Catatan keyakinan</div>
            <div>{cert.note}</div>
          </div>
        )}

        <section className="card">
          <div className="section-title">Kenapa risikonya begini?</div>
          {r.top_factors.map((f) => (
            <div key={f.faktor}>
              <div className="row between">
                <span style={{ textTransform: "capitalize" }}>{f.faktor}</span>
                <b>{Math.round(f.kontribusi * 100)}%</b>
              </div>
              <div className="bar" aria-hidden>
                <span style={{ width: `${Math.round(f.kontribusi * 100)}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className={`alert ${r.risk_level === "Tinggi" ? "danger" : r.risk_level === "Sedang" ? "warn" : "ok"}`}>
          <div className="head">Yang sebaiknya dilakukan</div>
          <div>{r.recommended_actions}</div>
        </section>

        {r.risk_level === "Tinggi" && (
          <div className="card">
            {vet.phone ? (
              <a className="btn danger" href={`tel:${vet.phone}`}>
                <Icon name="phone" size={20} /> Hubungi dokter hewan / penyuluh
              </a>
            ) : (
              <Link className="btn danger" href="/pengaturan">
                <Icon name="phone" size={20} /> Atur nomor dokter hewan / penyuluh
              </Link>
            )}
            <button className="btn secondary" onClick={copy}>
              {copied ? (
                <>
                  <Icon name="check" size={18} /> Tersalin
                </>
              ) : (
                "Salin ringkasan untuk dikirim"
              )}
            </button>
          </div>
        )}

        <Disclaimer text={r.disclaimer} />

        <div className="card">
          {feedback[id] ? (
            <p className="muted">Terima kasih, laporan Anda sudah dicatat.</p>
          ) : (
            <button
              className="btn ghost"
              onClick={async () => {
                await api.addFeedback(id);
                await reloadFeedback();
              }}
            >
              Hasil ini tidak sesuai? Laporkan
            </button>
          )}
        </div>

        <Link href={`/kesehatan/${id}`} className="btn secondary">
          Perbarui data ternak
        </Link>
      </main>
    </>
  );
}
