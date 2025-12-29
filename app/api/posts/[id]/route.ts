import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSiteSettings } from "@/lib/site-settings";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get a single post
export async function GET(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    const settings = await getSiteSettings();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const shouldIncrement =
        searchParams.get("view") === "1" || searchParams.get("view") === "true";

    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true } },
            comments: {
                include: {
                    author: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "asc" },
            },
            attachments: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    const isAdmin = session?.user?.role === "ADMIN";
    if (!settings.communityEnabled && !isAdmin) {
        return NextResponse.json({ error: "커뮤니티 기능이 비활성화되어 있습니다." }, { status: 403 });
    }

    const isAuthor = session?.user?.id === post.authorId;
    if (post.isSecret && !isAuthor && !isAdmin) {
        return NextResponse.json({ error: "비밀글입니다", isSecret: true }, { status: 403 });
    }

    const liked = session?.user?.id
        ? await prisma.postLike.findUnique({
            where: { postId_userId: { postId: id, userId: session.user.id } },
        })
        : null;
    const scrapped = session?.user?.id
        ? await prisma.postScrap.findUnique({
            where: { postId_userId: { postId: id, userId: session.user.id } },
        })
        : null;

    if (shouldIncrement) {
        // Increment view count
        await prisma.post.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }

    const board = await prisma.board.findFirst({
        where: { key: { equals: post.type, mode: "insensitive" } },
    });

    return NextResponse.json({
        ...post,
        viewCount: shouldIncrement ? post.viewCount + 1 : post.viewCount,
        content: post.content,
        authorId: post.author.id,
        liked: Boolean(liked),
        scrapped: Boolean(scrapped),
        boardName: board?.name ?? post.type,
        boardKey: board?.key ?? post.type,
        comments: post.comments.map((c) => ({
            ...c,
            authorId: c.author.id,
        })),
    });
}

// PUT: Update a post
export async function PUT(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }
    const settings = await getSiteSettings();
    if (!settings.communityEnabled && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "커뮤니티 기능이 비활성화되어 있습니다." }, { status: 403 });
    }
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!currentUser) {
        return NextResponse.json({ error: "세션이 만료되었습니다. 다시 로그인해주세요." }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    // Check permission: author or admin
    const isAuthor = post.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isAuthor && !isAdmin) {
        return NextResponse.json({ error: "수정 권한이 없습니다" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, contentMarkdown, type, boardKey, isSecret, isPinned, attachments } = body;
    const resolvedKey = typeof boardKey === "string" ? boardKey : type;
    const board = resolvedKey
        ? await prisma.board.findFirst({
            where: { key: { equals: resolvedKey, mode: "insensitive" } },
        })
        : null;
    if (resolvedKey && !board) {
        return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 400 });
    }
    if (board && !board.isVisible && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "비공개 게시판입니다." }, { status: 403 });
    }

    const updateData: {
        title?: string;
        content?: string;
        contentMarkdown?: string | null;
        type?: string;
        isSecret?: boolean;
        isPinned?: boolean;
    } = {
        title,
        content,
        type: board?.key ?? type,
    };
    if (typeof isSecret === "boolean") {
        updateData.isSecret = isSecret;
    }
    if (typeof isPinned === "boolean") {
        updateData.isPinned = isAdmin ? isPinned : post.isPinned;
    }
    if (typeof contentMarkdown === "string") {
        updateData.contentMarkdown = contentMarkdown.trim() || null;
    }
    const updated = await prisma.$transaction(async (tx) => {
        const updatedPost = await tx.post.update({
            where: { id },
            data: updateData,
        });

        if (Array.isArray(attachments)) {
            await tx.postAttachment.deleteMany({ where: { postId: id } });
            const attachmentData = attachments
                .filter((item) => typeof item?.url === "string" && item.url.trim())
                .map((item) => ({
                    postId: id,
                    url: item.url.trim(),
                    name: typeof item.name === "string" ? item.name.trim() || null : null,
                    type: typeof item.type === "string" ? item.type.trim() || null : null,
                    size: typeof item.size === "number" ? item.size : null,
                }));
            if (attachmentData.length) {
                await tx.postAttachment.createMany({ data: attachmentData });
            }
        }

        return updatedPost;
    });

    return NextResponse.json(updated);
}

// DELETE: Delete a post
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
        return NextResponse.json({ error: "게시글을 찾을 수 없습니다" }, { status: 404 });
    }

    // Check permission: author or admin
    const isAuthor = post.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isAuthor && !isAdmin) {
        return NextResponse.json({ error: "삭제 권한이 없습니다" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
