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
  LayoutDashboard,
  Instagram,
  Facebook,
  Youtube,
  Send,
  MessageCircle,
  Globe,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Tag,
} from "lucide-react";
import { FaInstagram, FaFacebookF, FaYoutube, FaTiktok, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { RiKakaoTalkFill } from "react-icons/ri";

type SocialLink = {
  key: string;
  label: string;
  url: string;
  enabled: boolean;
};

type SocialIconStyle = "branded" | "branded-sm" | "minimal";
type SocialAlignment = "left" | "center" | "right";

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
    socialIconStyle?: SocialIconStyle;
    socialAlignment?: SocialAlignment;
    showSocialLabels?: boolean;
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
  const [socialIconStyle, setSocialIconStyle] = useState<SocialIconStyle>(
    initialData.socialIconStyle ?? "branded"
  );
  const [socialAlignment, setSocialAlignment] = useState<SocialAlignment>(
    initialData.socialAlignment ?? "center"
  );
  const [showSocialLabels, setShowSocialLabels] = useState(
    initialData.showSocialLabels ?? false
  );

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
        socialIconStyle,
        socialAlignment,
        showSocialLabels,
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
            placeholder="예) Copyright © Blogi. All rights reserved."
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
        {/* 아이콘 스타일 선택 */}
        <div className="px-4 pb-3 border-b border-gray-100">
          <label className="text-xs text-gray-500 mb-2 block">아이콘 스타일</label>
          <div className="flex gap-2">
            {/* 브랜드 (큰) */}
            <button
              type="button"
              onClick={() => setSocialIconStyle("branded")}
              disabled={isPending}
              className={`flex-1 p-2 rounded-lg transition-colors ${
                socialIconStyle === "branded"
                  ? "bg-pink-100 ring-1 ring-pink-300"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <div className="flex justify-center gap-1 mb-1.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
                  <FaInstagram className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#1877F2]">
                  <FaFacebookF className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#FF0000]">
                  <FaYoutube className="w-3.5 h-3.5 text-white" />
                </span>
              </div>
              <span className="text-[10px] font-medium text-gray-600">브랜드 (큰)</span>
            </button>
            {/* 브랜드 (작은) */}
            <button
              type="button"
              onClick={() => setSocialIconStyle("branded-sm")}
              disabled={isPending}
              className={`flex-1 p-2 rounded-lg transition-colors ${
                socialIconStyle === "branded-sm"
                  ? "bg-pink-100 ring-1 ring-pink-300"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <div className="flex justify-center gap-1 mb-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
                  <FaInstagram className="w-3 h-3 text-white" />
                </span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#1877F2]">
                  <FaFacebookF className="w-3 h-3 text-white" />
                </span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#FF0000]">
                  <FaYoutube className="w-3 h-3 text-white" />
                </span>
              </div>
              <span className="text-[10px] font-medium text-gray-600">브랜드 (작은)</span>
            </button>
            {/* 미니멀 */}
            <button
              type="button"
              onClick={() => setSocialIconStyle("minimal")}
              disabled={isPending}
              className={`flex-1 p-2 rounded-lg transition-colors ${
                socialIconStyle === "minimal"
                  ? "bg-pink-100 ring-1 ring-pink-300"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <div className="flex justify-center gap-1.5 mb-1.5">
                <Instagram className="w-4 h-4 text-gray-500" />
                <Facebook className="w-4 h-4 text-gray-500" />
                <Youtube className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-[10px] font-medium text-gray-600">미니멀</span>
            </button>
          </div>
        </div>
        {/* 정렬 및 라벨 표시 옵션 */}
        <div className="px-4 pb-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
          {/* 정렬 */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-2 block">정렬</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSocialAlignment("left")}
                disabled={isPending}
                className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  socialAlignment === "left"
                    ? "bg-pink-100 ring-1 ring-pink-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <AlignLeft className="w-4 h-4 text-gray-600" />
                <span className="text-[10px] font-medium text-gray-600">좌측</span>
              </button>
              <button
                type="button"
                onClick={() => setSocialAlignment("center")}
                disabled={isPending}
                className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  socialAlignment === "center"
                    ? "bg-pink-100 ring-1 ring-pink-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <AlignCenter className="w-4 h-4 text-gray-600" />
                <span className="text-[10px] font-medium text-gray-600">가운데</span>
              </button>
              <button
                type="button"
                onClick={() => setSocialAlignment("right")}
                disabled={isPending}
                className={`flex-1 p-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  socialAlignment === "right"
                    ? "bg-pink-100 ring-1 ring-pink-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <AlignRight className="w-4 h-4 text-gray-600" />
                <span className="text-[10px] font-medium text-gray-600">우측</span>
              </button>
            </div>
          </div>
          {/* 라벨 표시 */}
          <div className="md:w-40">
            <label className="text-xs text-gray-500 mb-2 block">라벨 표시</label>
            <button
              type="button"
              onClick={() => setShowSocialLabels(!showSocialLabels)}
              disabled={isPending}
              className={`w-full p-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                showSocialLabels
                  ? "bg-pink-100 ring-1 ring-pink-300"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <Tag className="w-4 h-4 text-gray-600" />
              <span className="text-[10px] font-medium text-gray-600">
                {showSocialLabels ? "표시" : "숨김"}
              </span>
            </button>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2">
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

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  );
};
