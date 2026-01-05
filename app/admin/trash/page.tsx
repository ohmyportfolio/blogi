import { prisma } from "@/lib/prisma";
import { TrashManager } from "@/components/admin/trash-manager";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  // 삭제된 게시판 조회 (최근 게시글 5개 포함)
  const deletedBoards = await prisma.board.findMany({
    where: { isDeleted: true },
    include: {
      menuItem: {
        select: { label: true },
      },
      _count: {
        select: { posts: true },
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { deletedAt: "desc" },
  });

  const boards = deletedBoards.map((board) => ({
    id: board.id,
    name: board.name,
    slug: board.slug,
    description: board.description ?? "",
    menuItemLabel: board.menuItem.label,
    postCount: board._count.posts,
    deletedAt: board.deletedAt ? format(board.deletedAt, "yyyy.MM.dd HH:mm", { locale: ko }) : "",
    recentPosts: board.posts.map((post) => ({
      id: post.id,
      title: post.title,
      authorName: post.author?.name ?? "익명",
      createdAt: format(post.createdAt, "MM.dd", { locale: ko }),
    })),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">게시판 휴지통</h1>
            <p className="text-sm text-gray-500 mt-2">
              삭제된 게시판을 복구하거나 영구 삭제할 수 있습니다.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              영구 삭제 시 해당 게시판의 모든 게시글도 함께 삭제됩니다.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {boards.length}개 항목
          </div>
        </div>
      </div>

      <TrashManager boards={boards} />
    </div>
  );
}
