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
  metadataBase: new URL("https://musu.world"),
  title: {
    default: "AIエージェントチーム×ソロプレナー向けAIワークスペース | musu",
    template: "%s | musu",
  },
  description: "musuはソロプレナー・ひとり会社・フリーランスのための専属AIチーム。AI秘書・マーケティング・リサーチ・戦略のエージェントがチームで仕事をサポート。Gmail・Notion・Slack・X連携。月額固定費なし。",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ひとりだけど、ひとりじゃない。- musu",
    description: "AIエージェントチームと一緒に、ひとり会社を回そう。musuはソロプレナーのためのAIワークスペースです。",
    url: "https://musu.world",
    siteName: "musu",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "musu - ひとりだけど、ひとりじゃない。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ひとりだけど、ひとりじゃない。- musu",
    description: "AIエージェントチームと一緒に、ひとり会社を回そう。musuはソロプレナーのためのAIワークスペースです。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://musu.world",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "musu",
    url: "https://musu.world",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    description: "ソロプレナー・ひとり会社・フリーランスのためのAIエージェントワークスペース",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
      description: "初回クレジット付き。月額固定費なし。",
    },
    creator: {
      "@type": "Organization",
      name: "株式会社CFAC",
      url: "https://cfac.co.jp/",
    },
  };

  return (
    <html lang="ja">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-7PP0KVSBQE" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-7PP0KVSBQE');` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
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
