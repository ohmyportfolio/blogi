"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Lock } from "lucide-react";

interface ProtectedContentCardProps {
  title?: string;
  imageUrl?: string | null;
  createdAt?: Date;
  href: string;
  requiresAuth?: boolean;
  isLoggedIn?: boolean;
  lockedLabel?: string;
  isNew?: boolean;
}

export function ProtectedContentCard({
  title,
  imageUrl,
  createdAt,
  href,
  requiresAuth = false,
  isLoggedIn = false,
  lockedLabel = "회원 전용",
  isNew = false,
}: ProtectedContentCardProps) {
  // 비로그인 상태에서 로그인 필요 콘텐츠인 경우 비공개 표시
  const isLocked = requiresAuth && !isLoggedIn;

  // 회원 전용 콘텐츠는 완전히 다른 UI로 표시
  if (isLocked) {
    return (
      <div className="group rounded-xl md:rounded-2xl border border-black/5 bg-white/90 overflow-hidden shadow-sm text-left w-full cursor-default">
        <div className="relative aspect-[4/3] md:aspect-video overflow-hidden bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-8 h-8 md:w-10 md:h-10 text-white/80 mx-auto mb-2" />
            <span className="text-white/90 text-xs md:text-sm font-medium">{lockedLabel}</span>
          </div>
        </div>
        <div className="p-2 md:p-4">
          <h3 className="font-medium text-xs md:text-base line-clamp-2 text-gray-500">
            로그인 후 확인 가능합니다
          </h3>
          {createdAt && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
              {format(createdAt, "yyyy.MM.dd")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group rounded-xl md:rounded-2xl border border-black/5 bg-white/90 overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div className="relative aspect-[4/3] md:aspect-video overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title || "콘텐츠"}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300" />
        )}
      </div>
      <div className="p-2 md:p-4">
        <h3 className="font-medium text-xs md:text-base line-clamp-2">
          {isNew && <span className="inline-flex items-center px-1 py-0.5 mr-1 rounded text-[9px] md:text-[10px] font-bold bg-rose-500 text-white align-middle">NEW</span>}
          {title || "콘텐츠"}
        </h3>
        {createdAt && (
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
            {format(createdAt, "yyyy.MM.dd")}
          </p>
        )}
      </div>
    </Link>
  );
}
