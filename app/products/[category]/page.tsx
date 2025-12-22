import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";

interface CategoryPageProps {
    params: Promise<{
        category: string;
    }>;
}

// Map URL slugs to DB category values (if needed) or simple uppercase
const normalizeCategory = (slug: string) => {
    // Manual mapping or uppercase
    if (slug === "vip-trip") return "VIP_TRIP";
    if (slug === "hotel-villa") return "HOTEL_VILLA";
    if (slug === "tip") return "TIP";
    return slug.toUpperCase(); // CASINO -> CASINO
};

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { category: categorySlug } = await params;
    const dbCategory = normalizeCategory(categorySlug);

    const products = await prisma.product.findMany({
        where: {
            category: dbCategory,
            isVisible: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 capitalize">
                {categorySlug.replace("-", " ")}
            </h1>

            {products.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">
                        게시물이 없습니다.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </div>
    );
}
