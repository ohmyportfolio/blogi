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
    const productId = formData.get("productId") as string;
    const nextVisible = formData.get("nextVisible") === "true";
    if (!productId) {
      return { error: "유효하지 않은 상품입니다." };
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isVisible: nextVisible },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { error: "노출 상태 변경 중 오류가 발생했습니다." };
  }
}

async function deleteProduct(_: ConfirmActionState, formData: FormData): Promise<ConfirmActionState> {
  "use server";
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "관리자 권한이 필요합니다." };
    }
    const productId = formData.get("productId") as string;
    if (!productId) {
      return { error: "유효하지 않은 상품입니다." };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch {
    return { error: "삭제 처리 중 오류가 발생했습니다." };
  }
}

export default async function AdminProductsPage({
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
      const isProductHref = href.startsWith("/products/") || href.startsWith("products/");
      // community, external 제외하고 모든 상품 카테고리 포함
      if (item.linkType === "community" || item.linkType === "external") return false;
      return item.linkType === "category" || isProductHref;
    })
    .map((item, index) => {
      const href = item.href ?? "";
      const slug = href.startsWith("/products/")
        ? href.replace("/products/", "")
        : href.startsWith("products/")
        ? href.replace("products/", "")
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

  // 상품 조회 (카테고리 필터는 Category.id 기준)
  const selectedCategoryRecord = categoryRecordBySlug.get(selectedCategory);
  const products = await prisma.product.findMany({
    where: selectedCategory !== "all"
      ? selectedCategoryRecord
        ? { categoryId: selectedCategoryRecord.id }
        : { id: { in: [] } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { categoryRef: true },
  });

  // 카테고리별 상품 수 집계
  const categoryCounts = await prisma.product.groupBy({
    by: ["categoryId"],
    _count: { id: true },
  });

  // 카테고리별 상품 수 집계
  const countByCategory: Record<string, number> = {};
  categoryCounts.forEach((c) => {
    if (!c.categoryId) return;
    const slug = categoryById.get(c.categoryId)?.slug;
    if (!slug) return;
    countByCategory[slug] = (countByCategory[slug] || 0) + c._count.id;
  });

  // 상품 카테고리를 슬러그로 변환하는 헬퍼
  const getProductCategorySlug = (categoryRef?: { slug?: string | null }) => categoryRef?.slug ?? "";
  const getCategoryLabel = (slug: string, fallback?: string) =>
    categoryBySlug.get(slug)?.label || fallback || slug;

  const productsByCategory = products.reduce<Record<string, typeof products>>((acc, product) => {
    const slug = getProductCategorySlug(product.categoryRef ?? undefined);
    if (!acc[slug]) acc[slug] = [];
    acc[slug].push(product);
    return acc;
  }, {});

  const menuCategorySections = filterCategories.map((menu) => {
    const slug = menu.slug;
    return {
      slug,
      label: menu.label,
      products: productsByCategory[slug] ?? [],
    };
  });
  const assignedSlugs = new Set(menuCategorySections.map((section) => section.slug));
  const otherProducts = products.filter(
    (product) => !assignedSlugs.has(getProductCategorySlug(product.categoryRef ?? undefined))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">상품 관리</h1>
            <p className="text-sm text-gray-500 mt-2">
              상품을 추가하고 노출 상태를 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 상품 추가
            </Link>
            <div className="text-xs text-gray-500">
              총 {products.length}개의 상품
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
            href="/admin/products"
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
                href={`/admin/products?category=${slug}`}
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
        {/* 상품 목록 */}
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {selectedCategory !== "all"
              ? "해당 카테고리에 상품이 없습니다."
              : "등록된 상품이 없습니다."}
          </div>
        ) : selectedCategory === "all" && menuCategories.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {menuCategorySections.map((section) => (
              <div key={section.slug} className="bg-white">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70">
                  <div className="text-sm font-medium text-gray-700">{section.label}</div>
                  <div className="text-xs text-gray-400">{section.products.length}개</div>
                </div>
                {section.products.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-400">
                    해당 메뉴에 등록된 상품이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {section.products.map((product) => (
                      <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                          {/* 상품 썸네일 + 정보 */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* 썸네일 */}
                            <div className="flex-shrink-0">
                              <div
                                className={`relative w-12 h-12 rounded-lg overflow-hidden border ${
                                  product.isVisible ? "border-green-200" : "border-gray-200"
                                }`}
                              >
                                {product.imageUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={product.imageUrl}
                                    alt={product.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                  </div>
                                )}
                                {!product.isVisible && (
                                  <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                                    <EyeOff className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{product.title}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  {getCategoryLabel(
                                    getProductCategorySlug(product.categoryRef ?? undefined),
                                    product.categoryRef?.name || "미분류"
                                  )}
                                </span>
                                <span className="text-xs text-gray-400">{format(product.createdAt, "yyyy-MM-dd")}</span>
                                {product.price && (
                                  <span className="text-xs text-gray-500 font-medium">{product.price}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 액션 버튼들 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <ConfirmForm
                              action={toggleVisibility}
                              message={`상품을 ${product.isVisible ? "숨김" : "노출"} 처리할까요?`}
                              hiddenFields={{
                                productId: product.id,
                                nextVisible: (!product.isVisible).toString(),
                              }}
                            >
                              <button
                                type="submit"
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                  product.isVisible
                                    ? "text-green-600 bg-green-50 hover:bg-green-100"
                                    : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                {product.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                {product.isVisible ? "노출" : "숨김"}
                              </button>
                            </ConfirmForm>

                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </Link>

                            <ConfirmForm
                              action={deleteProduct}
                              message="상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                              hiddenFields={{ productId: product.id }}
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
            {otherProducts.length > 0 && (
              <div className="bg-white">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70">
                  <div className="text-sm font-medium text-gray-700">기타</div>
                  <div className="text-xs text-gray-400">{otherProducts.length}개</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {otherProducts.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        {/* 상품 썸네일 + 정보 */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* 썸네일 */}
                          <div className="flex-shrink-0">
                            <div
                              className={`relative w-12 h-12 rounded-lg overflow-hidden border ${
                                product.isVisible ? "border-green-200" : "border-gray-200"
                              }`}
                            >
                              {product.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <ImageIcon className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                              {!product.isVisible && (
                                <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                                  <EyeOff className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{product.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                {getCategoryLabel(
                                  getProductCategorySlug(product.categoryRef ?? undefined),
                                  product.categoryRef?.name || "미분류"
                                )}
                              </span>
                              <span className="text-xs text-gray-400">{format(product.createdAt, "yyyy-MM-dd")}</span>
                              {product.price && (
                                <span className="text-xs text-gray-500 font-medium">{product.price}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <ConfirmForm
                            action={toggleVisibility}
                            message={`상품을 ${product.isVisible ? "숨김" : "노출"} 처리할까요?`}
                            hiddenFields={{
                              productId: product.id,
                              nextVisible: (!product.isVisible).toString(),
                            }}
                          >
                            <button
                              type="submit"
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                product.isVisible
                                  ? "text-green-600 bg-green-50 hover:bg-green-100"
                                  : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                              }`}
                            >
                              {product.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {product.isVisible ? "노출" : "숨김"}
                            </button>
                          </ConfirmForm>

                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            수정
                          </Link>

                          <ConfirmForm
                            action={deleteProduct}
                            message="상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                            hiddenFields={{ productId: product.id }}
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
            {products.map((product) => (
              <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  {/* 상품 썸네일 + 정보 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 썸네일 */}
                    <div className="flex-shrink-0">
                      <div
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border ${
                          product.isVisible ? "border-green-200" : "border-gray-200"
                        }`}
                      >
                        {product.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        {!product.isVisible && (
                          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                            <EyeOff className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                            selectedCategory === getProductCategorySlug(product.categoryRef ?? undefined)
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getCategoryLabel(
                            getProductCategorySlug(product.categoryRef ?? undefined),
                            product.categoryRef?.name || "미분류"
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{format(product.createdAt, "yyyy-MM-dd")}</span>
                        {product.price && (
                          <span className="text-xs text-gray-500 font-medium">{product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <ConfirmForm
                      action={toggleVisibility}
                      message={`상품을 ${product.isVisible ? "숨김" : "노출"} 처리할까요?`}
                      hiddenFields={{
                        productId: product.id,
                        nextVisible: (!product.isVisible).toString(),
                      }}
                    >
                      <button
                        type="submit"
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          product.isVisible
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {product.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {product.isVisible ? "노출" : "숨김"}
                      </button>
                    </ConfirmForm>

                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </Link>

                    <ConfirmForm
                      action={deleteProduct}
                      message="상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                      hiddenFields={{ productId: product.id }}
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

        {/* 상품 추가 버튼 */}
        <div className="border-t border-dashed border-gray-200">
          <Link
            href="/admin/products/new"
            className="w-full p-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 상품 추가
          </Link>
        </div>
      </div>
    </div>
  );
}
