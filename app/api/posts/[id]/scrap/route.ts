import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(_: Request, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }
    const isAuthor = post.authorId === userId;
    const isAdmin = session.user.role === "ADMIN";
    if (post.isSecret && !isAuthor && !isAdmin) {
        return NextResponse.json({ error: "비밀글입니다" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.postScrap.findUnique({
            where: { postId_userId: { postId: id, userId } },
        });

        if (existing) {
            await tx.postScrap.delete({ where: { id: existing.id } });
            const updated = await tx.post.update({
                where: { id },
                data: { scrapCount: { decrement: 1 } },
            });
            return { scrapped: false, scrapCount: updated.scrapCount };
        }

        await tx.postScrap.create({
            data: { postId: id, userId },
        });
        const updated = await tx.post.update({
            where: { id },
            data: { scrapCount: { increment: 1 } },
        });
        return { scrapped: true, scrapCount: updated.scrapCount };
    });

    return NextResponse.json(result);
}
