import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtmlContent } from "@/lib/sanitize-html";

interface ProductDetailPageProps {
    params: Promise<{
        id: string;
        category: string;
    }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: {
            id,
        },
    });

    if (!product) {
        notFound();
    }

    const safeContent = sanitizeHtmlContent(product.content);

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            {/* Breadcrumb / Category */}
            <div className="mb-4">
                <Badge variant="outline" className="text-sm uppercase">
                    {product.category.replace("_", " ")}
                </Badge>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-5xl mb-6">
                {product.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 border-b pb-4 gap-2">
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
                dangerouslySetInnerHTML={{ __html: safeContent }}
            />
        </div>
    );
}
