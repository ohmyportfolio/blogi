import { prefersLightText } from "@/lib/theme-presets";

export const DEFAULT_LOGO_URL = "/logo.svg";
export const DEFAULT_LOGO_INVERSE_URL = "/logo_white.svg";
export const DEFAULT_BANNER_URL = "/logo.svg";
export const DEFAULT_BANNER_INVERSE_URL = "/logo_white.svg";

export const getDefaultLogoForBackground = (backgroundColor: string) =>
  prefersLightText(backgroundColor) ? DEFAULT_LOGO_INVERSE_URL : DEFAULT_LOGO_URL;

export const getDefaultBannerForBackground = (backgroundColor: string) =>
  prefersLightText(backgroundColor) ? DEFAULT_BANNER_INVERSE_URL : DEFAULT_BANNER_URL;

// Default thumbnails for menu items
export const DEFAULT_CONTENT_THUMBNAIL_URL = "/thumbnails/default-content.svg";
export const DEFAULT_COMMUNITY_THUMBNAIL_URL = "/thumbnails/default-community.svg";
export const DEFAULT_EXTERNAL_THUMBNAIL_URL = "/thumbnails/default-external.svg";

export const getDefaultThumbnailForLinkType = (
  linkType: "category" | "community" | "external"
): string | null => {
  switch (linkType) {
    case "category":
      return DEFAULT_CONTENT_THUMBNAIL_URL;
    case "community":
      return DEFAULT_COMMUNITY_THUMBNAIL_URL;
    case "external":
      return DEFAULT_EXTERNAL_THUMBNAIL_URL;
    default:
      return null;
  }
};

export const getLogoForBackground = (
  backgroundColor: string,
  options: {
    light?: string | null;
    dark?: string | null;
    fallback?: string | null;
  } = {}
) => {
  const prefersLight = prefersLightText(backgroundColor);
  if (prefersLight) {
    return (
      options.dark?.trim() ||
      options.light?.trim() ||
      options.fallback?.trim() ||
      getDefaultLogoForBackground(backgroundColor)
    );
  }
  return (
    options.light?.trim() ||
    options.dark?.trim() ||
    options.fallback?.trim() ||
    getDefaultLogoForBackground(backgroundColor)
  );
};
