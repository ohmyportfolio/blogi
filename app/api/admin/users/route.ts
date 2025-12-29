import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
};

const ensureNotLastAdmin = async (userId: string) => {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "ADMIN") return;
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    throw new Error("마지막 관리자 계정은 변경하거나 삭제할 수 없습니다.");
  }
};

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { data } = body;
    const email = String(data?.email ?? "").trim();
    const password = String(data?.password ?? "").trim();
    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호가 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name: data?.name?.trim() || null,
        email,
        password: hashedPassword,
        role: data?.role === "ADMIN" ? "ADMIN" : "USER",
        isApproved: data?.isApproved ?? false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    });
    revalidatePath("/admin/users");
    return NextResponse.json(created, { status: 201 });
  }

  if (action === "update") {
    const { id, data } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    const email = String(data?.email ?? "").trim();
    if (!email) {
      return NextResponse.json({ error: "이메일이 필요합니다" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }
    if (email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: "이미 사용 중인 이메일입니다" }, { status: 400 });
      }
    }
    const nextRole = data?.role === "ADMIN" ? "ADMIN" : "USER";
    if (existing.role === "ADMIN" && nextRole !== "ADMIN") {
      try {
        await ensureNotLastAdmin(id);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "권한 변경에 실패했습니다" },
          { status: 400 }
        );
      }
    }
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: data?.name?.trim() || null,
        email,
        role: nextRole,
        isApproved: data?.isApproved ?? false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    });
    revalidatePath("/admin/users");
    return NextResponse.json(updated);
  }

  if (action === "resetPassword") {
    const { id, password } = body;
    const nextPassword = String(password ?? "").trim();
    if (!id || !nextPassword) {
      return NextResponse.json({ error: "비밀번호가 필요합니다" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(nextPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    revalidatePath("/admin/users");
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }
    if (id === session.user.id) {
      return NextResponse.json({ error: "현재 로그인한 계정은 삭제할 수 없습니다" }, { status: 400 });
    }
    try {
      await ensureNotLastAdmin(id);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "삭제에 실패했습니다" },
        { status: 400 }
      );
    }
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "지원하지 않는 요청입니다" }, { status: 400 });
}
