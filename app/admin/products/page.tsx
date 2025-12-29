import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { ConfirmForm, type ConfirmActionState } from "@/components/admin/confirm-form";
import { auth } from "@/auth";

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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-3xl">상품 관리</h1>
                <Button asChild>
                    <Link href="/admin/products/new">상품 추가</Link>
                </Button>
            </div>

            <div className="space-y-4 md:space-y-0">
                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-semibold">{product.title}</div>
                                    <div className="text-sm text-gray-500">{product.category}</div>
                                </div>
                                <div className="text-sm font-medium">
                                    {product.isVisible ? "노출" : "숨김"}
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                {format(product.createdAt, "yyyy-MM-dd")}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/admin/products/${product.id}/edit`}>수정</Link>
                                </Button>
                                <ConfirmForm
                                    action={toggleVisibility}
                                    message={`상품을 ${product.isVisible ? "숨김" : "노출"} 처리할까요?`}
                                    hiddenFields={{
                                        productId: product.id,
                                        nextVisible: (!product.isVisible).toString(),
                                    }}
                                >
                                    <Button size="sm" variant="secondary">
                                        {product.isVisible ? "숨김" : "노출"}
                                    </Button>
                                </ConfirmForm>
                                <ConfirmForm
                                    action={deleteProduct}
                                    message="상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                                    hiddenFields={{ productId: product.id }}
                                >
                                    <Button size="sm" variant="destructive">
                                        삭제
                                    </Button>
                                </ConfirmForm>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="p-4">상품명</th>
                                <th className="p-4">카테고리</th>
                                <th className="p-4">노출</th>
                                <th className="p-4">등록일</th>
                                <th className="p-4">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-t">
                                    <td className="p-4 font-medium">{product.title}</td>
                                    <td className="p-4">{product.category}</td>
                                    <td className="p-4">{product.isVisible ? "노출" : "숨김"}</td>
                                    <td className="p-4">{format(product.createdAt, "yyyy-MM-dd")}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/admin/products/${product.id}/edit`}>
                                                    수정
                                                </Link>
                                            </Button>
                                        <ConfirmForm
                                            action={toggleVisibility}
                                            message={`상품을 ${product.isVisible ? "숨김" : "노출"} 처리할까요?`}
                                            hiddenFields={{
                                                productId: product.id,
                                                nextVisible: (!product.isVisible).toString(),
                                            }}
                                        >
                                            <Button size="sm" variant="secondary">
                                                {product.isVisible ? "숨김" : "노출"}
                                            </Button>
                                        </ConfirmForm>
                                        <ConfirmForm
                                            action={deleteProduct}
                                            message="상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                                            hiddenFields={{ productId: product.id }}
                                        >
                                            <Button size="sm" variant="destructive">
                                                삭제
                                            </Button>
                                        </ConfirmForm>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
