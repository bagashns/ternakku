"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";
import { Field } from "@/components/ui";
import { api } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // sudah login: lanjut ke consent atau beranda
  useEffect(() => {
    if (ready && user && profile) router.replace(profile.consent_answered ? "/home" : "/onboarding");
  }, [ready, user, profile, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "daftar") {
        const res = await api.signUp(email.trim(), password, name.trim());
        if (!res.session) {
          setInfo("Pendaftaran berhasil. Buka email Anda dan ketuk tautan konfirmasi, lalu masuk.");
          setMode("masuk");
        }
      } else {
        await api.signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="public" onSubmit={submit}>
      <div className="center" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 24 }}>
        <div className="splash logo" style={{ minHeight: 0, width: 72, height: 72, fontSize: 42, borderRadius: 18, border: "3px solid var(--green-700)" }} aria-hidden>
          T
        </div>
        <h1>{mode === "masuk" ? "Masuk ke TernakKu" : "Daftar TernakKu"}</h1>
      </div>

      {mode === "daftar" && (
        <Field label="Nama Anda" hint="Contoh: Pak Slamet">
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Tulis nama" required />
        </Field>
      )}
      <Field label="Email">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.com" required />
      </Field>
      <Field label="Kata sandi" hint={mode === "daftar" ? "Minimal 6 karakter" : undefined}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "masuk" ? "current-password" : "new-password"}
          minLength={6}
          required
        />
      </Field>

      {error && (
        <div className="alert danger" role="alert">
          {error}
        </div>
      )}
      {info && (
        <div className="alert ok" role="status">
          {info}
        </div>
      )}

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Memproses..." : mode === "masuk" ? "Masuk" : "Daftar"}
      </button>
      <button
        type="button"
        className="btn ghost"
        onClick={() => {
          setMode(mode === "masuk" ? "daftar" : "masuk");
          setError(null);
        }}
      >
        {mode === "masuk" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
      </button>
    </form>
  );
}
