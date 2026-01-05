import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextViewer } from "@/components/editor/rich-text-viewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { extractContentId, buildContentHref, getContentPlainText, truncateText } from "@/lib/contents";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

interface ContentDetailPageProps {
    params: Promise<{
        id: string;
        category: string;
    }>;
}

export async function generateMetadata({ params }: ContentDetailPageProps): Promise<Metadata> {
    const { id: idParam, category } = await params;
    const contentId = extractContentId(idParam);

    const [settings, content] = await Promise.all([
        getSiteSettings(),
        prisma.content.findUnique({
            where: { id: contentId },
            include: { categoryRef: true },
        }),
    ]);

    if (!content) {
        return {
            title: "콘텐츠를 찾을 수 없습니다",
            robots: { index: false, follow: false },
        };
    }

    const siteName = settings.siteName || "사이트";
    const descriptionSource = getContentPlainText(content.content, content.contentMarkdown);
    const description =
        truncateText(descriptionSource || settings.siteDescription || settings.siteTagline || "");
    const title = `${content.title} | ${siteName}`;
    const ogImage = content.imageUrl || settings.ogImageUrl || settings.siteLogoUrl || undefined;
    const canonicalPath = buildContentHref(
        content.categoryRef?.slug ?? category,
        content.id,
        content.title
    );
    const baseUrl = process.env.SITE_URL || "http://localhost:3000";
    const shouldNoIndex =
        !content.isVisible || content.isDeleted || (content.categoryRef?.requiresAuth ?? false);

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

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
    const { id: idParam, category } = await params;
    const contentId = extractContentId(idParam);
    const session = await auth();

    const content = await prisma.content.findUnique({
        where: {
            id: contentId,
        },
        include: {
            categoryRef: true,
        },
    });

    if (!content) {
        notFound();
    }

    const contentCategorySlug = content.categoryRef?.slug ?? category;
    const contentCategoryLabel = content.categoryRef?.name ?? category;
    const isAdmin = session?.user?.role === "ADMIN";
    const requiresAuth = content.categoryRef?.requiresAuth ?? false;
    const canViewCategory = !requiresAuth || Boolean(session);

    if (!content.isVisible && !isAdmin) {
        notFound();
    }

    const seoText = getContentPlainText(content.content, content.contentMarkdown);

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <Button variant="ghost" className="mb-6 -ml-2" asChild>
                <Link href={`/contents/${contentCategorySlug || category}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    목록으로
                </Link>
            </Button>

            {/* Breadcrumb / Category */}
            <div className="mb-4">
                <Badge variant="outline" className="text-sm uppercase">
                    {contentCategoryLabel}
                </Badge>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-5xl mb-6">
                {content.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 border-b pb-4 gap-2">
                <span>{format(content.createdAt, "yyyy.MM.dd")}</span>
                {content.price && canViewCategory && (
                    <span className="ml-auto font-bold text-lg text-sky-600">
                        {content.price}
                    </span>
                )}
            </div>

            {/* Content (Rich Text) */}
            {canViewCategory ? (
                <>
                    {seoText ? (
                        <div className="sr-only">
                            <p>{seoText}</p>
                        </div>
                    ) : null}
                    <RichTextViewer content={content.content} />
                </>
            ) : (
                <div className="rounded-2xl border border-black/5 bg-white/80 px-6 py-10 text-center shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
                    <p className="text-gray-500 text-base mb-6">
                        로그인 후 확인할 수 있습니다.
                    </p>
                    <Button asChild>
                        <Link href={`/login?callbackUrl=${encodeURIComponent(`/contents/${category}/${idParam}`)}`}>
                            로그인하기
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
