"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, LogOut, Settings, Menu, X, Lock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import type { MenuItemData } from "@/lib/menus";
import type { HeaderStyle } from "@/lib/header-styles";
import type { LogoSize, MobileTopSiteNameSize, SiteNamePosition } from "@/lib/site-settings";
import { useScrollHeader } from "@/hooks/use-scroll-header";

interface HeaderClientProps {
  menuItems: MenuItemData[];
  siteName: string;
  siteLogoUrl: string;
  siteTagline?: string;
  communityGroups: {
    menuItemId: string;
    label: string;
    href: string;
    slug: string;
    boards: { id: string; key: string; slug: string; name: string }[];
  }[];
  headerStyle?: HeaderStyle;
  headerScrollEffect?: boolean;
  hideSearch?: boolean;
  logoSize?: LogoSize;
  siteNamePosition?: SiteNamePosition;
  showMobileTopSiteName?: boolean;
  showMobileTopSiteNameSize?: MobileTopSiteNameSize;
}

// 배너 높이에 따른 클래스 (내부적으로 로고 스케일로 사용)
const getLogoSizeClasses = (size: LogoSize = "medium") => {
  switch (size) {
    case "small":
      return { desktop: "h-8", mobile: "h-[40px]" };
    case "medium":
      return { desktop: "h-12", mobile: "h-[60px]" };
    case "large":
      return { desktop: "h-16", mobile: "h-[80px]" };
    case "xlarge":
      return { desktop: "h-20", mobile: "h-[100px]" };
    case "xxlarge":
      return { desktop: "h-[100px]", mobile: "h-[120px]" };
    case "xxxlarge":
      return { desktop: "h-[150px]", mobile: "h-[150px]" };
    default:
      return { desktop: "h-12", mobile: "h-[60px]" };
  }
};

const getMobileHeaderOffsetPx = (size: LogoSize = "medium") => {
  switch (size) {
    case "small":
      return 132;
    case "medium":
      return 152;
    case "large":
      return 172;
    case "xlarge":
      return 192;
    case "xxlarge":
      return 212;
    case "xxxlarge":
      return 242;
    default:
      return 152;
  }
};

