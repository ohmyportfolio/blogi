import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getBoardMapByIds } from "@/lib/community";
import { getMenuByKey } from "@/lib/menus";
import { format } from "date-fns";
import { redirect } from "next/navigation";

// 항상 동적으로 렌더링 (사용자 수 체크를 위해)
export const dynamic = "force-dynamic";

const pillars = [
  {
    title: "프라이빗 큐레이션",
    description: "하루 동선부터 분위기까지 개인 취향에 맞게 설계합니다.",
    icon: Sparkles,
  },
  {
    title: "안전한 이동",
    description: "검증된 기사와 차량으로 늦은 시간에도 안심하세요.",
    icon: ShieldCheck,
  },
  {
    title: "로컬 연결",
    description: "핫플·리저브·투어까지 현지 네트워크로 빠르게.",
    icon: MapPinned,
  },
];

const signatureRoutes = [
  {
    title: "도착 + 체크인",
    detail: "공항 픽업과 웰컴 라운지, 호텔 체크인까지 한 번에.",
  },
  {
    title: "나이트 & 라운지",
    detail: "분위기 좋은 루프탑과 프라이빗 라운지를 매칭합니다.",
  },
  {
    title: "골프 & 휴식",
    detail: "오전 라운딩, 오후 스파, 저녁 미식으로 마무리.",
  },
];

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
  const siteLogoUrl = siteSettings?.siteLogoUrl || "/logo.png";
  const siteTagline = siteSettings?.siteTagline || "";
  const boardMap = await getBoardMapByIds(latestPosts.map((post) => post.boardId));
  const menuCategories = menu.items
    .filter((item) => item.linkType === "category" && item.href)
    .map((item, index) => {
      const href = item.href ?? "";
      const slug = href.startsWith("/products/")
        ? href.replace("/products/", "")
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
  const categoryImages = categoryIds.length
    ? await prisma.product.findMany({
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
  categoryImages.forEach((product) => {
    if (!product.imageUrl) return;
    if (!imageByCategoryId.has(product.categoryId)) {
      imageByCategoryId.set(product.categoryId, product.imageUrl);
    }
  });

  const categories = menuCategories.map((item) => {
    const category = categoryBySlug.get(item.slug);
    const imageUrl = category?.id ? imageByCategoryId.get(category.id) : undefined;
    return {
      ...item,
      description: category?.description ?? "",
      imageUrl,
      shortLabel: item.slug.replace(/-/g, " ").toUpperCase(),
    };
  });

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#f6f1e8]">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_85%_0%,rgba(94,234,212,0.18),transparent_60%),radial-gradient(700px_520px_at_10%_10%,rgba(251,146,60,0.16),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10 py-16 sm:py-20">
          {/* Mobile: Elegant brand bar */}
          <div className="md:hidden -mx-4 mb-12">
            <div className="bg-gradient-to-r from-[#1a2332] via-[#0f1824] to-[#1a2332] py-5 px-6 flex items-center justify-center gap-5 shadow-lg">
              <Image
                src={siteLogoUrl}
                alt={`${siteName} 로고`}
                width={140}
                height={48}
                className="h-12 w-auto"
                priority
                unoptimized
              />
              <div className="h-8 w-px bg-white/20" />
              <div>
                <p className="font-display text-lg text-white tracking-wide">{siteName}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/50">
                  {siteTagline || "Premium Travel Concierge"}
                </p>
              </div>
            </div>
          </div>
          {/* Desktop: Site name only */}
          <div className="hidden md:block text-center mb-10">
            <h2 className="font-display text-3xl tracking-tight text-foreground/90">{siteName}</h2>
            <div className="mt-2 mx-auto w-12 h-0.5 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-foreground/70">
                {siteTagline || "Danang VIP Concierge"}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-6 leading-[1.05]">
                다낭의 밤과 낮을
                <br />
                감각적으로 큐레이션합니다.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl">
                여행 루트, 숙소, 라운지까지 한 번에 설계하는 프리미엄 가이드. 모바일에서도
                깔끔하게 보이도록 필요한 정보만 담았습니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/products/promotion">이번달 프로모션</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/community">후기 보기</Link>
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="rounded-2xl border border-black/5 bg-white/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em]">Clients</p>
                  <p className="text-lg font-semibold text-foreground">1,200+</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em]">Programs</p>
                  <p className="text-lg font-semibold text-foreground">80+</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white/80 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em]">Support</p>
                  <p className="text-lg font-semibold text-foreground">24/7</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative h-[240px] sm:h-[320px] rounded-3xl overflow-hidden shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)]">
                  <Image
                    src="/images/landing/hotel-pullman-01.jpg"
                    alt="다낭 럭셔리 호텔"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="relative h-[200px] sm:h-[280px] rounded-3xl overflow-hidden self-end shadow-[0_25px_50px_-35px_rgba(15,23,42,0.45)]">
                  <Image
                    src="/images/landing/nightlife-waterfront-01.jpg"
                    alt="다낭 나이트 라이프"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 left-4 sm:left-10 rounded-2xl border border-black/5 bg-white/90 px-4 py-3 text-sm shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)]">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Signature</p>
                <p className="font-semibold">Night &amp; Resort Curated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-black/5 bg-white/90 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-foreground text-background p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-base">{pillar.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Curated index</p>
              <h2 className="font-display text-3xl sm:text-4xl">카테고리별 큐레이션</h2>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {categories.map((category) => (
              <Link
                key={category.label}
                href={category.href}
                className="min-w-[240px] max-w-[260px] w-[75vw] sm:w-auto sm:min-w-[220px] snap-start group"
              >
                <div className="rounded-3xl border border-black/5 bg-white/90 overflow-hidden shadow-[0_20px_45px_-35px_rgba(15,23,42,0.4)]">
                  <div className="relative h-[150px]">
                    {category.imageUrl ? (
                      <>
                        <Image
                          src={category.imageUrl}
                          alt={category.label}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 70vw, 240px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900" />
                    )}
                    <div className="absolute bottom-3 left-4 text-white">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                        {category.shortLabel}
                      </p>
                      <h3 className="font-display text-lg">{category.label}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {category.description || "카테고리 설명을 추가해보세요."}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Route */}
      <section className="py-14 sm:py-20 bg-white/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] items-center">
            <div className="relative h-[260px] sm:h-[320px] rounded-3xl overflow-hidden shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)]">
              <Image
                src="/images/landing/hq720.webp"
                alt="다낭 시그니처 코스"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Signature route</p>
              <h2 className="font-display text-3xl sm:text-4xl mt-3">하루 완성형 일정</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                다낭 VIP 투어는 동선 낭비 없이, 이동과 분위기를 세팅합니다. 모바일에서 보기 쉬운
                카드형 구성으로 핵심만 빠르게 확인할 수 있습니다.
              </p>
              <ol className="mt-6 space-y-4">
                {signatureRoutes.map((route, index) => (
                  <li
                    key={route.title}
                    className="rounded-2xl border border-black/5 bg-white/90 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
                        0{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{route.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{route.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="py-14 sm:py-20">
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
