import { prisma } from "@/lib/prisma";
import { MenuManager } from "@/components/admin/menu-manager";
import { DEFAULT_MAIN_MENU } from "@/lib/menus";
import { getSiteSettings } from "@/lib/site-settings";

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
  const [mainMenu, siteSettings] = await Promise.all([
    prisma.menu.upsert({
      where: { key: "main" },
      update: {},
      create: { key: "main", name: "Main" },
    }),
    getSiteSettings(),
  ]);

  const mainCount = await prisma.menuItem.count({ where: { menuId: mainMenu.id } });

  if (mainCount === 0) {
    await seedMenuItems(mainMenu.id, DEFAULT_MAIN_MENU);
  }

  const rawMainItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id },
    orderBy: { order: "asc" },
    include: { boards: { orderBy: { order: "asc" } } },
  });

  const mainItems = rawMainItems.map((item) => ({
    ...item,
    boards: item.boards?.map((board) => ({
      id: board.id,
      key: board.key,
      slug: board.slug,
      menuItemId: board.menuItemId,
      name: board.name,
      description: board.description,
      order: board.order,
      isVisible: board.isVisible,
    })),
    linkType:
      item.linkType === "category" || item.linkType === "community"
        ? (item.linkType as "category" | "community")
        : item.href?.startsWith("/community")
          ? ("community" as const)
          : ("category" as const),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">메뉴 관리</h1>
            <p className="text-sm text-gray-500 mt-2">
              모바일 우선 기준으로 메뉴를 구성하세요. 로그인 필요 메뉴는 안내 토스트가 표시됩니다.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              메뉴 유형은 상품 카테고리 또는 커뮤니티로 설정할 수 있습니다.
            </p>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>정렬 변경 후 꼭 ‘정렬 저장’을 눌러주세요.</div>
            <div>커뮤니티는 그룹 단위로 게시판을 추가합니다.</div>
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
          communityEnabled={siteSettings.communityEnabled}
        />
    </div>
  );
}
