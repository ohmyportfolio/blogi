import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isValidHeaderStyle } from "@/lib/header-styles";

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
    siteTagline,
    siteDescription,
    ogImageUrl,
    faviconUrl,
    headerStyle,
    headerScrollEffect,
    hideSearch,
    logoSize,
    siteNamePosition,
  } = body;

  const data: Record<string, unknown> = {
    siteName: typeof siteName === "string" && siteName.trim() ? siteName.trim() : null,
    siteLogoUrl: typeof siteLogoUrl === "string" && siteLogoUrl.trim() ? siteLogoUrl.trim() : null,
    siteTagline: typeof siteTagline === "string" && siteTagline.trim() ? siteTagline.trim() : null,
    siteDescription:
      typeof siteDescription === "string" && siteDescription.trim()
        ? siteDescription.trim()
        : null,
    ogImageUrl: typeof ogImageUrl === "string" && ogImageUrl.trim() ? ogImageUrl.trim() : null,
    faviconUrl: typeof faviconUrl === "string" && faviconUrl.trim() ? faviconUrl.trim() : null,
  };

  // 헤더 스타일 설정 추가
  if (typeof headerStyle === "string" && isValidHeaderStyle(headerStyle)) {
    data.headerStyle = headerStyle;
  }
  if (typeof headerScrollEffect === "boolean") {
    data.headerScrollEffect = headerScrollEffect;
  }
  if (typeof hideSearch === "boolean") {
    data.hideSearch = hideSearch;
  }
  if (typeof logoSize === "string" && ["small", "medium", "large", "xlarge", "xxlarge", "xxxlarge"].includes(logoSize)) {
    data.logoSize = logoSize;
  }
  if (typeof siteNamePosition === "string" && ["logo", "header1"].includes(siteNamePosition)) {
    data.siteNamePosition = siteNamePosition;
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
  return NextResponse.json(settings);
}
