"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, LogOut, Settings, Menu, X, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import type { MenuItemData } from "@/lib/menus";

interface HeaderClientProps {
  menuItems: MenuItemData[];
  siteName: string;
  siteLogoUrl: string;
  communityGroups: {
    menuItemId: string;
    label: string;
    href: string;
    slug: string;
    boards: { id: string; key: string; slug: string; name: string }[];
  }[];
  communityEnabled: boolean;
}

export const HeaderClient = ({
  menuItems,
  siteName,
  siteLogoUrl,
  communityGroups,
  communityEnabled,
}: HeaderClientProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openCommunityId, setOpenCommunityId] = useState<string | null>(null);
  const groupMap = useMemo(
    () => new Map(communityGroups.map((group) => [group.menuItemId, group])),
    [communityGroups]
  );

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setOpenCommunityId(null);
  };
  const visibleMenuItems = communityEnabled
    ? menuItems
    : menuItems.filter((item) => item.linkType !== "community");

  const handleProtectedClick = (event: React.MouseEvent, href: string) => {
    if (session) return;
    event.preventDefault();
    showToast("로그인이 필요합니다. 로그인 후 이용해주세요.", "info");
    router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
    closeSidebar();
  };

  const renderMenuLink = (route: MenuItemData, isMobile = false) => {
    const isActive =
      !!route.href &&
      (pathname === route.href || pathname?.startsWith(route.href + "/"));
    const isProtected = Boolean(route.requiresAuth && !session);
    const communityKey = route.id ?? route.href ?? route.label ?? "community";
    const linkClass = isMobile
      ? cn(
          "block px-6 py-3 text-sm font-semibold transition-colors",
          isActive
            ? "text-white bg-white/10 border-l-4 border-white/70"
            : "text-white/70 hover:text-white hover:bg-white/5"
        )
      : cn(
          "px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
          isActive
            ? "text-white"
            : "text-white/70 hover:text-white"
        );

    const content = (
      <span className="flex items-center gap-2">
        <span>{route.label}</span>
        {route.requiresAuth && <Lock className="w-3 h-3 text-white/70" />}
      </span>
    );

    return (
      <Link
        key={route.id ?? route.href}
        href={route.href}
        className={linkClass}
        target={route.openInNew ? "_blank" : undefined}
        rel={route.openInNew ? "noopener noreferrer" : undefined}
        onClick={(event) => {
          if (isProtected) {
            handleProtectedClick(event, route.href);
            return;
          }
          if (isMobile) {
            closeSidebar();
          }
        }}
      >
        {content}
      </Link>
    );
  };

  const renderCommunityMenu = (route: MenuItemData, isMobile = false) => {
    if (!communityEnabled) return null;
    const group = route.id ? groupMap.get(route.id) : undefined;
    const communityHref = group?.href || route.href || "/community";
    const isActive = communityHref
      ? pathname === communityHref || pathname?.startsWith(communityHref + "/")
      : pathname === "/community" || pathname?.startsWith("/community/");
    const label = group?.label || route.label || "커뮤니티";
    const communityKey = route.id ?? route.href ?? route.label ?? "community";
    const linkClass = isMobile
      ? cn(
          "block px-6 py-3 text-sm font-semibold transition-colors",
          isActive
            ? "text-white bg-white/10 border-l-4 border-white/70"
            : "text-white/70 hover:text-white hover:bg-white/5"
        )
      : cn(
          "px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
          isActive ? "text-white" : "text-white/70 hover:text-white"
        );

    const list = (group?.boards ?? []).map((board) => (
      <Link
        key={board.id}
        href={`/community/${group?.slug ?? "community"}/${board.slug}`}
        className={
          isMobile
            ? "block px-8 py-2 text-sm text-white/70 hover:text-white"
            : "block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        }
        onClick={() => {
          if (isMobile) closeSidebar();
        }}
      >
        {board.name}
      </Link>
    ));

    if (isMobile) {
      return (
        <div key={route.id ?? "community"} className="border-b border-white/5">
          <button
            type="button"
            className={linkClass}
            onClick={() =>
              setOpenCommunityId((prev) => (prev === communityKey ? null : communityKey))
            }
          >
            {label}
          </button>
          {openCommunityId === communityKey && (
            <div className="pb-3">
              {communityHref && (
                <Link
                  href={communityHref}
                  className="block px-8 py-2 text-sm text-white/70 hover:text-white"
                  onClick={closeSidebar}
                >
                  전체 보기
                </Link>
              )}
              {list.length > 0 ? list : (
                <span className="block px-8 py-2 text-xs text-white/40">게시판 없음</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={route.id ?? "community"} className="relative group">
        {communityHref ? (
          <Link href={communityHref} className={linkClass}>
            {label}
          </Link>
        ) : (
          <span className={linkClass}>{label}</span>
        )}
        <div className="absolute left-0 top-full mt-2 min-w-[180px] rounded-xl border border-black/10 bg-white/95 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
          {communityHref && (
            <>
              <Link
                href={communityHref}
                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                전체 보기
              </Link>
              <div className="border-t border-black/5" />
            </>
          )}
          {list.length > 0 ? list : (
            <span className="block px-4 py-3 text-xs text-gray-400">게시판 없음</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="relative w-full overflow-hidden bg-[#0b1320] text-white hidden md:block">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_-10%,rgba(14,165,166,0.35),transparent_60%),radial-gradient(700px_420px_at_80%_0%,rgba(255,107,87,0.35),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,10,20,0.85)_0%,rgba(11,19,32,0.6)_45%,rgba(12,28,42,0.9)_100%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between gap-3 py-3">
            <button
              className="md:hidden p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="메뉴 열기"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-3">
              <Image
                src={siteLogoUrl}
                alt={`${siteName} 로고`}
                width={280}
                height={96}
                className="h-14 w-auto"
                priority
                unoptimized
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-display text-xl tracking-tight">{siteName}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                  Danang Curated
                </span>
              </div>
            </Link>

            <form action="/search" method="get" className="hidden md:flex relative w-[360px]">
              <Input
                name="q"
                type="search"
                className="w-full pl-4 pr-10 bg-white/10 text-white placeholder:text-white/60 border-white/15"
                placeholder="검색어를 입력하세요"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-white/60" />
            </form>

            <div className="hidden md:flex items-center gap-x-4 text-sm">
              {session ? (
                <>
                  <span className="text-white/70">
                    {session.user?.name || session.user?.email}님
                  </span>
                  {session.user?.role === "ADMIN" && (
                    <Link href="/admin" className="hover:text-white transition flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      관리자
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-white transition">
                    로그인
                  </Link>
                  <Link href="/register" className="hover:text-white transition">
                    회원가입
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden w-10" />
          </div>

          <div className="hidden md:block pb-5">
            <nav className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-1">
              {visibleMenuItems.map((route) =>
                route.linkType === "community"
                  ? renderCommunityMenu(route)
                  : renderMenuLink(route)
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Floating hamburger button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-full bg-[#0b1320]/90 text-white shadow-lg backdrop-blur-sm border border-white/10 hover:bg-[#0b1320] transition"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50" onClick={closeSidebar} />
      )}

      <div
        className={cn(
          "md:hidden fixed top-0 left-0 h-full w-72 bg-[#0b1320] text-white z-[60] transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" className="flex items-center" onClick={closeSidebar}>
            <Image
              src={siteLogoUrl}
              alt={`${siteName} 로고`}
              width={240}
              height={82}
              className="h-12 w-auto"
              unoptimized
            />
          </Link>
          <button
            className="p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
            onClick={closeSidebar}
            aria-label="메뉴 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <form action="/search" method="get" className="relative">
            <Input
              name="q"
              type="search"
              className="w-full pl-4 pr-10 bg-white/10 text-white placeholder:text-white/60 border-white/15"
              placeholder="검색어를 입력하세요"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-white/60" />
          </form>
        </div>

        <nav className="py-2">
          {visibleMenuItems.map((route) =>
            route.linkType === "community"
              ? renderCommunityMenu(route, true)
              : renderMenuLink(route, true)
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          {session ? (
            <div className="space-y-3">
              <div className="text-white/60 text-sm">
                {session.user?.name || session.user?.email}님
              </div>
              {session.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={closeSidebar}
                  className="flex items-center gap-2 text-sm hover:text-white transition"
                >
                  <Settings className="w-4 h-4" />
                  관리자
                </Link>
              )}
              <button
                onClick={() => {
                  closeSidebar();
                  signOut({ callbackUrl: "/" });
                }}
                className="flex items-center gap-2 text-sm hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/login"
                onClick={closeSidebar}
                className="block w-full py-2 px-4 bg-white text-[#0b1320] text-center rounded-full font-semibold transition"
              >
                로그인
              </Link>
              <Link
                href="/register"
                onClick={closeSidebar}
                className="block w-full py-2 px-4 border border-white/30 hover:bg-white/10 text-white text-center rounded-full transition"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
