"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export const deleteAccount = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." };
    }

    try {
        // 관리자인 경우 마지막 관리자인지 확인
        if (session.user.role === "ADMIN") {
            const adminCount = await prisma.user.count({
                where: { role: "ADMIN" },
            });

            if (adminCount <= 1) {
                return { error: "마지막 관리자 계정은 삭제할 수 없습니다." };
            }
        }

        // 사용자 삭제 (관련 데이터도 cascade로 삭제됨)
        await prisma.user.delete({
            where: { id: session.user.id },
        });

        // 세션 종료를 위해 signOut 호출
        await signOut({ redirect: false });

        return { success: "회원 탈퇴가 완료되었습니다." };
    } catch (error) {
        return { error: "회원 탈퇴에 실패했습니다." };
    }
};
