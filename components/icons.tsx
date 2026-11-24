import type { ReactNode } from "react";

/** Logo TernakKu: huruf T dengan tunas kecil. variant "light" untuk latar hijau. */
export function Logo({ size = 48, variant = "dark" }: { size?: number; variant?: "dark" | "light" }) {
  const bg = variant === "dark" ? "#15803d" : "#ffffff";
  const fg = variant === "dark" ? "#ffffff" : "#15803d";
  const leaf = variant === "dark" ? "#bbf7d0" : "#16a34a";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="TernakKu" style={{ display: "block", flex: "none" }}>
      <rect width="48" height="48" rx="12" fill={bg} />
      <rect x="11" y="12" width="26" height="6.5" rx="3.25" fill={fg} />
      <rect x="20.75" y="12" width="6.5" height="25" rx="3.25" fill={fg} />
      <path d="M28.5 37c0-6.5 4.3-10 9.5-10 0 6-4 10-9.5 10Z" fill={leaf} />
    </svg>
  );
}

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  pulse: (
    <>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </>
  ),
  fork: (
    <>
      <circle cx="12" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9M12 12v3" />
    </>
  ),
  sliders: <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </>
  ),
  back: <path d="m15 18-6-6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      {PATHS[name]}
    </svg>
  );
}
