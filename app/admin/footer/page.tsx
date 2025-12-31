import { prisma } from "@/lib/prisma";
import { FooterSettingsForm } from "@/components/admin/footer-settings-form";

export default async function AdminFooterPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">푸터 설정</h1>
            <p className="text-sm text-gray-500 mt-2">
              이용약관/개인정보처리방침 링크와 사업자 정보, 소셜 링크를 관리합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 md:p-8 shadow-sm">
        <FooterSettingsForm
          initialData={{
            footerEnabled: settings?.footerEnabled ?? true,
            copyrightText: settings?.copyrightText ?? "",
            showCopyright: settings?.showCopyright ?? true,
            termsContent: settings?.termsContent ?? "",
            termsContentMarkdown: settings?.termsContentMarkdown ?? "",
            privacyContent: settings?.privacyContent ?? "",
            privacyContentMarkdown: settings?.privacyContentMarkdown ?? "",
            showTerms: settings?.showTerms ?? true,
            showPrivacy: settings?.showPrivacy ?? true,
            businessLines: Array.isArray(settings?.businessLines)
              ? (settings?.businessLines as string[])
              : [],
            showBusinessInfo: settings?.showBusinessInfo ?? true,
            socialLinks: Array.isArray(settings?.socialLinks)
              ? (settings?.socialLinks as { key: string; label: string; url: string }[])
              : [],
            showSocials: settings?.showSocials ?? true,
            socialIconStyle: (settings?.socialIconStyle as "branded" | "branded-sm" | "minimal") ?? "branded",
            socialAlignment: (settings?.socialAlignment as "left" | "center" | "right") ?? "center",
            showSocialLabels: settings?.showSocialLabels ?? false,
          }}
        />
      </div>
    </div>
  );
}
