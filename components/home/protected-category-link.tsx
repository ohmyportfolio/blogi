"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface ProtectedCategoryLinkProps {
  href: string;
  label: string;
  imageUrl?: string | null;
  requiresAuth?: boolean;
  variant?: "mobile" | "desktop";
}

export function ProtectedCategoryLink({
  href,
  label,
  imageUrl,
  requiresAuth = false,
  variant = "mobile",
}: ProtectedCategoryLinkProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !session) {
      e.preventDefault();
      showToast("로그인이 필요합니다. 로그인 후 이용해주세요.", "info");
      router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
    }
  };

  const showImage = imageUrl && !imageError;

  if (variant === "mobile") {
    return (
      <Link href={href} className="group block w-full" onClick={handleClick}>
        <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
          {showImage ? (
            <Image
              src={imageUrl}
              alt={label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <span className="text-white text-xs font-semibold leading-tight block">
              {label}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // desktop variant
  return (
    <Link href={href} className="group block w-full" onClick={handleClick}>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-white text-sm font-semibold leading-tight block">
            {label}
          </span>
        </div>
      </div>
    </Link>
  );
}

// 커뮤니티 메뉴용
export function ProtectedCommunityLink({
  href,
  label,
  thumbnailUrl,
  requiresAuth = false,
  variant = "mobile",
}: {
  href: string;
  label: string;
  thumbnailUrl?: string | null;
  requiresAuth?: boolean;
  variant?: "mobile" | "desktop";
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !session) {
      e.preventDefault();
      showToast("로그인이 필요합니다. 로그인 후 이용해주세요.", "info");
      router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
    }
  };

  const showImage = thumbnailUrl && !imageError;

  if (variant === "mobile") {
    return (
      <Link href={href} className="group block w-full" onClick={handleClick}>
        <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
          {showImage ? (
            <Image
              src={thumbnailUrl}
              alt={label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <span className="text-white text-xs font-semibold leading-tight block">
              {label}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // desktop variant
  return (
    <Link href={href} className="group block w-full" onClick={handleClick}>
      <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md">
        {showImage ? (
          <Image
            src={thumbnailUrl}
            alt={label}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-white text-sm font-semibold leading-tight block">
            {label}
          </span>
        </div>
      </div>
    </Link>
  );
}
