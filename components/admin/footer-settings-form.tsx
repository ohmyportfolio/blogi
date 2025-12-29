"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  Copyright,
  FileText,
  Shield,
  Building2,
  Share2,
  Eye,
  EyeOff,
  LayoutDashboard
} from "lucide-react";

type SocialLink = {
  key: string;
  label: string;
  url: string;
  enabled: boolean;
};

interface FooterSettingsFormProps {
  initialData: {
    footerEnabled: boolean;
    copyrightText?: string | null;
    showCopyright: boolean;
    termsContent?: string | null;
    termsContentMarkdown?: string | null;
    privacyContent?: string | null;
    privacyContentMarkdown?: string | null;
    showTerms: boolean;
    showPrivacy: boolean;
    businessLines: string[];
    showBusinessInfo: boolean;
    socialLinks: { key: string; label: string; url: string }[];
    showSocials: boolean;
  };
}

export const FooterSettingsForm = ({ initialData }: FooterSettingsFormProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [footerEnabled, setFooterEnabled] = useState(initialData.footerEnabled);
  const [copyrightText, setCopyrightText] = useState(initialData.copyrightText ?? "");
  const [showCopyright, setShowCopyright] = useState(initialData.showCopyright);
  const [termsContent, setTermsContent] = useState(initialData.termsContent ?? "");
  const [termsContentMarkdown, setTermsContentMarkdown] = useState(
    initialData.termsContentMarkdown ?? ""
  );
  const [privacyContent, setPrivacyContent] = useState(initialData.privacyContent ?? "");
  const [privacyContentMarkdown, setPrivacyContentMarkdown] = useState(
    initialData.privacyContentMarkdown ?? ""
  );
  const [showTerms, setShowTerms] = useState(initialData.showTerms);
  const [showPrivacy, setShowPrivacy] = useState(initialData.showPrivacy);
  const [businessLines, setBusinessLines] = useState<string[]>(() => {
    const lines = initialData.businessLines.slice(0, 4);
    return lines.length > 0 ? [...lines, "", "", "", ""].slice(0, 4) : ["", "", "", ""];
  });
  const [showBusinessInfo, setShowBusinessInfo] = useState(initialData.showBusinessInfo);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    const preset = [
      { key: "instagram", label: "Instagram" },
      { key: "facebook", label: "Facebook" },
      { key: "youtube", label: "YouTube" },
      { key: "tiktok", label: "TikTok" },
      { key: "telegram", label: "Telegram" },
      { key: "kakao", label: "KakaoTalk" },
      { key: "x", label: "X" },
    ];
    return preset.map((item) => {
      const existing = initialData.socialLinks.find((link) => link.key === item.key);
      return {
        key: item.key,
        label: item.label,
        url: existing?.url ?? "",
        enabled: Boolean(existing?.url),
      };
    });
  });
  const [showSocials, setShowSocials] = useState(initialData.showSocials);

  const updateSocial = (index: number, field: keyof SocialLink, value: string | boolean) => {
    setSocialLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        footerEnabled,
        copyrightText: copyrightText.trim() || null,
        showCopyright,
        termsContent: termsContent || null,
        termsContentMarkdown: termsContentMarkdown || null,
        privacyContent: privacyContent || null,
        privacyContentMarkdown: privacyContentMarkdown || null,
        showTerms,
        showPrivacy,
        businessLines: businessLines.map((line) => line.trim()).filter(Boolean),
        showBusinessInfo,
        showSocials,
        socialLinks: socialLinks
          .filter((item) => item.enabled && item.url.trim())
          .map((item) => ({
            key: item.key,
            label: item.label,
            url: item.url.trim(),
          })),
      };
      const res = await fetch("/api/admin/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }
      showToast("푸터 정보가 저장되었습니다.", "success");
    });
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    disabled
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );

  const VisibilityBadge = ({
    visible,
    onClick
  }: {
    visible: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
        visible
          ? "text-green-600 bg-green-50 hover:bg-green-100"
          : "text-gray-400 bg-gray-100 hover:bg-gray-200"
      }`}
    >
      {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {visible ? "노출" : "숨김"}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 설정 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${footerEnabled ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">푸터 전체 노출</label>
            <ToggleSwitch checked={footerEnabled} onChange={setFooterEnabled} disabled={isPending} />
          </div>
          <p className="text-xs text-gray-400">푸터 영역 전체를 표시하거나 숨깁니다.</p>
        </div>
      </div>

      {/* 저작권 표시 */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-lg ${showCopyright ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"}`}>
          <Copyright className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">저작권 표시</label>
            <VisibilityBadge visible={showCopyright} onClick={() => setShowCopyright(!showCopyright)} />
          </div>
          <Input
            value={copyrightText}
            onChange={(event) => setCopyrightText(event.target.value)}
            placeholder="예) Copyright © Danang VIP Tour. All rights reserved."
            disabled={isPending}
            className="bg-white"
          />
        </div>
      </div>

      {/* 이용약관 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
          <div className={`p-2.5 rounded-lg ${showTerms ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">이용약관</label>
              <VisibilityBadge visible={showTerms} onClick={() => setShowTerms(!showTerms)} />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <RichTextEditor
            content={termsContent}
            onChange={setTermsContent}
            onMarkdownChange={setTermsContentMarkdown}
            placeholder="이용약관 내용을 입력하세요..."
          />
        </div>
      </div>

      {/* 개인정보처리방침 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
          <div className={`p-2.5 rounded-lg ${showPrivacy ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-400"}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">개인정보처리방침</label>
              <VisibilityBadge visible={showPrivacy} onClick={() => setShowPrivacy(!showPrivacy)} />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <RichTextEditor
            content={privacyContent}
            onChange={setPrivacyContent}
            onMarkdownChange={setPrivacyContentMarkdown}
            placeholder="개인정보처리방침 내용을 입력하세요..."
          />
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
          <div className={`p-2.5 rounded-lg ${showBusinessInfo ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">사업자 정보</label>
              <VisibilityBadge visible={showBusinessInfo} onClick={() => setShowBusinessInfo(!showBusinessInfo)} />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Input
              key={`business-line-${index}`}
              value={businessLines[index] ?? ""}
              onChange={(event) =>
                setBusinessLines((prev) => {
                  const updated = [...prev];
                  updated[index] = event.target.value;
                  return updated;
                })
              }
              placeholder={`라인 ${index + 1}`}
              disabled={isPending}
              className="bg-white"
            />
          ))}
        </div>
      </div>

      {/* 소셜 링크 */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
          <div className={`p-2.5 rounded-lg ${showSocials ? "bg-pink-50 text-pink-600" : "bg-gray-100 text-gray-400"}`}>
            <Share2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">소셜 링크</label>
              <VisibilityBadge visible={showSocials} onClick={() => setShowSocials(!showSocials)} />
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {socialLinks.map((item, index) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-600 flex-shrink-0">{item.label}</span>
              <Input
                value={item.url}
                onChange={(event) => updateSocial(index, "url", event.target.value)}
                placeholder="https://"
                disabled={isPending}
                className="bg-white flex-1"
              />
              <button
                type="button"
                onClick={() => updateSocial(index, "enabled", !item.enabled)}
                disabled={isPending}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors flex-shrink-0 ${
                  item.enabled
                    ? "text-green-600 bg-green-50 hover:bg-green-100"
                    : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {item.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
          ))}
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
