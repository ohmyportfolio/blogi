import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
};

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { boardId, showOnHome, homeItemCount } = body;

  if (!boardId) {
    return NextResponse.json(
      { error: "게시판 ID가 필요합니다." },
      { status: 400 }
    );
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json(
      { error: "게시판을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: {
      showOnHome: Boolean(showOnHome),
      homeItemCount: Math.max(1, Math.min(10, Number(homeItemCount) || 5)),
    },
  });

  // 메인 페이지 캐시 무효화
  revalidatePath("/", "layout");

  return NextResponse.json(updated);
}
