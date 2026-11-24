"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorBox, Field, Loading, TopBar } from "@/components/ui";
import { useConsent, useLivestock } from "@/components/hooks";
import { api } from "@/lib/api";
import { displayName } from "@/lib/helpers";
import type { InbreedingResult } from "@/lib/types";

export default function PerkawinanBaru() {
  const router = useRouter();
  const { list, loading, error: loadError, reload } = useLivestock();
  const [consent] = useConsent();
  const [sire, setSire] = useState("");
  const [dam, setDam] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [result, setResult] = useState<InbreedingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(r: InbreedingResult | null) {
    setBusy(true);
    setError(null);
    try {
      await api.addMating({
        sire_id: sire,
        dam_id: dam,
        date,
        related: r?.is_related ?? false,
        relation: r?.relation ?? "",
        kinship: r?.kinship ?? 0,
        note: note.trim(),
      });
      router.replace("/perkawinan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setBusy(false);
    }
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent.ai) {
      save(null);
      return;
    }
    setBusy(true);
    try {
      setResult(await api.inbreedingCheck(sire, dam));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memeriksa.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <>
      <TopBar title="Catat Perkawinan" back="/perkawinan" />
      <form className="content" onSubmit={check}>
        {loadError && <ErrorBox message={loadError} onRetry={reload} />}
        <Field label="Pejantan">
          <select
            value={sire}
            onChange={(e) => {
              setSire(e.target.value);
              setResult(null);
            }}
            required
          >
            <option value="">Pilih pejantan</option>
            {list.filter((l) => l.sex !== "B").map((l) => (
              <option key={l.id} value={l.id}>
                {displayName(l)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Induk">
          <select
            value={dam}
            onChange={(e) => {
              setDam(e.target.value);
              setResult(null);
            }}
            required
          >
            <option value="">Pilih induk</option>
            {list.filter((l) => l.sex !== "J").map((l) => (
              <option key={l.id} value={l.id}>
                {displayName(l)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Catatan (boleh kosong)">
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {error && (
          <div className="alert danger" role="alert">
            {error}
          </div>
        )}

        {!result && (
          <button className="btn" type="submit" disabled={busy || !sire || !dam}>
            {busy ? "Memeriksa..." : consent.ai ? "Periksa kekerabatan" : "Simpan"}
          </button>
        )}

        {result && !result.is_related && (
          <>
            <div className="alert ok" role="status">
              <div className="head">● Tidak ditemukan hubungan sekerabat dekat</div>
              <div>{result.message}</div>
            </div>
            <button type="button" className="btn" onClick={() => save(result)}>
              Simpan perkawinan
            </button>
          </>
        )}

        {result && result.is_related && (
          <>
            <div className="alert danger" role="alert">
              <div className="head">▲ Peringatan: masih sekerabat</div>
              <div>
                Hubungan: <b>{result.relation}</b>
                {result.common_ancestor_generations != null && <> · leluhur bersama {result.common_ancestor_generations} generasi</>}
              </div>
              <div>Koefisien kekerabatan: {result.kinship}</div>
              <div className="small">Perkawinan sekerabat dapat menurunkan kualitas genetik keturunan. Pertimbangkan pejantan atau induk lain.</div>
            </div>
            <button type="button" className="btn secondary" onClick={() => router.replace("/perkawinan")}>
              Batalkan
            </button>
            <button type="button" className="btn ghost" onClick={() => save(result)}>
              Tetap simpan (saya paham risikonya)
            </button>
          </>
        )}
      </form>
    </>
  );
}
