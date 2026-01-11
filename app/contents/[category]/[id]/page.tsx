import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextViewer } from "@/components/editor/rich-text-viewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { extractContentId, buildContentHref, getContentPlainText, truncateText, hasLexicalRichNodes } from "@/lib/contents";
import { getSiteSettings } from "@/lib/site-settings";
import { markdownToHtml } from "@/lib/markdown";
import type { Metadata } from "next";
import { getMenuCategoryRequiresAuth } from "@/lib/category-auth";

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
    const ogImage =
      content.imageUrl ||
      settings.ogImageUrl ||
      settings.siteBannerUrl ||
      settings.siteLogoUrl ||
      "/default-logo.svg";
    const canonicalPath = buildContentHref(
        content.categoryRef?.slug ?? category,
        content.id
    );
    const baseUrl = process.env.SITE_URL || "http://localhost:3000";
    const menuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: content.categoryRef?.id,
        categorySlug: content.categoryRef?.slug ?? category,
    });
    const shouldNoIndex =
        !content.isVisible ||
        content.isDeleted ||
        (content.categoryRef?.requiresAuth ?? false) ||
        menuRequiresAuth;

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
    const menuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: content.categoryRef?.id,
        categorySlug: contentCategorySlug,
    });
    const requiresAuth = Boolean(content.categoryRef?.requiresAuth || menuRequiresAuth);
    const canViewCategory = !requiresAuth || Boolean(session);
    const showDate = content.categoryRef?.showDate ?? true;

    if (!content.isVisible && !isAdmin) {
        notFound();
    }

    const canonicalHref = buildContentHref(
        contentCategorySlug || category,
        content.id
    );
    const currentHref = `/contents/${category}/${idParam}`;
    if (currentHref !== canonicalHref) {
        redirect(canonicalHref);
    }

    const markdownHtml = canViewCategory && !content.htmlContent && content.contentMarkdown
        ? await markdownToHtml(content.contentMarkdown)
        : "";
    const htmlContent = content.htmlContent || markdownHtml;
    const preferLexical = hasLexicalRichNodes(content.content);

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
            {(showDate || (content.price && canViewCategory)) && (
                <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 border-b pb-4 gap-2">
                    {showDate && <span>{format(content.createdAt, "yyyy.MM.dd")}</span>}
                    {content.price && canViewCategory && (
                        <span className={showDate ? "ml-auto font-bold text-lg text-sky-600" : "font-bold text-lg text-sky-600"}>
                            {content.price}
                        </span>
                    )}
                </div>
            )}

            {/* Content (Rich Text) */}
            {canViewCategory ? (
                !preferLexical && htmlContent ? (
                    <div
                        className="blog-content min-h-[220px] rounded-3xl border border-black/5 bg-white/90 px-5 sm:px-8 py-6 sm:py-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                ) : (
                    <RichTextViewer content={content.content} />
                )
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
