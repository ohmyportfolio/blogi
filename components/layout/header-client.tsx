"use client";

import { useMemo, useState, useRef, useCallback } from "react";
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
import type { LogoSize, MobileTopSiteNameSize, SiteNamePosition, BannerWidth, BannerMaxHeight, BannerPosition } from "@/lib/site-settings";
import { useScrollHeader } from "@/hooks/use-scroll-header";

interface HeaderClientProps {
  menuItems: MenuItemData[];
  siteName: string;
  siteLogoUrl: string;
  siteBannerUrl: string;
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
  bannerSize?: LogoSize;
  bannerWidth?: BannerWidth;
  bannerMaxHeight?: BannerMaxHeight;
  bannerPosition?: BannerPosition;
  siteNamePosition?: SiteNamePosition;
  showMobileTopSiteName?: boolean;
  showMobileTopSiteNameSize?: MobileTopSiteNameSize;
}

// 배너 가로 비율 클래스
const getBannerWidthClass = (size: BannerWidth = "medium") => {
  switch (size) {
    case "xsmall":   return "w-[40%]";
    case "small":    return "w-[50%]";
    case "medium":   return "w-[60%]";
    case "large":    return "w-[70%]";
    case "xlarge":   return "w-[80%]";
    case "xxlarge":  return "w-[90%]";
    case "xxxlarge": return "w-full";
    default:         return "w-[60%]";
  }
};

// 배너 최대 높이 클래스 (프리셋 값만 - Tailwind는 빌드 시점에 클래스 스캔)
const getBannerMaxHeightClass = (height: string) => {
  switch (height) {
    case "40":   return "max-h-[40px]";
    case "60":   return "max-h-[60px]";
    case "80":   return "max-h-[80px]";
    case "100":  return "max-h-[100px]";
    case "120":  return "max-h-[120px]";
    default:     return "";  // 커스텀 값은 인라인 스타일로 처리
  }
};

// 배너 최대 높이 인라인 스타일 (커스텀 값용)
const getBannerMaxHeightStyle = (height: string): React.CSSProperties => {
  // 프리셋 값은 클래스로 처리하므로 스타일 없음
  const presets = ["", "none", "40", "60", "80", "100", "120"];
  if (presets.includes(height)) return {};

  // 커스텀 픽셀 값
  const parsed = parseInt(height, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 500) {
    return { maxHeight: `${parsed}px` };
  }

  return {};
};

// 배너 이미지 위치 클래스
const getBannerPositionClass = (position: BannerPosition = "center") => {
  switch (position) {
    case "top":    return "object-top";
    case "center": return "object-center";
    case "bottom": return "object-bottom";
    default:       return "object-center";
  }
};

