import { prisma } from "@/lib/prisma";
import { CategorySettingsClient } from "@/components/admin/category-settings-client";

export default async function AdminCategorySettingsPage() {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnailUrl: true,
      description: true,
      listViewEnabled: true,
      listViewCount: true,
      listViewLabel: true,
      cardViewEnabled: true,
      cardViewCount: true,
      cardViewLabel: true,
      displayOrder: true,
      showDate: true,
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">카테고리 설정</h1>
          <p className="text-sm text-gray-500 mt-2">
            카테고리 썸네일/설명과 리스트형/카드형 표시 방식을 설정합니다.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            홈 화면 노출은 홈 노출 설정에서 관리합니다.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center">
          <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">
            메뉴 관리에서 카테고리를 먼저 추가해주세요.
          </p>
        </div>
      ) : (
        <CategorySettingsClient initialCategories={categories} />
      )}
    </div>
  );
}
