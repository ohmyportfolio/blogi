"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";

export interface NoticeItem {
  id: string;
  text: string;
  link?: string;
  isNew?: boolean;
}

export type NoticeColorPreset = "amber" | "red" | "green" | "blue" | "slate" | "dark" | "indigo" | "coral" | "teal";

const colorPresets: Record<NoticeColorPreset, {
  bg: string;
  border: string;
  labelBg: string;
  labelBorder: string;
  labelText: string;
  dot: string;
  text: string;
  hover: string;
  progressBar: string;
  closeBtn: string;
  newBadgeBg: string;
  newBadgeText: string;
  counterText: string;
  iconColor: string;
}> = {
  amber: {
    bg: "bg-amber-50",
    border: "border-b border-amber-200/60",
    labelBg: "bg-amber-100/80",
    labelBorder: "border-r border-amber-200/60",
    labelText: "text-amber-700",
    dot: "bg-amber-500",
    text: "text-neutral-600",
    hover: "hover:text-amber-700",
    progressBar: "bg-amber-400",
    closeBtn: "text-amber-400 hover:text-amber-600",
    newBadgeBg: "bg-red-500",
    newBadgeText: "text-white",
    counterText: "text-amber-500/70",
    iconColor: "text-amber-500",
  },
  red: {
    bg: "bg-red-50",
    border: "border-b border-red-200/60",
    labelBg: "bg-red-100/80",
    labelBorder: "border-r border-red-200/60",
    labelText: "text-red-700",
    dot: "bg-red-500",
    text: "text-neutral-600",
    hover: "hover:text-red-700",
    progressBar: "bg-red-400",
    closeBtn: "text-red-400 hover:text-red-600",
    newBadgeBg: "bg-red-600",
    newBadgeText: "text-white",
    counterText: "text-red-500/70",
    iconColor: "text-red-500",
  },
  green: {
    bg: "bg-emerald-50",
    border: "border-b border-emerald-200/60",
    labelBg: "bg-emerald-100/80",
    labelBorder: "border-r border-emerald-200/60",
    labelText: "text-emerald-700",
    dot: "bg-emerald-500",
    text: "text-neutral-600",
    hover: "hover:text-emerald-700",
    progressBar: "bg-emerald-400",
    closeBtn: "text-emerald-400 hover:text-emerald-600",
    newBadgeBg: "bg-red-500",
    newBadgeText: "text-white",
    counterText: "text-emerald-500/70",
    iconColor: "text-emerald-500",
  },
  blue: {
    bg: "bg-sky-50",
    border: "border-b border-sky-200/60",
    labelBg: "bg-sky-100/80",
    labelBorder: "border-r border-sky-200/60",
    labelText: "text-sky-700",
    dot: "bg-sky-500",
    text: "text-neutral-600",
    hover: "hover:text-sky-700",
    progressBar: "bg-sky-400",
    closeBtn: "text-sky-400 hover:text-sky-600",
    newBadgeBg: "bg-red-500",
    newBadgeText: "text-white",
    counterText: "text-sky-500/70",
    iconColor: "text-sky-500",
  },
  slate: {
    bg: "bg-slate-100",
    border: "border-b border-slate-200/60",
    labelBg: "bg-slate-200/80",
    labelBorder: "border-r border-slate-300/60",
    labelText: "text-slate-700",
    dot: "bg-slate-500",
    text: "text-slate-600",
    hover: "hover:text-slate-900",
    progressBar: "bg-slate-400",
    closeBtn: "text-slate-400 hover:text-slate-600",
    newBadgeBg: "bg-red-500",
    newBadgeText: "text-white",
    counterText: "text-slate-400",
    iconColor: "text-slate-500",
  },
  dark: {
    bg: "bg-neutral-900",
    border: "",
    labelBg: "bg-white/10",
    labelBorder: "border-r border-white/10",
    labelText: "text-amber-400",
    dot: "bg-amber-400",
    text: "text-neutral-300",
    hover: "hover:text-amber-300",
    progressBar: "bg-amber-400/80",
    closeBtn: "text-white/30 hover:text-white/60",
    newBadgeBg: "bg-amber-500",
    newBadgeText: "text-neutral-900",
    counterText: "text-white/30",
    iconColor: "text-amber-400",
  },
  indigo: {
    bg: "bg-gradient-to-r from-indigo-600 to-violet-600",
    border: "",
    labelBg: "bg-white/12",
    labelBorder: "border-r border-white/12",
    labelText: "text-indigo-200",
    dot: "bg-indigo-300",
    text: "text-white/90",
    hover: "hover:text-indigo-200",
    progressBar: "bg-indigo-300/80",
    closeBtn: "text-white/30 hover:text-white/60",
    newBadgeBg: "bg-yellow-400",
    newBadgeText: "text-indigo-900",
    counterText: "text-white/30",
    iconColor: "text-indigo-300",
  },
  coral: {
    bg: "bg-slate-900",
    border: "",
    labelBg: "bg-white/8",
    labelBorder: "border-r border-white/8",
    labelText: "text-orange-400",
    dot: "bg-orange-400",
    text: "text-stone-300",
    hover: "hover:text-orange-300",
    progressBar: "bg-orange-400/80",
    closeBtn: "text-white/30 hover:text-white/60",
    newBadgeBg: "bg-orange-500",
    newBadgeText: "text-white",
    counterText: "text-white/30",
    iconColor: "text-orange-400",
  },
  teal: {
    bg: "bg-teal-600",
    border: "",
    labelBg: "bg-white/12",
    labelBorder: "border-r border-white/12",
    labelText: "text-amber-200",
    dot: "bg-amber-300",
    text: "text-amber-50",
    hover: "hover:text-amber-200",
    progressBar: "bg-amber-300/80",
    closeBtn: "text-white/30 hover:text-white/60",
    newBadgeBg: "bg-yellow-400",
    newBadgeText: "text-teal-900",
    counterText: "text-white/30",
    iconColor: "text-amber-300",
  },
};

