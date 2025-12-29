import { prisma } from "@/lib/prisma";
import { MenuManager } from "@/components/admin/menu-manager";
import { DEFAULT_MAIN_MENU } from "@/lib/menus";

const seedMenuItems = async (menuId: string, items: typeof DEFAULT_MAIN_MENU) => {
  await prisma.menuItem.createMany({
    data: items.map((item, index) => ({
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

  const rawMainItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id },
    orderBy: { order: "asc" },
  });

  const mainItems = rawMainItems.map((item) => ({
    ...item,
    linkType:
      item.linkType === "category" || item.linkType === "community"
        ? (item.linkType as "category" | "community")
        : item.href?.startsWith("/community")
          ? ("community" as const)
          : ("category" as const),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Menu Management</h1>
        <p className="text-sm text-gray-500 mt-2">
          모바일 우선 기준으로 메뉴를 구성하세요. 로그인 필요 메뉴는 안내 토스트가 표시됩니다.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          메뉴 유형을 상품 카테고리 또는 커뮤니티로 설정할 수 있습니다.
        </p>
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
