import { prisma } from "@/lib/prisma";
import { Users, LayoutGrid, FileText, MessageSquare } from "lucide-react";

export default async function AdminPage() {
  const [userCount, contentCount, postCount, commentCount] = await Promise.all([
    prisma.user.count(),
    prisma.content.count(),
    prisma.post.count(),
    prisma.comment.count(),
  ]);

  const stats = [
    { label: "사용자", value: userCount, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "콘텐츠", value: contentCount, icon: LayoutGrid, color: "text-green-600 bg-green-50" },
    { label: "게시물", value: postCount, icon: FileText, color: "text-purple-600 bg-purple-50" },
    { label: "댓글", value: commentCount, icon: MessageSquare, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-display text-3xl">대시보드</h1>
            <p className="text-sm text-gray-500 mt-2">
              사이트 전체 현황을 한눈에 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
