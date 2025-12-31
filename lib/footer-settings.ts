import { prisma } from "@/lib/prisma";

export type SocialLink = {
  key: string;
  label: string;
  url: string;
};

// branded: 브랜드 컬러 배경 + 아이콘
// branded-sm: 브랜드 컬러 배경 + 아이콘 (작은 사이즈)
// minimal: lucide 아이콘 (배경 없음)
export type SocialIconStyle = "branded" | "branded-sm" | "minimal";
export type SocialAlignment = "left" | "center" | "right";

export type FooterSettings = {
  siteName?: string | null;
  siteLogoUrl?: string | null;
  footerEnabled: boolean;
  copyrightText?: string | null;
  showCopyright: boolean;
  termsContent?: string | null;
  termsContentMarkdown?: string | null;
  privacyContent?: string | null;
  privacyContentMarkdown?: string | null;
  showTerms: boolean;
  showPrivacy: boolean;
  businessLines: string[];
  showBusinessInfo: boolean;
  socialLinks: SocialLink[];
  showSocials: boolean;
  socialIconStyle: SocialIconStyle;
  socialAlignment: SocialAlignment;
  showSocialLabels: boolean;
};

export const getFooterSettings = async (): Promise<FooterSettings> => {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  const rawSocials = Array.isArray(settings?.socialLinks) ? settings?.socialLinks : [];
  const normalizeKey = (value: string) => {
    const cleaned = value.trim().toLowerCase();
    if (["instagram", "insta"].includes(cleaned)) return "instagram";
    if (["facebook", "fb"].includes(cleaned)) return "facebook";
    if (["youtube", "yt"].includes(cleaned)) return "youtube";
    if (["tiktok", "틱톡"].includes(cleaned)) return "tiktok";
    if (["telegram", "텔레그램"].includes(cleaned)) return "telegram";
    if (["kakao", "kakaotalk", "카카오", "카카오톡"].includes(cleaned)) return "kakao";
    if (["x", "twitter"].includes(cleaned)) return "x";
    return cleaned;
  };
  const socialLinks = rawSocials
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { key?: unknown; label?: unknown; url?: unknown };
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!label || !url) return null;
      const key =
        typeof record.key === "string" && record.key.trim()
          ? normalizeKey(record.key)
          : normalizeKey(label);
      if (!key) return null;
      return { key, label, url };
    })
    .filter(Boolean) as SocialLink[];

  return {
    siteName: settings?.siteName ?? null,
    siteLogoUrl: settings?.siteLogoUrl ?? null,
    footerEnabled: settings?.footerEnabled ?? true,
    copyrightText: settings?.copyrightText ?? null,
    showCopyright: settings?.showCopyright ?? true,
    termsContent: settings?.termsContent ?? null,
    termsContentMarkdown: settings?.termsContentMarkdown ?? null,
    privacyContent: settings?.privacyContent ?? null,
    privacyContentMarkdown: settings?.privacyContentMarkdown ?? null,
    showTerms: settings?.showTerms ?? true,
    showPrivacy: settings?.showPrivacy ?? true,
    businessLines: Array.isArray(settings?.businessLines)
      ? (settings?.businessLines as string[]).filter(Boolean)
      : [],
    showBusinessInfo: settings?.showBusinessInfo ?? true,
    socialLinks,
    showSocials: settings?.showSocials ?? true,
    socialIconStyle: (["branded", "branded-sm", "minimal"].includes(settings?.socialIconStyle ?? "")
      ? settings?.socialIconStyle
      : "branded") as SocialIconStyle,
    socialAlignment: (["left", "center", "right"].includes(settings?.socialAlignment ?? "")
      ? settings?.socialAlignment
      : "center") as SocialAlignment,
    showSocialLabels: settings?.showSocialLabels ?? false,
  };
};
