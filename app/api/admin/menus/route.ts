import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildBoardKey } from "@/lib/boards";
import { buildCommunityHref, extractCommunitySlug } from "@/lib/community";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
};

const getOrCreateMenu = async (key: string, name?: string) => {
  const existing = await prisma.menu.findUnique({ where: { key } });
  if (existing) return existing;
  return prisma.menu.create({
    data: {
      key,
      name: name || key,
    },
  });
};

const resolveLinkType = (value?: string, href?: string) => {
  if (value === "external") return "external";
  if (value === "community") return "community";
  if (value === "category") return "category";
  if (href?.startsWith("http")) return "external";
  if (href?.startsWith("/community")) return "community";
  return "category";
};

const isManualHrefValid = (href?: string) => {
  if (!href) return false;
  return href.startsWith("http") || href.startsWith("/");
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;

const validateSlug = (slug: string): { valid: boolean; error?: string } => {
  if (!slug) return { valid: true };
  if (slug.length > 50) return { valid: false, error: "슬러그는 50자 이하여야 합니다" };
  if (!SLUG_PATTERN.test(slug)) {
    return { valid: false, error: "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다" };
  }
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { valid: false, error: "슬러그는 하이픈으로 시작하거나 끝날 수 없습니다" };
  }
  return { valid: true };
};

const getExistingCommunitySlug = (href?: string) => {
  if (!href) return "";
  const slug = extractCommunitySlug(href);
  return slug || "";
};

const getExistingCategorySlug = (href?: string) => {
  if (!href) return "";
  if (href.startsWith("/products/")) {
    return href.replace("/products/", "").trim();
  }
  return "";
};

const getNextSequentialSlug = async ({
  menuId,
  linkType,
  prefix,
  basePath,
}: {
  menuId: string;
  linkType: "community" | "category";
  prefix: string;
  basePath: string;
}) => {
  const items = await prisma.menuItem.findMany({
    where: { menuId, linkType },
    select: { href: true },
  });
  const max = items.reduce((acc, item) => {
    if (!item.href?.startsWith(basePath)) return acc;
    const slug = item.href.replace(basePath, "").replace(/^\/+/, "");
    const match = slug.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) return acc;
    return Math.max(acc, Number(match[1]));
  }, 0);
  return `${prefix}-${max + 1}`;
};


