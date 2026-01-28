import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
};

// PUT: 태그 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, order } = body;

  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return NextResponse.json({ error: "태그를 찾을 수 없습니다" }, { status: 404 });
  }

  const data: { name?: string; slug?: string; order?: number } = {};

  if (name !== undefined && name.trim()) {
    data.name = name.trim();
    data.slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  if (order !== undefined) {
    data.order = order;
  }

  const updated = await prisma.tag.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE: 태그 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const { id } = await params;

  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return NextResponse.json({ error: "태그를 찾을 수 없습니다" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
