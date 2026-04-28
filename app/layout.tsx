import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"]
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"]
});

export const metadata: Metadata = {
  title: "ChessCoach Arena",
  description: "Play chess, get coached, and climb your city leaderboard."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable}`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
