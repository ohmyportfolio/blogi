import { prisma } from "@/lib/prisma";
import { getMenuByKey } from "@/lib/menus";
import BoardHomeSettingsClient from "@/components/admin/board-home-settings-client";
import CategoryHomeSettingsClient from "@/components/admin/category-home-settings-client";
import MobileDashboardToggle from "@/components/admin/mobile-dashboard-toggle";
import HomeGridLayoutClient from "@/components/admin/home-grid-layout-client";

export default async function AdminHomeSettingsPage() {
  const [categories, menu, siteSettings] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        showOnHome: true,
        homeItemCount: true,
        requiresAuth: true,
      },
    }),
    getMenuByKey("main"),
    prisma.siteSettings.findUnique({
      where: { key: "default" },
      select: { showHomeDashboardOnMobile: true, homeGridLayout: true },
    }),
  ]);

  const communityItems = menu.items.filter(
    (item) => item.linkType === "community" && item.href
  );

  const groups = await Promise.all(
    communityItems.map(async (item) => {
      const boards = await prisma.board.findMany({
        where: {
          menuItemId: item.id,
          isDeleted: false,
        },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          key: true,
          menuItemId: true,
          showOnHome: true,
          homeItemCount: true,
        },
      });

      return {
        menuItemId: item.id,
        label: item.label,
        href: item.href ?? "",
        slug: item.href?.replace("/community/", "") ?? "",
        order: item.order ?? 0,
        isVisible: item.isVisible ?? true,
        boards,
      };
    })
  );

  // 홈 메뉴 그리드용: 카테고리 + 커뮤니티 메뉴 이름 순서대로
  const menuCategories = menu.items
    .filter((item) => item.linkType === "category" && item.href)
    .map((item) => item.label);
  const menuCommunities = communityItems.map((item) => item.label);
  const allMenuNames = [...menuCategories, ...menuCommunities];

  const savedLayout = Array.isArray(siteSettings?.homeGridLayout)
    ? (siteSettings.homeGridLayout as number[])
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h1 className="font-display text-2xl">홈 노출 설정</h1>
        <p className="text-sm text-gray-500 mt-2">
          홈 페이지에 표시할 카테고리와 게시판을 설정합니다.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          카테고리 화면 구성은 카테고리 설정에서 관리합니다.
        </p>
      </div>

      <MobileDashboardToggle
        initialValue={siteSettings?.showHomeDashboardOnMobile ?? true}
      />

      {allMenuNames.length > 0 && (
        <HomeGridLayoutClient
          menuNames={allMenuNames}
          initialLayout={savedLayout}
        />
      )}

      <section className="space-y-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl">카테고리 최신 콘텐츠</h2>
          <p className="text-sm text-gray-500 mt-2">
            카테고리별 최신 콘텐츠 노출 여부와 개수를 설정합니다.
          </p>
        </div>
        <CategoryHomeSettingsClient initialCategories={categories} />
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl">게시판 최신 글</h2>
          <p className="text-sm text-gray-500 mt-2">
            게시판별 최신 글 노출 여부와 개수를 설정합니다.
          </p>
        </div>
        <BoardHomeSettingsClient initialGroups={groups} />
      </section>
    </div>
  );
}
