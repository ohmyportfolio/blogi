import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getMenuByKey } from "@/lib/menus";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buildContentHref } from "@/lib/contents";
import { ProtectedCategoryLink, ProtectedCommunityLink } from "@/components/home/protected-category-link";
import { ProtectedContentCard } from "@/components/home/protected-content-card";
import { needsAdminSetup } from "@/lib/admin-setup";

// 항상 동적으로 렌더링 (사용자 수 체크를 위해)
export const dynamic = "force-dynamic";

export default async function Home() {
  // 초기 설정이 필요한지 확인
  const needsSetup = await needsAdminSetup();
  if (needsSetup) {
    redirect("/setup");
  }

  const session = await auth();
  const sessionUserId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const canViewRestricted = Boolean(sessionUserId);

  const [siteSettings, menu] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { key: "default" } }),
    getMenuByKey("main"),
  ]);

  const siteName = siteSettings?.siteName || "사이트";
  const siteTagline = siteSettings?.siteTagline || "";

  const menuCategories = menu.items
    .filter((item) => item.linkType === "category" && item.href)
    .map((item, index) => {
      const href = item.href ?? "";
      const slug = href.startsWith("/contents/")
        ? href.replace("/contents/", "")
        : href.replace(/^\/+/, "");
      return {
        id: item.id,
        label: item.label,
        slug,
        href,
        order: item.order ?? index + 1,
        requiresAuth: item.requiresAuth ?? false,
      };
    })
    .filter((item) => item.slug);
  const menuAuthBySlug = new Map(
    menuCategories.map((item) => [item.slug, item.requiresAuth ?? false])
  );

  const categoryRecords = menuCategories.length
    ? await prisma.category.findMany({
        where: { slug: { in: menuCategories.map((item) => item.slug) } },
      })
    : [];
  const categoryBySlug = new Map(categoryRecords.map((item) => [item.slug, item]));
  const categoryIds = categoryRecords.map((item) => item.id);
  const contentImages = categoryIds.length
    ? await prisma.content.findMany({
        where: {
          categoryId: { in: categoryIds },
          isVisible: true,
          isDeleted: false,
          imageUrl: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: { categoryId: true, imageUrl: true },
      })
    : [];
  const imageByCategoryId = new Map<string, string>();
  contentImages.forEach((content) => {
    if (!content.imageUrl) return;
    if (!imageByCategoryId.has(content.categoryId)) {
      imageByCategoryId.set(content.categoryId, content.imageUrl);
    }
  });

  const categories = menuCategories.map((item) => {
    const category = categoryBySlug.get(item.slug);
    // 카테고리 썸네일 우선, 없으면 콘텐츠 이미지 fallback
    const thumbnailUrl = category?.thumbnailUrl;
    const contentImageUrl = category?.id ? imageByCategoryId.get(category.id) : undefined;
    const imageUrl = thumbnailUrl || contentImageUrl;
    return {
      ...item,
      description: category?.description ?? "",
      imageUrl,
      shortLabel: item.slug.replace(/-/g, " ").toUpperCase(),
    };
  });

  // 커뮤니티 메뉴 (후기, 자유게시판 등)
  const communityMenus = menu.items
    .filter((item) => item.linkType === "community" && item.href)
    .map((item, index) => ({
      id: item.id,
      label: item.label,
      href: item.href ?? "",
      order: item.order ?? index + 1,
      thumbnailUrl: item.thumbnailUrl ?? null,
      requiresAuth: item.requiresAuth ?? false,
    }));

  // 메인 페이지 대시보드 데이터: 메인 노출 설정된 카테고리
  // 모든 카테고리를 가져오되 requiresAuth 정보 포함
  const homeCategories = await prisma.category.findMany({
    where: {
      showOnHome: true,
      isVisible: true,
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      homeItemCount: true,
      requiresAuth: true,
    },
  });

  // 메인 노출 설정된 게시판
  const homeBoards = await prisma.board.findMany({
    where: {
      showOnHome: true,
      isVisible: true,
      isDeleted: false,
    },
    orderBy: [{ menuItem: { order: "asc" } }, { order: "asc" }],
    select: {
      id: true,
      key: true,
      slug: true,
      name: true,
      homeItemCount: true,
      menuItemId: true,
      menuItem: {
        select: {
          label: true,
          href: true,
          order: true,
          requiresAuth: true,
        },
      },
    },
  });

  // 카테고리별 최신 콘텐츠, 게시판별 최신 글
  const postVisibilityFilter = isAdmin
    ? {}
    : sessionUserId
      ? { OR: [{ isSecret: false }, { authorId: sessionUserId }] }
      : { isSecret: false };

  type CategoryDisplay =
    | { type: "locked"; count: number }
    | {
        type: "contents";
        items: {
          id: string;
          title: string;
          imageUrl: string | null;
          createdAt: Date;
        }[];
      };

  type BoardDisplay =
    | { type: "locked" }
    | {
        type: "posts";
        items: {
          id: string;
          title: string;
          createdAt: Date;
          isPinned: boolean;
          isSecret: boolean;
          viewCount: number;
          author: { name: string | null };
        }[];
      };

  const [categoryDisplayEntries, boardDisplayEntries] = await Promise.all([
    Promise.all(
      homeCategories.map(async (category) => {
        const menuRequiresAuth = menuAuthBySlug.get(category.slug) ?? false;
        const effectiveRequiresAuth = Boolean(category.requiresAuth || menuRequiresAuth);
        const canViewCategory = !effectiveRequiresAuth || canViewRestricted || isAdmin;
        if (!canViewCategory) {
          const count = Math.max(1, category.homeItemCount ?? 0);
          return [category.id, { type: "locked", count } as CategoryDisplay] as const;
        }
        const contents = await prisma.content.findMany({
          where: {
            categoryId: category.id,
            isVisible: true,
            isDeleted: false,
          },
          orderBy: { createdAt: "desc" },
          take: category.homeItemCount,
          select: {
            id: true,
            title: true,
            imageUrl: true,
            createdAt: true,
          },
        });
        return [category.id, { type: "contents", items: contents } as CategoryDisplay] as const;
      })
    ),
    Promise.all(
      homeBoards.map(async (board) => {
        const requiresAuth = board.menuItem?.requiresAuth ?? false;
        const canViewBoard = !requiresAuth || canViewRestricted || isAdmin;
        if (!canViewBoard) {
          return [board.id, { type: "locked" } as BoardDisplay] as const;
        }
        const posts = await prisma.post.findMany({
          where: {
            boardId: board.id,
            ...postVisibilityFilter,
          },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          take: board.homeItemCount,
          include: {
            author: { select: { name: true } },
          },
        });
        return [board.id, { type: "posts", items: posts } as BoardDisplay] as const;
      })
    ),
  ]);

  const categoryDisplayMap = new Map(
    categoryDisplayEntries.filter(([, display]) =>
      display.type === "locked" ? display.count > 0 : display.items.length > 0
    )
  );
  const boardDisplayMap = new Map(
    boardDisplayEntries.filter(([, display]) =>
      display.type === "locked" ? true : display.items.length > 0
    )
  );

  // board.key에서 그룹 슬러그 추출 (예: "reviews__review-board" → "reviews")
  function extractGroupSlug(boardKey: string): string {
    return boardKey.split("__")[0];
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Mobile: Category Grid Landing */}
      <section className="md:hidden flex-1 flex items-center justify-center px-3 py-2 bg-[var(--theme-content-bg)]">
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          {categories.map((category) => (
            <ProtectedCategoryLink
              key={category.label}
              href={category.href}
              label={category.label}
              imageUrl={category.imageUrl}
              requiresAuth={category.requiresAuth}
              variant="mobile"
            />
          ))}
          {/* 커뮤니티 메뉴 (후기, 자유게시판) */}
          {communityMenus.map((menu) => (
            <ProtectedCommunityLink
              key={menu.id}
              href={menu.href}
              label={menu.label}
              thumbnailUrl={menu.thumbnailUrl}
              requiresAuth={menu.requiresAuth}
              variant="mobile"
            />
          ))}
        </div>
      </section>

      {/* Desktop: Full Landing Page */}

      {/* Categories */}
      <section className="hidden md:flex flex-1 items-center justify-center px-4 py-8 bg-[var(--theme-content-bg)]">
        <div className="w-full max-w-6xl">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {categories.map((category) => (
              <div key={category.label} className="w-[calc(25%_-_12px)] lg:w-[calc(20%_-_13px)]">
                <ProtectedCategoryLink
                  href={category.href}
                  label={category.label}
                  imageUrl={category.imageUrl}
                  requiresAuth={category.requiresAuth}
                  variant="desktop"
                />
              </div>
            ))}
            {/* 커뮤니티 메뉴 */}
            {communityMenus.map((menu) => (
              <div key={menu.id} className="w-[calc(25%_-_12px)] lg:w-[calc(20%_-_13px)]">
                <ProtectedCommunityLink
                  href={menu.href}
                  label={menu.label}
                  thumbnailUrl={menu.thumbnailUrl}
                  requiresAuth={menu.requiresAuth}
                  variant="desktop"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Content Dashboard */}
      <section className={`${siteSettings?.showHomeDashboardOnMobile ? '' : 'hidden md:block'} pt-0 pb-8 md:pb-14 lg:pb-20 bg-[var(--theme-content-bg)]`}>
        <div className="container mx-auto px-3 md:px-4 space-y-6 md:space-y-12">

          {/* 카테고리별 최신 콘텐츠 */}
          {homeCategories
            .filter((cat) => categoryDisplayMap.has(cat.id))
            .map((category) => {
              const display = categoryDisplayMap.get(category.id);
              const isLocked = display?.type === "locked";
              const contents = display?.type === "contents" ? display.items : [];
              const lockedCount = display?.type === "locked" ? display.count : 0;
              const menuRequiresAuth = menuAuthBySlug.get(category.slug) ?? false;
              const effectiveRequiresAuth = Boolean(category.requiresAuth || menuRequiresAuth);
              const canViewCategory = !effectiveRequiresAuth || canViewRestricted || isAdmin;
              const categoryHref = `/contents/${category.slug}`;
              const loginHref = `/login?callbackUrl=${encodeURIComponent(categoryHref)}`;

              return (
                <div key={category.id}>
                  <div className="flex items-end justify-between mb-3 md:mb-6">
                    <div>
                      <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-muted-foreground">
                        {category.slug.replace(/-/g, " ")}
                      </p>
                      <h2 className="font-display text-lg md:text-2xl lg:text-3xl">
                        {category.name}
                      </h2>
                    </div>
                    <Button variant="accent" size="sm" className="text-xs md:text-sm h-7 md:h-9 px-2 md:px-4" asChild>
                      <Link href={canViewCategory ? categoryHref : loginHref}>
                        더 보기 <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3">
                    {isLocked
                      ? Array.from({ length: lockedCount }).map((_, index) => (
                          <ProtectedContentCard
                            key={`${category.id}-locked-${index}`}
                            href={categoryHref}
                            requiresAuth
                            isLoggedIn={canViewRestricted}
                            lockedLabel="회원가입 전용"
                          />
                        ))
                      : contents.map((content) => (
                          <ProtectedContentCard
                            key={content.id}
                            title={content.title}
                            imageUrl={content.imageUrl}
                            createdAt={content.createdAt}
                            href={buildContentHref(category.slug, content.id, content.title)}
                            requiresAuth={effectiveRequiresAuth}
                            isLoggedIn={canViewRestricted}
                          />
                        ))}
                  </div>
                </div>
              );
            })}

          {/* 게시판별 최신 글 */}
          {homeBoards
            .filter((board) => boardDisplayMap.has(board.id))
            .map((board) => {
              const display = boardDisplayMap.get(board.id);
              const groupSlug = extractGroupSlug(board.key);
              const requiresAuth = board.menuItem?.requiresAuth ?? false;
              const canViewBoard = !requiresAuth || canViewRestricted || isAdmin;
              const posts = display?.type === "posts" ? display.items : [];
              const boardHref = `/community/${groupSlug}/${board.slug}`;
              const loginHref = `/login?callbackUrl=${encodeURIComponent(boardHref)}`;

              return (
                <div key={board.id}>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {board.menuItem?.label ?? "커뮤니티"}
                      </p>
                      <h2 className="font-display text-2xl sm:text-3xl">
                        {board.name}
                      </h2>
                    </div>
                    <Button variant="accent" size="sm" asChild>
                      <Link href={canViewBoard ? boardHref : loginHref}>
                        더 보기 <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {canViewBoard ? (
                    <div className="rounded-2xl border border-black/5 bg-white/90 overflow-hidden shadow-sm">
                      <div className="divide-y divide-gray-100">
                        {posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/community/${groupSlug}/${board.slug}/${post.id}`}
                            className="block p-4 hover:bg-gray-50 transition"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium line-clamp-1 mb-1">
                                  {post.isPinned && (
                                    <span className="inline-block mr-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                      공지
                                    </span>
                                  )}
                                  {post.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{post.author.name || "익명"}</span>
                                  <span>•</span>
                                  <span>{format(post.createdAt, "yyyy.MM.dd")}</span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground shrink-0">
                                조회 {post.viewCount}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-black/5 bg-white/90 shadow-sm">
                      <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                        <div className="inline-flex items-center gap-2 text-slate-600 text-sm">
                          <Lock className="h-4 w-4 text-slate-400" />
                          <span>회원 전용 게시판입니다</span>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={loginHref}>로그인 후 보기</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

        </div>
      </section>
    </div>
  );
}
