import { prisma } from "@/lib/prisma";
import { extractCommunitySlug } from "@/lib/community";
import { CommunityManager } from "@/components/admin/community-manager";

export default async function AdminCommunitySettingsPage() {
  const menu = await prisma.menu.findUnique({ where: { key: "main" } });
  const communityItems = menu
    ? await prisma.menuItem.findMany({
        where: { menuId: menu.id, linkType: "community" },
        orderBy: { order: "asc" },
        include: {
          boards: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
          },
        },
      })
    : [];

  const groups = communityItems.map((item) => ({
    menuItemId: item.id,
    label: item.label,
    href: item.href,
    slug: extractCommunitySlug(item.href, item.label),
    order: item.order ?? 0,
    isVisible: item.isVisible ?? true,
    thumbnailUrl: item.thumbnailUrl ?? null,
    boards: item.boards.map((board) => ({
      id: board.id,
      key: board.key,
      slug: board.slug,
      menuItemId: board.menuItemId,
      name: board.name,
      description: board.description,
      order: board.order,
      isVisible: board.isVisible,
    })),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">커뮤니티 관리</h1>
          <p className="text-sm text-gray-500 mt-2">
            커뮤니티 그룹 썸네일과 게시판 구성을 관리합니다.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            그룹 생성/정렬은 메뉴 관리에서 진행합니다.
          </p>
        </div>
      </div>

      <CommunityManager initialGroups={groups} />
    </div>
  );
}
