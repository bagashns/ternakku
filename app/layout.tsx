import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";
import { AuthProvider } from "@/components/auth";

export const metadata: Metadata = {
  title: "TernakKu",
  description: "Catat ternak dan dapatkan peringatan dini risiko kesehatan dan perkawinan sekerabat.",
  applicationName: "TernakKu",
  appleWebApp: { capable: true, title: "TernakKu", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <div className="shell">{children}</div>
        </AuthProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
