"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGuard, useRisk } from "@/components/hooks";
import { Icon, type IconName } from "@/components/icons";
import { Loading } from "@/components/ui";

const ITEMS: { href: string; label: string; ico: IconName }[] = [
  { href: "/ternak", label: "Ternak Saya", ico: "list" },
  { href: "/kesehatan", label: "Kesehatan & Risiko", ico: "pulse" },
  { href: "/perkawinan", label: "Perkawinan", ico: "fork" },
  { href: "/pengaturan", label: "Notifikasi & Pengaturan", ico: "sliders" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const ok = useGuard();
  const pathname = usePathname();
  const [risk] = useRisk();
  const high = Object.values(risk).filter((r) => r.risk_level === "Tinggi").length;

  if (!ok) return <Loading />;

  return (
    <>
      {children}
      <nav className="nav" aria-label="Menu utama">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <span className="ico" aria-hidden>
                <Icon name={it.ico} size={24} />
              </span>
              {it.href === "/pengaturan" && high > 0 && (
                <span className="dot" aria-label={`${high} peringatan`}>
                  {high}
                </span>
              )}
              {it.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
