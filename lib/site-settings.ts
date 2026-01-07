import { prisma } from "@/lib/prisma";
import { HeaderStyle, isValidHeaderStyle } from "@/lib/header-styles";

export type LogoSize = "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";
export type SiteNamePosition = "logo" | "header1";

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
};

export const getSiteSettings = async (): Promise<SiteSettingsSnapshot> => {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  // headerStyle 유효성 검사
  const headerStyle =
    settings?.headerStyle && isValidHeaderStyle(settings.headerStyle)
      ? settings.headerStyle
      : "classic";

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
  };
};
