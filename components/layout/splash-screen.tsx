"use client";

import { useState, useEffect } from "react";
import type { SplashLogoSize } from "@/lib/site-settings";

const LOGO_SIZE_CLASSES: Record<SplashLogoSize, string> = {
  small: "w-20 h-20",
  medium: "w-32 h-32",
  large: "w-40 h-40",
  xlarge: "w-48 h-48",
};

interface SplashScreenProps {
  enabled: boolean;
  backgroundColor: string;
  logoUrl: string;
  logoSize: SplashLogoSize;
}

function shouldShowSplash(enabled: boolean): boolean {
  if (!enabled) return false;
  if (typeof window === "undefined") return false;
  if (window.innerWidth >= 768) return false;
  if (sessionStorage.getItem("splash_shown")) return false;
  return true;
}

export const SplashScreen = ({ enabled, backgroundColor, logoUrl, logoSize }: SplashScreenProps) => {
  const [show, setShow] = useState(() => shouldShowSplash(enabled));
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!show) return;

    // 표시되는 경우에만 세션 마킹
    sessionStorage.setItem("splash_shown", "1");

    // 1.5초 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // 2초 후 완전히 제거
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center md:hidden transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor }}
    >
      <img
        src={logoUrl}
        alt="Logo"
        className={`${LOGO_SIZE_CLASSES[logoSize]} object-contain`}
      />
    </div>
  );
};
