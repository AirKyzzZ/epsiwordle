import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EPSIWordle - Le Wordle exclusif EPSI",
  description: "Jeu quotidien Wordle pour les étudiants EPSI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-50 text-gray-900 dark:bg-black dark:text-zinc-50`}
      >
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
