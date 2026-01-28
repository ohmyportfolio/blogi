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
  const categoryId = body.categoryId || body.id;
  const { showOnHome, homeItemCount } = body;

  if (!categoryId) {
    return NextResponse.json({ error: "카테고리 ID가 필요합니다." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      showOnHome: Boolean(showOnHome),
      homeItemCount: Math.max(1, Math.min(10, Number(homeItemCount) || 3)),
    },
  });

  revalidatePath("/", "layout");

  return NextResponse.json(updated);
}
