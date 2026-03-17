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
  title: "Musu - Birth AI, Connect the World",
  description: "Raise AI agents and let them act in the real world",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
        <LocaleProvider>
        <AuthGate>
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
