import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { RightPanel } from "@/components/RightPanel";
import { IntentProvider } from "@/context/IntentContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "musu.world - ひとりだけど、ひとりじゃない。",
  description: "AIが、あなたの仕事仲間になる。フリーランス・個人事業主のためのAIエージェントチーム。",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "musu - ひとりだけど、ひとりじゃない。",
    description: "AIが、あなたの仕事仲間になる。ソロプレナー・ひとり会社のためのAIエージェントチーム。",
    url: "https://musu.world",
    siteName: "musu",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "https://musu.world/og-image.png", width: 1200, height: 630, alt: "musu - ひとりだけど、ひとりじゃない。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "musu - ひとりだけど、ひとりじゃない。",
    description: "AIが、あなたの仕事仲間になる。ソロプレナー・ひとり会社のためのAIエージェントチーム。",
    images: ["https://musu.world/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        <LocaleProvider>
        <AuthGate
          publicChildren={
            <div className="min-h-screen bg-[var(--background)]">
              <main className="w-full">
                {children}
              </main>
            </div>
          }
        >
        <IntentProvider>
          <div className="min-h-screen flex justify-center">
            <Sidebar />
            <main className="w-full max-w-[600px] min-h-screen border-x border-[var(--card-border)] pb-16 md:pb-0">
              {children}
            </main>
            <RightPanel />
          </div>
          <MobileNav />
        </IntentProvider>
        </AuthGate>
        </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
