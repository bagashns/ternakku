"use client";
import { useEffect } from "react";

/** Daftarkan service worker hanya di produksi supaya aplikasi bisa dipasang ke layar utama. */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
