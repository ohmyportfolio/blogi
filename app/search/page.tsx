import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { auth } from "@/auth";
import { BackButton } from "@/components/ui/back-button";
import { Package } from "lucide-react";

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
    }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = (q || "").trim();
    const session = await auth();

    if (!query) {
        return (
            <div className="container mx-auto px-4 py-10 max-w-3xl">
                <h1 className="text-2xl font-bold mb-4">검색</h1>
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    검색어를 입력해주세요.
                </div>
            </div>
        );
    }

    // 상품만 검색 (제목 + 본문)
    const products = await prisma.product.findMany({
        where: {
            isVisible: true,
            ...(session ? {} : { NOT: { categoryRef: { is: { requiresAuth: true } } } }),
            OR: [
                { title: { contains: query, mode: "insensitive" } },
                { contentMarkdown: { contains: query, mode: "insensitive" } },
            ],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { categoryRef: true },
    });

    return (
        <div className="container mx-auto px-4 py-6 max-w-3xl">
            {/* 헤더 */}
            <div className="mb-4">
                <BackButton label="돌아가기" className="mb-3" />
                <div className="flex items-baseline gap-2">
                    <h1 className="font-display text-xl md:text-2xl">
                        &quot;{query}&quot;
                    </h1>
                    <span className="text-sm text-gray-500">
                        검색 결과 {products.length}건
                    </span>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                </div>
            ) : (
                <div className="rounded-xl border border-black/5 bg-white overflow-hidden divide-y divide-gray-100">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.categoryRef?.slug ?? "unknown"}/${product.id}`}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                        >
                            {/* 썸네일 */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            {/* 내용 */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="text-sky-600">{product.categoryRef?.name ?? "미분류"}</span>
                                    <span>·</span>
                                    <span>{format(product.createdAt, "MM.dd")}</span>
                                    {product.price && (
                                        <>
                                            <span>·</span>
                                            <span className="text-sky-700 font-medium">{product.price}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
