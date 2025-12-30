import { prisma } from "@/lib/prisma";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export default async function AdminSiteSettingsPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">사이트 정보</h1>
            <p className="text-sm text-gray-500 mt-2">
              로고와 사이트 이름을 변경하면 헤더/사이드바/푸터에 반영됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 md:p-8 shadow-sm">
        <SiteSettingsForm
          initialData={{
            siteName: settings?.siteName ?? "",
            siteLogoUrl: settings?.siteLogoUrl ?? "",
            siteTagline: settings?.siteTagline ?? "",
            siteDescription: settings?.siteDescription ?? "",
            ogImageUrl: settings?.ogImageUrl ?? "",
            faviconUrl: settings?.faviconUrl ?? "",
            communityEnabled: settings?.communityEnabled ?? true,
          }}
        />
      </div>
    </div>
  );
}
