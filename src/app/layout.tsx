import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: {
    default: "3M Ministry — Multiply Movement Mascouche",
    template: "%s · 3M Ministry",
  },
  description:
    "3M Ministry forme et envoie des leaders pour multiplier l'Église au Québec — à travers l'Église locale La Cité Mascouche.",
  metadataBase: new URL("https://3mministry.com"),
  // Short name used by Safari / iOS when the user adds the site to the dock
  // or home screen. The full title is too long there.
  appleWebApp: {
    title: "3M Ministry",
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#050a14",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
