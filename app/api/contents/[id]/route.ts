import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/markdown";
import { buildContentIndexUrl, isPublicIndexable, submitIndexNow } from "@/lib/indexnow";
import { getMenuCategoryRequiresAuth } from "@/lib/category-auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Content detail
export async function GET(req: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    const content = await prisma.content.findUnique({
        where: { id },
        include: {
            categoryRef: true,
            tags: {
                include: { tag: true },
                orderBy: { tag: { order: "asc" } },
            },
        },
    });

    if (!content) {
        return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }

    if (!content.isVisible && !isAdmin) {
        return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }

    const menuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: content.categoryRef?.id,
        categorySlug: content.categoryRef?.slug,
    });
    if ((content.categoryRef?.requiresAuth || menuRequiresAuth) && !session) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    return NextResponse.json({
        ...content,
        content: content.content,
    });
}

// PUT: Update content (Admin only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.content.findUnique({
        where: { id },
        include: { categoryRef: true },
    });
    if (!existing) {
        return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, contentMarkdown, categoryId, price, imageUrl, isVisible, tagIds } = body;

    if (!title || !content || !categoryId) {
        return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
    }

    const categoryRef = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryRef) {
        return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 400 });
    }

    const updateData: {
        title: string;
        content: string;
        contentMarkdown?: string | null;
        htmlContent?: string | null;
        price?: string | null;
        imageUrl?: string | null;
        isVisible: boolean;
        categoryId: string;
    } = {
        title,
        content,
        price: price || null,
        imageUrl: imageUrl || null,
        isVisible: typeof isVisible === "boolean" ? isVisible : true,
        categoryId: categoryRef.id,
    };
    if (typeof contentMarkdown === "string") {
        const trimmedMarkdown = contentMarkdown.trim();
        updateData.contentMarkdown = trimmedMarkdown || null;
        updateData.htmlContent = trimmedMarkdown ? await markdownToHtml(trimmedMarkdown) : null;
    }

    const updated = await prisma.content.update({
        where: { id },
        data: updateData,
        include: { categoryRef: true },
    });

    // 태그 재할당
    if (Array.isArray(tagIds)) {
        await prisma.contentTag.deleteMany({ where: { contentId: id } });
        if (tagIds.length > 0) {
            await prisma.contentTag.createMany({
                data: tagIds.map((tagId: string) => ({
                    contentId: id,
                    tagId,
                })),
                skipDuplicates: true,
            });
        }
    }

    revalidatePath("/sitemap.xml");
    const existingMenuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: existing.categoryRef?.id,
        categorySlug: existing.categoryRef?.slug,
    });
    const updatedMenuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: updated.categoryRef?.id,
        categorySlug: updated.categoryRef?.slug,
    });
    const wasPublic = isPublicIndexable({
        isVisible: existing.isVisible,
        isDeleted: existing.isDeleted,
        categoryRequiresAuth: Boolean(existing.categoryRef?.requiresAuth || existingMenuRequiresAuth),
        categoryIsVisible: existing.categoryRef?.isVisible ?? true,
    });
    const isPublic = isPublicIndexable({
        isVisible: updated.isVisible,
        isDeleted: updated.isDeleted,
        categoryRequiresAuth: Boolean(updated.categoryRef?.requiresAuth || updatedMenuRequiresAuth),
        categoryIsVisible: updated.categoryRef?.isVisible ?? true,
    });
    if (wasPublic || isPublic) {
        const categorySlug = updated.categoryRef?.slug ?? existing.categoryRef?.slug;
        if (categorySlug) {
            await submitIndexNow([buildContentIndexUrl(categorySlug, updated.id)]);
        }
    }

    return NextResponse.json(updated);
}

// DELETE: Soft delete content (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.content.findUnique({
        where: { id },
        include: { categoryRef: true },
    });
    if (!existing) {
        return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }

    // Soft delete: 휴지통으로 이동
    await prisma.content.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
            isVisible: false,
        },
    });

    revalidatePath("/sitemap.xml");
    const menuRequiresAuth = await getMenuCategoryRequiresAuth({
        categoryId: existing.categoryRef?.id,
        categorySlug: existing.categoryRef?.slug,
    });
    if (
        isPublicIndexable({
            isVisible: existing.isVisible,
            isDeleted: existing.isDeleted,
            categoryRequiresAuth: Boolean(existing.categoryRef?.requiresAuth || menuRequiresAuth),
            categoryIsVisible: existing.categoryRef?.isVisible ?? true,
        })
    ) {
        const categorySlug = existing.categoryRef?.slug;
        if (categorySlug) {
            await submitIndexNow([buildContentIndexUrl(categorySlug, existing.id)]);
        }
    }

    return NextResponse.json({
        success: true,
        message: "콘텐츠가 휴지통으로 이동되었습니다.",
    });
}
