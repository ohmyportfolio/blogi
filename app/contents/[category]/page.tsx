import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Suspense } from "react";
import { ContentListSection } from "@/components/contents/content-list-section";
import { ContentCardSection } from "@/components/contents/content-card-section";

interface CategoryPageProps {
    params: Promise<{
        category: string;
    }>;
    searchParams: Promise<{
        listPage?: string;
        cardPage?: string;
    }>;
}

const PAGE_SIZE = 10;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { category: categorySlug } = await params;
    const { listPage: listPageParam, cardPage: cardPageParam } = await searchParams;
    const session = await auth();

    const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
    });

    const requiresAuth = category?.requiresAuth ?? false;
    const canViewCategory = !requiresAuth || Boolean(session);

    // 로그인 필요 화면
    if (!canViewCategory) {
        return (
            <div className="container mx-auto px-4 py-10">
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
    } = category;

    // 전체 콘텐츠 조회
    const allContents = await prisma.content.findMany({
        where: {
            categoryId: category.id,
            isVisible: true,
        },
        orderBy: { createdAt: "desc" },
        include: { categoryRef: true },
    });

    // 콘텐츠 없음
    if (allContents.length === 0) {
        return (
            <div className="container mx-auto px-4 py-10">
                <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                    {category.name}
                </h1>
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
            <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                {category.name}
            </h1>

            <div>
                {visibleSections.map((type, index) => renderSection(type, index))}
            </div>
        </div>
    );
}
