import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBoardMapByIds } from "@/lib/community";
import { getMenuByKey } from "@/lib/menus";
import { format } from "date-fns";
import { redirect } from "next/navigation";

// 항상 동적으로 렌더링 (사용자 수 체크를 위해)
export const dynamic = "force-dynamic";

export default async function Home() {
  // 초기 설정이 필요한지 확인
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    redirect("/setup");
  }

  const [latestPosts, siteSettings, menu] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    prisma.siteSettings.findUnique({ where: { key: "default" } }),
    getMenuByKey("main"),
  ]);

  const siteName = siteSettings?.siteName || "사이트";
  const siteTagline = siteSettings?.siteTagline || "";
  const boardMap = await getBoardMapByIds(latestPosts.map((post) => post.boardId));
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
      };
    })
    .filter((item) => item.slug);

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
    }));

  return (
    <div className="flex flex-col flex-1">
      {/* Mobile: Category Grid Landing */}
      <section className="md:hidden flex-1 flex items-center justify-center px-3 py-2 bg-[#f6f1e8]">
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="group"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span className="text-white text-xs font-semibold leading-tight block">
                    {category.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {/* 커뮤니티 메뉴 (후기, 자유게시판) */}
          {communityMenus.map((menu) => (
            <Link
              key={menu.id}
              href={menu.href}
              className="group"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                {menu.thumbnailUrl ? (
                  <Image
                    src={menu.thumbnailUrl}
                    alt={menu.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <span className="text-white text-xs font-semibold leading-tight block">
                    {menu.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Desktop: Full Landing Page */}

      {/* Categories */}
      <section className="hidden md:flex flex-1 items-center justify-center px-4 py-8 bg-[#f6f1e8]">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((category) => (
              <Link key={category.label} href={category.href} className="group">
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.label}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-white text-sm font-semibold leading-tight block">
                      {category.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {/* 커뮤니티 메뉴 */}
            {communityMenus.map((menu) => (
              <Link key={menu.id} href={menu.href} className="group">
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                  {menu.thumbnailUrl ? (
                    <Image
                      src={menu.thumbnailUrl}
                      alt={menu.label}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-white text-sm font-semibold leading-tight block">
                      {menu.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="hidden md:block pt-0 pb-14 sm:pb-20 bg-[#f6f1e8]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Journal</p>
              <h2 className="font-display text-3xl sm:text-4xl">최신 여행 정보</h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/community">
                더 보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {latestPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/80 py-12 text-center text-muted-foreground">
              아직 게시물이 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {latestPosts.map((post) => {
                const boardInfo = boardMap.get(post.boardId);
                const href = boardInfo ? `${boardInfo.href}/${post.id}` : `/community/${post.id}`;
                return (
                  <Link
                    key={post.id}
                    href={href}
                    className="group rounded-3xl border border-black/5 bg-white/90 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] transition hover:-translate-y-1"
                  >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span>Story</span>
                    <span className="text-[11px]">{format(post.createdAt, "yyyy.MM.dd")}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg leading-snug line-clamp-2 text-foreground">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {post.author.name || "Anonymous"}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm text-foreground">
                    읽어보기
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
