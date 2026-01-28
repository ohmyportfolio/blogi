import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const { categoryId, enabled } = await req.json();

  if (!categoryId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "categoryId와 enabled가 필요합니다." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { tagFilterEnabled: enabled },
    select: { id: true, tagFilterEnabled: true },
  });

  revalidatePath(`/contents/${category.slug}`);
  revalidatePath("/", "layout");

  return NextResponse.json(updated);
}
