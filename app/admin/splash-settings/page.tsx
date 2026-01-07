import { prisma } from "@/lib/prisma";
import { SplashSettingsForm } from "@/components/admin/splash-settings-form";

export default async function AdminSplashSettingsPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">스플래시 설정</h1>
            <p className="text-sm text-gray-500 mt-2">
              모바일에서 첫 접속 시 표시되는 스플래시 화면을 설정합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 md:p-8 shadow-sm">
        <SplashSettingsForm
          initialData={{
            splashEnabled: settings?.splashEnabled ?? false,
            splashBackgroundColor: settings?.splashBackgroundColor ?? "#ffffff",
            splashLogoUrl: settings?.splashLogoUrl ?? "",
            splashLogoSize: settings?.splashLogoSize ?? "medium",
            siteLogoUrl: settings?.siteLogoUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
