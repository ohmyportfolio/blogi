import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCommunityGroupBySlug } from "@/lib/community";
import { getSiteSettings } from "@/lib/site-settings";

interface CommunityGroupPageProps {
  params: Promise<{ group: string }>;
}

export default async function CommunityGroupPage({ params }: CommunityGroupPageProps) {
  const { group } = await params;
  const session = await auth();
  const settings = await getSiteSettings();
  const isAdmin = session?.user?.role === "ADMIN";

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
  const board = community.boards[0];
  if (!board) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="rounded-2xl border border-black/5 bg-white/80 p-8 text-center text-gray-500">
          게시판이 아직 없습니다. 관리자에게 게시판 생성을 요청해주세요.
        </div>
      </div>
    );
  }

  redirect(`/community/${community.slug}/${board.slug}`);
}
