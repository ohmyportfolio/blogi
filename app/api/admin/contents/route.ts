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
  const { action, id } = body;

  // 콘텐츠 복구
  if (action === "restore") {
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }
    await prisma.content.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        isVisible: true,
      },
    });
    revalidatePath("/admin/contents");
    revalidatePath("/admin/trash");
    return NextResponse.json({ success: true, message: "콘텐츠가 복구되었습니다." });
  }

  // 콘텐츠 영구 삭제
  if (action === "permanentDelete") {
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "콘텐츠를 찾을 수 없습니다" }, { status: 404 });
    }
    if (!existing.isDeleted) {
      return NextResponse.json({ error: "휴지통에 있는 콘텐츠만 영구 삭제할 수 있습니다" }, { status: 400 });
    }
    await prisma.content.delete({ where: { id } });
    revalidatePath("/admin/contents");
    revalidatePath("/admin/trash");
    return NextResponse.json({ success: true, message: "콘텐츠가 영구 삭제되었습니다." });
  }

  return NextResponse.json({ error: "지원하지 않는 동작입니다" }, { status: 400 });
}
