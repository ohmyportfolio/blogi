"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdatePasswordSchema } from "@/schemas";

export const updatePassword = async (values: z.infer<typeof UpdatePasswordSchema>) => {
    const validatedFields = UpdatePasswordSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "잘못된 입력입니다." };
    }

    const session = await auth();

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { error: "사용자를 찾을 수 없습니다." };
        }

        const passwordsMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordsMatch) {
            return { error: "현재 비밀번호가 올바르지 않습니다." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return { success: "비밀번호가 성공적으로 변경되었습니다." };
    } catch (error) {
        return { error: "비밀번호 변경에 실패했습니다." };
    }
};
