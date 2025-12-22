import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function PostList({ type }: { type: string }) {
    const posts = await prisma.post.findMany({
        where: {
            type: type,
        },
        include: {
            author: {
                select: { name: true },
            },
            _count: {
                select: { comments: true },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (posts.length === 0) {
        return <div className="p-8 text-center text-gray-500">게시물이 없습니다.</div>;
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                    <Card className="hover:bg-gray-50 transition cursor-pointer">
                        <CardHeader className="py-4">
                            <CardTitle className="font-display text-lg flex items-center gap-2">
                                {post.title}
                                {post._count.comments > 0 && (
                                    <span className="text-sm text-sky-600">[{post._count.comments}]</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 text-sm text-gray-500 flex justify-between items-center">
                            <span>{post.author.name || "Anonymous"}</span>
                            <span>{format(post.createdAt, "yyyy.MM.dd")}</span>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

export default function CommunityPage() {
    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Community</p>
                    <h1 className="font-display text-3xl sm:text-4xl">커뮤니티</h1>
                </div>
                <Button asChild>
                    <Link href="/community/write">글쓰기</Link>
                </Button>
            </div>

            <Tabs defaultValue="REVIEW" className="w-full">
                <TabsList className="w-full mb-8">
                    <TabsTrigger value="REVIEW">후기</TabsTrigger>
                    <TabsTrigger value="FREE">자유게시판</TabsTrigger>
                </TabsList>
                <TabsContent value="REVIEW">
                    <PostList type="REVIEW" />
                </TabsContent>
                <TabsContent value="FREE">
                    <PostList type="FREE" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
