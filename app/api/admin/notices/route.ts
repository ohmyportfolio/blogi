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
  const { noticeTickerEnabled, noticeItems } = body;

  // noticeItems 검증: { id: string; text: string; link?: string }[]
  const validatedItems = Array.isArray(noticeItems)
    ? noticeItems
        .filter(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Record<string, unknown>).id === "string" &&
            typeof (item as Record<string, unknown>).text === "string" &&
            ((item as Record<string, unknown>).text as string).trim().length > 0
        )
        .map((item: Record<string, unknown>) => ({
          id: String(item.id),
          text: String(item.text).trim(),
          ...(typeof item.link === "string" && item.link.trim()
            ? { link: item.link.trim() }
            : {}),
        }))
        .slice(0, 20)
    : [];

  const data = {
    noticeTickerEnabled: Boolean(noticeTickerEnabled),
    noticeItems: validatedItems,
  };

  const settings = await prisma.siteSettings.upsert({
    where: { key: "default" },
    update: data,
    create: { key: "default", ...data },
  });

  revalidatePath("/", "layout");
  return NextResponse.json(settings);
}
