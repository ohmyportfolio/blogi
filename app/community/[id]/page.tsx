"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface Post {
    id: string;
    title: string;
    content: string;
    type: string;
    viewCount: number;
    createdAt: string;
    authorId: string;
    author: { name: string | null };
    comments: Comment[];
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    authorId: string;
    author: { name: string | null };
}

export default function PostDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: session } = useSession();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const hasIncrementedView = useRef(false);

    const isAuthor = session?.user?.id === post?.authorId;
    const isAdmin = session?.user?.role === "ADMIN";
    const canEdit = isAuthor || isAdmin;

    const fetchPost = useCallback(async (incrementView = false) => {
        if (!id) return;
        try {
            const viewParam = incrementView ? "?view=1" : "";
            const res = await fetch(`/api/posts/${id}${viewParam}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data);
                if (incrementView) {
                    hasIncrementedView.current = true;
                }
            } else {
                router.push("/community");
            }
        } catch (error) {
            console.error(error);
            router.push("/community");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            fetchPost(!hasIncrementedView.current);
        }
    }, [id, fetchPost]);

    const handleDelete = async () => {
        if (!confirm("정말 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                router.push("/community");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !session) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: comment }),
            });
            if (res.ok) {
                setComment("");
                fetchPost(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCommentDelete = async (commentId: string) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchPost(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!post) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <Button variant="ghost" className="mb-4" asChild>
                <Link href="/community">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    목록으로
                </Link>
            </Button>

            <div className="flex items-center justify-between mb-4">
                <Badge variant={post.type === "REVIEW" ? "default" : "secondary"}>
                    {post.type === "REVIEW" ? "후기" : "자유게시판"}
                </Badge>
                {canEdit && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/community/${post.id}/edit`}>
                                <Edit className="w-4 h-4 mr-1" />
                                수정
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                        </Button>
                    </div>
                )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl mb-4">{post.title}</h1>

            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-8 border-b pb-4 gap-x-4 gap-y-2">
                <span>작성자: {post.author.name || "Anonymous"}</span>
                <span>{format(new Date(post.createdAt), "yyyy.MM.dd HH:mm")}</span>
                <span>조회수: {post.viewCount}</span>
            </div>

            <div
                className="prose max-w-none prose-lg mb-12 min-h-[200px] [&_img]:max-w-full [&_img]:rounded-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Comments Section */}
            <div className="bg-white/80 p-6 rounded-2xl shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    댓글 {post.comments.length}개
                </h3>

                {/* Comment Form */}
                {session ? (
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                        <Textarea
                            placeholder="댓글을 입력하세요..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mb-2"
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={submitting || !comment.trim()}>
                                {submitting ? "등록 중..." : "댓글 등록"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="mb-6 p-4 bg-white rounded border text-center text-gray-500">
                        <Link href="/login" className="text-sky-500 hover:underline">
                            로그인
                        </Link>
                        하시면 댓글을 작성할 수 있습니다.
                    </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                    {post.comments.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">첫 댓글을 남겨보세요!</p>
                    ) : (
                        post.comments.map((c) => (
                            <div key={c.id} className="bg-white p-4 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{c.author.name || "Anonymous"}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">
                                            {format(new Date(c.createdAt), "yyyy.MM.dd HH:mm")}
                                        </span>
                                        {(session?.user?.id === c.authorId || isAdmin) && (
                                            <button
                                                onClick={() => handleCommentDelete(c.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
