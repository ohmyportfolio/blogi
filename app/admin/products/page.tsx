import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

async function toggleVisibility(formData: FormData) {
    "use server";
    const productId = formData.get("productId") as string;
    const nextVisible = formData.get("nextVisible") === "true";

    await prisma.product.update({
        where: { id: productId },
        data: { isVisible: nextVisible },
    });

    revalidatePath("/admin/products");
}

async function deleteProduct(formData: FormData) {
    "use server";
    const productId = formData.get("productId") as string;

    await prisma.product.delete({
        where: { id: productId },
    });

    revalidatePath("/admin/products");
}

export default async function AdminProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="font-display text-3xl">Product Management</h1>
                <Button asChild>
                    <Link href="/admin/products/new">Add Product</Link>
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
                                    {product.isVisible ? "Visible" : "Hidden"}
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                {format(product.createdAt, "yyyy-MM-dd")}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                                </Button>
                                <form action={toggleVisibility}>
                                    <input type="hidden" name="productId" value={product.id} />
                                    <input
                                        type="hidden"
                                        name="nextVisible"
                                        value={(!product.isVisible).toString()}
                                    />
                                    <Button size="sm" variant="secondary">
                                        {product.isVisible ? "Hide" : "Show"}
                                    </Button>
                                </form>
                                <form action={deleteProduct}>
                                    <input type="hidden" name="productId" value={product.id} />
                                    <Button size="sm" variant="destructive">
                                        Delete
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="p-4">Title</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Visible</th>
                            <th className="p-4">Created At</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="border-t">
                                <td className="p-4 font-medium">{product.title}</td>
                                <td className="p-4">{product.category}</td>
                                <td className="p-4">{product.isVisible ? "Yes" : "No"}</td>
                                <td className="p-4">{format(product.createdAt, "yyyy-MM-dd")}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/admin/products/${product.id}/edit`}>
                                                Edit
                                            </Link>
                                        </Button>
                                        <form action={toggleVisibility}>
                                            <input type="hidden" name="productId" value={product.id} />
                                            <input
                                                type="hidden"
                                                name="nextVisible"
                                                value={(!product.isVisible).toString()}
                                            />
                                            <Button size="sm" variant="secondary">
                                                {product.isVisible ? "Hide" : "Show"}
                                            </Button>
                                        </form>
                                        <form action={deleteProduct}>
                                            <input type="hidden" name="productId" value={product.id} />
                                            <Button size="sm" variant="destructive">
                                                Delete
                                            </Button>
                                        </form>
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
