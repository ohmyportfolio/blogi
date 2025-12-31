import Link from "next/link";
import { getFooterSettings, type SocialIconStyle, type SocialAlignment } from "@/lib/footer-settings";
import { Globe, Instagram, Facebook, Youtube, Send, MessageCircle } from "lucide-react";
import { FaInstagram, FaFacebookF, FaYoutube, FaTiktok, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { RiKakaoTalkFill } from "react-icons/ri";

// 브랜드 컬러 스타일 (큰 사이즈)
const getBrandedIcon = (key: string) => {
    switch (key) {
        case "instagram":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
                    <FaInstagram className="w-5 h-5 text-white" />
                </span>
            );
        case "facebook":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1877F2]">
                    <FaFacebookF className="w-5 h-5 text-white" />
                </span>
            );
        case "youtube":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#FF0000]">
                    <FaYoutube className="w-5 h-5 text-white" />
                </span>
            );
        case "tiktok":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-black">
                    <FaTiktok className="w-5 h-5 text-white" />
                </span>
            );
        case "telegram":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#0088cc]">
                    <FaTelegram className="w-5 h-5 text-white" />
                </span>
            );
        case "kakao":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEE500]">
                    <RiKakaoTalkFill className="w-5 h-5 text-[#3C1E1E]" />
                </span>
            );
        case "x":
            return (
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-black">
                    <FaXTwitter className="w-5 h-5 text-white" />
                </span>
            );
        default:
            return <Globe className="w-5 h-5 text-white" />;
    }
};

// 브랜드 컬러 스타일 (작은 사이즈)
const getBrandedSmallIcon = (key: string) => {
    switch (key) {
        case "instagram":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
                    <FaInstagram className="w-4 h-4 text-white" />
                </span>
            );
        case "facebook":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#1877F2]">
                    <FaFacebookF className="w-4 h-4 text-white" />
                </span>
            );
        case "youtube":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#FF0000]">
                    <FaYoutube className="w-4 h-4 text-white" />
                </span>
            );
        case "tiktok":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black">
                    <FaTiktok className="w-4 h-4 text-white" />
                </span>
            );
        case "telegram":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#0088cc]">
                    <FaTelegram className="w-4 h-4 text-white" />
                </span>
            );
        case "kakao":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#FEE500]">
                    <RiKakaoTalkFill className="w-4 h-4 text-[#3C1E1E]" />
                </span>
            );
        case "x":
            return (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black">
                    <FaXTwitter className="w-4 h-4 text-white" />
                </span>
            );
        default:
            return <Globe className="w-4 h-4 text-white" />;
    }
};

// 미니멀 스타일 (lucide 아이콘, 배경 없음)
const getMinimalIcon = (key: string) => {
    switch (key) {
        case "instagram":
            return <Instagram className="w-5 h-5 text-white/70 hover:text-white transition" />;
        case "facebook":
            return <Facebook className="w-5 h-5 text-white/70 hover:text-white transition" />;
        case "youtube":
            return <Youtube className="w-5 h-5 text-white/70 hover:text-white transition" />;
        case "tiktok":
            return <FaTiktok className="w-4 h-4 text-white/70" />;
        case "telegram":
            return <Send className="w-5 h-5 text-white/70 hover:text-white transition" />;
        case "kakao":
            return <MessageCircle className="w-5 h-5 text-white/70 hover:text-white transition" />;
        case "x":
            return <FaXTwitter className="w-4 h-4 text-white/70" />;
        default:
            return <Globe className="w-5 h-5 text-white/70 hover:text-white transition" />;
    }
};

const getSocialIcon = (key: string, style: SocialIconStyle) => {
    switch (style) {
        case "minimal":
            return getMinimalIcon(key);
        case "branded-sm":
            return getBrandedSmallIcon(key);
        default:
            return getBrandedIcon(key);
    }
};

const getAlignmentClass = (alignment: SocialAlignment) => {
    switch (alignment) {
        case "left":
            return "justify-start";
        case "right":
            return "justify-end";
        default:
            return "justify-center";
    }
};

export const Footer = async () => {
    const settings = await getFooterSettings();
    if (!settings.footerEnabled) {
        return null;
    }
    return (
        <footer className="relative overflow-hidden bg-[#0b1320] text-white py-4 md:py-8 border-t border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(700px_420px_at_90%_0%,rgba(14,165,166,0.2),transparent_60%)]" />
            <div className="container mx-auto px-4 text-center relative space-y-2 md:space-y-3">
                {(settings.showTerms || settings.showPrivacy) && (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-white/70">
                        {settings.showTerms && settings.termsContent && (
                            <Link href="/terms" className="hover:text-white transition">
                                이용약관
                            </Link>
                        )}
                        {settings.showPrivacy && settings.privacyContent && (
                            <Link href="/privacy" className="hover:text-white transition">
                                개인정보처리방침
                            </Link>
                        )}
                    </div>
                )}
                {settings.showBusinessInfo && settings.businessLines.length > 0 && (
                    <div className="hidden md:block text-xs text-white/60 space-y-1">
                        {settings.businessLines.map((line, index) => (
                            <div key={`${line}-${index}`}>{line}</div>
                        ))}
                    </div>
                )}
                {settings.showSocials && settings.socialLinks.length > 0 && (
                    <div className={`flex flex-wrap gap-4 ${getAlignmentClass(settings.socialAlignment)}`}>
                        {settings.socialLinks.map((link) => (
                            <Link
                                key={`${link.key}-${link.url}`}
                                href={link.url}
                                className="hover:opacity-80 transition flex items-center gap-1.5"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={link.label}
                            >
                                {getSocialIcon(link.key, settings.socialIconStyle)}
                                {settings.showSocialLabels && (
                                    <span className="text-xs text-white/70">{link.label}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
                {settings.showCopyright && (
                    <p className="text-[10px] md:text-xs text-white/50 uppercase tracking-[0.15em] md:tracking-[0.2em]">
                        {settings.copyrightText ||
                          (settings.siteName
                            ? `Copyright © ${settings.siteName}. All rights reserved.`
                            : "Copyright © All rights reserved.")}
                    </p>
                )}
            </div>
        </footer>
    );
};
