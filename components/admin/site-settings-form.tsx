"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { FileText, Globe, Image, ImageIcon, Tag, Upload, MousePointer2, Check, Crop, SearchX, Maximize2, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/admin/image-cropper";
import type { LogoSize, MobileTopSiteNameSize } from "@/lib/site-settings";

const LOGO_SIZES: { value: LogoSize; label: string; description: string }[] = [
  { value: "small", label: "작음", description: "32px" },
  { value: "medium", label: "보통", description: "48px" },
  { value: "large", label: "크게", description: "64px" },
  { value: "xlarge", label: "매우 크게", description: "80px" },
  { value: "xxlarge", label: "특대", description: "100px" },
  { value: "xxxlarge", label: "최대", description: "150px" },
];

const MOBILE_TOP_NAME_SIZES: { value: MobileTopSiteNameSize; label: string; description: string }[] = [
  { value: "sm", label: "작게", description: "14px" },
  { value: "md", label: "보통", description: "16px" },
  { value: "lg", label: "크게", description: "18px" },
];

interface SiteSettingsFormProps {
  initialData: {
    siteName?: string | null;
    siteLogoUrl?: string | null;
    siteTagline?: string | null;
    siteDescription?: string | null;
    ogImageUrl?: string | null;
    faviconUrl?: string | null;
    headerScrollEffect?: boolean | null;
    hideSearch?: boolean | null;
    logoSize?: string | null;
    siteNamePosition?: string | null;
    showMobileTopSiteName?: boolean | null;
    showMobileTopSiteNameSize?: string | null;
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
  const [showTopSiteName, setShowTopSiteName] = useState(
    typeof initialData.showMobileTopSiteName === "boolean"
      ? initialData.showMobileTopSiteName
      : true
  );
  const [showTopSiteNameSize, setShowTopSiteNameSize] = useState<MobileTopSiteNameSize>(
    (initialData.showMobileTopSiteNameSize as MobileTopSiteNameSize) || "md"
  );
  const [headerScrollEffect, setHeaderScrollEffect] = useState(
    typeof initialData.headerScrollEffect === "boolean" ? initialData.headerScrollEffect : true
  );
  const [hideSearch, setHideSearch] = useState(
    typeof initialData.hideSearch === "boolean" ? initialData.hideSearch : false
  );
  const [logoSize, setLogoSize] = useState<LogoSize>(
    (initialData.logoSize as LogoSize) || "medium"
  );
  const [uploading, setUploading] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"logo" | "og" | "favicon" | null>(null);

  // 크롭 없이 직접 업로드 (배너 등 비정사각형 이미지용)
  const createDirectUploadHandler =
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

  // 크롭 모달을 여는 핸들러
  const createCropHandler =
    (target: "logo" | "og" | "favicon") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("이미지 파일만 업로드할 수 있습니다.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCropperImage(reader.result as string);
        setCropTarget(target);
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    };

  // 크롭 완료 핸들러
  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperImage(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", croppedBlob, "cropped.jpg");
    formData.append("scope", "branding");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        showToast("업로드에 실패했습니다.", "error");
        return;
      }

      const data = await res.json();

      if (cropTarget === "logo") {
        setSiteLogoUrl(data.url);
        showToast("배너 이미지가 업로드되었습니다.", "success");
      } else if (cropTarget === "og") {
        setOgImageUrl(data.url);
        showToast("OG 이미지가 업로드되었습니다.", "success");
      } else if (cropTarget === "favicon") {
        setFaviconUrl(data.url);
        showToast("파비콘이 업로드되었습니다.", "success");
      }
    } catch {
      showToast("업로드에 실패했습니다.", "error");
    } finally {
      setUploading(false);
      setCropTarget(null);
    }
  };

  const handleLogoUpload = createDirectUploadHandler(
    setSiteLogoUrl,
    "배너 이미지가 업로드되었습니다.",
    "배너 이미지 업로드에 실패했습니다."
  );
  const handleLogoCrop = createCropHandler("logo");
  const handleOgCrop = createCropHandler("og");
  const handleFaviconCrop = createCropHandler("favicon");

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
        headerScrollEffect,
        hideSearch,
        logoSize,
        showMobileTopSiteName: showTopSiteName,
        showMobileTopSiteNameSize: showTopSiteNameSize,
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

  const SaveButton = () => (
    <Button type="submit" disabled={isPending}>
      {isPending ? "저장 중..." : "저장"}
    </Button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 상단 저장 버튼 */}
      <div className="flex justify-end">
        <SaveButton />
      </div>

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
          <p className="text-xs text-gray-400">상단과 브라우저 탭에 표시됩니다.</p>
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
          <p className="text-xs text-gray-400">상단과 홈에 표시되는 짧은 문구입니다.</p>
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

      {/* 배너 이미지 URL */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
          <Image className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">배너 이미지 URL</label>
          <Input
            value={siteLogoUrl}
            onChange={(event) => setSiteLogoUrl(event.target.value)}
            placeholder="https://example.com/banner.jpg"
            disabled={isPending}
            className="bg-white"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              원본 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Crop className="w-3.5 h-3.5" />
              크롭 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoCrop}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          <p className="text-xs text-gray-400">배너 이미지로 사용됩니다. 원본: 비율 유지 / 크롭: 1:1 정사각형</p>
          {siteLogoUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
              <img src={siteLogoUrl} alt="배너 미리보기" className="h-10 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 배너 높이 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
          <Maximize2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium">배너 높이</label>
            <p className="text-xs text-gray-400 mt-1">모바일 배너 영역의 높이를 선택하세요.</p>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {LOGO_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setLogoSize(size.value)}
                disabled={isPending}
                className={cn(
                  "relative p-3 rounded-xl border-2 text-center transition-all",
                  logoSize === size.value
                    ? "border-purple-500 bg-purple-50/50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                {logoSize === size.value && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className="font-medium text-sm">{size.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{size.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상단 사이트명 표시 (모바일) */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${showTopSiteName ? "bg-sky-50 text-sky-600" : "bg-gray-100 text-gray-400"}`}>
          <Type className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">상단 사이트명 표시 (모바일)</label>
            <button
              type="button"
              onClick={() => setShowTopSiteName(!showTopSiteName)}
              disabled={isPending}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                showTopSiteName ? "bg-sky-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  showTopSiteName ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            모바일 1행 중앙에 사이트명을 표시합니다.
          </p>
        </div>
      </div>

      {/* 상단 사이트명 크기 (모바일) */}
      {showTopSiteName && (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600">
            <Type className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm font-medium">상단 사이트명 크기 (모바일)</label>
              <p className="text-xs text-gray-400 mt-1">1행 중앙 사이트명의 글자 크기를 선택하세요.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_TOP_NAME_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setShowTopSiteNameSize(size.value)}
                  disabled={isPending}
                  className={cn(
                    "relative p-3 rounded-xl border-2 text-center transition-all",
                    showTopSiteNameSize === size.value
                      ? "border-slate-500 bg-slate-50/60"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  {showTopSiteNameSize === size.value && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div className="font-medium text-sm">{size.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{size.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 검색 숨김 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${hideSearch ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
          <SearchX className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">검색 아이콘 숨김</label>
            <button
              type="button"
              onClick={() => setHideSearch(!hideSearch)}
              disabled={isPending}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                hideSearch ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  hideSearch ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            상단에서 검색 아이콘을 숨깁니다. 모바일에서는 상단 검색 버튼이 비활성화됩니다.
          </p>
        </div>
      </div>

      {/* 스크롤 효과 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${headerScrollEffect ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
          <MousePointer2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">스크롤 효과</label>
            <button
              type="button"
              onClick={() => setHeaderScrollEffect(!headerScrollEffect)}
              disabled={isPending}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                headerScrollEffect ? "bg-teal-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  headerScrollEffect ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            스크롤 시 상단 바에 그림자/블러 효과가 적용됩니다. (클래식 제외)
          </p>
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
              <Crop className="w-3.5 h-3.5" />
              크롭 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleOgCrop}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          <p className="text-xs text-gray-400">1:1 정사각형으로 크롭됩니다</p>
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
              <Crop className="w-3.5 h-3.5" />
              크롭 업로드
              <input
                type="file"
                accept="image/*"
                onChange={handleFaviconCrop}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          <p className="text-xs text-gray-400">1:1 정사각형으로 크롭됩니다 (권장: 32x32 ~ 512x512)</p>
          {faviconUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
              <img src={faviconUrl} alt="파비콘 미리보기" className="h-8 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 크롭 모달 */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropperImage(null);
            setCropTarget(null);
          }}
        />
      )}

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  );
};
