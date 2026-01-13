import { prisma } from "@/lib/prisma";
import { HeaderStyle } from "@/lib/header-styles";
import { getThemePreset, getDefaultTheme, type ThemeColors } from "@/lib/theme-presets";
import { DEFAULT_LOGO_URL, DEFAULT_LOGO_INVERSE_URL } from "@/lib/branding";

export type LogoSize = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";
export type MobileTopSiteNameSize = "sm" | "md" | "lg";
export type SiteNamePosition = "logo" | "header1";
export type SplashLogoSize = "small" | "medium" | "large" | "xlarge";
export type BannerWidth = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge" | "xxxlarge";
export type BannerMaxHeight = string; // "" (빈 문자열) = 제한없음, "1"~"500" 숫자 문자열
export type BannerPosition = "top" | "center" | "bottom";

export type SiteSettingsSnapshot = {
  siteName?: string | null;
  siteLogoUrl?: string | null;
  siteLogoUrlLight?: string | null;
  siteLogoUrlDark?: string | null;
  siteLogoMode: "light" | "dark";
  siteLogoSize: LogoSize;
  siteBannerUrl?: string | null;
  bannerWidth: BannerWidth;
  bannerMaxHeight: string; // "" = 제한없음, "1"~"500" 숫자
  bannerPosition: BannerPosition;
  siteTagline?: string | null;
  siteDescription?: string | null;
  ogImageUrl?: string | null;
  faviconUrl?: string | null;
  faviconPng16?: string | null;
  faviconPng32?: string | null;
  faviconAppleTouch?: string | null;
  faviconAndroid192?: string | null;
  faviconAndroid512?: string | null;
  faviconIco?: string | null;
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
  // 테마 설정
  themeColors: ThemeColors;
};

export const getSiteSettings = async (): Promise<SiteSettingsSnapshot> => {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  const headerStyle: HeaderStyle = "classic";

  // logoSize 유효성 검사 (배너 높이용)
  const validLogoSizes: LogoSize[] = [
    "xsmall",
    "small",
    "medium",
    "large",
    "xlarge",
    "xxlarge",
    "xxxlarge",
  ];
  const logoSize: LogoSize =
    settings?.logoSize && validLogoSizes.includes(settings.logoSize as LogoSize)
      ? (settings.logoSize as LogoSize)
      : "medium";
  const siteLogoSize: LogoSize =
    settings?.siteLogoSize && validLogoSizes.includes(settings.siteLogoSize as LogoSize)
      ? (settings.siteLogoSize as LogoSize)
      : logoSize;

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

  const legacyLogo = settings?.siteLogoUrl ?? null;
  const logoMode =
    settings?.siteLogoMode === "dark" ? "dark" : "light";

  // 배너 설정 유효성 검사
  const validBannerWidths: BannerWidth[] = ["xsmall", "small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"];
  const bannerWidth: BannerWidth =
    settings?.bannerWidth && validBannerWidths.includes(settings.bannerWidth as BannerWidth)
      ? (settings.bannerWidth as BannerWidth)
      : "xxxlarge"; // 기본값 100%

  // bannerMaxHeight: 빈 문자열이면 제한없음, 1~500 범위의 숫자 문자열
  const rawMaxHeight = settings?.bannerMaxHeight ?? "";
  const parsedHeight = parseInt(rawMaxHeight, 10);
  const bannerMaxHeight: string =
    rawMaxHeight === "" ? "" :
    (!isNaN(parsedHeight) && parsedHeight >= 1 && parsedHeight <= 500) ? String(parsedHeight) : "";

  const validBannerPositions: BannerPosition[] = ["top", "center", "bottom"];
  const bannerPosition: BannerPosition =
    settings?.bannerPosition && validBannerPositions.includes(settings.bannerPosition as BannerPosition)
      ? (settings.bannerPosition as BannerPosition)
      : "center";

  return {
    siteName: settings?.siteName ?? null,
    siteLogoUrl: legacyLogo ?? DEFAULT_LOGO_URL,
    siteLogoUrlLight: settings?.siteLogoUrlLight ?? legacyLogo ?? DEFAULT_LOGO_URL,
    siteLogoUrlDark: settings?.siteLogoUrlDark ?? DEFAULT_LOGO_INVERSE_URL,
    siteLogoMode: logoMode,
    siteLogoSize,
    siteBannerUrl: settings?.siteBannerUrl ?? null,
    bannerWidth,
    bannerMaxHeight,
    bannerPosition,
    siteTagline: settings?.siteTagline ?? null,
    siteDescription: settings?.siteDescription ?? null,
    ogImageUrl: settings?.ogImageUrl ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
    faviconPng16: settings?.faviconPng16 ?? null,
    faviconPng32: settings?.faviconPng32 ?? null,
    faviconAppleTouch: settings?.faviconAppleTouch ?? null,
    faviconAndroid192: settings?.faviconAndroid192 ?? null,
    faviconAndroid512: settings?.faviconAndroid512 ?? null,
    faviconIco: settings?.faviconIco ?? null,
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
    // 테마 설정
    themeColors: getThemeColors(settings),
  };
};

// 테마 색상 계산 (프리셋 + 커스텀 오버라이드)
function getThemeColors(settings: {
  themePreset?: string;
  customHeaderBg?: string | null;
  customHeaderText?: string | null;
  customHeaderSiteNameText?: string | null;
  customHeaderMenuText?: string | null;
  customFooterBg?: string | null;
  customFooterText?: string | null;
  customPrimary?: string | null;
  customAccent?: string | null;
  customContentBg?: string | null;
  customButtonText?: string | null;
} | null): ThemeColors {
  const preset = settings?.themePreset
    ? getThemePreset(settings.themePreset)
    : getDefaultTheme();

  const presetColors = preset?.colors ?? getDefaultTheme().colors;

  return {
    headerBg: settings?.customHeaderBg ?? presetColors.headerBg,
    headerText: settings?.customHeaderText ?? presetColors.headerText,
    headerSiteNameText: settings?.customHeaderSiteNameText ?? presetColors.headerSiteNameText,
    headerMenuText: settings?.customHeaderMenuText ?? presetColors.headerMenuText,
    footerBg: settings?.customFooterBg ?? settings?.customHeaderBg ?? presetColors.footerBg,
    footerText: settings?.customFooterText ?? settings?.customHeaderText ?? presetColors.footerText,
    primary: settings?.customPrimary ?? presetColors.primary,
    accent: settings?.customAccent ?? presetColors.accent,
    contentBg: settings?.customContentBg ?? presetColors.contentBg,
    buttonText: settings?.customButtonText ?? presetColors.buttonText,
  };
}
