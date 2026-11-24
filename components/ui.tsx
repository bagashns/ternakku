"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { RiskLevel } from "@/lib/types";

const ICON: Record<RiskLevel, string> = { Rendah: "●", Sedang: "▲", Tinggi: "■" };

export function RiskBadge({ level, big }: { level?: RiskLevel | null; big?: boolean }) {
  if (!level) return <span className={`badge none${big ? " big" : ""}`}>Belum dicek</span>;
  return (
    <span className={`badge ${level}${big ? " big" : ""}`}>
      <span aria-hidden>{ICON[level]}</span> Risiko {level}
    </span>
  );
}

export function TopBar({ title, back }: { title: string; back?: boolean | string }) {
  const router = useRouter();
  return (
    <header className="topbar">
      {back ? (
        <button className="back" aria-label="Kembali" onClick={() => (typeof back === "string" ? router.push(back) : router.back())}>
          ←
        </button>
      ) : null}
      <h1>{title}</h1>
      <Link href="/home" aria-label="Beranda" style={{ fontSize: 22, minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        🏠
      </Link>
    </header>
  );
}

export function Loading({ text = "Memuat..." }: { text?: string }) {
  return (
    <div className="empty">
      <span className="spinner" /> <div>{text}</div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert danger" role="alert">
      <div className="head">Gagal memuat</div>
      <div>{message}</div>
      {onRetry && (
        <button className="btn secondary small" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function Disclaimer({ text }: { text?: string }) {
  return (
    <div className="alert info small">
      <div className="head">Ini estimasi, bukan diagnosis</div>
      <div>{text ?? "Hasil ini berdasarkan data yang dicatat. Untuk ternak berisiko tinggi, hubungi penyuluh atau dokter hewan."}</div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}
