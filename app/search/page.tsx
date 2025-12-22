import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCard } from "@/components/products/product-card";

interface SearchPageProps {
    searchParams: {
        q?: string;
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = (searchParams.q || "").trim();

    if (!query) {
        return (
            <div className="container mx-auto px-4 py-10 max-w-5xl">
                <h1 className="text-2xl font-bold mb-4">검색</h1>
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    검색어를 입력해주세요.
                </div>
            </div>
        );
    }

    const [posts, products] = await Promise.all([
        prisma.post.findMany({
            where: {
                title: { contains: query, mode: "insensitive" },
            },
            include: {
                author: { select: { name: true } },
                _count: { select: { comments: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
        prisma.product.findMany({
            where: {
                isVisible: true,
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
    ]);

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <h1 className="font-display text-3xl mb-6">
                검색 결과: <span className="text-sky-600">{query}</span>
            </h1>

            <section className="mb-10">
                <h2 className="font-display text-2xl mb-4">게시글</h2>
                {posts.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-gray-500 text-center">
                        게시글 검색 결과가 없습니다.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/community/${post.id}`}>
                                <Card className="hover:bg-gray-50 transition cursor-pointer">
                                    <CardHeader className="py-4">
                                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                                            {post.title}
                                            {post._count.comments > 0 && (
                                                <span className="text-sm text-sky-500">
                                                    [{post._count.comments}]
                                                </span>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 text-sm text-gray-500 flex justify-between items-center">
                                        <span>{post.author.name || "Anonymous"}</span>
                                        <span>{format(post.createdAt, "yyyy.MM.dd")}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2 className="font-display text-2xl mb-4">상품</h2>
                {products.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-gray-500 text-center">
                        상품 검색 결과가 없습니다.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.title}
                                category={product.category}
                                imageUrl={product.imageUrl}
                                price={product.price}
                                createdAt={product.createdAt}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
