import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMenuByKey } from "@/lib/menus";
import BoardHomeSettingsClient from "@/components/admin/board-home-settings-client";

export default async function AdminBoardSettingsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/");
  }

  // 커뮤니티 메뉴 가져오기
  const menu = await getMenuByKey("main");
  const communityItems = menu.items.filter(
    (item) => item.linkType === "community" && item.href
  );

  // 각 커뮤니티 그룹의 게시판 정보 가져오기
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h1 className="font-display text-2xl">게시판 메인 노출 설정</h1>
        <p className="text-sm text-gray-500 mt-2">
          메인 페이지에 표시할 게시판과 최신 글 개수를 설정합니다.
        </p>
      </div>

      <BoardHomeSettingsClient initialGroups={groups} />
    </div>
  );
}
