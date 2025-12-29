import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSiteSettings } from "@/lib/site-settings";

// GET: List all posts
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || searchParams.get("board");
    const session = await auth();
    const sessionUserId = session?.user?.id || null;
    const isAdmin = session?.user?.role === "ADMIN";
    const settings = await getSiteSettings();

    if (!settings.communityEnabled && !isAdmin) {
        return NextResponse.json({ error: "커뮤니티 기능이 비활성화되어 있습니다." }, { status: 403 });
    }

    const posts = await prisma.post.findMany({
        where: type ? { type: { equals: type, mode: "insensitive" } } : undefined,
        include: {
            author: { select: { name: true } },
            _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const safePosts = posts.map((post) => {
        const isOwner = sessionUserId && post.authorId === sessionUserId;
        const canViewSecret = !post.isSecret || isAdmin || isOwner;
        return {
            ...post,
            content: canViewSecret ? post.content : null,
            contentMarkdown: canViewSecret ? post.contentMarkdown : null,
        };
    });

    return NextResponse.json(safePosts);
}

// POST: Create a new post
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { title, content, contentMarkdown, type, boardKey, isSecret, isPinned, attachments } = body;
    const resolvedKey = typeof boardKey === "string" ? boardKey : type;

    if (!title || !content || !resolvedKey) {
        return NextResponse.json({ error: "모든 필드를 입력해주세요" }, { status: 400 });
    }
    const board = await prisma.board.findFirst({
        where: { key: { equals: resolvedKey, mode: "insensitive" } },
    });
    if (!board) {
        return NextResponse.json({ error: "게시판을 찾을 수 없습니다." }, { status: 400 });
    }
    if (!board.isVisible && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "비공개 게시판입니다." }, { status: 403 });
    }

    const post = await prisma.post.create({
        data: {
            title,
            content,
            contentMarkdown: typeof contentMarkdown === "string" && contentMarkdown.trim()
                ? contentMarkdown.trim()
                : null,
            type: board.key,
            isSecret: Boolean(isSecret),
            isPinned: session.user.role === "ADMIN" ? Boolean(isPinned) : false,
            authorId: currentUser.id,
            attachments: Array.isArray(attachments) && attachments.length
                ? {
                    create: attachments
                        .filter((item) => typeof item?.url === "string" && item.url.trim())
                        .map((item) => ({
                            url: item.url.trim(),
                            name: typeof item.name === "string" ? item.name.trim() || null : null,
                            type: typeof item.type === "string" ? item.type.trim() || null : null,
                            size: typeof item.size === "number" ? item.size : null,
                        })),
                }
                : undefined,
        },
        include: {
            attachments: true,
        },
    });

    return NextResponse.json(post, { status: 201 });
}
