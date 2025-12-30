"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { FileText, Globe, Image, ImageIcon, Tag, Users, Upload } from "lucide-react";

interface SiteSettingsFormProps {
  initialData: {
    siteName?: string | null;
    siteLogoUrl?: string | null;
    siteTagline?: string | null;
    siteDescription?: string | null;
    ogImageUrl?: string | null;
    faviconUrl?: string | null;
    communityEnabled?: boolean | null;
  };
}

export const SiteSettingsForm = ({ initialData }: SiteSettingsFormProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [siteName, setSiteName] = useState(initialData.siteName ?? "");
  const [siteLogoUrl, setSiteLogoUrl] = useState(initialData.siteLogoUrl ?? "");
  const [siteTagline, setSiteTagline] = useState(initialData.siteTagline ?? "");
  const [siteDescription, setSiteDescription] = useState(initialData.siteDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initialData.ogImageUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initialData.faviconUrl ?? "");
  const [communityEnabled, setCommunityEnabled] = useState(
    typeof initialData.communityEnabled === "boolean" ? initialData.communityEnabled : true
  );
  const [uploading, setUploading] = useState(false);

  const createUploadHandler =
    (setter: (value: string) => void, successMessage: string, failMessage: string) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("scope", "branding");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || failMessage, "error");
          return;
        }
        const data = await res.json();
        setter(data.url);
        showToast(successMessage, "success");
      } finally {
        setUploading(false);
        event.target.value = "";
      }
    };

  const handleLogoUpload = createUploadHandler(
    setSiteLogoUrl,
    "로고가 업로드되었습니다.",
    "로고 업로드에 실패했습니다."
  );
  const handleOgUpload = createUploadHandler(
    setOgImageUrl,
    "OG 이미지가 업로드되었습니다.",
    "OG 이미지 업로드에 실패했습니다."
  );
  const handleFaviconUpload = createUploadHandler(
    setFaviconUrl,
    "파비콘이 업로드되었습니다.",
    "파비콘 업로드에 실패했습니다."
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        siteName: siteName.trim() || null,
        siteLogoUrl: siteLogoUrl.trim() || null,
        siteTagline: siteTagline.trim() || null,
        siteDescription: siteDescription.trim() || null,
        ogImageUrl: ogImageUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
        communityEnabled,
      };
      const res = await fetch("/api/admin/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }
      showToast("사이트 정보가 저장되었습니다.", "success");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 사이트 이름 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <Globe className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">사이트 이름</label>
          <Input
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
            placeholder="사이트 이름을 입력하세요"
            disabled={isPending}
            className="bg-white"
          />
          <p className="text-xs text-gray-400">헤더와 브라우저 탭에 표시됩니다.</p>
        </div>
      </div>

      {/* 로고 URL */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
          <Image className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">로고 URL</label>
          <Input
            value={siteLogoUrl}
            onChange={(event) => setSiteLogoUrl(event.target.value)}
            placeholder="https://example.com/logo.png"
            disabled={isPending}
            className="bg-white"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              파일 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          {siteLogoUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
              <img src={siteLogoUrl} alt="로고 미리보기" className="h-10 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 사이트 태그라인 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
          <Tag className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">태그라인</label>
          <Input
            value={siteTagline}
            onChange={(event) => setSiteTagline(event.target.value)}
            placeholder="예) Premium Travel Concierge"
            disabled={isPending}
            className="bg-white"
          />
          <p className="text-xs text-gray-400">헤더와 홈에 표시되는 짧은 문구입니다.</p>
        </div>
      </div>

      {/* 사이트 설명 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">사이트 설명</label>
          <Textarea
            value={siteDescription}
            onChange={(event) => setSiteDescription(event.target.value)}
            placeholder="검색/메타 설명에 사용됩니다."
            disabled={isPending}
            className="bg-white min-h-[110px]"
          />
          <p className="text-xs text-gray-400">SEO 설명, 공유 미리보기에 노출됩니다.</p>
        </div>
      </div>

      {/* OG 이미지 URL */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">OG 이미지 URL</label>
          <Input
            value={ogImageUrl}
            onChange={(event) => setOgImageUrl(event.target.value)}
            placeholder="https://example.com/og-image.jpg"
            disabled={isPending}
            className="bg-white"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              파일 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleOgUpload}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          {ogImageUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
              <img src={ogImageUrl} alt="OG 미리보기" className="h-16 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 파비콘 URL */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600">
          <Image className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">파비콘 URL</label>
          <Input
            value={faviconUrl}
            onChange={(event) => setFaviconUrl(event.target.value)}
            placeholder="https://example.com/favicon.png"
            disabled={isPending}
            className="bg-white"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              파일 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleFaviconUpload}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          {faviconUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
              <img src={faviconUrl} alt="파비콘 미리보기" className="h-8 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 커뮤니티 기능 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${communityEnabled ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">커뮤니티 기능</label>
            <button
              type="button"
              onClick={() => setCommunityEnabled(!communityEnabled)}
              disabled={isPending}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                communityEnabled ? "bg-purple-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  communityEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            비활성화하면 커뮤니티 메뉴와 게시판이 숨겨집니다.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
};
