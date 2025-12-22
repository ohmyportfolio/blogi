import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PostDetailPageProps {
    params: {
        id: string;
    };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
    const post = await prisma.post.findUnique({
        where: {
            id: params.id,
        },
        include: {
            author: {
                select: { name: true },
            },
            comments: {
                include: {
                    author: { select: { name: true } },
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!post) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button variant="ghost" className="mb-4" asChild>
                <Link href="/community">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                </Link>
            </Button>

            <div className="mb-4">
                <Badge variant={post.type === "REVIEW" ? "default" : "secondary"}>
                    {post.type === "REVIEW" ? "후기" : "자유게시판"}
                </Badge>
            </div>

            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center text-sm text-gray-500 mb-8 border-b pb-4 gap-x-4">
                <span>작성자: {post.author.name || "Anonymous"}</span>
                <span>{format(post.createdAt, "yyyy.MM.dd HH:mm")}</span>
                <span>조회수: {post.viewCount}</span>
            </div>

            <div className="prose max-w-none prose-lg mb-12 whitespace-pre-wrap">
                {post.content}
            </div>

            {/* Comments Section (Mock for now, needs real form) */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold mb-4">댓글 {post.comments.length}개</h3>
                <div className="space-y-4">
                    {post.comments.length === 0 ? (
                        <p className="text-gray-500 text-sm">댓글이 없습니다.</p>
                    ) : (
                        post.comments.map((comment) => (
                            <div key={comment.id} className="border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{comment.author.name}</span>
                                    <span className="text-xs text-gray-400">{format(comment.createdAt, "yyyy.MM.dd HH:mm")}</span>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
