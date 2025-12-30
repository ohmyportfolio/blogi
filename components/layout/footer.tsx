import Link from "next/link";
import type { ReactNode } from "react";
import { getFooterSettings } from "@/lib/footer-settings";
import { Instagram, Facebook, Youtube, Send, MessageCircle, Twitter, Globe } from "lucide-react";

const SOCIAL_ICONS: Record<string, ReactNode> = {
    instagram: <Instagram className="w-4 h-4" />,
    facebook: <Facebook className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    tiktok: <Globe className="w-4 h-4" />,
    telegram: <Send className="w-4 h-4" />,
    kakao: <MessageCircle className="w-4 h-4" />,
    x: <Twitter className="w-4 h-4" />,
};

export const Footer = async () => {
    const settings = await getFooterSettings();
    if (!settings.footerEnabled) {
        return null;
    }
    return (
        <footer className="relative overflow-hidden bg-[#0b1320] text-white py-10 border-t border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(700px_420px_at_90%_0%,rgba(14,165,166,0.2),transparent_60%)]" />
            <div className="container mx-auto px-4 text-center relative space-y-4">
                <h3 className="font-display text-2xl">{settings.siteName || "사이트"}</h3>
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
                    <div className="text-xs text-white/60 space-y-1">
                        {settings.businessLines.map((line, index) => (
                            <div key={`${line}-${index}`}>{line}</div>
                        ))}
                    </div>
                )}
                {settings.showSocials && settings.socialLinks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 text-xs text-white/70">
                        {settings.socialLinks.map((link) => (
                            <Link
                                key={`${link.key}-${link.url}`}
                                href={link.url}
                                className="hover:text-white transition"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className="inline-flex items-center gap-2">
                                    {SOCIAL_ICONS[link.key] ?? <Globe className="w-4 h-4" />}
                                    <span>{link.label}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
                {settings.showCopyright && (
                    <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
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
