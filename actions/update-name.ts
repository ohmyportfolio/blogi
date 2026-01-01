"use server";

import * as z from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpdateNameSchema } from "@/schemas";
import { revalidatePath } from "next/cache";

export const updateName = async (values: z.infer<typeof UpdateNameSchema>) => {
    const validatedFields = UpdateNameSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "잘못된 입력입니다." };
    }

    const session = await auth();

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." };
    }

    const { name } = validatedFields.data;

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name },
        });

        revalidatePath("/profile");

        return { success: "이름이 성공적으로 변경되었습니다." };
    } catch (error) {
        return { error: "이름 변경에 실패했습니다." };
    }
};
