import { prisma } from "@/lib/prisma";
import { ContentTrashManager } from "@/components/admin/content-trash-manager";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminContentsTrashPage() {
  const deletedContents = await prisma.content.findMany({
    where: { isDeleted: true },
    include: {
      categoryRef: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { deletedAt: "desc" },
  });

  const contents = deletedContents.map((content) => ({
    id: content.id,
    title: content.title,
    categoryName: content.categoryRef?.name ?? "미분류",
    categorySlug: content.categoryRef?.slug ?? "",
    imageUrl: content.imageUrl,
    contentMarkdown: content.contentMarkdown ?? "",
    price: content.price ?? "",
    deletedAt: content.deletedAt ? format(content.deletedAt, "yyyy.MM.dd HH:mm", { locale: ko }) : "",
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">콘텐츠 휴지통</h1>
            <p className="text-sm text-gray-500 mt-2">
              삭제된 콘텐츠를 복구하거나 영구 삭제할 수 있습니다.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              영구 삭제 시 해당 콘텐츠는 완전히 삭제되며 복구할 수 없습니다.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {contents.length}개 항목
          </div>
        </div>
      </div>

      <ContentTrashManager contents={contents} />
    </div>
  );
}
