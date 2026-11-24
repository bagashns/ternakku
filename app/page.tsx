"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth";

export default function Splash() {
  const router = useRouter();
  const { user, profile, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      router.replace(!user ? "/login" : profile && !profile.consent_answered ? "/onboarding" : "/home");
    }, 900);
    return () => clearTimeout(t);
  }, [ready, user, profile, router]);

  return (
    <div className="splash">
      <div className="logo" aria-hidden>
        T
      </div>
      <h1 style={{ fontSize: 34 }}>TernakKu</h1>
      <p>Catat ternak, cegah rugi lebih awal</p>
    </div>
  );
}
