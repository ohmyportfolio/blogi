import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: List products
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";
    const categoryRecord = category
        ? await prisma.category.findUnique({ where: { slug: category } })
        : null;

    if (categoryRecord?.requiresAuth && !session) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
        where: category
            ? categoryRecord
                ? {
                    categoryId: categoryRecord.id,
                    isVisible: isAdmin ? undefined : true,
                }
                : { id: { in: [] } }
            : {
                isVisible: isAdmin ? undefined : true,
                ...(session ? {} : { NOT: { categoryRef: { is: { requiresAuth: true } } } }),
            },
        orderBy: { createdAt: "desc" },
        include: { categoryRef: true },
    });

    return NextResponse.json(products);
}

// POST: Create a new product (Admin only)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, contentMarkdown, categoryId, price, imageUrl } = body;

    if (!title || !content || !categoryId) {
        return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
    }

    const categoryRef = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryRef) {
        return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 400 });
    }

    const product = await prisma.product.create({
        data: {
            title,
            content,
            contentMarkdown: typeof contentMarkdown === "string" && contentMarkdown.trim()
                ? contentMarkdown.trim()
                : null,
            categoryId: categoryRef.id,
            price: price || null,
            imageUrl: imageUrl || null,
        },
    });

    return NextResponse.json(product, { status: 201 });
}
