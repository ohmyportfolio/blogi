"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { FileText, Globe, Image, ImageIcon, Tag, Upload, Palette, MousePointer2, Check, Crop, SearchX, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderStyle, HEADER_STYLES } from "@/lib/header-styles";
import { ImageCropper } from "@/components/admin/image-cropper";
import type { LogoSize, SiteNamePosition } from "@/lib/site-settings";

const SITE_NAME_POSITIONS: { value: SiteNamePosition; label: string; description: string }[] = [
  { value: "logo", label: "로고 우측", description: "로고 옆에 표시" },
  { value: "header1", label: "헤더 1행", description: "상단 행에 표시" },
];

const LOGO_SIZES: { value: LogoSize; label: string; description: string }[] = [
  { value: "small", label: "작음", description: "32px" },
  { value: "medium", label: "보통", description: "48px" },
  { value: "large", label: "크게", description: "64px" },
  { value: "xlarge", label: "매우 크게", description: "80px" },
  { value: "xxlarge", label: "특대", description: "100px" },
  { value: "xxxlarge", label: "최대", description: "150px" },
];

interface SiteSettingsFormProps {
  initialData: {
    siteName?: string | null;
    siteLogoUrl?: string | null;
    siteTagline?: string | null;
    siteDescription?: string | null;
    ogImageUrl?: string | null;
    faviconUrl?: string | null;
    headerStyle?: string | null;
    headerScrollEffect?: boolean | null;
    hideSearch?: boolean | null;
    logoSize?: string | null;
    siteNamePosition?: string | null;
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
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>(
    (initialData.headerStyle as HeaderStyle) || "classic"
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
  const [siteNamePosition, setSiteNamePosition] = useState<SiteNamePosition>(
    (initialData.siteNamePosition as SiteNamePosition) || "logo"
  );
  const [uploading, setUploading] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"logo" | "og" | "favicon" | null>(null);

  // 크롭 없이 직접 업로드 (로고 등 비정사각형 이미지용)
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
        showToast("로고가 업로드되었습니다.", "success");
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
    "로고가 업로드되었습니다.",
    "로고 업로드에 실패했습니다."
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
        headerStyle,
        headerScrollEffect,
        hideSearch,
        logoSize,
        siteNamePosition,
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
          <p className="text-xs text-gray-400">원본: 비율 유지 / 크롭: 1:1 정사각형</p>
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

      {/* 헤더 스타일 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600">
          <Palette className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium">헤더 스타일</label>
            <p className="text-xs text-gray-400 mt-1">2025-2026 트렌드를 반영한 헤더 디자인을 선택하세요.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(HEADER_STYLES) as [HeaderStyle, typeof HEADER_STYLES[HeaderStyle]][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setHeaderStyle(key)}
                  disabled={isPending}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all",
                    headerStyle === key
                      ? "border-cyan-500 bg-cyan-50/50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  {headerStyle === key && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {/* 미리보기 영역 */}
                  <div className={cn(
                    "h-10 rounded-lg mb-3 flex items-center justify-center text-xs",
                    config.preview.bg,
                    config.preview.text
                  )}>
                    헤더 미리보기
                  </div>
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{config.description}</div>
                </button>
              )
            )}
          </div>
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
            스크롤 시 헤더에 그림자/블러 효과가 적용됩니다. (클래식 제외)
          </p>
        </div>
      </div>

      {/* 검색 숨김 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${hideSearch ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
          <SearchX className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">검색 숨김</label>
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
            헤더에서 검색바를 숨깁니다. 모바일에서는 첫 번째 헤더 행도 함께 숨겨집니다.
          </p>
        </div>
      </div>

      {/* 로고 크기 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
          <Maximize2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium">로고 크기</label>
            <p className="text-xs text-gray-400 mt-1">헤더에 표시되는 로고의 크기를 선택하세요.</p>
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

      {/* 사이트명 위치 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
          <Tag className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium">사이트명 위치</label>
            <p className="text-xs text-gray-400 mt-1">헤더에서 사이트명이 표시되는 위치를 선택하세요.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SITE_NAME_POSITIONS.map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => setSiteNamePosition(pos.value)}
                disabled={isPending}
                className={cn(
                  "relative p-3 rounded-xl border-2 text-center transition-all",
                  siteNamePosition === pos.value
                    ? "border-teal-500 bg-teal-50/50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                {siteNamePosition === pos.value && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className="font-medium text-sm">{pos.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{pos.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  );
};
