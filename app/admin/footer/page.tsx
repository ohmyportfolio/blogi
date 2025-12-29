import { prisma } from "@/lib/prisma";
import { FooterSettingsForm } from "@/components/admin/footer-settings-form";

export default async function AdminFooterPage() {
  const settings = await prisma.siteSettings.findUnique({
    where: { key: "default" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl">푸터 설정</h1>
        <p className="text-sm text-gray-500 mt-2">
          이용약관/개인정보처리방침 링크와 사업자 정보, 소셜 링크를 관리합니다.
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow">
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
          }}
        />
      </div>
    </div>
  );
}
