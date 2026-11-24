"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Loading, TopBar } from "@/components/ui";
import { useLivestock } from "@/components/hooks";
import { api } from "@/lib/api";
import { displayName } from "@/lib/helpers";

export default function TernakBaru() {
  const router = useRouter();
  const { list, loading } = useLivestock();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("sapi");
  const [sex, setSex] = useState<"" | "J" | "B">("");
  const [sire, setSire] = useState("");
  const [dam, setDam] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api.createLivestock({
        id: id.trim().toUpperCase(),
        name: name.trim() || null,
        species,
        sex: sex || null,
        sire_id: sire || null,
        dam_id: dam || null,
      });
      router.replace(`/ternak/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <>
      <TopBar title="Tambah Ternak" back />
      <form className="content" onSubmit={submit}>
        <Field label="Nomor tag" hint="Wajib dan harus unik. Contoh: SPI-012">
          <input value={id} onChange={(e) => setId(e.target.value)} required maxLength={32} placeholder="SPI-012" />
        </Field>
        <Field label="Nama (boleh kosong)">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Sri" />
        </Field>
        <div className="grid2">
          <Field label="Jenis">
            <select value={species} onChange={(e) => setSpecies(e.target.value)}>
              {["sapi", "kambing", "domba", "kerbau"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Jenis kelamin">
            <select value={sex} onChange={(e) => setSex(e.target.value as "" | "J" | "B")}>
              <option value="">Belum diisi</option>
              <option value="J">Jantan</option>
              <option value="B">Betina</option>
            </select>
          </Field>
        </div>
        <Field label="Pejantan (bapak)" hint="Isi bila diketahui. Dipakai untuk peringatan perkawinan sekerabat.">
          <select value={sire} onChange={(e) => setSire(e.target.value)}>
            <option value="">Tidak diketahui</option>
            {list.filter((l) => l.sex !== "B").map((l) => (
              <option key={l.id} value={l.id}>
                {displayName(l)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Induk (ibu)">
          <select value={dam} onChange={(e) => setDam(e.target.value)}>
            <option value="">Tidak diketahui</option>
            {list.filter((l) => l.sex !== "J").map((l) => (
              <option key={l.id} value={l.id}>
                {displayName(l)}
              </option>
            ))}
          </select>
        </Field>
        {error && (
          <div className="alert danger" role="alert">
            {error}
          </div>
        )}
        <button className="btn" type="submit" disabled={busy || !id.trim()}>
          {busy ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </>
  );
}
