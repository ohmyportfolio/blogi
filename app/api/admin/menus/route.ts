import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { menuKey, data } = body;
    if (!menuKey || !data?.label || !data?.href) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다" }, { status: 400 });
    }
    const menu = await getOrCreateMenu(menuKey, menuKey === "footer" ? "Footer" : "Main");
    const item = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        label: data.label,
        href: data.href,
        order: data.order ?? 0,
        isVisible: data.isVisible ?? true,
        isExternal: data.isExternal ?? false,
        openInNew: data.openInNew ?? false,
        requiresAuth: data.requiresAuth ?? false,
        badgeText: data.badgeText || null,
      },
    });
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    return NextResponse.json(item, { status: 201 });
  }

  if (action === "update") {
    const { id, data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        label: data.label,
        href: data.href,
        isVisible: data.isVisible,
        isExternal: data.isExternal,
        openInNew: data.openInNew,
        requiresAuth: data.requiresAuth,
        badgeText: data.badgeText || null,
      },
    });
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    return NextResponse.json(item);
  }

  if (action === "delete") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  }

  if (action === "reorder") {
    const { menuKey, items } = body;
    if (!menuKey || !Array.isArray(items)) {
      return NextResponse.json({ error: "정렬 정보가 필요합니다" }, { status: 400 });
    }
    const menu = await getOrCreateMenu(menuKey, menuKey === "footer" ? "Footer" : "Main");
    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.menuItem.update({
          where: { id: item.id },
          data: { order: item.order, menuId: menu.id },
        })
      )
    );
    revalidatePath("/admin/menus");
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "지원하지 않는 동작입니다" }, { status: 400 });
}
