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
  const { splashEnabled, splashBackgroundColor, splashLogoUrl, splashLogoSize } = body;

  const data: Record<string, unknown> = {};

  if (typeof splashEnabled === "boolean") {
    data.splashEnabled = splashEnabled;
  }

  if (typeof splashBackgroundColor === "string") {
    data.splashBackgroundColor = splashBackgroundColor.trim() || null;
  }

  if (typeof splashLogoUrl === "string") {
    data.splashLogoUrl = splashLogoUrl.trim() || null;
  }

  if (typeof splashLogoSize === "string" && ["small", "medium", "large", "xlarge"].includes(splashLogoSize)) {
    data.splashLogoSize = splashLogoSize;
  }

  const settings = await prisma.siteSettings.upsert({
    where: { key: "default" },
    update: data,
    create: {
      key: "default",
      ...data,
    },
  });

  revalidatePath("/", "layout");
  return NextResponse.json(settings);
}
