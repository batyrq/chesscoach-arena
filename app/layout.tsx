import type { Metadata } from "next";
import { Space_Grotesk, Sora } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"]
});

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"]
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
      <body className={`${spaceGrotesk.variable} ${sora.variable}`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
