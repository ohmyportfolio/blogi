import { prisma } from "@/lib/prisma";
import { MenuManager } from "@/components/admin/menu-manager";
import { DEFAULT_MAIN_MENU } from "@/lib/menus";

const seedMenuItems = async (menuId: string, items: typeof DEFAULT_MAIN_MENU) => {
  for (const [index, item] of items.entries()) {
    let linkedCategoryId: string | null = null;

    // 카테고리 타입인 경우 Category 생성 및 linkedCategoryId 연결
    if (item.linkType === "category" && item.href) {
      const slug = item.href.replace("/contents/", "");
      if (slug) {
        const category = await prisma.category.upsert({
          where: { slug },
          update: {
            name: item.label,
            order: item.order ?? index + 1,
            requiresAuth: item.requiresAuth ?? false,
          },
          create: {
            name: item.label,
            slug,
            order: item.order ?? index + 1,
            isVisible: true,
            requiresAuth: item.requiresAuth ?? false,
          },
        });
        linkedCategoryId = category.id;
      }
    }

    await prisma.menuItem.create({
      data: {
        menuId,
        label: item.label,
        href: item.href,
        order: item.order ?? index + 1,
        isVisible: item.isVisible ?? true,
        isExternal: item.isExternal ?? false,
        openInNew: item.openInNew ?? false,
        requiresAuth: item.requiresAuth ?? false,
        badgeText: item.badgeText ?? null,
        linkType: item.linkType ?? "category",
        linkedCategoryId,
      },
    });
  }
};

const ensureCategoryMenuItems = async (menuId: string) => {
  const count = await prisma.menuItem.count({
    where: { menuId, linkType: "category" },
  });
  if (count > 0) return;

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });
  if (categories.length === 0) return;

  const existingOrders = await prisma.menuItem.findMany({
    where: { menuId },
    select: { order: true },
  });
  const maxOrder = existingOrders.reduce((acc, item) => Math.max(acc, item.order), 0);

  await prisma.menuItem.createMany({
    data: categories.map((category, index) => ({
      menuId,
      label: category.name,
      href: `/contents/${category.slug}`,
      order: category.order > 0 ? category.order : maxOrder + index + 1,
      isVisible: category.isVisible,
      isExternal: false,
      openInNew: false,
      requiresAuth: category.requiresAuth ?? false,
      badgeText: null,
      linkType: "category",
      linkedCategoryId: category.id,
    })),
  });
};

export default async function AdminMenusPage() {
  const mainMenu = await prisma.menu.upsert({
    where: { key: "main" },
    update: {},
    create: { key: "main", name: "Main" },
  });

  const mainCount = await prisma.menuItem.count({ where: { menuId: mainMenu.id } });

  if (mainCount === 0) {
    await seedMenuItems(mainMenu.id, DEFAULT_MAIN_MENU);
  }
  await ensureCategoryMenuItems(mainMenu.id);

  const rawMainItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id },
    orderBy: { order: "asc" },
  });

  const mainItems = rawMainItems.map((item) => ({
    ...item,
    linkType:
      item.linkType === "category" || item.linkType === "community" || item.linkType === "external"
        ? (item.linkType as "category" | "community" | "external")
        : item.href?.startsWith("http")
          ? ("external" as const)
          : item.href?.startsWith("/community")
            ? ("community" as const)
            : ("category" as const),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">메뉴 관리</h1>
            <p className="text-sm text-gray-500 mt-2">
              모바일 우선 기준으로 메뉴를 구성하세요. 로그인 필요 메뉴는 안내 토스트가 표시됩니다.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              메뉴 유형은 콘텐츠 카테고리 또는 커뮤니티로 설정할 수 있습니다.
            </p>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>커뮤니티 게시판/그룹 썸네일은 커뮤니티 관리에서 설정합니다.</div>
            <div>카테고리 썸네일/설명은 콘텐츠 표시 설정에서 관리합니다.</div>
          </div>
        </div>
      </div>

      <MenuManager
          menus={[
            {
              key: "main",
              name: "메인 메뉴",
              items: mainItems,
            },
          ]}
        />
    </div>
  );
}
