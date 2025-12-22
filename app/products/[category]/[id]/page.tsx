import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface ProductDetailPageProps {
    params: {
        id: string;
        category: string;
    };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const product = await prisma.product.findUnique({
        where: {
            id: params.id,
        },
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Breadcrumb / Category */}
            <div className="mb-4">
                <Badge variant="outline" className="text-sm uppercase">
                    {product.category.replace("_", " ")}
                </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
                {product.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center text-gray-500 text-sm mb-8 border-b pb-4">
                <span>{format(product.createdAt, "yyyy.MM.dd")}</span>
                {product.price && (
                    <span className="ml-auto font-bold text-lg text-sky-600">
                        {product.price}
                    </span>
                )}
            </div>

            {/* Content (Rich Text) */}
            <div
                className="prose max-w-none prose-lg"
                dangerouslySetInnerHTML={{ __html: product.content }}
            />
        </div>
    );
}
