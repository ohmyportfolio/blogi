import { prisma } from "@/lib/prisma";
import { NoticeSettingsForm } from "@/components/admin/notice-settings-form";

export default async function AdminNoticesPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">공지사항 관리</h1>
            <p className="text-sm text-gray-500 mt-2">
              상단 공지사항 바의 노출 여부와 문구를 관리합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 md:p-8 shadow-sm">
        <NoticeSettingsForm
          initialData={{
            noticeTickerEnabled: settings?.noticeTickerEnabled ?? false,
            noticeItems: Array.isArray(settings?.noticeItems)
              ? (settings.noticeItems as { id: string; text: string; link?: string }[])
              : [],
          }}
        />
      </div>
    </div>
  );
}