export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { menuKey, data } = body;
    if (!menuKey || !data?.label) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다" }, { status: 400 });
    }
    const menu = await getOrCreateMenu(menuKey, menuKey === "footer" ? "Footer" : "Main");
    const linkType = resolveLinkType(data.linkType, data.href);
    let href = data.href;
    let linkedCategoryId: string | null = null;

    // 외부 링크 처리
    if (linkType === "external") {
      if (!isManualHrefValid(data.href)) {
        return NextResponse.json(
          { error: "링크 주소는 http://, https:// 또는 / 로 시작해야 합니다" },
          { status: 400 }
        );
      }
      href = data.href;
      linkedCategoryId = null;
    } else if (linkType === "community") {
      const inputSlug = data.slug?.trim();
      const validation = validateSlug(inputSlug || "");
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const slug = inputSlug || await getNextSequentialSlug({
        menuId: menu.id,
        linkType: "community",
        prefix: "community",
        basePath: "/community/",
      });
      href = buildCommunityHref(slug);
      const duplicate = await prisma.menuItem.findFirst({
        where: { menuId: menu.id, linkType: "community", href },
      });
      if (duplicate) {
        return NextResponse.json({ error: "이미 존재하는 커뮤니티 슬러그입니다" }, { status: 400 });
      }
    } else if (linkType === "category") {
      const inputSlug = data.slug?.trim();
      const validation = validateSlug(inputSlug || "");
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const slug = inputSlug || await getNextSequentialSlug({
        menuId: menu.id,
        linkType: "category",
        prefix: "category",
        basePath: "/products/",
      });
      if (!slug) {
        return NextResponse.json({ error: "카테고리 주소가 필요합니다" }, { status: 400 });
      }
      href = `/products/${slug}`;
      const category = await prisma.category.upsert({
        where: { slug },
        update: {
          name: data.label,
          isVisible: data.isVisible ?? true,
          order: data.order ?? 0,
          requiresAuth: typeof data.requiresAuth === "boolean" ? data.requiresAuth : false,
        },
        create: {
          name: data.label,
          slug,
          isVisible: data.isVisible ?? true,
          order: data.order ?? 0,
          requiresAuth: typeof data.requiresAuth === "boolean" ? data.requiresAuth : false,
        },
      });
      linkedCategoryId = category.id;
      const duplicate = await prisma.menuItem.findFirst({
        where: { menuId: menu.id, linkType: "category", href },
      });
      if (duplicate) {
        return NextResponse.json({ error: "이미 존재하는 카테고리 메뉴입니다" }, { status: 400 });
      }
    }
    const item = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        label: data.label,
        href,
        order: data.order ?? 0,
        isVisible: data.isVisible ?? true,
        isExternal: data.isExternal ?? false,
        openInNew: data.openInNew ?? false,
        requiresAuth: data.requiresAuth ?? false,
        badgeText: data.badgeText || null,
        linkType,
        linkedCategoryId,
      },
    });
    // 커뮤니티 게시판은 관리자 메뉴에서 직접 생성합니다.
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    revalidatePath("/community");
    const nextItem = await prisma.menuItem.findUnique({
      where: { id: item.id },
      include: { boards: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(nextItem ?? item, { status: 201 });
  }

  if (action === "update") {
    const { id, data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "메뉴를 찾을 수 없습니다" }, { status: 404 });
    }

    // 메뉴 생성 후 타입 변경 차단
    if (data.linkType && data.linkType !== existing.linkType) {
      return NextResponse.json(
        { error: "메뉴 유형은 생성 후 변경할 수 없습니다. 기존 메뉴를 삭제하고 새로 생성해주세요." },
        { status: 400 }
      );
    }

    const linkType = existing.linkType; // 기존 타입 유지
    let href = existing.href; // href도 기존 값 유지 (타입에 따라 결정됨)
    let linkedCategoryId: string | null = existing.linkedCategoryId ?? null;

    // 외부 링크인 경우 href 업데이트 허용
    if (linkType === "external") {
      if (data.href && !isManualHrefValid(data.href)) {
        return NextResponse.json(
          { error: "링크 주소는 http://, https:// 또는 / 로 시작해야 합니다" },
          { status: 400 }
        );
      }
      href = data.href ?? existing.href;
    } else if (linkType === "community") {
      // 커뮤니티는 href 변경 없이 기존 값 유지 (슬러그 변경 불가)
      linkedCategoryId = null;
    } else if (linkType === "category") {
      // 카테고리는 연결된 Category 정보만 업데이트
      const slug = getExistingCategorySlug(existing.href);
      if (linkedCategoryId) {
        await prisma.category.update({
          where: { id: linkedCategoryId },
          data: {
            name: data.label ?? existing.label,
            isVisible: data.isVisible ?? existing.isVisible,
            requiresAuth: typeof data.requiresAuth === "boolean" ? data.requiresAuth : undefined,
          },
        });
      } else if (slug) {
        // linkedCategoryId가 없는 기존 데이터의 경우 Category 생성/연결
        const category = await prisma.category.upsert({
          where: { slug },
          update: {
            name: data.label ?? existing.label,
            isVisible: data.isVisible ?? true,
            requiresAuth: typeof data.requiresAuth === "boolean" ? data.requiresAuth : false,
          },
          create: {
            name: data.label ?? existing.label,
            slug,
            isVisible: data.isVisible ?? true,
            order: existing.order ?? 0,
            requiresAuth: typeof data.requiresAuth === "boolean" ? data.requiresAuth : false,
          },
        });
        linkedCategoryId = category.id;
      }
    }
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        label: data.label,
        href,
        isVisible: data.isVisible,
        isExternal: data.isExternal,
        openInNew: data.openInNew,
        requiresAuth: data.requiresAuth,
        badgeText: data.badgeText || null,
        linkType,
        linkedCategoryId,
      },
    });
    // 커뮤니티 게시판은 관리자 메뉴에서 직접 생성합니다.
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    revalidatePath("/community");
    const nextItem = await prisma.menuItem.findUnique({
      where: { id: item.id },
      include: { boards: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(nextItem ?? item);
  }

  if (action === "delete") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (existing?.linkType === "category" && existing.linkedCategoryId) {
      await prisma.category.update({
        where: { id: existing.linkedCategoryId },
        data: { isVisible: false },
      });
    }
    if (existing?.linkType === "community") {
      const boards = await prisma.board.findMany({ where: { menuItemId: existing.id } });
      if (boards.length > 0) {
        const boardIds = boards.map((board) => board.id);
        const postCount = await prisma.post.count({
          where: { boardId: { in: boardIds } },
        });
        if (postCount > 0) {
          return NextResponse.json(
            { error: "게시글이 있는 커뮤니티는 삭제할 수 없습니다. 게시글을 먼저 정리해주세요." },
            { status: 400 }
          );
        }
      }
    }
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    revalidatePath("/community");
    return NextResponse.json({ success: true });
  }

  if (action === "reorder") {
    const { menuKey, items } = body;
    if (!menuKey || !Array.isArray(items)) {
      return NextResponse.json({ error: "정렬 정보가 필요합니다" }, { status: 400 });
    }
    const menu = await getOrCreateMenu(menuKey, menuKey === "footer" ? "Footer" : "Main");
    const menuUpdates = items.map((item: { id: string; order: number }) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { order: item.order, menuId: menu.id },
      })
    );
    const linkedItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((item: { id: string }) => item.id) } },
      select: { id: true, linkType: true, linkedCategoryId: true },
    });
    const orderMap = new Map(items.map((item: { id: string; order: number }) => [item.id, item.order]));
    const categoryUpdates = linkedItems
      .filter((item) => item.linkType === "category" && item.linkedCategoryId)
      .map((item) =>
        prisma.category.update({
          where: { id: item.linkedCategoryId as string },
          data: { order: orderMap.get(item.id) ?? 0 },
        })
      );
    await prisma.$transaction([...menuUpdates, ...categoryUpdates]);
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "지원하지 않는 동작입니다" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { action, id, thumbnailUrl } = body;

  if (action === "updateThumbnail") {
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "메뉴를 찾을 수 없습니다" }, { status: 404 });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        thumbnailUrl: thumbnailUrl || null,
      },
    });

    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "지원하지 않는 동작입니다" }, { status: 400 });
}
