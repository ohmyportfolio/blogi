"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/schemas";
import { needsAdminSetup } from "@/lib/admin-setup";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        return { error: "이미 사용 중인 이메일입니다." };
    }

    // 관리자가 없는 경우에만 관리자 계정을 생성
    const needsSetup = await needsAdminSetup();
    const shouldCreateAdmin = needsSetup;

    await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            // 관리자가 없으면 이 계정을 관리자 + 승인 처리
            role: shouldCreateAdmin ? "ADMIN" : "USER",
            isApproved: shouldCreateAdmin ? true : false,
        },
    });

    if (shouldCreateAdmin) {
        return { success: "최초 관리자 계정이 생성되었습니다. 바로 로그인하실 수 있습니다." };
    }

    return { success: "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다." };
};
