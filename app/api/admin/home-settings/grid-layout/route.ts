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
  const { layout } = body;

  if (!Array.isArray(layout) || layout.some((v: unknown) => typeof v !== "number" || v < 1 || v > 3)) {
    return NextResponse.json({ error: "잘못된 레이아웃 데이터입니다." }, { status: 400 });
  }

  await prisma.siteSettings.update({
    where: { key: "default" },
    data: { homeGridLayout: layout },
  });

  revalidatePath("/", "layout");

  return NextResponse.json({ success: true });
}
