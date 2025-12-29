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
  if (value === "community") return "community";
  if (value === "category") return "category";
  if (href?.startsWith("/community")) return "community";
  return "category";
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
    let linkedId: string | null = null;
    if (linkType === "community") {
      const slug = await getNextSequentialSlug({
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
    } else {
      const slug = await getNextSequentialSlug({
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
        },
        create: {
          name: data.label,
          slug,
          isVisible: data.isVisible ?? true,
          order: data.order ?? 0,
        },
      });
      linkedId = category.id;
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
        linkedId,
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
    const linkType = resolveLinkType(data.linkType, data.href ?? existing.href);
    let href = data.href ?? existing.href;
    let linkedId: string | null = existing.linkedId ?? null;
    if (linkType === "community") {
      const isSwitching = existing.linkType !== "community";
      const slug = isSwitching
        ? await getNextSequentialSlug({
            menuId: existing.menuId,
            linkType: "community",
            prefix: "community",
            basePath: "/community/",
          })
        : getExistingCommunitySlug(existing.href);
      if (!slug) {
        return NextResponse.json({ error: "커뮤니티 슬러그를 생성할 수 없습니다" }, { status: 400 });
      }
      href = buildCommunityHref(slug);
      const duplicate = await prisma.menuItem.findFirst({
        where: {
          menuId: existing.menuId,
          linkType: "community",
          href,
          NOT: { id: existing.id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: "이미 존재하는 커뮤니티 슬러그입니다" }, { status: 400 });
      }
      if (existing.linkType === "category" && existing.linkedId) {
        await prisma.category.update({
          where: { id: existing.linkedId },
          data: { isVisible: false },
        });
      }
      linkedId = null;
      if (existing.linkType === "community") {
        const prevSlug = getExistingCommunitySlug(existing.href);
        if (prevSlug && prevSlug !== slug) {
          const boards = await prisma.board.findMany({
            where: { menuItemId: existing.id },
          });
          for (const board of boards) {
            const nextKey = buildBoardKey(slug, board.slug);
            if (nextKey !== board.key) {
              await prisma.post.updateMany({
                where: { type: { equals: board.key, mode: "insensitive" } },
                data: { type: nextKey },
              });
              await prisma.board.update({
                where: { id: board.id },
                data: { key: nextKey },
              });
            }
          }
        }
      }
    } else {
      const isSwitching = existing.linkType !== "category";
      const slug = isSwitching
        ? await getNextSequentialSlug({
            menuId: existing.menuId,
            linkType: "category",
            prefix: "category",
            basePath: "/products/",
          })
        : getExistingCategorySlug(existing.href);
      if (!slug) {
        return NextResponse.json({ error: "카테고리 주소가 필요합니다" }, { status: 400 });
      }
      href = `/products/${slug}`;
      if (linkedId) {
        const prevCategory = await prisma.category.findUnique({ where: { id: linkedId } });
        if (prevCategory && prevCategory.slug !== slug) {
          await prisma.product.updateMany({
            where: { category: prevCategory.slug },
            data: { category: slug },
          });
        }
        await prisma.category.update({
          where: { id: linkedId },
          data: {
            name: data.label ?? existing.label,
            slug,
            isVisible: data.isVisible ?? existing.isVisible,
          },
        });
      } else {
        const category = await prisma.category.upsert({
          where: { slug },
          update: {
            name: data.label ?? existing.label,
            isVisible: data.isVisible ?? true,
          },
          create: {
            name: data.label ?? existing.label,
            slug,
            isVisible: data.isVisible ?? true,
            order: existing.order ?? 0,
          },
        });
        linkedId = category.id;
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
        linkedId,
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
    if (existing?.linkType === "category" && existing.linkedId) {
      await prisma.category.update({
        where: { id: existing.linkedId },
        data: { isVisible: false },
      });
    }
    if (existing?.linkType === "community") {
      const boards = await prisma.board.findMany({ where: { menuItemId: existing.id } });
      if (boards.length > 0) {
        const boardKeys = boards.map((board) => board.key);
        const postCount = await prisma.post.count({
          where: { type: { in: boardKeys } },
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
      select: { id: true, linkType: true, linkedId: true },
    });
    const orderMap = new Map(items.map((item: { id: string; order: number }) => [item.id, item.order]));
    const categoryUpdates = linkedItems
      .filter((item) => item.linkType === "category" && item.linkedId)
      .map((item) =>
        prisma.category.update({
          where: { id: item.linkedId as string },
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
