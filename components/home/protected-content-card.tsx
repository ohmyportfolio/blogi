"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Lock } from "lucide-react";

interface ProtectedContentCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  createdAt: Date;
  href: string;
  requiresAuth?: boolean;
}

export function ProtectedContentCard({
  id,
  title,
  imageUrl,
  createdAt,
  href,
  requiresAuth = false,
}: ProtectedContentCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !session) {
      e.preventDefault();
      showToast("로그인이 필요합니다. 로그인 후 이용해주세요.", "info");
      router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
    }
  };

  // 비로그인 상태에서 로그인 필요 콘텐츠인 경우 비공개 표시
  const isLocked = requiresAuth && !session;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group rounded-xl md:rounded-2xl border border-black/5 bg-white/90 overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div className="relative aspect-[4/3] md:aspect-video overflow-hidden">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={isLocked ? "비공개 콘텐츠" : title}
              fill
              className={`object-cover transition-transform group-hover:scale-105 ${isLocked ? "blur-sm" : ""}`}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Lock className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            )}
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ${isLocked ? "" : ""}`}>
            {isLocked && <Lock className="w-6 h-6 md:w-8 md:h-8 text-slate-500" />}
          </div>
        )}
      </div>
      <div className="p-2 md:p-4">
        <h3 className="font-medium text-xs md:text-base line-clamp-2">
          {isLocked ? "로그인 후 확인 가능합니다" : title}
        </h3>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
          {format(createdAt, "yyyy.MM.dd")}
        </p>
      </div>
    </Link>
  );
}
