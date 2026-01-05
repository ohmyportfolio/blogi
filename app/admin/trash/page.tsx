import { prisma } from "@/lib/prisma";
import { TrashManager } from "@/components/admin/trash-manager";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  // 삭제된 게시판 조회
  const deletedBoards = await prisma.board.findMany({
    where: { isDeleted: true },
    include: {
      menuItem: {
        select: { label: true },
      },
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { deletedAt: "desc" },
  });

  const boards = deletedBoards.map((board) => ({
    id: board.id,
    name: board.name,
    slug: board.slug,
    menuItemLabel: board.menuItem.label,
    postCount: board._count.posts,
    deletedAt: board.deletedAt ? format(board.deletedAt, "yyyy.MM.dd HH:mm", { locale: ko }) : "",
  }));

  // 삭제된 콘텐츠 조회
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
    deletedAt: content.deletedAt ? format(content.deletedAt, "yyyy.MM.dd HH:mm", { locale: ko }) : "",
  }));

  const totalItems = boards.length + contents.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">휴지통</h1>
            <p className="text-sm text-gray-500 mt-2">
              삭제된 게시판과 콘텐츠를 복구하거나 영구 삭제할 수 있습니다.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              영구 삭제 시 해당 항목은 완전히 삭제되며 복구할 수 없습니다.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            게시판 {boards.length}개, 콘텐츠 {contents.length}개
          </div>
        </div>
      </div>

      <TrashManager boards={boards} contents={contents} />
    </div>
  );
}
