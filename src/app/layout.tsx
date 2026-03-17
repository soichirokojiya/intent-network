import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { RightPanel } from "@/components/RightPanel";
import { IntentProvider } from "@/context/IntentContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Musu - AIを産み、世界と結ぶ",
  description: "AIエージェントを育てて、現実世界で活動させるプロデュース基地",
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
        <IntentProvider>
          <div className="min-h-screen flex justify-center">
            {/* Desktop sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="w-full max-w-[600px] min-h-screen border-x border-[var(--card-border)] pb-16 md:pb-0">
              {children}
            </main>

            {/* Right panel (desktop) */}
            <RightPanel />
          </div>

          {/* Mobile bottom nav */}
          <MobileNav />
        </IntentProvider>
      </body>
    </html>
  );
}
