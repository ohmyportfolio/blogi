import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { getDefaultCommunityBoard } from "@/lib/community";

export default async function CommunityIndexPage() {
  const session = await auth();
  const settings = await getSiteSettings();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!settings.communityEnabled && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="rounded-2xl border border-black/5 bg-white/80 p-8 text-center shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
          <h1 className="font-display text-2xl mb-3">커뮤니티가 비활성화되어 있습니다</h1>
          <p className="text-sm text-gray-500">
            현재 커뮤니티 기능이 꺼져 있습니다. 관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    );
  }

  const target = await getDefaultCommunityBoard({
    includeHiddenBoards: isAdmin,
    includeHiddenGroups: isAdmin,
  });
  if (!target) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="rounded-2xl border border-black/5 bg-white/80 p-8 text-center text-gray-500">
          게시판이 아직 없습니다. 관리자에게 게시판 생성을 요청해주세요.
        </div>
      </div>
    );
  }

  redirect(`/community/${target.group.slug}/${target.board.slug}`);
}
