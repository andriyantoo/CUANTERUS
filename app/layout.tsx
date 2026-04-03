import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cuanterus — Platform Edukasi Trading di Indonesia",
  description:
    "Belajar trading dari nol dengan kurikulum terstruktur, sinyal real-time, dan komunitas trader aktif. Dipercaya 5,000+ trader Indonesia.",
  keywords: [
    "belajar trading",
    "edukasi trading",
    "kursus trading",
    "sinyal trading",
    "trading pemula",
    "cuanterus",
    "trading Indonesia",
    "kursus crypto",
    "kursus forex",
  ],
  openGraph: {
    title: "Cuanterus — Platform Edukasi Trading di Indonesia",
    description:
      "Belajar trading dari nol dengan kurikulum terstruktur, sinyal real-time, dan komunitas trader aktif. Dipercaya 5,000+ trader Indonesia.",
    url: "https://cuanterus.vercel.app",
    siteName: "Cuanterus",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuanterus — Platform Edukasi Trading di Indonesia",
    description:
      "Belajar trading dari nol dengan kurikulum terstruktur, sinyal real-time, dan komunitas trader aktif. Dipercaya 5,000+ trader Indonesia.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
