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
  const {
    id,
    applyToAll, // 전체 적용 플래그
    listViewEnabled,
    listViewCount,
    listViewLabel,
    cardViewEnabled,
    cardViewCount,
    cardViewLabel,
    displayOrder,
    showDate,
    tagFilterEnabled,
  } = body;

  // 유효성 검사: 둘 다 비활성화는 불가
  if (!listViewEnabled && !cardViewEnabled) {
    return NextResponse.json(
      { error: "리스트형 또는 카드형 중 하나는 활성화해야 합니다." },
      { status: 400 }
    );
  }

  const updateData = {
    listViewEnabled: Boolean(listViewEnabled),
    listViewCount: Math.max(0, Number(listViewCount) || 0),
    listViewLabel: listViewLabel?.trim() || null,
    cardViewEnabled: Boolean(cardViewEnabled),
    cardViewCount: Math.max(0, Number(cardViewCount) || 0),
    cardViewLabel: cardViewLabel?.trim() || null,
    displayOrder: displayOrder === "list" ? "list" : "card",
    showDate: showDate !== false, // 기본값 true
    ...(tagFilterEnabled !== undefined && { tagFilterEnabled: Boolean(tagFilterEnabled) }),
  };

  // 전체 카테고리에 적용
  if (applyToAll) {
    await prisma.category.updateMany({
      where: { isVisible: true },
      data: updateData,
    });

    // 모든 카테고리 페이지 캐시 무효화
    revalidatePath("/contents", "layout");
    revalidatePath("/", "layout"); // 메인 페이지도 무효화

    return NextResponse.json({ success: true, appliedToAll: true });
  }

  // 단일 카테고리 업데이트
  if (!id) {
    return NextResponse.json({ error: "카테고리 ID가 필요합니다." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "카테고리를 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  // 해당 카테고리 페이지 캐시 무효화
  revalidatePath(`/contents/${updated.slug}`);
  revalidatePath("/", "layout"); // 메인 페이지도 무효화

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      listViewEnabled: true,
      listViewCount: true,
      listViewLabel: true,
      cardViewEnabled: true,
      cardViewCount: true,
      cardViewLabel: true,
      displayOrder: true,
      showDate: true,
    },
  });

  return NextResponse.json(categories);
}
