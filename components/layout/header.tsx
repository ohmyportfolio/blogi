import { HeaderClient } from "@/components/layout/header-client";
import { getMenuByKey } from "@/lib/menus";
import { getFooterSettings } from "@/lib/footer-settings";
import { getSiteSettings } from "@/lib/site-settings";
import { getCommunityGroups } from "@/lib/community";
import {
  DEFAULT_LOGO_INVERSE_URL,
  DEFAULT_LOGO_URL,
  getDefaultBannerForBackground,
} from "@/lib/branding";

export const Header = async () => {
  const menu = await getMenuByKey("main");
  const [footerSettings, siteSettings, communityGroups] = await Promise.all([
    getFooterSettings(),
    getSiteSettings(),
    getCommunityGroups(),
  ]);
  const logoFallback = siteSettings.siteLogoUrl || footerSettings.siteLogoUrl;
  const headerLogoUrl =
    siteSettings.siteLogoMode === "light"
      ? siteSettings.siteLogoUrlLight || siteSettings.siteLogoUrlDark || logoFallback || DEFAULT_LOGO_URL
      : siteSettings.siteLogoMode === "dark"
      ? siteSettings.siteLogoUrlDark || siteSettings.siteLogoUrlLight || logoFallback || DEFAULT_LOGO_INVERSE_URL
      : siteSettings.siteLogoUrlLight || siteSettings.siteLogoUrlDark || logoFallback || DEFAULT_LOGO_URL;
  const fallbackBannerUrl = getDefaultBannerForBackground(siteSettings.themeColors.headerBg);

  return (
    <HeaderClient
      menuItems={menu.items}
      siteName={footerSettings.siteName || "사이트"}
      siteLogoUrl={headerLogoUrl}
      siteBannerUrl={siteSettings.siteBannerUrl || fallbackBannerUrl}
      siteTagline={siteSettings.siteTagline || ""}
      communityGroups={communityGroups}
      headerStyle={siteSettings.headerStyle}
      headerScrollEffect={siteSettings.headerScrollEffect}
      hideSearch={siteSettings.hideSearch}
      logoSize={siteSettings.siteLogoSize}
      bannerSize={siteSettings.logoSize}
      bannerWidth={siteSettings.bannerWidth}
      bannerMaxHeight={siteSettings.bannerMaxHeight}
      bannerPosition={siteSettings.bannerPosition}
      siteNamePosition={siteSettings.siteNamePosition}
      showMobileTopSiteName={siteSettings.showMobileTopSiteName}
      showMobileTopSiteNameSize={siteSettings.showMobileTopSiteNameSize}
    />
  );
};
