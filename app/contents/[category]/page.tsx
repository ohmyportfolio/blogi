import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Suspense } from "react";
import { ContentListSection } from "@/components/contents/content-list-section";
import { ContentCardSection } from "@/components/contents/content-card-section";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";
import { getMenuCategoryRequiresAuth } from "@/lib/category-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TagFilter } from "@/components/contents/tag-filter";

interface CategoryPageProps {
    params: Promise<{
        category: string;
    }>;
    searchParams: Promise<{
        listPage?: string;
        cardPage?: string;
        tag?: string;
    }>;
}

const PAGE_SIZE = 10;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const { category: categorySlug } = await params;
    const [settings, category] = await Promise.all([
        getSiteSettings(),
        prisma.category.findUnique({ where: { slug: categorySlug } }),
    ]);

    const siteName = settings.siteName || "사이트";
    const baseUrl = process.env.SITE_URL || "http://localhost:3010";

    if (!category) {
        return {
            title: `${categorySlug} | ${siteName}`,
            robots: { index: false, follow: false },
        };
    }

    const title = `${category.name} | ${siteName}`;
    const description = category.description || settings.siteDescription || settings.siteTagline || "";
    const ogImage =
      category.thumbnailUrl ||
      settings.ogImageUrl ||
      settings.siteBannerUrl ||
      settings.siteLogoUrlLight ||
      settings.siteLogoUrlDark ||
      settings.siteLogoUrl ||
      "/logo.svg";
    const canonicalPath = `/contents/${category.slug}`;
    const menuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: category.id,
        categorySlug: category.slug,
    });
    const shouldNoIndex = category.requiresAuth || menuRequiresAuth || !category.isVisible;

    return {
        title,
        description: description || undefined,
        alternates: { canonical: `${baseUrl}${canonicalPath}` },
        openGraph: ogImage
            ? {
                title,
                description: description || undefined,
                images: [{ url: ogImage }],
            }
            : {
                title,
                description: description || undefined,
            },
        robots: shouldNoIndex ? { index: false, follow: false } : undefined,
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { category: categorySlug } = await params;
    const { listPage: listPageParam, cardPage: cardPageParam, tag: tagSlug } = await searchParams;
    const session = await auth();

    const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
    });

    const menuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: category?.id,
        categorySlug,
    });
    const requiresAuth = Boolean(category?.requiresAuth || menuRequiresAuth);
    const canViewCategory = !requiresAuth || Boolean(session);

    // 로그인 필요 화면
    if (!canViewCategory) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Button variant="ghost" className="mb-6 -ml-2" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        홈으로
                    </Link>
                </Button>
                <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                    {category?.name ?? categorySlug.replace(/-/g, " ")}
                </h1>
                <div className="text-center py-20 bg-white/80 rounded-2xl border border-black/5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
                    <p className="text-gray-500 text-lg mb-6">
                        로그인 후 확인할 수 있습니다.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href={`/login?callbackUrl=${encodeURIComponent(`/contents/${categorySlug}`)}`}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                        >
                            로그인하기
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // 카테고리 없음
    if (!category) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Button variant="ghost" className="mb-6 -ml-2" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        홈으로
                    </Link>
                </Button>
                <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                    {categorySlug.replace(/-/g, " ")}
                </h1>
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">카테고리를 찾을 수 없습니다.</p>
                </div>
            </div>
        );
    }

    // 표시 설정
    const {
        listViewEnabled,
        listViewCount,
        listViewLabel,
        cardViewEnabled,
        cardViewCount,
        cardViewLabel,
        displayOrder,
        showDate,
        tagFilterEnabled,
    } = category;

    // 태그 데이터 fetch (tagFilterEnabled인 경우)
    const categoryTags = tagFilterEnabled
        ? await prisma.tag.findMany({
            where: {
                OR: [
                    { categoryId: category.id },
                    { categoryId: null },
                ],
            },
            orderBy: [{ categoryId: "asc" }, { order: "asc" }],
        })
        : [];

    // 태그 필터링 조건
    const activeTag = tagFilterEnabled && tagSlug
        ? categoryTags.find((t) => t.slug === tagSlug)
        : null;

    // 전체 콘텐츠 조회
    const allContents = await prisma.content.findMany({
        where: {
            categoryId: category.id,
            isVisible: true,
            isDeleted: false,
            ...(activeTag
                ? { tags: { some: { tagId: activeTag.id } } }
                : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { categoryRef: true },
    });

    // 콘텐츠 없음
    if (allContents.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <Button variant="ghost" className="mb-6 -ml-2" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        홈으로
                    </Link>
                </Button>
                <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                    {category.name}
                </h1>

                {tagFilterEnabled && categoryTags.length > 0 && (
                    <TagFilter
                        tags={categoryTags}
                        categorySlug={categorySlug}
                        activeTagSlug={tagSlug}
                    />
                )}

                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">콘텐츠가 없습니다.</p>
                </div>
            </div>
        );
    }

    // 리스트형 데이터 준비
    let listContents: typeof allContents = [];
    let listCurrentPage = 1;
    let listTotalPages = 1;
    let showListPagination = false;

    if (listViewEnabled) {
        if (listViewCount > 0) {
            // 최근 N개만 표시 (페이징 없음)
            listContents = allContents.slice(0, listViewCount);
        } else {
            // 전체 표시 (페이징 적용)
            listCurrentPage = Math.max(1, Number(listPageParam) || 1);
            listTotalPages = Math.ceil(allContents.length / PAGE_SIZE);
            listCurrentPage = Math.min(listCurrentPage, listTotalPages);
            const startIdx = (listCurrentPage - 1) * PAGE_SIZE;
            listContents = allContents.slice(startIdx, startIdx + PAGE_SIZE);
            showListPagination = listTotalPages > 1;
        }
    }

    // 카드형 데이터 준비
    let cardContents: typeof allContents = [];
    let cardCurrentPage = 1;
    let cardTotalPages = 1;
    let showCardPagination = false;

    if (cardViewEnabled) {
        if (cardViewCount > 0) {
            // 최근 N개만 표시 (페이징 없음)
            cardContents = allContents.slice(0, cardViewCount);
        } else {
            // 전체 표시 (페이징 적용)
            cardCurrentPage = Math.max(1, Number(cardPageParam) || 1);
            cardTotalPages = Math.ceil(allContents.length / PAGE_SIZE);
            cardCurrentPage = Math.min(cardCurrentPage, cardTotalPages);
            const startIdx = (cardCurrentPage - 1) * PAGE_SIZE;
            cardContents = allContents.slice(startIdx, startIdx + PAGE_SIZE);
            showCardPagination = cardTotalPages > 1;
        }
    }

    // 섹션 렌더링 순서 결정
    const sections = displayOrder === "list" ? ["list", "card"] : ["card", "list"];

    // 섹션 렌더링 함수
    const renderSection = (type: string, index: number) => {
        if (type === "list" && listViewEnabled && listContents.length > 0) {
            return (
                <div key="list-section">
                    {index > 0 && <hr className="border-gray-200 my-8" />}
                    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-xl h-40" />}>
                        <ContentListSection
                            contents={listContents}
                            categorySlug={categorySlug}
                            currentPage={listCurrentPage}
                            totalPages={listTotalPages}
                            showPagination={showListPagination}
                            label={listViewLabel}
                            showDate={showDate}
                        />
                    </Suspense>
                </div>
            );
        }

        if (type === "card" && cardViewEnabled && cardContents.length > 0) {
            return (
                <div key="card-section">
                    {index > 0 && <hr className="border-gray-200 my-8" />}
                    <Suspense fallback={<div className="animate-pulse bg-gray-100 rounded-xl h-40" />}>
                        <ContentCardSection
                            contents={cardContents}
                            categorySlug={categorySlug}
                            categoryName={category.name}
                            currentPage={cardCurrentPage}
                            totalPages={cardTotalPages}
                            showPagination={showCardPagination}
                            label={cardViewLabel}
                            showDate={showDate}
                        />
                    </Suspense>
                </div>
            );
        }

        return null;
    };

    // 실제로 표시될 섹션만 필터링
    const visibleSections = sections.filter((type) => {
        if (type === "list") return listViewEnabled && listContents.length > 0;
        if (type === "card") return cardViewEnabled && cardContents.length > 0;
        return false;
    });

    return (
        <div className="container mx-auto px-4 py-10">
            <Button variant="ghost" className="mb-6 -ml-2" asChild>
                <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    홈으로
                </Link>
            </Button>
            <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                {category.name}
            </h1>

            {tagFilterEnabled && categoryTags.length > 0 && (
                <TagFilter
                    tags={categoryTags}
                    categorySlug={categorySlug}
                    activeTagSlug={tagSlug}
                />
            )}

            <div>
                {visibleSections.map((type, index) => renderSection(type, index))}
            </div>
        </div>
    );
}
