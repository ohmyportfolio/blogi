import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { markdownToHtml } from "@/lib/markdown";
import { buildContentIndexUrl, isPublicIndexable, submitIndexNow } from "@/lib/indexnow";
import { getMenuCategoryRequiresAuth, getRestrictedCategoryIdsFromMenu } from "@/lib/category-auth";

// GET: List contents
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    const categoryRecord = category
        ? await prisma.category.findUnique({ where: { slug: category } })
        : null;
    const menuRequiresAuth = categoryRecord
        ? await getMenuCategoryRequiresAuth({
            categoryId: categoryRecord.id,
            categorySlug: categoryRecord.slug,
        })
        : false;

    if ((categoryRecord?.requiresAuth || menuRequiresAuth) && !session) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const restrictedCategoryIds = !session ? await getRestrictedCategoryIdsFromMenu() : [];
    const unauthFilters = session
        ? []
        : [
            { NOT: { categoryRef: { is: { requiresAuth: true } } } },
            ...(restrictedCategoryIds.length
                ? [{ NOT: { categoryId: { in: restrictedCategoryIds } } }]
                : []),
        ];

    const contents = await prisma.content.findMany({
        where: category
            ? categoryRecord
                ? {
                    categoryId: categoryRecord.id,
                    isVisible: isAdmin ? undefined : true,
                    isDeleted: false,
                }
                : { id: { in: [] } }
            : {
                isVisible: isAdmin ? undefined : true,
                isDeleted: false,
                ...(unauthFilters.length ? { AND: unauthFilters } : {}),
            },
        orderBy: { createdAt: "desc" },
        include: { categoryRef: true },
    });

    return NextResponse.json(contents);
}

// POST: Create a new content (Admin only)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, contentMarkdown, categoryId, price, imageUrl, tagIds } = body;

    if (!title || !content || !categoryId) {
        return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
    }

    const categoryRef = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryRef) {
        return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 400 });
    }

    const htmlContent =
        typeof contentMarkdown === "string" && contentMarkdown.trim()
            ? await markdownToHtml(contentMarkdown.trim())
            : null;

    let validatedTagIds: string[] = [];
    if (tagIds !== undefined) {
        if (!Array.isArray(tagIds) || tagIds.some((id) => typeof id !== "string")) {
            return NextResponse.json({ error: "태그 형식이 올바르지 않습니다." }, { status: 400 });
        }
        validatedTagIds = Array.from(
            new Set(tagIds.map((id: string) => id.trim()).filter(Boolean))
        );
        if (validatedTagIds.length > 0) {
            const validTags = await prisma.tag.findMany({
                where: {
                    id: { in: validatedTagIds },
                    OR: [{ categoryId: categoryRef.id }, { categoryId: null }],
                },
                select: { id: true },
            });
            const validTagIds = new Set(validTags.map((tag) => tag.id));
            const invalidTagIds = validatedTagIds.filter((id) => !validTagIds.has(id));
            if (invalidTagIds.length > 0) {
                return NextResponse.json(
                    { error: "유효하지 않은 태그가 포함되어 있습니다." },
                    { status: 400 }
                );
            }
        }
    }

    const createdContent = await prisma.content.create({
        data: {
            title,
            content,
            contentMarkdown: typeof contentMarkdown === "string" && contentMarkdown.trim()
                ? contentMarkdown.trim()
                : null,
            htmlContent,
            categoryId: categoryRef.id,
            price: price || null,
            imageUrl: imageUrl || null,
        },
    });

    // 태그 연결
    if (validatedTagIds.length > 0) {
        await prisma.contentTag.createMany({
            data: validatedTagIds.map((tagId) => ({
                contentId: createdContent.id,
                tagId,
            })),
            skipDuplicates: true,
        });
    }

    revalidatePath("/sitemap.xml");
    if (
        isPublicIndexable({
            isVisible: createdContent.isVisible,
            isDeleted: createdContent.isDeleted,
            categoryRequiresAuth: categoryRef.requiresAuth ?? false,
            categoryIsVisible: categoryRef.isVisible ?? true,
        })
    ) {
        await submitIndexNow([buildContentIndexUrl(categoryRef.slug, createdContent.id)]);
    }

    return NextResponse.json(createdContent, { status: 201 });
}
