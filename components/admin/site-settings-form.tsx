"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { FileText, Globe, Image, ImageIcon, Tag, Upload, MousePointer2, Check, Crop, SearchX, Maximize2, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/admin/image-cropper";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import type { LogoSize, MobileTopSiteNameSize, BannerWidth, BannerMaxHeight, BannerPosition } from "@/lib/site-settings";

const LOGO_SIZES: { value: LogoSize; label: string; description: string }[] = [
  { value: "xsmall", label: "더 작게", description: "24px" },
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

const BANNER_WIDTHS: { value: BannerWidth; label: string; description: string }[] = [
  { value: "xsmall", label: "40%", description: "가장 작게" },
  { value: "small", label: "50%", description: "작게" },
  { value: "medium", label: "60%", description: "보통" },
  { value: "large", label: "70%", description: "크게" },
  { value: "xlarge", label: "80%", description: "매우 크게" },
  { value: "xxlarge", label: "90%", description: "특대" },
  { value: "xxxlarge", label: "100%", description: "꽉 참" },
];

const BANNER_MAX_HEIGHTS: { value: BannerMaxHeight; label: string; description: string }[] = [
  { value: "none", label: "제한없음", description: "원본 비율" },
  { value: "40", label: "40px", description: "매우 작게" },
  { value: "60", label: "60px", description: "작게" },
  { value: "80", label: "80px", description: "보통" },
  { value: "100", label: "100px", description: "크게" },
  { value: "120", label: "120px", description: "매우 크게" },
];

const BANNER_POSITIONS: { value: BannerPosition; label: string; description: string }[] = [
  { value: "top", label: "상단", description: "위쪽 표시" },
  { value: "center", label: "중앙", description: "가운데 표시" },
  { value: "bottom", label: "하단", description: "아래쪽 표시" },
];

const DEFAULT_LOGO_LIGHT = "/logo.svg";
const DEFAULT_LOGO_DARK = "/logo_white.svg";

interface SiteSettingsFormProps {
  initialData: {
    siteName?: string | null;
    siteLogoUrl?: string | null;
    siteLogoUrlLight?: string | null;
    siteLogoUrlDark?: string | null;
    siteLogoMode?: "light" | "dark" | string | null;
    siteLogoSize?: string | null;
    siteBannerUrl?: string | null;
    bannerWidth?: string | null;
    bannerMaxHeight?: string | null;
    bannerPosition?: string | null;
    siteTagline?: string | null;
    siteDescription?: string | null;
    ogImageUrl?: string | null;
    faviconUrl?: string | null;
    faviconPng16?: string | null;
    faviconPng32?: string | null;
    faviconAppleTouch?: string | null;
    faviconAndroid192?: string | null;
    faviconAndroid512?: string | null;
    faviconIco?: string | null;
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
  const legacyLogo = initialData.siteLogoUrl?.trim() || "";
  const [siteLogoUrl, setSiteLogoUrl] = useState(initialData.siteLogoUrl ?? "");
  const [siteLogoUrlLight, setSiteLogoUrlLight] = useState(
    initialData.siteLogoUrlLight?.trim() || legacyLogo || DEFAULT_LOGO_LIGHT
  );
  const resolvedLogoDark =
    initialData.siteLogoUrlDark?.trim() &&
    initialData.siteLogoUrlDark.trim() !== DEFAULT_LOGO_LIGHT
      ? initialData.siteLogoUrlDark.trim()
      : DEFAULT_LOGO_DARK;
  const [siteLogoUrlDark, setSiteLogoUrlDark] = useState(resolvedLogoDark);
  const [siteLogoMode, setSiteLogoMode] = useState<"light" | "dark">(
    initialData.siteLogoMode === "dark" ? "dark" : "light"
  );
  const [siteLogoSize, setSiteLogoSize] = useState<LogoSize>(
    (initialData.siteLogoSize as LogoSize) || (initialData.logoSize as LogoSize) || "medium"
  );
  const [siteBannerUrl, setSiteBannerUrl] = useState(initialData.siteBannerUrl ?? "");
  const [bannerWidth, setBannerWidth] = useState<BannerWidth>(
    (initialData.bannerWidth as BannerWidth) || "medium"
  );
  const [bannerMaxHeight, setBannerMaxHeight] = useState<string>(
    initialData.bannerMaxHeight ?? ""
  );
  const [customHeight, setCustomHeight] = useState<string>(() => {
    const initial = initialData.bannerMaxHeight ?? "";
    // 프리셋 값이 아니면 커스텀 값으로 간주
    const presets = ["", "none", "40", "60", "80", "100", "120"];
    return presets.includes(initial) ? "" : initial;
  });
  const [bannerPosition, setBannerPosition] = useState<BannerPosition>(
    (initialData.bannerPosition as BannerPosition) || "center"
  );
  const [siteTagline, setSiteTagline] = useState(initialData.siteTagline ?? "");
  const [siteDescription, setSiteDescription] = useState(initialData.siteDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initialData.ogImageUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initialData.faviconUrl ?? "");
  const [faviconPng16, setFaviconPng16] = useState(initialData.faviconPng16 ?? "");
  const [faviconPng32, setFaviconPng32] = useState(initialData.faviconPng32 ?? "");
  const [faviconAppleTouch, setFaviconAppleTouch] = useState(initialData.faviconAppleTouch ?? "");
  const [faviconAndroid192, setFaviconAndroid192] = useState(initialData.faviconAndroid192 ?? "");
  const [faviconAndroid512, setFaviconAndroid512] = useState(initialData.faviconAndroid512 ?? "");
  const [faviconIco, setFaviconIco] = useState(initialData.faviconIco ?? "");
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
  const [cropTarget, setCropTarget] = useState<
    "logo" | "logoLight" | "logoDark" | "banner" | "og" | "favicon" | null
  >(null);

  // 크롭 없이 직접 업로드 (배너/로고 등 비정사각형 이미지용)
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
    (target: "logo" | "logoLight" | "logoDark" | "banner" | "og" | "favicon") =>
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

    try {
      if (cropTarget === "favicon") {
        await uploadFaviconAutoSet(croppedBlob);
        return;
      }

      const formData = new FormData();
      formData.append("file", croppedBlob, "cropped.jpg");
      formData.append("scope", "branding");

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
        showToast("로고 이미지가 업로드되었습니다.", "success");
      } else if (cropTarget === "logoLight") {
        setSiteLogoUrlLight(data.url);
        showToast("라이트 로고가 업로드되었습니다.", "success");
      } else if (cropTarget === "logoDark") {
        setSiteLogoUrlDark(data.url);
        showToast("다크 로고가 업로드되었습니다.", "success");
      } else if (cropTarget === "banner") {
        setSiteBannerUrl(data.url);
        showToast("배너 이미지가 업로드되었습니다.", "success");
      } else if (cropTarget === "og") {
        setOgImageUrl(data.url);
        showToast("OG 이미지가 업로드되었습니다.", "success");
      }
    } catch {
      showToast("업로드에 실패했습니다.", "error");
    } finally {
      setUploading(false);
      setCropTarget(null);
    }
  };

  const handleLogoLightUpload = createDirectUploadHandler(
    setSiteLogoUrlLight,
    "라이트 로고가 업로드되었습니다.",
    "라이트 로고 업로드에 실패했습니다."
  );
  const handleLogoDarkUpload = createDirectUploadHandler(
    setSiteLogoUrlDark,
    "다크 로고가 업로드되었습니다.",
    "다크 로고 업로드에 실패했습니다."
  );
  const handleLogoLightCrop = createCropHandler("logoLight");
  const handleLogoDarkCrop = createCropHandler("logoDark");
  const handleBannerUpload = createDirectUploadHandler(
    setSiteBannerUrl,
    "배너 이미지가 업로드되었습니다.",
    "배너 이미지 업로드에 실패했습니다."
  );
  const handleBannerCrop = createCropHandler("banner");
  const handleOgCrop = createCropHandler("og");
  const handleFaviconCrop = createCropHandler("favicon");

  const getImageSize = (file: File) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const size = { width: img.width, height: img.height };
        URL.revokeObjectURL(url);
        resolve(size);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("이미지를 읽을 수 없습니다."));
      };
      img.src = url;
    });

  const validateExactSize = async (file: File, size: number) => {
    const { width, height } = await getImageSize(file);
    if (width !== size || height !== size) {
      throw new Error(`이미지 크기는 ${size}x${size}px 이어야 합니다.`);
    }
  };

  const uploadFaviconAutoSet = async (file: Blob) => {
    const formData = new FormData();
    formData.append("file", file, "favicon.png");
    formData.append("mode", "auto");

    const res = await fetch("/api/admin/favicon", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "파비콘 자동 생성에 실패했습니다.", "error");
      return false;
    }
    setFaviconPng16(data.faviconPng16 || "");
    setFaviconPng32(data.faviconPng32 || "");
    setFaviconAppleTouch(data.faviconAppleTouch || "");
    setFaviconAndroid192(data.faviconAndroid192 || "");
    setFaviconAndroid512(data.faviconAndroid512 || "");
    setFaviconIco(data.faviconIco || "");
    if (data.faviconPng32) {
      setFaviconUrl(data.faviconPng32);
    }
    showToast("파비콘 세트가 생성되었습니다. 저장을 눌러 적용하세요.", "success");
    return true;
  };

  const createFaviconVariantHandler =
    (
      target:
        | "faviconPng16"
        | "faviconPng32"
        | "faviconAppleTouch"
        | "faviconAndroid192"
        | "faviconAndroid512"
        | "faviconIco",
      size: number | null,
      setter: (value: string) => void,
      successMessage: string
    ) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        if (size !== null) {
          await validateExactSize(file, size);
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", "single");
        formData.append("target", target);

        const res = await fetch("/api/admin/favicon", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || "파비콘 업로드에 실패했습니다.", "error");
          return;
        }
        setter(data.url || "");
        if (target === "faviconPng32" && data.url) {
          setFaviconUrl(data.url);
        }
        showToast(successMessage, "success");
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
          "error"
        );
      } finally {
        setUploading(false);
        event.target.value = "";
      }
    };

  const handleFavicon16Upload = createFaviconVariantHandler(
    "faviconPng16",
    16,
    setFaviconPng16,
    "16x16 파비콘이 업로드되었습니다."
  );
  const handleFavicon32Upload = createFaviconVariantHandler(
    "faviconPng32",
    32,
    setFaviconPng32,
    "32x32 파비콘이 업로드되었습니다."
  );
  const handleFaviconAppleUpload = createFaviconVariantHandler(
    "faviconAppleTouch",
    180,
    setFaviconAppleTouch,
    "Apple Touch 아이콘이 업로드되었습니다."
  );
  const handleFaviconAndroid192Upload = createFaviconVariantHandler(
    "faviconAndroid192",
    192,
    setFaviconAndroid192,
    "Android 192 아이콘이 업로드되었습니다."
  );
  const handleFaviconAndroid512Upload = createFaviconVariantHandler(
    "faviconAndroid512",
    512,
    setFaviconAndroid512,
    "Android 512 아이콘이 업로드되었습니다."
  );
  const handleFaviconIcoUpload = createFaviconVariantHandler(
    "faviconIco",
    null,
    setFaviconIco,
    "favicon.ico가 업로드되었습니다."
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        siteName: siteName.trim() || null,
        siteLogoUrlLight: siteLogoUrlLight.trim() || null,
        siteLogoUrlDark: siteLogoUrlDark.trim() || null,
        siteLogoUrl:
          siteLogoUrlLight.trim() ||
          siteLogoUrlDark.trim() ||
          siteLogoUrl.trim() ||
          null,
        siteLogoMode,
        siteLogoSize,
        siteBannerUrl: siteBannerUrl.trim() || null,
        bannerWidth,
        bannerMaxHeight,
        bannerPosition,
        siteTagline: siteTagline.trim() || null,
        siteDescription: siteDescription.trim() || null,
        ogImageUrl: ogImageUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
        faviconPng16: faviconPng16.trim() || null,
        faviconPng32: faviconPng32.trim() || null,
        faviconAppleTouch: faviconAppleTouch.trim() || null,
        faviconAndroid192: faviconAndroid192.trim() || null,
        faviconAndroid512: faviconAndroid512.trim() || null,
        faviconIco: faviconIco.trim() || null,
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
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">사이트 이름</label>
            <HelpTooltip content="웹사이트의 대표 이름입니다. 헤더 상단, 브라우저 탭 제목, SEO 메타 태그에 사용됩니다." />
          </div>
          <Input
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
            placeholder="사이트 이름을 입력하세요"
            disabled={isPending}
            className="bg-white"
          />
        </div>
      </div>

      {/* 사이트 태그라인 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
          <Tag className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">태그라인</label>
            <HelpTooltip content="사이트를 한 줄로 소개하는 슬로건입니다. 헤더나 홈 화면에 표시되며, 브랜드 이미지를 전달합니다." />
          </div>
          <Input
            value={siteTagline}
            onChange={(event) => setSiteTagline(event.target.value)}
            placeholder="예) Premium Travel Concierge"
            disabled={isPending}
            className="bg-white"
          />
        </div>
      </div>

      {/* 사이트 설명 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">사이트 설명</label>
            <HelpTooltip content="검색엔진(Google, Naver)과 SNS 공유 미리보기에 표시되는 설명입니다. 150자 내외로 사이트의 핵심 내용을 작성하세요." />
          </div>
          <Textarea
            value={siteDescription}
            onChange={(event) => setSiteDescription(event.target.value)}
            placeholder="검색/메타 설명에 사용됩니다."
            disabled={isPending}
            className="bg-white min-h-[110px]"
          />
        </div>
      </div>

      {/* 배너 이미지 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
          <Image className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">배너 이미지</label>
            <HelpTooltip content="홈 화면 상단이나 주요 페이지에 표시되는 대표 배너 이미지입니다. 원본 업로드는 비율을 유지하고, 크롭 업로드는 1:1 정사각형으로 잘립니다." />
          </div>
          <Input
            value={siteBannerUrl}
            onChange={(event) => setSiteBannerUrl(event.target.value)}
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
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleBannerUpload}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Crop className="w-3.5 h-3.5" />
              크롭 업로드
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleBannerCrop}
                disabled={isPending || uploading}
                className="hidden"
              />
            </label>
            {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
          </div>
          {siteBannerUrl && (
            <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
              <img src={siteBannerUrl} alt="배너 미리보기" className="h-10 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* 배너 너비 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
          <Maximize2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">배너 너비</label>
              <HelpTooltip content="모바일 배너의 가로 크기를 화면 비율로 설정합니다." />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {BANNER_WIDTHS.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setBannerWidth(size.value)}
                disabled={isPending}
                className={cn(
                  "relative p-3 rounded-xl border-2 text-center transition-all",
                  bannerWidth === size.value
                    ? "border-purple-500 bg-purple-50/50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                {bannerWidth === size.value && (
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

      {/* 배너 최대 높이 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Maximize2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">배너 최대 높이</label>
              <HelpTooltip content="배너의 최대 높이를 제한합니다. 프리셋 선택 또는 커스텀 값(1~500px)을 입력할 수 있습니다." />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {BANNER_MAX_HEIGHTS.map((size) => {
              const isSelected = size.value === "none"
                ? (bannerMaxHeight === "" || bannerMaxHeight === "none")
                : bannerMaxHeight === size.value;
              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => {
                    setBannerMaxHeight(size.value === "none" ? "" : size.value);
                    setCustomHeight("");
                  }}
                  disabled={isPending}
                  className={cn(
                    "relative p-3 rounded-xl border-2 text-center transition-all",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div className="font-medium text-sm">{size.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{size.description}</div>
                </button>
              );
            })}
            {/* 커스텀 입력 버튼 */}
            <button
              type="button"
              onClick={() => {
                const preset = ["", "none", "40", "60", "80", "100", "120"];
                if (!preset.includes(bannerMaxHeight)) return; // 이미 커스텀 모드
                setCustomHeight("150");
                setBannerMaxHeight("150");
              }}
              disabled={isPending}
              className={cn(
                "relative p-3 rounded-xl border-2 text-center transition-all",
                !["", "none", "40", "60", "80", "100", "120"].includes(bannerMaxHeight)
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              {!["", "none", "40", "60", "80", "100", "120"].includes(bannerMaxHeight) && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <div className="font-medium text-sm">커스텀</div>
              <div className="text-xs text-gray-500 mt-0.5">직접 입력</div>
            </button>
          </div>
          {/* 커스텀 픽셀 입력 필드 */}
          {!["", "none", "40", "60", "80", "100", "120"].includes(bannerMaxHeight) && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={500}
                value={customHeight}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomHeight(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 1 && num <= 500) {
                    setBannerMaxHeight(String(num));
                  }
                }}
                placeholder="1~500"
                className="w-24"
                disabled={isPending}
              />
              <span className="text-sm text-gray-500">px (1~500 범위)</span>
            </div>
          )}
        </div>
      </div>

      {/* 배너 이미지 위치 (높이 제한 시에만 표시) */}
      {bannerMaxHeight !== "" && bannerMaxHeight !== "none" && (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium">배너 이미지 위치</label>
                <HelpTooltip content="높이가 제한될 때 이미지의 어느 부분을 표시할지 선택합니다." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BANNER_POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => setBannerPosition(pos.value)}
                  disabled={isPending}
                  className={cn(
                    "relative p-3 rounded-xl border-2 text-center transition-all",
                    bannerPosition === pos.value
                      ? "border-cyan-500 bg-cyan-50/50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  {bannerPosition === pos.value && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
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
      )}

      {/* 로고 이미지 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
          <Image className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">로고 이미지 (라이트/다크)</label>
            <HelpTooltip content="헤더와 푸터에 표시되는 로고입니다. 라이트/다크 로고를 각각 등록하고, 위에서 사용할 로고를 선택하세요." />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">사용 방식</p>
              <select
                value={siteLogoMode}
                onChange={(event) => setSiteLogoMode(event.target.value as "light" | "dark")}
                disabled={isPending}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-300"
              >
                <option value="light">라이트 로고 사용</option>
                <option value="dark">다크 로고 사용</option>
              </select>
              <p className="text-xs text-gray-400">
                선택한 로고가 헤더/푸터/스플래시에서 고정으로 사용됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">라이트 모드용 (밝은 배경)</p>
              <Input
                value={siteLogoUrlLight}
                onChange={(event) => setSiteLogoUrlLight(event.target.value)}
                placeholder="https://example.com/logo-light.png"
                disabled={isPending}
                className="bg-white"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  원본 업로드
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleLogoLightUpload}
                    disabled={isPending || uploading}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Crop className="w-3.5 h-3.5" />
                  크롭 업로드
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleLogoLightCrop}
                    disabled={isPending || uploading}
                    className="hidden"
                  />
                </label>
                {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
              </div>
              {siteLogoUrlLight && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
                  <img
                    src={siteLogoUrlLight}
                    alt="라이트 로고 미리보기"
                    className="h-10 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">다크 모드용 (어두운 배경)</p>
              <Input
                value={siteLogoUrlDark}
                onChange={(event) => setSiteLogoUrlDark(event.target.value)}
                placeholder="https://example.com/logo-dark.png"
                disabled={isPending}
                className="bg-white"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  원본 업로드
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleLogoDarkUpload}
                    disabled={isPending || uploading}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Crop className="w-3.5 h-3.5" />
                  크롭 업로드
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleLogoDarkCrop}
                    disabled={isPending || uploading}
                    className="hidden"
                  />
                </label>
                {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
              </div>
              {siteLogoUrlDark && (
                <div className="mt-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <img
                    src={siteLogoUrlDark}
                    alt="다크 로고 미리보기"
                    className="h-10 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 로고 크기 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
          <Maximize2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">로고 이미지 크기</label>
              <HelpTooltip content="헤더/모바일 상단 로고 이미지 크기를 선택합니다." />
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {LOGO_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setSiteLogoSize(size.value)}
                disabled={isPending}
                className={cn(
                  "relative p-3 rounded-xl border-2 text-center transition-all",
                  siteLogoSize === size.value
                    ? "border-purple-500 bg-purple-50/50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                {siteLogoSize === size.value && (
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
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">상단 사이트명 표시 (모바일)</label>
              <HelpTooltip content="모바일 헤더의 1행 중앙에 사이트 이름을 텍스트로 표시합니다. 로고만 보여주고 싶다면 끄세요." />
            </div>
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
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium">상단 사이트명 크기 (모바일)</label>
                <HelpTooltip content="모바일 헤더 1행에 표시되는 사이트명의 글자 크기입니다." />
              </div>
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
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">검색 아이콘 숨김</label>
              <HelpTooltip content="헤더의 검색 아이콘을 숨깁니다. 검색 기능을 사용하지 않거나 별도 검색 페이지가 있을 때 유용합니다." />
            </div>
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
        </div>
      </div>

      {/* 스크롤 효과 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${headerScrollEffect ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-400"}`}>
          <MousePointer2 className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">스크롤 효과</label>
              <HelpTooltip content="페이지를 스크롤할 때 헤더에 그림자와 블러 효과를 추가합니다. 콘텐츠와 헤더를 시각적으로 구분해줍니다." />
            </div>
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
        </div>
      </div>

      {/* OG 이미지 URL */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">OG 이미지 URL</label>
            <HelpTooltip content="카카오톡, 페이스북, 트위터, 슬랙 등에서 링크를 공유할 때 미리보기에 표시되는 대표 이미지입니다. 권장 크기: 1200×630px (1.91:1 비율)" />
          </div>
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
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleOgCrop}
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

      {/* 파비콘 설정 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600">
          <Image className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium">파비콘 업로드 (자동 생성)</label>
              <HelpTooltip content="브라우저 탭, 북마크, 모바일 홈 화면에 표시되는 작은 아이콘입니다. 하나의 이미지를 업로드하면 여러 크기(16/32/192/512px, Apple Touch, ICO)가 자동 생성됩니다." />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Crop className="w-3.5 h-3.5" />
                크롭 업로드
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleFaviconCrop}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
              {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-28">favicon-16x16</span>
              <span className="text-xs text-gray-500">
                {faviconPng16 ? "업로드됨" : "미설정"}
              </span>
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                16x16 업로드
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFavicon16Upload}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
              {faviconPng16 && (
                <img src={faviconPng16} alt="favicon 16" className="h-6 w-6 rounded bg-white border" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-28">favicon-32x32</span>
              <span className="text-xs text-gray-500">
                {faviconPng32 ? "업로드됨" : "미설정"}
              </span>
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                32x32 업로드
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFavicon32Upload}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
              {faviconPng32 && (
                <img src={faviconPng32} alt="favicon 32" className="h-7 w-7 rounded bg-white border" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-28">apple-touch-icon</span>
              <span className="text-xs text-gray-500">
                {faviconAppleTouch ? "업로드됨" : "미설정"}
              </span>
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                180x180 업로드
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFaviconAppleUpload}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
              {faviconAppleTouch && (
                <img src={faviconAppleTouch} alt="apple touch" className="h-8 w-8 rounded bg-white border" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-28">android-192</span>
              <span className="text-xs text-gray-500">
                {faviconAndroid192 ? "업로드됨" : "미설정"}
              </span>
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                192x192 업로드
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFaviconAndroid192Upload}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
              {faviconAndroid192 && (
                <img src={faviconAndroid192} alt="android 192" className="h-8 w-8 rounded bg-white border" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-28">android-512</span>
              <span className="text-xs text-gray-500">
                {faviconAndroid512 ? "업로드됨" : "미설정"}
              </span>
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                512x512 업로드
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleFaviconAndroid512Upload}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
              {faviconAndroid512 && (
                <img src={faviconAndroid512} alt="android 512" className="h-8 w-8 rounded bg-white border" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-28">favicon.ico</span>
              <span className="text-xs text-gray-500">
                {faviconIco ? "업로드됨" : "미설정"}
              </span>
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                .ico 업로드
                <input
                  type="file"
                  accept=".ico"
                  onChange={handleFaviconIcoUpload}
                  disabled={isPending || uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">기본 파비콘 (fallback)</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {faviconUrl ? "업로드됨" : "미설정"}
              </span>
              {faviconUrl && (
                <img
                  src={faviconUrl}
                  alt="기본 파비콘"
                  className="h-6 w-6 rounded bg-white border"
                />
              )}
            </div>
            <p className="text-xs text-gray-400">기본값은 32x32 파비콘을 사용합니다.</p>
          </div>
        </div>
      </div>

      {/* 크롭 모달 */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          outputSize={cropTarget === "favicon" ? 512 : 400}
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
