import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PostListView } from "@/app/community/post-list-view";
import { getCommunityGroupBySlug } from "@/lib/community";
import { getSiteSettings } from "@/lib/site-settings";

async function PostList({
  boardKey,
  groupSlug,
  boardSlug,
  sessionUserId,
  sessionRole,
  query,
  page,
  pageSize,
}: {
  boardKey: string;
  groupSlug: string;
  boardSlug: string;
  sessionUserId?: string | null;
  sessionRole?: string | null;
  query: string;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {
    type: { equals: boardKey, mode: "insensitive" },
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { contentMarkdown: { contains: query, mode: "insensitive" } },
    ];
  }

  const total = await prisma.post.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const viewPosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    authorName: post.author?.name || "Anonymous",
    authorId: post.authorId,
    createdAt: post.createdAt.toISOString(),
    commentCount: post._count.comments,
    viewCount: post.viewCount,
    isPinned: post.isPinned,
    isSecret: post.isSecret,
  }));

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(targetPage));
    return `/community/${groupSlug}/${boardSlug}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PostListView
        posts={viewPosts}
        sessionUserId={sessionUserId}
        sessionRole={sessionRole}
        postBasePath={`/community/${groupSlug}/${boardSlug}`}
      />
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={buildPageHref(Math.max(1, currentPage - 1))}
            className={`px-3 py-1 rounded border text-sm ${
              currentPage === 1 ? "pointer-events-none text-gray-300 border-gray-200" : "hover:bg-gray-50"
            }`}
          >
            이전
          </Link>
          <span className="text-sm text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={buildPageHref(Math.min(totalPages, currentPage + 1))}
            className={`px-3 py-1 rounded border text-sm ${
              currentPage === totalPages
                ? "pointer-events-none text-gray-300 border-gray-200"
                : "hover:bg-gray-50"
            }`}
          >
            다음
          </Link>
        </div>
      )}
    </div>
  );
}

interface CommunityBoardPageProps {
  params: Promise<{ group: string; board: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function CommunityBoardPage({ params, searchParams }: CommunityBoardPageProps) {
  const session = await auth();
  const settings = await getSiteSettings();
  const isAdmin = session?.user?.role === "ADMIN";
  const { group, board } = await params;
  const queryParams = await searchParams;
  const query = (queryParams.q || "").trim();
  const page = Math.max(1, Number(queryParams.page || 1));
  const pageSize = 10;

  if (!settings.communityEnabled && !isAdmin) {
    redirect("/community");
  }

  const community = await getCommunityGroupBySlug(group, {
    includeHiddenBoards: isAdmin,
    includeHiddenGroups: isAdmin,
  });
  if (!community) {
    notFound();
  }

  const currentBoard = community.boards.find((item) => item.slug === board);
  if (!currentBoard) {
    redirect(`/community/${community.slug}`);
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Community</p>
          <h1 className="font-display text-3xl sm:text-4xl">{community.label}</h1>
        </div>
        <Button asChild>
          <Link href={`/community/${community.slug}/${currentBoard.slug}/write`}>글쓰기</Link>
        </Button>
      </div>

      <form
        className="mb-6 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]"
        action={`/community/${community.slug}/${currentBoard.slug}`}
        method="get"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="q">검색어</Label>
            <Input id="q" name="q" placeholder="제목/내용 검색" defaultValue={query} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button type="submit">검색</Button>
          <Button type="reset" variant="outline" asChild>
            <Link href={`/community/${community.slug}/${currentBoard.slug}`}>초기화</Link>
          </Button>
        </div>
      </form>

      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {community.boards.map((boardItem) => {
            const search = new URLSearchParams();
            if (query) search.set("q", query);
            search.set("page", "1");
            const href = `/community/${community.slug}/${boardItem.slug}?${search.toString()}`;
            const isActive = boardItem.slug === currentBoard.slug;
            return (
              <Link
                key={boardItem.id}
                href={href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#0b1320] text-white"
                    : "bg-white text-gray-600 border border-black/5 hover:bg-gray-50"
                }`}
              >
                {boardItem.name}
              </Link>
            );
          })}
        </div>
      </div>

      <PostList
        boardKey={currentBoard.key}
        groupSlug={community.slug}
        boardSlug={currentBoard.slug}
        sessionUserId={session?.user?.id}
        sessionRole={session?.user?.role}
        query={query}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
