import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import { auth } from "@/auth";

interface CategoryPageProps {
    params: Promise<{
        category: string;
    }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { category: categorySlug } = await params;
    const session = await auth();
    const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
    });
    const requiresAuth = category?.requiresAuth ?? false;
    const canViewCategory = !requiresAuth || Boolean(session);

    const products = canViewCategory && category
        ? await prisma.product.findMany({
            where: {
                categoryId: category.id,
                isVisible: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: { categoryRef: true },
        })
        : [];

    return (
        <div className="container mx-auto px-4 py-10">
            <h1 className="font-display text-3xl sm:text-4xl mb-8 capitalize">
                {category?.name ?? categorySlug.replace(/-/g, " ")}
            </h1>

            {!canViewCategory ? (
                <div className="text-center py-20 bg-white/80 rounded-2xl border border-black/5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
                    <p className="text-gray-500 text-lg mb-6">
                        로그인 후 확인할 수 있습니다.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href={`/login?callbackUrl=${encodeURIComponent(`/products/${categorySlug}`)}`}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                        >
                            로그인하기
                        </a>
                    </div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">
                        상품이 없습니다.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            categorySlug={product.categoryRef?.slug ?? categorySlug}
                            categoryLabel={product.categoryRef?.name ?? category?.name ?? categorySlug}
                            imageUrl={product.imageUrl}
                            price={product.price}
                            createdAt={product.createdAt}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
