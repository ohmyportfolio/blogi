import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextViewer } from "@/components/editor/rich-text-viewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";

interface ProductDetailPageProps {
    params: Promise<{
        id: string;
        category: string;
    }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { id, category } = await params;
    const session = await auth();

    const product = await prisma.product.findUnique({
        where: {
            id,
        },
        include: {
            categoryRef: true,
        },
    });

    if (!product) {
        notFound();
    }

    const productCategorySlug = product.categoryRef?.slug ?? category;
    const productCategoryLabel = product.categoryRef?.name ?? category;
    const isAdmin = session?.user?.role === "ADMIN";
    const requiresAuth = product.categoryRef?.requiresAuth ?? false;
    const canViewCategory = !requiresAuth || Boolean(session);

    if (!product.isVisible && !isAdmin) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <Button variant="ghost" className="mb-6 -ml-2" asChild>
                <Link href={`/products/${productCategorySlug || category}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    목록으로
                </Link>
            </Button>

            {/* Breadcrumb / Category */}
            <div className="mb-4">
                <Badge variant="outline" className="text-sm uppercase">
                    {productCategoryLabel}
                </Badge>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-5xl mb-6">
                {product.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 border-b pb-4 gap-2">
                <span>{format(product.createdAt, "yyyy.MM.dd")}</span>
                {product.price && canViewCategory && (
                    <span className="ml-auto font-bold text-lg text-sky-600">
                        {product.price}
                    </span>
                )}
            </div>

            {/* Content (Rich Text) */}
            {canViewCategory ? (
                <RichTextViewer content={product.content} />
            ) : (
                <div className="rounded-2xl border border-black/5 bg-white/80 px-6 py-10 text-center shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
                    <p className="text-gray-500 text-base mb-6">
                        로그인 후 확인할 수 있습니다.
                    </p>
                    <Button asChild>
                        <Link href={`/login?callbackUrl=${encodeURIComponent(`/products/${category}/${id}`)}`}>
                            로그인하기
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
