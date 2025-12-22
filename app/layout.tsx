import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/ui/toast";

const instrumentSans = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-head",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "다낭VIP투어",
  description: "다낭 여행의 모든 것, 다낭 VIP 투어에서!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${instrumentSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1 bg-transparent">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
