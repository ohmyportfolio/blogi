import { prisma } from "@/lib/prisma";
import { TagManagementClient } from "@/components/admin/tag-management-client";

export default async function AdminTagsPage() {
    const [categories, globalTags] = await Promise.all([
        prisma.category.findMany({
            where: { isVisible: true },
            orderBy: { order: "asc" },
            select: {
                id: true,
                name: true,
                slug: true,
                tagFilterEnabled: true,
                tags: {
                    orderBy: { order: "asc" },
                    select: { id: true, name: true, slug: true, order: true, categoryId: true },
                },
            },
        }),
        prisma.tag.findMany({
            where: { categoryId: null },
            orderBy: { order: "asc" },
            select: { id: true, name: true, slug: true, order: true, categoryId: true },
        }),
    ]);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
                <h1 className="font-display text-2xl md:text-3xl">태그 관리</h1>
                <p className="text-sm text-gray-500 mt-2">
                    글로벌 태그와 카테고리 전용 태그를 관리합니다. 카테고리별 태그 필터 활성화 여부도 여기에서 설정할 수 있습니다.
                </p>
            </div>
            <TagManagementClient
                categories={categories}
                initialGlobalTags={globalTags}
            />
        </div>
    );
}
