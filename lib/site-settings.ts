import { prisma } from "@/lib/prisma";
import { HeaderStyle } from "@/lib/header-styles";

export type LogoSize = "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";
export type MobileTopSiteNameSize = "sm" | "md" | "lg";
export type SiteNamePosition = "logo" | "header1";
export type SplashLogoSize = "small" | "medium" | "large" | "xlarge";

export type SiteSettingsSnapshot = {
  siteName?: string | null;
  siteLogoUrl?: string | null;
  siteTagline?: string | null;
  siteDescription?: string | null;
  ogImageUrl?: string | null;
  faviconUrl?: string | null;
  // 헤더 스타일 설정
  headerStyle: HeaderStyle;
  headerScrollEffect: boolean;
  // 헤더 검색 및 로고 설정
  hideSearch: boolean;
  logoSize: LogoSize;
  siteNamePosition: SiteNamePosition;
  showMobileTopSiteName: boolean;
  showMobileTopSiteNameSize: MobileTopSiteNameSize;
  // 스플래시 스크린 설정
  splashEnabled: boolean;
  splashBackgroundColor: string;
  splashLogoUrl?: string | null;
  splashLogoSize: SplashLogoSize;
};

export const getSiteSettings = async (): Promise<SiteSettingsSnapshot> => {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  const headerStyle: HeaderStyle = "classic";

  // logoSize 유효성 검사
  const validLogoSizes: LogoSize[] = ["small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"];
  const logoSize: LogoSize =
    settings?.logoSize && validLogoSizes.includes(settings.logoSize as LogoSize)
      ? (settings.logoSize as LogoSize)
      : "medium";

  // siteNamePosition 유효성 검사
  const validPositions: SiteNamePosition[] = ["logo", "header1"];
  const siteNamePosition: SiteNamePosition =
    settings?.siteNamePosition && validPositions.includes(settings.siteNamePosition as SiteNamePosition)
      ? (settings.siteNamePosition as SiteNamePosition)
      : "logo";

  const validMobileTopSiteNameSizes: MobileTopSiteNameSize[] = ["sm", "md", "lg"];
  const showMobileTopSiteNameSize: MobileTopSiteNameSize =
    settings?.showMobileTopSiteNameSize &&
    validMobileTopSiteNameSizes.includes(settings.showMobileTopSiteNameSize as MobileTopSiteNameSize)
      ? (settings.showMobileTopSiteNameSize as MobileTopSiteNameSize)
      : "md";

  return {
    siteName: settings?.siteName ?? null,
    siteLogoUrl: settings?.siteLogoUrl ?? null,
    siteTagline: settings?.siteTagline ?? null,
    siteDescription: settings?.siteDescription ?? null,
    ogImageUrl: settings?.ogImageUrl ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
    headerStyle,
    headerScrollEffect: settings?.headerScrollEffect ?? true,
    hideSearch: settings?.hideSearch ?? false,
    logoSize,
    siteNamePosition,
    showMobileTopSiteName: settings?.showMobileTopSiteName ?? true,
    showMobileTopSiteNameSize,
    // 스플래시 스크린 설정
    splashEnabled: settings?.splashEnabled ?? false,
    splashBackgroundColor: settings?.splashBackgroundColor ?? "#ffffff",
    splashLogoUrl: settings?.splashLogoUrl ?? null,
    splashLogoSize: (["small", "medium", "large", "xlarge"].includes(settings?.splashLogoSize ?? "")
      ? settings?.splashLogoSize
      : "medium") as SplashLogoSize,
  };
};
