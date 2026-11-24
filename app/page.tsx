"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth";
import { Logo } from "@/components/icons";

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
      <Logo size={96} variant="light" />
      <h1 style={{ fontSize: 34 }}>TernakKu</h1>
      <p>Catat ternak, cegah rugi lebih awal</p>
    </div>
  );
}
