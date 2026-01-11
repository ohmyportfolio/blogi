"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Sparkles, Palette, Image, Upload, Trash2, Maximize2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SplashLogoSize } from "@/lib/site-settings";

const SPLASH_LOGO_SIZES: { value: SplashLogoSize; label: string; description: string }[] = [
  { value: "small", label: "작게", description: "80px" },
  { value: "medium", label: "보통", description: "128px" },
  { value: "large", label: "크게", description: "160px" },
  { value: "xlarge", label: "매우 크게", description: "200px" },
];

interface SplashSettingsFormProps {
  initialData: {
    splashEnabled: boolean;
    splashBackgroundColor: string | null;
    splashLogoUrl: string | null;
    splashLogoSize: string | null;
    siteLogoUrl: string | null;
  };
}

export const SplashSettingsForm = ({ initialData }: SplashSettingsFormProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [splashEnabled, setSplashEnabled] = useState(initialData.splashEnabled);
  const [splashBackgroundColor, setSplashBackgroundColor] = useState(
    initialData.splashBackgroundColor ?? "#ffffff"
  );
  const [splashLogoUrl, setSplashLogoUrl] = useState(initialData.splashLogoUrl ?? "");
  const [splashLogoSize, setSplashLogoSize] = useState<SplashLogoSize>(
    (initialData.splashLogoSize as SplashLogoSize) || "medium"
  );
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        showToast(data.error || "로고 업로드에 실패했습니다.", "error");
        return;
      }
      const data = await res.json();
      setSplashLogoUrl(data.url);
      showToast("스플래시 로고가 업로드되었습니다.", "success");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        splashEnabled,
        splashBackgroundColor: splashBackgroundColor.trim() || null,
        splashLogoUrl: splashLogoUrl.trim() || null,
        splashLogoSize,
      };
      const res = await fetch("/api/admin/splash-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }
      showToast("스플래시 설정이 저장되었습니다.", "success");
    });
  };

  const effectiveLogoUrl = splashLogoUrl || initialData.siteLogoUrl || "/default-logo.svg";

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

      {/* 스플래시 사용 여부 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${splashEnabled ? "bg-violet-50 text-violet-600" : "bg-gray-100 text-gray-400"}`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">스플래시 화면 사용</label>
            <button
              type="button"
              onClick={() => setSplashEnabled(!splashEnabled)}
              disabled={isPending}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                splashEnabled ? "bg-violet-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  splashEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            모바일에서 세션당 1회, 로고가 점멸하며 표시됩니다.
          </p>
        </div>
      </div>

      {splashEnabled && (
        <>
          {/* 배경색 */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="p-2.5 rounded-lg bg-fuchsia-50 text-fuchsia-600">
              <Palette className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">배경색</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={splashBackgroundColor}
                  onChange={(e) => setSplashBackgroundColor(e.target.value)}
                  disabled={isPending}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <Input
                  value={splashBackgroundColor}
                  onChange={(e) => setSplashBackgroundColor(e.target.value)}
                  placeholder="#ffffff"
                  disabled={isPending}
                  className="bg-white w-32"
                />
              </div>
              <p className="text-xs text-gray-400">스플래시 화면의 배경색을 선택하세요.</p>
            </div>
          </div>

          {/* 스플래시 로고 */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Image className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">스플래시 로고</label>
              <Input
                value={splashLogoUrl}
                onChange={(e) => setSplashLogoUrl(e.target.value)}
                placeholder="비워두면 사이트 로고를 사용합니다"
                disabled={isPending}
                className="bg-white"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  업로드
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isPending || uploading}
                    className="hidden"
                  />
                </label>
                {splashLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setSplashLogoUrl("")}
                    disabled={isPending}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </button>
                )}
                {uploading && <span className="text-xs text-gray-500">업로드 중...</span>}
              </div>
              <p className="text-xs text-gray-400">
                비워두면 사이트 설정의 배너 이미지를 사용합니다.
              </p>
            </div>
          </div>

          {/* 로고 크기 */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium">로고 크기</label>
                <p className="text-xs text-gray-400 mt-1">스플래시 화면에 표시될 로고 크기를 선택하세요.</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SPLASH_LOGO_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setSplashLogoSize(size.value)}
                    disabled={isPending}
                    className={cn(
                      "relative p-3 rounded-xl border-2 text-center transition-all",
                      splashLogoSize === size.value
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    {splashLogoSize === size.value && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
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

          {/* 미리보기 */}
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
            <label className="text-sm font-medium mb-3 block">미리보기</label>
            <div
              className="relative w-full max-w-[200px] aspect-[9/16] rounded-2xl overflow-hidden border border-gray-200 shadow-sm mx-auto"
              style={{ backgroundColor: splashBackgroundColor }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={effectiveLogoUrl}
                  alt="스플래시 로고"
                  className={cn(
                    "object-contain",
                    splashLogoSize === "small" && "w-20 h-20",
                    splashLogoSize === "medium" && "w-24 h-24",
                    splashLogoSize === "large" && "w-28 h-28",
                    splashLogoSize === "xlarge" && "w-32 h-32"
                  )}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              모바일에서 새로고침할 때마다 표시됩니다.
            </p>
          </div>
        </>
      )}

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  );
};