export const HeaderClient = ({
  menuItems,
  siteName,
  siteLogoUrl,
  siteTagline,
  communityGroups,
  headerStyle = "classic",
  headerScrollEffect = true,
  hideSearch = false,
  logoSize = "medium",
  siteNamePosition = "logo",
  showMobileTopSiteName = true,
  showMobileTopSiteNameSize = "md",
}: HeaderClientProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [openCommunityId, setOpenCommunityId] = useState<string | null>(null);
  const groupMap = useMemo(
    () => new Map(communityGroups.map((group) => [group.menuItemId, group])),
    [communityGroups]
  );

  // 스크롤 감지 (classic 외 스타일에서 사용)
  const { isScrolled } = useScrollHeader(50, headerScrollEffect && headerStyle !== "classic");

  const isBento = headerStyle === "bento";

  // 스타일별 헤더 클래스
  const getHeaderClasses = () => {
    const baseTransition = "transition-all duration-300 ease-out";

    switch (headerStyle) {
      case "glassmorphism":
        return cn(
          "sticky top-0 z-40 w-full text-gray-900",
          baseTransition,
          isScrolled
            ? "backdrop-blur-xl bg-white/80 shadow-lg border-b border-white/20"
            : "backdrop-blur-md bg-white/60"
        );
      case "minimal":
        return cn(
          "sticky top-0 z-40 w-full text-gray-900",
          baseTransition,
          isScrolled
            ? "bg-white shadow-sm border-b border-gray-200/70"
            : "bg-white/95 border-b border-gray-200/60"
        );
      case "bento":
        return cn(
          "sticky top-0 z-40 w-full text-gray-900",
          baseTransition,
          isScrolled
            ? "backdrop-blur-lg bg-gray-50/90 shadow-md"
            : "backdrop-blur-md bg-gray-50/70"
        );
      default: // classic
        return "relative w-full overflow-hidden bg-[#0b1320] text-white";
    }
  };

  // 스타일별 텍스트 클래스
  const getTextClasses = (isActive: boolean, isNav = false) => {
    if (headerStyle === "classic") {
      return isActive ? "text-white" : "text-white/70 hover:text-white";
    }
    // 모던 스타일들
    if (isNav) {
      return isActive
        ? "text-gray-900 font-semibold"
        : "text-gray-600 hover:text-gray-900";
    }
    return isActive ? "text-gray-900" : "text-gray-600 hover:text-gray-900";
  };

  // 스타일별 배경 오버레이 (classic만 사용)
  const renderBackgroundOverlay = () => {
    if (headerStyle !== "classic") return null;
    return (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_20%_-10%,rgba(14,165,166,0.35),transparent_60%),radial-gradient(700px_420px_at_80%_0%,rgba(255,107,87,0.35),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,10,20,0.85)_0%,rgba(11,19,32,0.6)_45%,rgba(12,28,42,0.9)_100%)]" />
      </>
    );
  };

  // 스타일별 입력 필드 클래스
  const getInputClasses = () => {
    if (headerStyle === "classic") {
      return "w-full pl-4 pr-10 bg-white/10 text-white placeholder:text-white/60 border-white/15";
    }
    if (headerStyle === "bento") {
      return "w-full pl-4 pr-10 bg-transparent text-gray-900 placeholder:text-gray-500 border-transparent focus-visible:ring-0 focus-visible:ring-offset-0";
    }
    return "w-full pl-4 pr-10 bg-gray-100/80 text-gray-900 placeholder:text-gray-500 border-gray-200/50";
  };

  // 스타일별 아이콘 색상
  const getIconClasses = () => {
    if (headerStyle === "classic") {
      return "text-white/60";
    }
    return "text-gray-500";
  };

  // Bento 스타일 모듈 클래스
  const getBentoTileClasses = () => {
    if (!isBento) return "";
    return cn(
      "rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-md",
      isScrolled ? "shadow-md" : "shadow-sm",
      "transition-all duration-200"
    );
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setOpenCommunityId(null);
  };

  // 메뉴는 모두 보이고, 클릭 시 로그인 필요 여부 체크
  const visibleMenuItems = menuItems;

  const handleProtectedClick = (event: React.MouseEvent, href: string) => {
    if (session) return;
    event.preventDefault();
    showToast("로그인이 필요합니다. 로그인 후 이용해주세요.", "info");
    router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
    closeSidebar();
  };

  const handleMobileSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = mobileSearchQuery.trim();
    if (!query) {
      showToast("검색어를 입력해주세요.", "info");
      return;
    }
    setIsSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const renderMenuLink = (route: MenuItemData, isMobile = false) => {
    const isActive =
      !!route.href &&
      (pathname === route.href || pathname?.startsWith(route.href + "/"));
    const isProtected = Boolean(route.requiresAuth && !session);

    // 모바일 스타일 (사이드바용 - 항상 다크)
    const mobileLinkClass = cn(
      "block px-6 py-3 text-sm font-semibold transition-colors",
      isActive
        ? "text-white bg-white/10 border-l-4 border-white/70"
        : "text-white/70 hover:text-white hover:bg-white/5"
    );

    // 데스크톱 스타일 (headerStyle에 따라 변경)
    const desktopLinkClass = cn(
      "px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
      getTextClasses(isActive, true),
      headerStyle === "bento" && "rounded-xl hover:bg-white/50"
    );

    const linkClass = isMobile ? mobileLinkClass : desktopLinkClass;

    const lockIconClass = headerStyle === "classic" ? "text-white/70" : "text-gray-400";

    const content = (
      <span className="flex items-center gap-2">
        <span>{route.label}</span>
        {route.requiresAuth && <Lock className={cn("w-3 h-3", lockIconClass)} />}
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
    const group = route.id ? groupMap.get(route.id) : undefined;
    const communityHref = group?.href || route.href || "/community";
    const isActive = communityHref
      ? pathname === communityHref || pathname?.startsWith(communityHref + "/")
      : pathname === "/community" || pathname?.startsWith("/community/");
    const label = group?.label || route.label || "커뮤니티";
    const communityKey = route.id ?? route.href ?? route.label ?? "community";

    // 모바일 스타일 (사이드바용 - 항상 다크)
    const mobileLinkClass = cn(
      "block px-6 py-3 text-sm font-semibold transition-colors",
      isActive
        ? "text-white bg-white/10 border-l-4 border-white/70"
        : "text-white/70 hover:text-white hover:bg-white/5"
    );

    // 데스크톱 스타일 (headerStyle에 따라 변경)
    const desktopLinkClass = cn(
      "px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
      getTextClasses(isActive, true),
      headerStyle === "bento" && "rounded-xl hover:bg-white/50"
    );

    const linkClass = isMobile ? mobileLinkClass : desktopLinkClass;

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

  // 스타일별 사이트명/태그라인 색상
  const taglineClass = headerStyle === "classic" ? "text-white/60" : "text-gray-500";
  const userNameClass = headerStyle === "classic" ? "text-white/70" : "text-gray-600";
  const showTopSiteName = showMobileTopSiteName;
  const mobileTopNameSizeClass =
    showMobileTopSiteNameSize === "sm"
      ? "text-sm"
      : showMobileTopSiteNameSize === "lg"
      ? "text-lg"
      : "text-base";
  const mobileHeaderOffset = getMobileHeaderOffsetPx(logoSize);

  return (
    <>
      <header className={cn(getHeaderClasses(), "hidden md:block")}>
        {renderBackgroundOverlay()}
        {isBento ? (
          <div className="container mx-auto px-4 relative py-3">
            <div className="grid gap-3">
              <div className={cn(
                "grid gap-3 items-center",
                hideSearch
                  ? "lg:grid-cols-[auto_1fr_auto]"
                  : "lg:grid-cols-[auto_minmax(0,1fr)_auto]"
              )}>
                {/* 검색 숨김 시: 왼쪽 유저 정보 */}
                {hideSearch && (
                  <div className={cn("flex items-center gap-x-4 text-sm px-4 py-2", getBentoTileClasses())}>
                    {session ? (
                      <Link
                        href="/profile"
                        className={cn(userNameClass, "hover:underline transition cursor-pointer")}
                      >
                        {session.user?.name || session.user?.email}님
                      </Link>
                    ) : (
                      <Link href="/login" className={cn(getTextClasses(false), "transition")}>
                        로그인
                      </Link>
                    )}
                  </div>
                )}

                {/* 배너 이미지 */}
                <Link
                  href="/"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2",
                    getBentoTileClasses(),
                    hideSearch && "justify-center"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={siteLogoUrl}
                    alt={`${siteName} 배너`}
                    className={cn("object-contain", getLogoSizeClasses(logoSize).desktop)}
                  />
                  {siteNamePosition === "logo" && (
                    <span className={cn(
                      "font-display tracking-tight",
                      hideSearch ? "text-sm" : "text-xl"
                    )}>
                      {siteName}
                    </span>
                  )}
                </Link>

                {/* 사이트명 (header1) + 검색 폼 */}
                {!hideSearch ? (
                  <div className={cn("flex items-center gap-3 px-4 py-2", getBentoTileClasses())}>
                    {siteNamePosition === "header1" && (
                      <span className="font-display text-sm tracking-tight whitespace-nowrap">
                        {siteName}
                      </span>
                    )}
                    <form action="/search" method="get" className="relative w-full">
                      <Input
                        name="q"
                        type="search"
                        className={getInputClasses()}
                        placeholder="검색어를 입력하세요"
                      />
                      <Search className={cn("absolute right-3 top-2.5 h-5 w-5", getIconClasses())} />
                    </form>
                  </div>
                ) : (
                  siteNamePosition === "header1" && (
                    <div className={cn("flex items-center justify-center px-4 py-2", getBentoTileClasses())}>
                      <span className="font-display text-sm tracking-tight">
                        {siteName}
                      </span>
                    </div>
                  )
                )}

                <div className={cn("flex items-center gap-x-4 text-sm px-4 py-2", getBentoTileClasses())}>
                  {session ? (
                    <>
                      {!hideSearch && (
                        <Link
                          href="/profile"
                          className={cn(userNameClass, "hover:underline transition cursor-pointer")}
                        >
                          {session.user?.name || session.user?.email}님
                        </Link>
                      )}
                      {session.user?.role === "ADMIN" && (
                        <Link href="/admin" className={cn(getTextClasses(false), "transition flex items-center gap-1")}>
                          <Settings className="w-4 h-4" />
                          관리자
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={cn(getTextClasses(false), "transition flex items-center gap-1")}
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      {!hideSearch && (
                        <Link href="/login" className={cn(getTextClasses(false), "transition")}>
                          로그인
                        </Link>
                      )}
                      <Link href="/register" className={cn(getTextClasses(false), "transition")}>
                        회원가입
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className={cn("px-3 py-2", getBentoTileClasses())}>
                <nav className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-1">
                  {visibleMenuItems.map((route) =>
                    route.linkType === "community"
                      ? renderCommunityMenu(route)
                      : renderMenuLink(route)
                  )}
                </nav>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 relative">
            <div className={cn(
              "flex items-center gap-3 py-3",
              "transition-all duration-300",
              hideSearch ? "justify-center" : "justify-between"
            )}>
              {/* 검색 숨김 시: 왼쪽 유저 정보 */}
              {hideSearch && (
                <div className="hidden md:flex items-center gap-x-4 text-sm absolute left-4">
                  {session ? (
                    <Link
                      href="/profile"
                      className={cn(userNameClass, "hover:underline transition cursor-pointer")}
                    >
                      {session.user?.name || session.user?.email}님
                    </Link>
                  ) : (
                    <Link href="/login" className={cn(getTextClasses(false), "transition")}>
                      로그인
                    </Link>
                  )}
                </div>
              )}

              <button
                className="md:hidden p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="메뉴 열기"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* 배너 이미지 */}
              <Link href="/" className={cn(
                "flex items-center gap-3",
                hideSearch && "justify-center"
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={siteLogoUrl}
                  alt={`${siteName} 배너`}
                  className={cn(
                    "transition-all duration-300 object-contain",
                    getLogoSizeClasses(logoSize).desktop
                  )}
                />
                {siteNamePosition === "logo" && (
                  <span className={cn(
                    "font-display tracking-tight",
                    hideSearch ? "text-sm" : "text-xl"
                  )}>
                    {siteName}
                  </span>
                )}
              </Link>

              {/* 사이트명 (header1 위치일 때) + 검색 폼 */}
              {!hideSearch ? (
                <div className="hidden md:flex items-center gap-4">
                  {siteNamePosition === "header1" && (
                    <span className="font-display text-sm tracking-tight whitespace-nowrap">
                      {siteName}
                    </span>
                  )}
                  <form action="/search" method="get" className="relative w-[360px]">
                    <Input
                      name="q"
                      type="search"
                      className={getInputClasses()}
                      placeholder="검색어를 입력하세요"
                    />
                    <Search className={cn("absolute right-3 top-2.5 h-5 w-5", getIconClasses())} />
                  </form>
                </div>
              ) : (
                /* 검색 숨김일 때 사이트명 header1 위치 표시 */
                siteNamePosition === "header1" && (
                  <span className="hidden md:block font-display text-sm tracking-tight">
                    {siteName}
                  </span>
                )
              )}

              {/* 우측 유저 정보 */}
              <div className={cn(
                "hidden md:flex items-center gap-x-4 text-sm",
                hideSearch && "absolute right-4"
              )}>
                {session ? (
                  <>
                    {!hideSearch && (
                      <Link
                        href="/profile"
                        className={cn(userNameClass, "hover:underline transition cursor-pointer")}
                      >
                        {session.user?.name || session.user?.email}님
                      </Link>
                    )}
                    {session.user?.role === "ADMIN" && (
                      <Link href="/admin" className={cn(getTextClasses(false), "transition flex items-center gap-1")}>
                        <Settings className="w-4 h-4" />
                        관리자
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className={cn(getTextClasses(false), "transition flex items-center gap-1")}
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    {!hideSearch && (
                      <Link href="/login" className={cn(getTextClasses(false), "transition")}>
                        로그인
                      </Link>
                    )}
                    <Link href="/register" className={cn(getTextClasses(false), "transition")}>
                      회원가입
                    </Link>
                  </>
                )}
              </div>

              <div className="md:hidden w-10" />
            </div>

            <div className="hidden md:block transition-all duration-300 pb-4">
              <nav className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-1">
                {visibleMenuItems.map((route) =>
                  route.linkType === "community"
                    ? renderCommunityMenu(route)
                    : renderMenuLink(route)
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0b1320] shadow-lg pt-2">
        <>
          {/* Row 1: Menu + (Site Name) + Search Icon + Login */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 relative">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-11 h-11 rounded-lg bg-[#2d5a87] hover:bg-[#3d6a97] transition flex items-center justify-center"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            {showTopSiteName && (
              <span
                className={cn(
                  "text-white font-display tracking-wide absolute left-1/2 -translate-x-1/2",
                  mobileTopNameSizeClass
                )}
              >
                {siteName}
              </span>
            )}

            <div className="flex items-center gap-1">
              {!hideSearch && (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="검색"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              )}
              {session ? (
                <Link
                  href="/profile"
                  className="text-white text-sm font-medium px-2 h-11 flex items-center truncate max-w-[96px] hover:text-white/80 transition"
                >
                  {session.user?.name?.slice(0, 4) || "회원"}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-white text-sm font-semibold whitespace-nowrap px-2 h-11 flex items-center hover:text-white/80 transition"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>

          {/* Row 2: Banner Image (image only) */}
          <div className="flex items-center justify-center py-3">
            <Link href="/" className="flex items-center">
              <Image
                src={siteLogoUrl}
                alt={`${siteName} 배너`}
                width={240}
                height={140}
                className={cn("w-auto object-contain", getLogoSizeClasses(logoSize).mobile)}
                unoptimized
              />
            </Link>
          </div>
        </>
      </div>
      <div className="md:hidden" style={{ height: mobileHeaderOffset }} aria-hidden />

      {isSearchOpen && (
        <div
          className="md:hidden fixed inset-0 z-[70] bg-black/60"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="absolute left-0 right-0 top-0 mt-16 px-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">검색</div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                  aria-label="검색 닫기"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <form
                action="/search"
                method="get"
                className="mt-3"
                onSubmit={handleMobileSearchSubmit}
              >
                <div className="relative">
                  <Input
                    name="q"
                    type="search"
                    placeholder="검색어를 입력하세요"
                    autoFocus
                    value={mobileSearchQuery}
                    onChange={(event) => setMobileSearchQuery(event.target.value)}
                    className="h-11 pl-4 pr-11 bg-gray-100 text-gray-900 placeholder:text-gray-500 border-0 rounded-xl"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center"
                    aria-label="검색 실행"
                  >
                    <Search className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteLogoUrl}
              alt={`${siteName} 배너`}
              className="h-12 w-auto object-contain"
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

        <nav className="py-2 mt-4">
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
              <Link
                href="/profile"
                onClick={closeSidebar}
                className="flex items-center gap-2 text-sm hover:text-white transition"
              >
                <User className="w-4 h-4" />
                프로필
              </Link>
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