// 배너/로고 크기에 따른 클래스 (공통 스케일)
const getLogoSizeClasses = (size: LogoSize = "medium") => {
  switch (size) {
    case "xsmall":
      return { desktop: "h-6", mobile: "h-[32px]" };
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

// 배너 높이의 기본값 (bannerMaxHeight 미설정 시)
const getDefaultBannerHeightPx = (size: LogoSize = "medium") => {
  switch (size) {
    case "xsmall":   return 32;
    case "small":    return 40;
    case "medium":   return 60;
    case "large":    return 80;
    case "xlarge":   return 100;
    case "xxlarge":  return 120;
    case "xxxlarge": return 150;
    default:         return 60;
  }
};

// 모바일 헤더 오프셋 계산 (상단바 ~60px + 배너 영역 패딩 24px + 배너 높이)
const getMobileHeaderOffsetPx = (
  bannerSize: LogoSize,
  bannerMaxHeight: string,
  measuredBannerHeight: number
) => {
  const BASE_OFFSET = 84; // 상단바(~60px) + 배너 영역 패딩(~24px)

  // 실제 측정된 배너 높이가 있으면 그것을 사용 (가장 정확)
  if (measuredBannerHeight > 0) {
    return BASE_OFFSET + measuredBannerHeight;
  }

  // bannerMaxHeight가 설정된 경우 해당 값 사용
  if (bannerMaxHeight && bannerMaxHeight !== "" && bannerMaxHeight !== "none") {
    const parsed = parseInt(bannerMaxHeight, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 500) {
      return BASE_OFFSET + parsed;
    }
  }

  // 그렇지 않으면 bannerSize 기반 기본 높이 사용
  return BASE_OFFSET + getDefaultBannerHeightPx(bannerSize);
};

export const HeaderClient = ({
  menuItems,
  siteName,
  siteLogoUrl,
  siteBannerUrl,
  siteTagline,
  communityGroups,
  headerStyle = "classic",
  headerScrollEffect = true,
  hideSearch = false,
  logoSize = "medium",
  bannerSize = "medium",
  bannerWidth = "medium",
  bannerMaxHeight = "none",
  bannerPosition = "center",
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
  const [bannerHeight, setBannerHeight] = useState<number>(0);
  const bannerContainerRef = useRef<HTMLDivElement>(null);

  // 배너 컨테이너 높이 측정
  const measureBannerHeight = useCallback(() => {
    if (bannerContainerRef.current) {
      setBannerHeight(bannerContainerRef.current.offsetHeight);
    }
  }, []);
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
          "sticky top-0 z-40 w-full text-[color:var(--theme-header-text)]",
          baseTransition,
          isScrolled
            ? "backdrop-blur-xl bg-white/80 shadow-lg border-b border-white/20"
            : "backdrop-blur-md bg-white/60"
        );
      case "minimal":
        return cn(
          "sticky top-0 z-40 w-full text-[color:var(--theme-header-text)]",
          baseTransition,
          isScrolled
            ? "bg-white shadow-sm border-b border-gray-200/70"
            : "bg-white/95 border-b border-gray-200/60"
        );
      case "bento":
        return cn(
          "sticky top-0 z-40 w-full text-[color:var(--theme-header-text)]",
          baseTransition,
          isScrolled
            ? "backdrop-blur-lg bg-gray-50/90 shadow-md"
            : "backdrop-blur-md bg-gray-50/70"
        );
      default: // classic
        return "relative z-40 w-full overflow-visible";
    }
  };

  // 스타일별 텍스트 클래스 (classic은 CSS 변수 사용)
  const getTextClasses = (isActive: boolean, isNav = false) => {
    if (headerStyle === "classic") {
      // CSS 변수로 색상이 적용되므로 opacity만 조절
      return isActive ? "opacity-100" : "opacity-70 hover:opacity-100";
    }
    // 모던 스타일들도 테마 텍스트 색상 기준으로 맞춤
    if (isNav) {
      return isActive
        ? "font-semibold opacity-100"
        : "opacity-70 hover:opacity-100";
    }
    return isActive ? "opacity-100" : "opacity-70 hover:opacity-100";
  };

  // 스타일별 배경 오버레이 (테마 색상 적용을 위해 제거됨)
  const renderBackgroundOverlay = () => {
    return null;
  };

  // 스타일별 입력 필드 클래스
  const getInputClasses = () => {
    if (headerStyle === "classic") {
      return "w-full pl-4 pr-10 bg-black/10 text-[color:var(--theme-header-text)] placeholder:text-[color:color-mix(in oklab,var(--theme-header-text)_55%,transparent)] border-black/15";
    }
    if (headerStyle === "bento") {
      return "w-full pl-4 pr-10 bg-transparent text-[color:var(--theme-header-text)] placeholder:text-[color:color-mix(in oklab,var(--theme-header-text)_55%,transparent)] border-transparent focus-visible:ring-0 focus-visible:ring-offset-0";
    }
    return "w-full pl-4 pr-10 bg-gray-100/80 text-[color:var(--theme-header-text)] placeholder:text-[color:color-mix(in oklab,var(--theme-header-text)_55%,transparent)] border-gray-200/50";
  };

  // 스타일별 아이콘 색상
  const getIconClasses = () => {
    if (headerStyle === "classic") {
      return "opacity-60";
    }
    return "opacity-60";
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
      "text-[color:var(--theme-header-menu-text)]",
      isActive
        ? "bg-[color:color-mix(in oklab,var(--theme-header-menu-text)_18%,transparent)] border-l-4 border-[color:color-mix(in oklab,var(--theme-header-menu-text)_60%,transparent)]"
        : "opacity-80 hover:opacity-100 hover:bg-[color:color-mix(in oklab,var(--theme-header-menu-text)_10%,transparent)]"
    );

    // 데스크톱 스타일 (headerStyle에 따라 변경)
    const desktopLinkClass = cn(
      "px-3 py-2 text-sm font-medium transition-all whitespace-nowrap text-[color:var(--theme-header-menu-text)]",
      getTextClasses(isActive, true),
      headerStyle === "bento" && "rounded-xl hover:bg-white/50"
    );

    const linkClass = isMobile ? mobileLinkClass : desktopLinkClass;

  const lockIconClass = headerStyle === "classic" ? "opacity-70" : "opacity-50";

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
      "text-[color:var(--theme-header-menu-text)]",
      isActive
        ? "bg-[color:color-mix(in oklab,var(--theme-header-menu-text)_18%,transparent)] border-l-4 border-[color:color-mix(in oklab,var(--theme-header-menu-text)_60%,transparent)]"
        : "opacity-80 hover:opacity-100 hover:bg-[color:color-mix(in oklab,var(--theme-header-menu-text)_10%,transparent)]"
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
            ? "block px-8 py-2 text-sm text-[color:color-mix(in oklab,var(--theme-header-menu-text)_70%,transparent)] hover:text-[color:var(--theme-header-menu-text)]"
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
              {list.length > 0 ? list : (
                <span className="block px-8 py-2 text-xs text-[color:color-mix(in oklab,var(--theme-header-menu-text)_40%,transparent)]">게시판 없음</span>
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
        {/* 투명한 브릿지 영역으로 메뉴와 드롭다운 연결 */}
        <div className="absolute left-0 top-full h-2 w-full" />
        <div className="absolute left-0 top-full z-50 pt-2 min-w-[180px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
          <div className="rounded-xl border border-black/10 bg-white/95 shadow-lg overflow-hidden">
          {list.length > 0 ? list : (
            <span className="block px-4 py-3 text-xs text-gray-400">게시판 없음</span>
          )}
          </div>
        </div>
      </div>
    );
  };

  // 스타일별 사이트명/태그라인 색상
  const taglineClass = headerStyle === "classic" ? "opacity-60" : "opacity-60";
  const userNameClass = headerStyle === "classic" ? "opacity-70" : "opacity-70";
  const showTopSiteName = showMobileTopSiteName;
  const mobileTopNameSizeClass =
    showMobileTopSiteNameSize === "sm"
      ? "text-sm"
      : showMobileTopSiteNameSize === "lg"
      ? "text-lg"
      : "text-base";
  const mobileHeaderOffset = getMobileHeaderOffsetPx(bannerSize, bannerMaxHeight, bannerHeight);

  // classic 스타일일 때 테마 색상 사용
  const themedHeaderStyle = {
    backgroundColor: "var(--theme-header-bg)",
    color: "var(--theme-header-text)",
  };

  return (
    <>
      <header className={cn(getHeaderClasses(), "hidden md:block")} style={themedHeaderStyle}>
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

                {/* 로고 이미지 */}
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
                    alt={`${siteName} 로고`}
                    className={cn("object-contain", getLogoSizeClasses(logoSize).desktop)}
                  />
                  {siteNamePosition === "logo" && (
                    <span className={cn(
                      "font-display tracking-tight text-[color:var(--theme-header-site-name-text)]",
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
                      <span className="font-display text-sm tracking-tight whitespace-nowrap text-[color:var(--theme-header-site-name-text)]">
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
                      <span className="font-display text-sm tracking-tight text-[color:var(--theme-header-site-name-text)]">
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
                <nav className="flex items-center gap-2 overflow-x-auto md:overflow-x-visible overflow-y-visible pb-1 scrollbar-hide">
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

              {/* 로고 이미지 */}
              <Link href="/" className={cn(
                "flex items-center gap-3",
                hideSearch && "justify-center"
              )}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={siteLogoUrl}
                  alt={`${siteName} 로고`}
                  className={cn(
                    "transition-all duration-300 object-contain",
                    getLogoSizeClasses(logoSize).desktop
                  )}
                />
                {siteNamePosition === "logo" && (
                    <span className={cn(
                      "font-display tracking-tight text-[color:var(--theme-header-site-name-text)]",
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
                    <span className="font-display text-sm tracking-tight whitespace-nowrap text-[color:var(--theme-header-site-name-text)]">
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
                  <span className="hidden md:block font-display text-sm tracking-tight text-[color:var(--theme-header-site-name-text)]">
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
              <nav className="flex items-center gap-2 overflow-x-auto md:overflow-x-visible overflow-y-visible pb-1 scrollbar-hide">
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
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 shadow-lg pt-2"
        style={{ backgroundColor: "var(--theme-header-bg)", color: "var(--theme-header-text)" }}
      >
        <>
          {/* Row 1: Menu + (Site Name) + Search Icon + Login */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 relative">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-11 h-11 rounded-lg bg-[color:color-mix(in oklab,var(--theme-header-text)_18%,transparent)] hover:bg-[color:color-mix(in oklab,var(--theme-header-text)_28%,transparent)] transition flex items-center justify-center"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5 text-[color:var(--theme-header-text)]" />
            </button>

            {showTopSiteName && (
              <span
                className={cn(
                  "font-display tracking-wide absolute left-1/2 -translate-x-1/2 text-[color:var(--theme-header-site-name-text)]",
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
                  <Search className="w-5 h-5 text-[color:var(--theme-header-text)]" />
                </button>
              )}
              {session ? (
                <Link
                  href="/profile"
                  className="text-[color:var(--theme-header-text)] text-sm font-medium px-2 h-11 flex items-center truncate max-w-[96px] opacity-90 hover:opacity-100 transition"
                >
                  {session.user?.name?.slice(0, 4) || "회원"}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-[color:var(--theme-header-text)] text-sm font-semibold whitespace-nowrap px-2 h-11 flex items-center opacity-90 hover:opacity-100 transition"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>

          {/* Row 2: Banner Image (image only) */}
          <div ref={bannerContainerRef} className="flex items-center justify-center py-3">
            <Link href="/" className={cn("flex items-center", getBannerWidthClass(bannerWidth))}>
                <Image
                  src={siteBannerUrl}
                  alt={`${siteName} 배너`}
                  width={1200}
                  height={630}
                  className={cn(
                    "w-full h-auto",
                    bannerMaxHeight !== "" && bannerMaxHeight !== "none" && "object-cover",
                    getBannerMaxHeightClass(bannerMaxHeight),
                    getBannerPositionClass(bannerPosition)
                  )}
                  style={getBannerMaxHeightStyle(bannerMaxHeight)}
                  unoptimized
                  onLoad={measureBannerHeight}
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
          "md:hidden fixed top-0 left-0 h-full w-72 z-[60] transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "var(--theme-header-bg)", color: "var(--theme-header-text)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" className="flex items-center" onClick={closeSidebar}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteLogoUrl}
              alt={`${siteName} 로고`}
              className={cn("w-auto object-contain", getLogoSizeClasses(logoSize).mobile)}
            />
          </Link>
          <button
            className="p-2 rounded-full border border-white/10 bg-white/10 hover:bg-white/20 transition text-[color:var(--theme-header-text)]"
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
              <div className="text-[color:color-mix(in oklab,var(--theme-header-text)_60%,transparent)] text-sm">
                {session.user?.name || session.user?.email}님
              </div>
              <Link
                href="/profile"
                onClick={closeSidebar}
                className="flex items-center gap-2 text-sm text-[color:var(--theme-header-text)] opacity-80 hover:opacity-100 transition"
              >
                <User className="w-4 h-4" />
                프로필
              </Link>
              {session.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={closeSidebar}
                  className="flex items-center gap-2 text-sm text-[color:var(--theme-header-text)] opacity-80 hover:opacity-100 transition"
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
                className="flex items-center gap-2 text-sm text-[color:var(--theme-header-text)] opacity-80 hover:opacity-100 transition"
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
