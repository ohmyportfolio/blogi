import { HeaderClient } from "@/components/layout/header-client";
import { getMenuByKey } from "@/lib/menus";
import { getFooterSettings } from "@/lib/footer-settings";
import { getSiteSettings } from "@/lib/site-settings";
import { getCommunityGroups } from "@/lib/community";

export const Header = async () => {
  const menu = await getMenuByKey("main");
  const [footerSettings, siteSettings, communityGroups] = await Promise.all([
    getFooterSettings(),
    getSiteSettings(),
    getCommunityGroups(),
  ]);
  return (
    <HeaderClient
      menuItems={menu.items}
      siteName={footerSettings.siteName || "다낭VIP투어"}
      siteLogoUrl={footerSettings.siteLogoUrl || "/logo.png"}
      communityGroups={communityGroups}
      communityEnabled={siteSettings.communityEnabled}
    />
  );
};
