import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { ConfirmForm, type ConfirmActionState } from "@/components/admin/confirm-form";
import { auth } from "@/auth";
import { Eye, EyeOff, Pencil, Trash2, Package, Plus } from "lucide-react";

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

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

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
          <div className="text-xs text-gray-500">
            총 {products.length}개의 상품
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        {/* 상품 목록 */}
        <div className="divide-y divide-gray-100">
          {products.map((product) => (
            <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {/* 상품 정보 */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-lg ${product.isVisible ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{product.category}</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-400">{format(product.createdAt, "yyyy-MM-dd")}</span>
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
                    className="p-1.5 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <ConfirmForm
                    action={deleteProduct}
                    message="상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                    hiddenFields={{ productId: product.id }}
                  >
                    <button
                      type="submit"
                      className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            </div>
          ))}
        </div>

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
