"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Edit, MessageCircle, Trash2, Eye, Lock, Pin } from "lucide-react";

export interface PostListItem {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isSecret: boolean;
}

interface PostListViewProps {
  posts: PostListItem[];
  sessionUserId?: string | null;
  sessionRole?: string | null;
  emptyMessage?: string;
  postBasePath?: string;
}

export function PostListView({
  posts,
  sessionUserId,
  sessionRole,
  emptyMessage = "게시물이 없습니다.",
  postBasePath,
}: PostListViewProps) {
  const [items, setItems] = useState(posts);
  const [lockedPost, setLockedPost] = useState<PostListItem | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  useEffect(() => {
    setItems(posts);
  }, [posts]);

  const canEdit = (authorId: string) =>
    Boolean(sessionUserId && (sessionUserId === authorId || sessionRole === "ADMIN"));

  const canOpen = (post: PostListItem) => !post.isSecret || canEdit(post.authorId);
  const getPostHref = (postId: string) =>
    postBasePath ? `${postBasePath}/${postId}` : `/community/${postId}`;
  const getEditHref = (postId: string) =>
    postBasePath ? `${postBasePath}/${postId}/edit` : `/community/${postId}/edit`;

  const handleDelete = async (postId: string) => {
    const confirmed = await confirm({
      title: "게시글 삭제",
      message: "정말 삭제하시겠습니까?",
      confirmText: "삭제",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== postId));
        showToast("게시글이 삭제되었습니다.", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "삭제에 실패했습니다.", "error");
      }
    } catch {
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const sortedItems = useMemo(() => items, [items]);

  if (sortedItems.length === 0) {
    return <div className="p-8 text-center text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-6">
      {lockedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setLockedPost(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.6)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <Lock className="h-4 w-4" />
              Private
            </div>
            <h3 className="mt-3 text-lg font-semibold">이 글은 비밀글입니다.</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              작성자 또는 관리자만 내용을 확인할 수 있습니다. 권한이 있다면 로그인 후 다시
              시도해주세요.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {!sessionUserId && (
                <Button asChild variant="outline" className="sm:order-1">
                  <Link href="/login">로그인하기</Link>
                </Button>
              )}
              <Button
                type="button"
                onClick={() => setLockedPost(null)}
                className="sm:order-2"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Cards */}
      <div className="space-y-4 md:hidden">
        {sortedItems.map((post) => (
          <Card key={post.id} className="p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={getPostHref(post.id)}
                  className="block text-base font-semibold text-foreground hover:text-sky-700"
                  onClick={(event) => {
                    if (!canOpen(post)) {
                      event.preventDefault();
                      setLockedPost(post);
                    }
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    {post.isPinned && <Pin className="w-4 h-4 text-amber-500" />}
                    {post.isSecret && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 shadow-[0_8px_18px_-12px_rgba(251,191,36,0.6)]">
                        <Lock className="w-3 h-3" />
                        비밀글
                      </span>
                    )}
                    {post.title}
                  </span>
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{post.authorName}</span>
                  <span>·</span>
                  <span>{format(new Date(post.createdAt), "yyyy.MM.dd")}</span>
                </div>
              </div>
              {post.commentCount > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {post.commentCount}
                </Badge>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {post.viewCount}
              </span>
                    {canEdit(post.authorId) && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={getEditHref(post.id)}>
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      수정
                    </Link>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left w-[70px]">번호</th>
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left w-[160px]">작성자</th>
                <th className="px-4 py-3 text-left w-[120px]">작성일</th>
                <th className="px-4 py-3 text-left w-[90px]">조회</th>
                <th className="px-4 py-3 text-left w-[90px]">댓글</th>
                <th className="px-4 py-3 text-left w-[140px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((post, index) => (
                <tr key={post.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {post.isPinned ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Pin className="w-3.5 h-3.5" />
                        공지
                      </span>
                    ) : (
                      sortedItems.length - index
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={getPostHref(post.id)}
                      className="font-medium text-foreground hover:text-sky-700"
                      onClick={(event) => {
                        if (!canOpen(post)) {
                          event.preventDefault();
                          setLockedPost(post);
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {post.isSecret && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 shadow-[0_8px_18px_-12px_rgba(251,191,36,0.6)]">
                            <Lock className="w-3 h-3" />
                            비밀글
                          </span>
                        )}
                        {post.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.authorName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(post.createdAt), "yyyy.MM.dd")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.viewCount}</td>
                  <td className="px-4 py-3 text-gray-500">{post.commentCount}</td>
                  <td className="px-4 py-3">
                    {canEdit(post.authorId) ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={getEditHref(post.id)}>
                            수정
                          </Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id)}>
                          삭제
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
