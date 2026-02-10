"use server";

import * as z from "zod";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const demoLogin = async (redirectTo = "/") => {
    if (process.env.DEMO_MODE !== "true") {
        return { error: "데모 모드가 비활성화되어 있습니다." };
    }

    const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { id: "asc" },
    });

    if (!admin) {
        return { error: "관리자 계정이 존재하지 않습니다." };
    }

    try {
        await signIn("credentials", {
            email: admin.email,
            password: "__demo_bypass__",
            redirect: false,
            redirectTo,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "로그인에 실패했습니다." };
        }
        throw error;
    }

    return { success: "관리자로 로그인되었습니다!", redirectTo };
};

export const login = async (
    values: z.infer<typeof LoginSchema>,
    redirectTo = "/"
) => {
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "계정이 없습니다" };
    }

    const { email, password } = validatedFields.data;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
        }

        if (!user.isApproved && user.role !== "ADMIN") {
            return { error: "관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.", code: "PENDING_APPROVAL" };
        }

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            redirectTo,
        });

        if (result?.error) {
            return { error: "로그인에 실패했습니다." };
        }
    } catch (error) {
        if (error instanceof AuthError) {
            // 승인 대기 중인 사용자 체크
            if (error.cause?.err?.message === "PENDING_APPROVAL") {
                return { error: "관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.", code: "PENDING_APPROVAL" };
            }

            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };

                default:
                    return { error: "로그인에 실패했습니다." };
            }
        }

        throw error;
    }

    return { success: "로그인 성공!", redirectTo };
};
