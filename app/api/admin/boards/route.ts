import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildBoardKey } from "@/lib/boards";
import { extractCommunitySlug } from "@/lib/community";
import { revalidatePath } from "next/cache";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
};

const getNextBoardSlug = async (menuItemId: string) => {
  const boards = await prisma.board.findMany({
    where: { menuItemId },
    select: { slug: true },
  });
  const usedSlugs = new Set(boards.map((board) => board.slug).filter(Boolean));
  let index = 1;
  while (usedSlugs.has(`board-${index}`)) {
    index += 1;
  }
  return `board-${index}`;
};

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { data } = body;
    if (!data?.name || !data?.menuItemId) {
      return NextResponse.json({ error: "게시판 이름과 그룹 정보가 필요합니다" }, { status: 400 });
    }
    const menuItem = await prisma.menuItem.findUnique({ where: { id: data.menuItemId } });
    if (!menuItem || menuItem.linkType !== "community") {
      return NextResponse.json({ error: "커뮤니티 메뉴를 찾을 수 없습니다" }, { status: 404 });
    }
    const groupSlug = extractCommunitySlug(menuItem.href, menuItem.label);
    const slug = data.slug?.trim() || await getNextBoardSlug(menuItem.id);
    if (!slug) {
      return NextResponse.json({ error: "게시판 슬러그를 생성할 수 없습니다" }, { status: 400 });
    }
    const exists = await prisma.board.findFirst({
      where: { menuItemId: menuItem.id, slug },
    });
    if (exists) {
      return NextResponse.json({ error: "이미 존재하는 게시판 슬러그입니다" }, { status: 400 });
    }
    const count = await prisma.board.count({ where: { menuItemId: menuItem.id } });
    const board = await prisma.board.create({
      data: {
        key: buildBoardKey(groupSlug, slug),
        slug,
        menuItemId: menuItem.id,
        name: data.name,
        description: data.description || null,
        isVisible: data.isVisible ?? true,
        order: data.order ?? count + 1,
      },
    });
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json(board, { status: 201 });
  }

  if (action === "update") {
    const { id, data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "게시판을 찾을 수 없습니다" }, { status: 404 });
    }
    const nextName = data?.name ?? existing.name;
    const board = await prisma.board.update({
      where: { id },
      data: {
        name: nextName,
        description: typeof data?.description === "string" ? data.description : existing.description,
        isVisible: typeof data?.isVisible === "boolean" ? data.isVisible : existing.isVisible,
      },
    });
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json(board);
  }

  if (action === "delete") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.board.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "게시판을 찾을 수 없습니다" }, { status: 404 });
    }
    // soft delete - 휴지통으로 이동
    await prisma.board.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isVisible: false,
      },
    });
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json({
      success: true,
      message: "게시판이 휴지통으로 이동되었습니다.",
      postCount: existing._count.posts,
    });
  }

  // 게시판 복구
  if (action === "restore") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "게시판을 찾을 수 없습니다" }, { status: 404 });
    }
    await prisma.board.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        isVisible: true,
      },
    });
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json({ success: true, message: "게시판이 복구되었습니다." });
  }

  // 게시판 영구 삭제
  if (action === "permanentDelete") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.board.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "게시판을 찾을 수 없습니다" }, { status: 404 });
    }
    if (!existing.isDeleted) {
      return NextResponse.json({ error: "휴지통에 있는 게시판만 영구 삭제할 수 있습니다" }, { status: 400 });
    }
    // 게시물과 함께 영구 삭제
    await prisma.$transaction([
      prisma.post.deleteMany({ where: { boardId: id } }),
      prisma.board.delete({ where: { id } }),
    ]);
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json({
      success: true,
      message: "게시판이 영구 삭제되었습니다.",
      deletedPosts: existing._count.posts,
    });
  }

  if (action === "reorder") {
    const { items, menuItemId } = body;
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "정렬 정보가 필요합니다" }, { status: 400 });
    }
    if (!menuItemId) {
      return NextResponse.json({ error: "그룹 정보가 필요합니다" }, { status: 400 });
    }
    const validIds = await prisma.board.findMany({
      where: { menuItemId },
      select: { id: true },
    });
    const idSet = new Set(validIds.map((item) => item.id));
    await prisma.$transaction(
      items
        .filter((item: { id: string; order: number }) => idSet.has(item.id))
        .map((item: { id: string; order: number }) =>
          prisma.board.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
    );
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "지원하지 않는 동작입니다" }, { status: 400 });
}