const SLIDE_DURATION = 3500;
const TRANSITION_MS = 400;

interface NoticeTickerProps {
  notices: NoticeItem[];
  colorPreset?: NoticeColorPreset;
}

export function NoticeTicker({ notices, colorPreset = "amber" }: NoticeTickerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("notice_dismissed")) {
      setDismissed(true);
    }
  }, []);

  if (!notices || notices.length === 0 || dismissed) return null;

  const c = colorPresets[colorPreset] ?? colorPresets.amber;

  const handleDismiss = () => {
    sessionStorage.setItem("notice_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div
      className={`w-full flex-none ${c.bg} ${c.border} relative`}
      aria-label="공지사항"
    >
      <div className="flex items-center">
        {/* Label */}
        <div className={`shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 ${c.labelBg} ${c.labelBorder}`}>
          <Megaphone className={`h-3 w-3 md:h-3.5 md:w-3.5 ${c.iconColor} animate-notice-icon`} />
          <span className={`text-xs md:text-sm font-bold ${c.labelText} tracking-wide`}>공지</span>
        </div>

        {/* Ticker content */}
        <div className="overflow-hidden flex-1 py-2 md:py-2.5">
          <SlideUpTicker notices={notices} c={c} />
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={`shrink-0 px-2 md:px-3 ${c.closeBtn} transition-colors`}
          aria-label="공지 닫기"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}


function SlideUpTicker({ notices, c }: { notices: NoticeItem[]; c: typeof colorPresets.amber }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "sliding" | "reset">("idle");

  const advance = useCallback(() => {
    setPhase("sliding");

    setTimeout(() => {
      setPhase("reset");
      setCurrentIdx((prev) => (prev + 1) % notices.length);

      requestAnimationFrame(() => {
        setPhase("idle");
      });
    }, TRANSITION_MS);
  }, [notices.length]);

  useEffect(() => {
    const interval = setInterval(advance, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [advance]);

  const current = notices[currentIdx];
  const next = notices[(currentIdx + 1) % notices.length];
  const noTransition = phase === "reset";

  return (
    <div className="relative overflow-hidden h-5">
      {/* Current item */}
      <div
        className={`absolute inset-x-0 top-0 h-full flex items-center justify-center text-xs md:text-sm ${c.text} font-medium ${
          noTransition ? "" : "transition-transform duration-400 ease-in-out"
        }`}
        style={{ transform: phase === "sliding" ? "translateY(-100%)" : "translateY(0)" }}
      >
        <NoticeContent notice={current} c={c} />
      </div>

      {/* Next item */}
      <div
        className={`absolute inset-x-0 top-0 h-full flex items-center justify-center text-xs md:text-sm ${c.text} font-medium ${
          noTransition ? "" : "transition-transform duration-400 ease-in-out"
        }`}
        style={{ transform: phase === "sliding" ? "translateY(0)" : "translateY(100%)" }}
      >
        <NoticeContent notice={next} c={c} />
      </div>
    </div>
  );
}

function NoticeContent({
  notice,
  c,
}: {
  notice: NoticeItem;
  c: typeof colorPresets.amber;
}) {
  return (
    <span className={`inline-flex items-center max-w-full px-3 ${notice.isNew ? "gap-2" : ""}`}>
      {notice.isNew && (
        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${c.newBadgeBg} ${c.newBadgeText} leading-none uppercase tracking-wider`}>
          N
        </span>
      )}
      {notice.link ? (
        <Link
          href={notice.link}
          className={`truncate ${c.hover} transition-colors duration-200`}
        >
          {notice.text}
        </Link>
      ) : (
        <span className="truncate">{notice.text}</span>
      )}
    </span>
  );
}
