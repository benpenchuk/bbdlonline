import type { Metadata, Viewport } from "next";
import { Archivo, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BBDL — Beta Beer Dye League",
    template: "%s · BBDL",
  },
  description: "The Beta Beer Dye League. Scores, standings, stats and records.",
  // The league itself is behind a login, so there is nothing here worth indexing.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1a2a52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSans.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
