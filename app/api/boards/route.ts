import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBoards, getBoardsByMenuItemId } from "@/lib/boards";
import { getCommunityGroupBySlug } from "@/lib/community";
import { getSiteSettings } from "@/lib/site-settings";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeHidden = searchParams.get("all") === "true";
  const group = searchParams.get("group") || undefined;
  const menuItemId = searchParams.get("menuItemId") || undefined;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const settings = await getSiteSettings();

  if (!settings.communityEnabled && !isAdmin) {
    return NextResponse.json({ error: "커뮤니티 기능이 비활성화되어 있습니다." }, { status: 403 });
  }

  if (group) {
    const community = await getCommunityGroupBySlug(group, {
      includeHiddenBoards: includeHidden && isAdmin,
      includeHiddenGroups: includeHidden && isAdmin,
    });
    if (!community) {
      return NextResponse.json({ error: "커뮤니티 그룹을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(community.boards);
  }

  if (menuItemId) {
    const boards = await getBoardsByMenuItemId({
      menuItemId,
      includeHidden: includeHidden && isAdmin,
    });
    return NextResponse.json(boards);
  }

  const boards = await getBoards({ includeHidden: includeHidden && isAdmin });
  return NextResponse.json(boards);
}
