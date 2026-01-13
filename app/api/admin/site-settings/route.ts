import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
};

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const {
    siteName,
    siteLogoUrl,
    siteLogoUrlLight,
    siteLogoUrlDark,
    siteLogoMode,
    siteLogoSize,
    siteBannerUrl,
    bannerWidth,
    bannerMaxHeight,
    bannerPosition,
    siteTagline,
    siteDescription,
    ogImageUrl,
    faviconUrl,
    faviconPng16,
    faviconPng32,
    faviconAppleTouch,
    faviconAndroid192,
    faviconAndroid512,
    faviconIco,
    headerScrollEffect,
    hideSearch,
    logoSize,
    siteNamePosition,
    showMobileTopSiteName,
    showMobileTopSiteNameSize,
  } = body;

  const resolvedLogoFallback =
    (typeof siteLogoUrlLight === "string" && siteLogoUrlLight.trim() ? siteLogoUrlLight.trim() : null) ||
    (typeof siteLogoUrlDark === "string" && siteLogoUrlDark.trim() ? siteLogoUrlDark.trim() : null) ||
    (typeof siteLogoUrl === "string" && siteLogoUrl.trim() ? siteLogoUrl.trim() : null);

  const data: Record<string, unknown> = {
    siteName: typeof siteName === "string" && siteName.trim() ? siteName.trim() : null,
    siteLogoUrl: resolvedLogoFallback,
    siteLogoUrlLight:
      typeof siteLogoUrlLight === "string" && siteLogoUrlLight.trim()
        ? siteLogoUrlLight.trim()
        : null,
    siteLogoUrlDark:
      typeof siteLogoUrlDark === "string" && siteLogoUrlDark.trim()
        ? siteLogoUrlDark.trim()
        : null,
    siteLogoMode:
      typeof siteLogoMode === "string" && ["light", "dark"].includes(siteLogoMode)
        ? siteLogoMode
        : "light",
    siteBannerUrl: typeof siteBannerUrl === "string" && siteBannerUrl.trim() ? siteBannerUrl.trim() : null,
    siteTagline: typeof siteTagline === "string" && siteTagline.trim() ? siteTagline.trim() : null,
    siteDescription:
      typeof siteDescription === "string" && siteDescription.trim()
        ? siteDescription.trim()
        : null,
    ogImageUrl: typeof ogImageUrl === "string" && ogImageUrl.trim() ? ogImageUrl.trim() : null,
    faviconUrl: typeof faviconUrl === "string" && faviconUrl.trim() ? faviconUrl.trim() : null,
    faviconPng16: typeof faviconPng16 === "string" && faviconPng16.trim() ? faviconPng16.trim() : null,
    faviconPng32: typeof faviconPng32 === "string" && faviconPng32.trim() ? faviconPng32.trim() : null,
    faviconAppleTouch:
      typeof faviconAppleTouch === "string" && faviconAppleTouch.trim()
        ? faviconAppleTouch.trim()
        : null,
    faviconAndroid192:
      typeof faviconAndroid192 === "string" && faviconAndroid192.trim()
        ? faviconAndroid192.trim()
        : null,
    faviconAndroid512:
      typeof faviconAndroid512 === "string" && faviconAndroid512.trim()
        ? faviconAndroid512.trim()
        : null,
    faviconIco: typeof faviconIco === "string" && faviconIco.trim() ? faviconIco.trim() : null,
  };

  if (typeof headerScrollEffect === "boolean") {
    data.headerScrollEffect = headerScrollEffect;
  }
  if (typeof hideSearch === "boolean") {
    data.hideSearch = hideSearch;
  }
  if (
    typeof logoSize === "string" &&
    ["xsmall", "small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"].includes(logoSize)
  ) {
    data.logoSize = logoSize;
  }
  if (
    typeof siteLogoSize === "string" &&
    ["xsmall", "small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"].includes(siteLogoSize)
  ) {
    data.siteLogoSize = siteLogoSize;
  }
  if (typeof siteNamePosition === "string" && ["logo", "header1"].includes(siteNamePosition)) {
    data.siteNamePosition = siteNamePosition;
  }
  if (typeof showMobileTopSiteName === "boolean") {
    data.showMobileTopSiteName = showMobileTopSiteName;
  }
  if (typeof showMobileTopSiteNameSize === "string" && ["sm", "md", "lg"].includes(showMobileTopSiteNameSize)) {
    data.showMobileTopSiteNameSize = showMobileTopSiteNameSize;
  }
  if (
    typeof bannerWidth === "string" &&
    ["xsmall", "small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"].includes(bannerWidth)
  ) {
    data.bannerWidth = bannerWidth;
  }
  if (typeof bannerMaxHeight === "string") {
    // 빈 문자열, 프리셋 값, 또는 1~500 범위의 숫자
    if (bannerMaxHeight === "" || bannerMaxHeight === "none") {
      data.bannerMaxHeight = "";
    } else if (["40", "60", "80", "100", "120"].includes(bannerMaxHeight)) {
      data.bannerMaxHeight = bannerMaxHeight;
    } else {
      const parsed = parseInt(bannerMaxHeight, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 500) {
        data.bannerMaxHeight = String(parsed);
      }
    }
  }
  if (
    typeof bannerPosition === "string" &&
    ["top", "center", "bottom"].includes(bannerPosition)
  ) {
    data.bannerPosition = bannerPosition;
  }

  const settings = await prisma.siteSettings.upsert({
    where: { key: "default" },
    update: data,
    create: {
      key: "default",
      ...data,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/community");
  revalidatePath("/site.webmanifest");
  return NextResponse.json(settings);
}
