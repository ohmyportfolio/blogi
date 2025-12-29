"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit, MessageCircle, Heart, Bookmark, Lock } from "lucide-react";
import { RichTextViewer } from "@/components/editor/rich-text-viewer";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  boardName?: string;
  boardKey?: string;
  viewCount: number;
  createdAt: string;
  authorId: string;
  isSecret: boolean;
  isPinned: boolean;
  likeCount: number;
  scrapCount: number;
  liked?: boolean;
  scrapped?: boolean;
  author: { name: string | null };
  comments: Comment[];
  attachments?: Attachment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: { name: string | null };
}

interface Attachment {
  id: string;
  url: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
}

export default function PostDetailPage() {
  const { id, group, board } = useParams<{ id: string; group: string; board: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);
  const [blockedSecret, setBlockedSecret] = useState(false);
  const hasIncrementedView = useRef(false);
  const { showToast } = useToast();

  const isAuthor = session?.user?.id === post?.authorId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canEdit = isAuthor || isAdmin;
  const listHref = `/community/${group}/${board}`;

  const fetchPost = useCallback(
    async (incrementView = false) => {
      if (!id) return;
      try {
        const viewParam = incrementView ? "?view=1" : "";
        const res = await fetch(`/api/posts/${id}${viewParam}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setBlockedSecret(false);
          if (incrementView) {
            hasIncrementedView.current = true;
          }
        } else if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (data.isSecret) {
            setBlockedSecret(true);
            setPost(null);
          } else {
            router.push(listHref);
          }
        } else {
          router.push(listHref);
        }
      } catch (error) {
        console.error(error);
        router.push(listHref);
      } finally {
        setLoading(false);
      }
    },
    [id, router, listHref]
  );

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
        router.push(listHref);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async () => {
    if (!session) {
      showToast("로그인이 필요합니다.", "info");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) =>
          prev
            ? {
                ...prev,
                likeCount: data.likeCount ?? prev.likeCount,
                liked: data.liked ?? !prev.liked,
              }
            : prev
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleScrap = async () => {
    if (!session) {
      showToast("로그인이 필요합니다.", "info");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${id}/scrap`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) =>
          prev
            ? {
                ...prev,
                scrapCount: data.scrapCount ?? prev.scrapCount,
                scrapped: data.scrapped ?? !prev.scrapped,
              }
            : prev
        );
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

  const handleCommentEditStart = (target: Comment) => {
    setEditingCommentId(target.id);
    setEditingContent(target.content);
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleCommentUpdate = async (commentId: string) => {
    if (!editingContent.trim()) {
      showToast("댓글 내용을 입력해주세요.", "info");
      return;
    }
    setUpdatingCommentId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent }),
      });
      if (res.ok) {
        handleCommentEditCancel();
        fetchPost(false);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data?.error || "댓글 수정에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("댓글 수정 중 오류가 발생했습니다.", "error");
    } finally {
      setUpdatingCommentId(null);
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

  if (blockedSecret) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="rounded-2xl border border-black/5 bg-white/90 p-8 text-center shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
          <div className="flex justify-center mb-4 text-gray-400">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="font-display text-xl mb-2">비밀글입니다</h2>
          <p className="text-sm text-gray-500 mb-6">
            작성자 또는 관리자만 확인할 수 있습니다.
          </p>
          <Button asChild>
            <Link href={listHref}>목록으로</Link>
          </Button>
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
        <Link href={listHref}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Link>
      </Button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{post.boardName ?? post.type}</Badge>
          {post.isSecret && (
            <Badge variant="outline" className="flex items-center gap-1 text-gray-500">
              <Lock className="w-3 h-3" />
              비밀글
            </Badge>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`${listHref}/${post.id}/edit`}>
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
        <span>좋아요: {post.likeCount}</span>
        <span>스크랩: {post.scrapCount}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant={post.liked ? "default" : "outline"} onClick={handleLike}>
          <Heart className="w-4 h-4 mr-2" />
          좋아요
        </Button>
        <Button variant={post.scrapped ? "default" : "outline"} onClick={handleScrap}>
          <Bookmark className="w-4 h-4 mr-2" />
          스크랩
        </Button>
      </div>

      <div className="mb-12">
        <RichTextViewer content={post.content} />
      </div>

      {post.attachments && post.attachments.length > 0 && (
        <div className="mb-12">
          <h3 className="font-semibold mb-3">첨부 이미지</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.attachments.map((file) => (
              <a
                key={file.id}
                href={file.url}
                className="relative overflow-hidden rounded-lg border border-black/5 bg-gray-50"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={file.url}
                  alt={file.name || "첨부 이미지"}
                  className="h-32 w-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

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
                      <>
                        <button
                          onClick={() => handleCommentEditStart(c)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCommentDelete(c.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingCommentId === c.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleCommentEditCancel}>
                        취소
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleCommentUpdate(c.id)}
                        disabled={updatingCommentId === c.id}
                      >
                        {updatingCommentId === c.id ? "수정 중..." : "수정 저장"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
