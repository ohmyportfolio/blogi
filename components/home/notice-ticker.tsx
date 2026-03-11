"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface NoticeItem {
  id: string;
  text: string;
  link?: string;
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
  },
};

interface NoticeTickerProps {
  notices: NoticeItem[];
  colorPreset?: NoticeColorPreset;
}

export function NoticeTicker({ notices, colorPreset = "amber" }: NoticeTickerProps) {
  if (!notices || notices.length === 0) return null;

  const c = colorPresets[colorPreset] ?? colorPresets.amber;

  return (
    <div
      className={`w-full flex-none ${c.bg} ${c.border}`}
      aria-label="공지사항"
    >
      <div className="flex items-center">
        <div className={`shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 ${c.labelBg} ${c.labelBorder}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${c.dot}`} />
          </span>
          <span className={`text-xs md:text-sm font-bold ${c.labelText} tracking-wide`}>공지</span>
        </div>

        <div className="overflow-hidden flex-1 py-2 md:py-2.5">
          <SlideUpTicker notices={notices} c={c} />
        </div>
      </div>
    </div>
  );
}

function SlideUpTicker({ notices, c }: { notices: NoticeItem[]; c: typeof colorPresets.amber }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  // phase: "idle" = showing current, "sliding" = animating up, "reset" = instantly repositioning
  const [phase, setPhase] = useState<"idle" | "sliding" | "reset">("idle");

  useEffect(() => {
    const interval = setInterval(() => {
      // Start slide up
      setPhase("sliding");

      setTimeout(() => {
        // Transition done: instantly reset positions (no transition) and advance index
        setPhase("reset");
        setCurrentIdx((prev) => (prev + 1) % notices.length);

        // Next frame: back to idle (re-enables transition for next slide)
        requestAnimationFrame(() => {
          setPhase("idle");
        });
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, [notices.length]);

  const current = notices[currentIdx];
  const next = notices[(currentIdx + 1) % notices.length];
  const noTransition = phase === "reset";

  return (
    <div className="relative overflow-hidden h-5 flex items-center justify-center">
      {/* Current item */}
      <div
        className={`absolute inset-x-0 flex items-center justify-center text-xs md:text-sm ${c.text} font-medium ${
          noTransition ? "" : "transition-transform duration-400 ease-in-out"
        } ${
          phase === "sliding" ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <NoticeContent notice={current} hover={c.hover} />
      </div>

      {/* Next item (slides up from below) */}
      <div
        className={`absolute inset-x-0 flex items-center justify-center text-xs md:text-sm ${c.text} font-medium ${
          noTransition ? "" : "transition-transform duration-400 ease-in-out"
        } ${
          phase === "sliding" ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <NoticeContent notice={next} hover={c.hover} />
      </div>
    </div>
  );
}

function NoticeContent({ notice, hover }: { notice: NoticeItem; hover: string }) {
  if (notice.link) {
    return (
      <Link
        href={notice.link}
        className={`truncate max-w-full px-3 ${hover} transition-colors duration-200`}
      >
        {notice.text}
      </Link>
    );
  }
  return <span className="truncate max-w-full px-3">{notice.text}</span>;
}
