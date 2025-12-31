import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { ConfirmForm, type ConfirmActionState } from "@/components/admin/confirm-form";
import { auth } from "@/auth";
import { Eye, EyeOff, Pencil, Trash2, ImageIcon, Plus, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

async function toggleVisibility(_: ConfirmActionState, formData: FormData): Promise<ConfirmActionState> {
  "use server";
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "관리자 권한이 필요합니다." };
    }
    const contentId = formData.get("contentId") as string;
    const nextVisible = formData.get("nextVisible") === "true";
    if (!contentId) {
      return { error: "유효하지 않은 콘텐츠입니다." };
    }

    await prisma.content.update({
      where: { id: contentId },
      data: { isVisible: nextVisible },
    });

    revalidatePath("/admin/contents");
    return { success: true };
  } catch {
    return { error: "노출 상태 변경 중 오류가 발생했습니다." };
  }
}

async function deleteContent(_: ConfirmActionState, formData: FormData): Promise<ConfirmActionState> {
  "use server";
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "관리자 권한이 필요합니다." };
    }
    const contentId = formData.get("contentId") as string;
    if (!contentId) {
      return { error: "유효하지 않은 콘텐츠입니다." };
    }

    await prisma.content.delete({
      where: { id: contentId },
    });

    revalidatePath("/admin/contents");
    return { success: true };
  } catch {
    return { error: "삭제 처리 중 오류가 발생했습니다." };
  }
}

