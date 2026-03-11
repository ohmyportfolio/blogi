"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";

export interface NoticeItem {
  id: string;
  text: string;
  link?: string;
}

interface NoticeTickerProps {
  notices: NoticeItem[];
}

export function NoticeTicker({ notices }: NoticeTickerProps) {
  if (!notices || notices.length === 0) return null;

  const renderItems = () =>
    notices.map((notice, idx) => (
      <span key={notice.id} className="inline-flex items-center shrink-0">
        {idx > 0 && (
          <span className="mx-3 md:mx-4 text-muted-foreground/40 select-none">·</span>
        )}
        {notice.link ? (
          <Link
            href={notice.link}
            className="hover:text-primary transition-colors whitespace-nowrap"
          >
            {notice.text}
          </Link>
        ) : (
          <span className="whitespace-nowrap">{notice.text}</span>
        )}
      </span>
    ));

  return (
    <div
      className="w-full flex-none border-b border-border/50 bg-muted/50"
      role="marquee"
      aria-label="공지사항"
    >
      <div className="flex items-center">
        {/* Fixed label */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-primary/10 border-r border-border/50">
          <Megaphone className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
          <span className="text-xs md:text-sm font-semibold text-primary">공지</span>
        </div>

        {/* Scrolling area */}
        <div className="overflow-hidden flex-1 py-2 md:py-2.5">
          <div className="animate-ticker flex text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center shrink-0 pl-4">
              {renderItems()}
            </div>
            <div className="flex items-center shrink-0 pl-4" aria-hidden="true">
              {/* Duplicate for seamless loop */}
              {notices.map((notice, idx) => (
                <span key={`dup-${notice.id}`} className="inline-flex items-center shrink-0">
                  {idx > 0 && (
                    <span className="mx-3 md:mx-4 text-muted-foreground/40 select-none">·</span>
                  )}
                  <span className="whitespace-nowrap">{notice.text}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
