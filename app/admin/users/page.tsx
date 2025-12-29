import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserManager } from "@/components/admin/user-manager";

export default async function AdminUsersPage() {
    const session = await auth();
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isApproved: true,
            createdAt: true,
        },
    });

    return (
        <div className="space-y-6">
            <h1 className="font-display text-3xl">사용자 관리</h1>
            <UserManager users={users} currentUserId={session?.user?.id} />
        </div>
    );
}