export default async function AdminContentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const params = await searchParams;
  const selectedCategory =
    (Array.isArray(params.category) ? params.category[0] : params.category) || "all";

  // 메뉴 관리에서 설정한 카테고리 타입 메뉴 항목 가져오기
  const mainMenu = await prisma.menu.findUnique({
    where: { key: "main" },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
  });

  const menuCategories = (mainMenu?.items ?? [])
    .filter((item) => {
      const href = item.href ?? "";
      const isContentHref = href.startsWith("/contents/") || href.startsWith("contents/");
      // community, external 제외하고 모든 콘텐츠 카테고리 포함
      if (item.linkType === "community" || item.linkType === "external") return false;
      return item.linkType === "category" || isContentHref;
    })
    .map((item, index) => {
      const href = item.href ?? "";
      const slug = href.startsWith("/contents/")
        ? href.replace("/contents/", "")
        : href.startsWith("contents/")
        ? href.replace("contents/", "")
        : "";
      return {
        id: item.id,
        label: item.label,
        slug,
        order: item.order ?? index + 1,
      };
    })
    .filter((item) => item.slug);

  // 메뉴에 있는 카테고리만 필터에 표시 (메뉴가 기준)
  const filterCategories = menuCategories;

  const categoryBySlug = new Map(filterCategories.map((item) => [item.slug, item]));
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const categoryRecordBySlug = new Map(categories.map((item) => [item.slug, item]));

  // 콘텐츠 조회 (카테고리 필터는 Category.id 기준)
  const selectedCategoryRecord = categoryRecordBySlug.get(selectedCategory);
  const contents = await prisma.content.findMany({
    where: selectedCategory !== "all"
      ? selectedCategoryRecord
        ? { categoryId: selectedCategoryRecord.id }
        : { id: { in: [] } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { categoryRef: true },
  });

  // 카테고리별 콘텐츠 수 집계
  const categoryCounts = await prisma.content.groupBy({
    by: ["categoryId"],
    _count: { id: true },
  });

  // 카테고리별 콘텐츠 수 집계
  const countByCategory: Record<string, number> = {};
  categoryCounts.forEach((c) => {
    if (!c.categoryId) return;
    const slug = categoryById.get(c.categoryId)?.slug;
    if (!slug) return;
    countByCategory[slug] = (countByCategory[slug] || 0) + c._count.id;
  });

  // 콘텐츠 카테고리를 슬러그로 변환하는 헬퍼
  const getContentCategorySlug = (categoryRef?: { slug?: string | null }) => categoryRef?.slug ?? "";
  const getCategoryLabel = (slug: string, fallback?: string) =>
    categoryBySlug.get(slug)?.label || fallback || slug;

  const contentsByCategory = contents.reduce<Record<string, typeof contents>>((acc, content) => {
    const slug = getContentCategorySlug(content.categoryRef ?? undefined);
    if (!acc[slug]) acc[slug] = [];
    acc[slug].push(content);
    return acc;
  }, {});

  const menuCategorySections = filterCategories.map((menu) => {
    const slug = menu.slug;
    return {
      slug,
      label: menu.label,
      contents: contentsByCategory[slug] ?? [],
    };
  });
  const assignedSlugs = new Set(menuCategorySections.map((section) => section.slug));
  const otherContents = contents.filter(
    (content) => !assignedSlugs.has(getContentCategorySlug(content.categoryRef ?? undefined))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">콘텐츠 관리</h1>
            <p className="text-sm text-gray-500 mt-2">
              콘텐츠를 작성하고 노출 상태를 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/admin/contents/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              콘텐츠 작성
            </Link>
            <div className="text-xs text-gray-500">
              총 {contents.length}개의 콘텐츠
              {selectedCategory !== "all" && (
                <span className="ml-1 text-blue-500">
                  ({getCategoryLabel(selectedCategory, selectedCategory)} 필터 적용)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 (메뉴 관리 기준) */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">카테고리 필터</span>
          <span className="text-xs text-gray-400">(메뉴 관리에서 설정한 순서)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/contents"
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            전체 ({Object.values(countByCategory).reduce((a, b) => a + b, 0)})
          </Link>
          {filterCategories.map((menu) => {
            const slug = menu.slug;
            return (
              <Link
                key={`${menu.id}-${slug}`}
                href={`/admin/contents?category=${slug}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === slug
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {menu.label} ({countByCategory[slug] || 0})
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {/* 콘텐츠 목록 */}
        {contents.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {selectedCategory !== "all"
              ? "해당 카테고리에 콘텐츠가 없습니다."
              : "등록된 콘텐츠가 없습니다."}
          </div>
        ) : selectedCategory === "all" && menuCategories.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {menuCategorySections.map((section) => (
              <div key={section.slug} className="bg-white">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70">
                  <div className="text-sm font-medium text-gray-700">{section.label}</div>
                  <div className="text-xs text-gray-400">{section.contents.length}개</div>
                </div>
                {section.contents.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    해당 메뉴에 등록된 콘텐츠가 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {section.contents.map((content) => (
                      <div key={content.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          {/* 콘텐츠 썸네일 + 정보 */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* 썸네일 */}
                            <div className="flex-shrink-0">
                              <div
                                className={`relative w-12 h-12 rounded-lg overflow-hidden border ${
                                  content.isVisible ? "border-green-200" : "border-gray-200"
                                }`}
                              >
                                {content.imageUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={content.imageUrl}
                                    alt={content.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                                {!content.isVisible && (
                                  <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                                    <EyeOff className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{content.title}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  {getCategoryLabel(
                                    getContentCategorySlug(content.categoryRef ?? undefined),
                                    content.categoryRef?.name || "미분류"
                                  )}
                                </span>
                                <span className="text-xs text-gray-400">{format(content.createdAt, "yyyy-MM-dd")}</span>
                                {content.price && (
                                  <span className="text-xs text-gray-500 font-medium">{content.price}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 액션 버튼들 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <ConfirmForm
                              action={toggleVisibility}
                              message={`콘텐츠를 ${content.isVisible ? "숨김" : "노출"} 처리할까요?`}
                              hiddenFields={{
                                contentId: content.id,
                                nextVisible: (!content.isVisible).toString(),
                              }}
                            >
                              <button
                                type="submit"
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  content.isVisible
                                    ? "text-green-600 bg-green-50 hover:bg-green-100"
                                    : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                {content.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                {content.isVisible ? "노출" : "숨김"}
                              </button>
                            </ConfirmForm>

                            <Link
                              href={`/admin/contents/${content.id}/edit`}
                              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </Link>

                            <ConfirmForm
                              action={deleteContent}
                              message="콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                              hiddenFields={{ contentId: content.id }}
                            >
                              <button
                                type="submit"
                                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                삭제
                              </button>
                            </ConfirmForm>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {otherContents.length > 0 && (
              <div className="bg-white">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70">
                  <div className="text-sm font-medium text-gray-700">기타</div>
                  <div className="text-xs text-gray-400">{otherContents.length}개</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {otherContents.map((content) => (
                    <div key={content.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        {/* 콘텐츠 썸네일 + 정보 */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 썸네일 */}
                          <div className="flex-shrink-0">
                            <div
                              className={`relative w-12 h-12 rounded-lg overflow-hidden border ${
                                content.isVisible ? "border-green-200" : "border-gray-200"
                              }`}
                            >
                              {content.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={content.imageUrl}
                                  alt={content.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <ImageIcon className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                              {!content.isVisible && (
                                <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                                  <EyeOff className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{content.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                {getCategoryLabel(
                                  getContentCategorySlug(content.categoryRef ?? undefined),
                                  content.categoryRef?.name || "미분류"
                                )}
                              </span>
                              <span className="text-xs text-gray-400">{format(content.createdAt, "yyyy-MM-dd")}</span>
                              {content.price && (
                                <span className="text-xs text-gray-500 font-medium">{content.price}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <ConfirmForm
                            action={toggleVisibility}
                            message={`콘텐츠를 ${content.isVisible ? "숨김" : "노출"} 처리할까요?`}
                            hiddenFields={{
                              contentId: content.id,
                              nextVisible: (!content.isVisible).toString(),
                            }}
                          >
                            <button
                              type="submit"
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                content.isVisible
                                  ? "text-green-600 bg-green-50 hover:bg-green-100"
                                  : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                              }`}
                            >
                              {content.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {content.isVisible ? "노출" : "숨김"}
                            </button>
                          </ConfirmForm>

                          <Link
                            href={`/admin/contents/${content.id}/edit`}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            수정
                          </Link>

                          <ConfirmForm
                            action={deleteContent}
                            message="콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                            hiddenFields={{ contentId: content.id }}
                          >
                            <button
                              type="submit"
                              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              삭제
                            </button>
                          </ConfirmForm>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {contents.map((content) => (
              <div key={content.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  {/* 콘텐츠 썸네일 + 정보 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 썸네일 */}
                    <div className="flex-shrink-0">
                      <div
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border ${
                          content.isVisible ? "border-green-200" : "border-gray-200"
                        }`}
                      >
                        {content.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={content.imageUrl}
                            alt={content.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        {!content.isVisible && (
                          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                            <EyeOff className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{content.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                            selectedCategory === getContentCategorySlug(content.categoryRef ?? undefined)
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getCategoryLabel(
                            getContentCategorySlug(content.categoryRef ?? undefined),
                            content.categoryRef?.name || "미분류"
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{format(content.createdAt, "yyyy-MM-dd")}</span>
                        {content.price && (
                          <span className="text-xs text-gray-500 font-medium">{content.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <ConfirmForm
                      action={toggleVisibility}
                      message={`콘텐츠를 ${content.isVisible ? "숨김" : "노출"} 처리할까요?`}
                      hiddenFields={{
                        contentId: content.id,
                        nextVisible: (!content.isVisible).toString(),
                      }}
                    >
                      <button
                        type="submit"
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          content.isVisible
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {content.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {content.isVisible ? "노출" : "숨김"}
                      </button>
                    </ConfirmForm>

                    <Link
                      href={`/admin/contents/${content.id}/edit`}
                      className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </Link>

                    <ConfirmForm
                      action={deleteContent}
                      message="콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                      hiddenFields={{ contentId: content.id }}
                    >
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 콘텐츠 추가 버튼 */}
        <div className="border-t border-dashed border-gray-200">
          <Link
            href="/admin/contents/new"
            className="w-full p-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            콘텐츠 작성
          </Link>
        </div>
      </div>
    </div>
  );
}
