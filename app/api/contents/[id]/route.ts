import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
        include: { categoryRef: true },
    });

    if (!content) {
        return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }

    if (!content.isVisible && !isAdmin) {
        return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }

    if (content.categoryRef?.requiresAuth && !session) {
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
    const body = await req.json();
    const { title, content, contentMarkdown, categoryId, price, imageUrl, isVisible } = body;

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
        updateData.contentMarkdown = contentMarkdown.trim() || null;
    }

    const updated = await prisma.content.update({
        where: { id },
        data: updateData,
    });

    return NextResponse.json(updated);
}

// DELETE: Delete content (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.content.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
