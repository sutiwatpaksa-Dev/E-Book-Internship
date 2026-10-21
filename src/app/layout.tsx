import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { translationsTh } from "@/lib/translations-th";
import "./global.css";

const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });

const siteUrl = "https://e-book-internship.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "คู่มือฝึกงาน Blicktech", template: "%s · คู่มือฝึกงาน Blicktech" },
  description: "Basic Dev Fundamentals สำหรับน้องฝึกงาน บริษัท บลิคซ์เทค คอนซัลแทนท์ จำกัด",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  // ภาพตัวอย่างตอนแชร์ลิงก์ (LINE, Facebook, Slack)
  openGraph: { images: [{ url: "/brand/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={plexThai.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={{ locale: "th", translations: translationsTh }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
