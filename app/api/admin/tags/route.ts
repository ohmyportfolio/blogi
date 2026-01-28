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

function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET: 태그 목록 조회
// ?categoryId=xxx  → 해당 카테고리 전용 태그
// ?global=true     → 글로벌 태그만
// ?categoryId=xxx&includeGlobal=true → 카테고리 전용 + 글로벌 태그
// (파라미터 없음)  → 전체 태그
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const global = searchParams.get("global");
  const includeGlobal = searchParams.get("includeGlobal");

  let where = {};

  if (global === "true") {
    where = { categoryId: null };
  } else if (categoryId) {
    if (includeGlobal === "true") {
      where = {
        OR: [{ categoryId }, { categoryId: null }],
      };
    } else {
      where = { categoryId };
    }
  }

  const tags = await prisma.tag.findMany({
    where,
    orderBy: [{ categoryId: "asc" }, { order: "asc" }],
    include: {
      _count: { select: { contents: true } },
    },
  });

  return NextResponse.json(tags);
}

// POST: 태그 생성
// Body: { name, categoryId? }
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { name, categoryId } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "태그 이름을 입력해주세요" }, { status: 400 });
  }

  const slug = toSlug(name);
  if (!slug) {
    return NextResponse.json({ error: "유효한 태그 이름을 입력해주세요" }, { status: 400 });
  }

  // 카테고리 전용 태그인 경우 카테고리 존재 확인
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "카테고리를 찾을 수 없습니다" }, { status: 404 });
    }
  }

  // 같은 범위 내 slug 중복 확인
  const existing = await prisma.tag.findUnique({
    where: {
      categoryId_slug: {
        categoryId: categoryId || null,
        slug,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 태그입니다" }, { status: 409 });
  }

  // order: 해당 범위의 최대값 + 1
  const maxOrder = await prisma.tag.aggregate({
    where: { categoryId: categoryId || null },
    _max: { order: true },
  });

  const tag = await prisma.tag.create({
    data: {
      name: name.trim(),
      slug,
      order: (maxOrder._max.order ?? -1) + 1,
      categoryId: categoryId || null,
    },
  });

  return NextResponse.json(tag, { status: 201 });
}
