import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TernakKu",
    short_name: "TernakKu",
    description: "Catat ternak dan dapatkan peringatan dini risiko kesehatan dan perkawinan sekerabat.",
    start_url: "/",
    display: "standalone",
    background_color: "#15803d",
    theme_color: "#15803d",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
