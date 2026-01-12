import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { SplashScreen } from "@/components/layout/splash-screen";
import { AuthProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { getSiteSettings } from "@/lib/site-settings";
import { DEFAULT_LOGO_INVERSE_URL, DEFAULT_LOGO_URL } from "@/lib/branding";

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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const metadataBase =
    typeof process.env.SITE_URL === "string" && process.env.SITE_URL.trim()
      ? new URL(process.env.SITE_URL)
      : undefined;
  const title = settings.siteName || "사이트";
  const description =
    settings.siteDescription || settings.siteTagline || "사이트 소개 내용을 입력해주세요.";
  const ogImage =
    settings.ogImageUrl ||
    settings.siteBannerUrl ||
    settings.siteLogoUrlLight ||
    settings.siteLogoUrlDark ||
    settings.siteLogoUrl ||
    DEFAULT_LOGO_URL;

  const iconEntries: Array<{ url: string; sizes?: string; type?: string } | string> = [];
  if (settings.faviconIco) {
    iconEntries.push({ url: settings.faviconIco, type: "image/x-icon" });
  }
  if (settings.faviconPng32) {
    iconEntries.push({ url: settings.faviconPng32, sizes: "32x32", type: "image/png" });
  }
  if (settings.faviconPng16) {
    iconEntries.push({ url: settings.faviconPng16, sizes: "16x16", type: "image/png" });
  }
  if (!iconEntries.length && settings.faviconUrl) {
    iconEntries.push(settings.faviconUrl);
  }
  const appleIcons = settings.faviconAppleTouch
    ? [{ url: settings.faviconAppleTouch, sizes: "180x180", type: "image/png" }]
    : undefined;
  const manifest =
    settings.faviconAndroid192 || settings.faviconAndroid512 ? "/site.webmanifest" : undefined;

  return {
    title,
    description,
    metadataBase,
    openGraph: ogImage
      ? {
          title,
          description,
          images: [{ url: ogImage }],
        }
      : {
          title,
          description,
        },
    icons: iconEntries.length
      ? {
          icon: iconEntries,
          apple: appleIcons,
          shortcut: settings.faviconUrl || iconEntries[0],
        }
      : undefined,
    manifest,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  // 스플래시 로고: splashLogoUrl → siteLogoUrl → 기본 로고
  const splashLogoFallback =
    settings.siteLogoMode === "dark"
      ? settings.siteLogoUrlDark || settings.siteLogoUrlLight || settings.siteLogoUrl || DEFAULT_LOGO_INVERSE_URL
      : settings.siteLogoUrlLight || settings.siteLogoUrlDark || settings.siteLogoUrl || DEFAULT_LOGO_URL;
  const splashLogoUrl = settings.splashLogoUrl || splashLogoFallback;

  return (
    <html lang="ko">
      <body
        className={`${instrumentSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <ThemeProvider themeColors={settings.themeColors}>
                <SplashScreen
                  enabled={settings.splashEnabled}
                  backgroundColor={settings.splashBackgroundColor}
                  logoUrl={splashLogoUrl}
                  logoSize={settings.splashLogoSize}
                />
                <Header />
                <main
                  className="flex-1 flex flex-col pt-0"
                  style={{ backgroundColor: "var(--theme-content-bg)" }}
                >
                  {children}
                </main>
                <ScrollToTop />
                <Footer />
              </ThemeProvider>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
