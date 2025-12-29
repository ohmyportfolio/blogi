"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { lexicalJsonToPlainText } from "@/lib/lexical";
import { useToast } from "@/components/ui/toast";

export default function EditPage() {
  const { id, group, board } = useParams<{ id: string; group: string; board: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [boardKey, setBoardKey] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState<
    { url: string; name?: string | null; type?: string | null; size?: number | null }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const isAdminUser = session?.user?.role === "ADMIN";
  const listHref = `/community/${group}/${board}`;

  const fetchPost = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/posts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setContent(data.content);
        setContentMarkdown(data.contentMarkdown ?? "");
        setBoardKey(data.boardKey ?? data.type ?? "");
        setAuthorId(data.authorId);
        setIsSecret(Boolean(data.isSecret));
        setIsPinned(Boolean(data.isPinned));
        setAttachments(Array.isArray(data.attachments) ? data.attachments : []);
      } else {
        router.push(listHref);
      }
    } catch {
      router.push(listHref);
    } finally {
      setLoading(false);
    }
  }, [id, router, listHref]);

  const fetchBoardKey = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards?group=${encodeURIComponent(String(group))}${isAdminUser ? "&all=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const matched = list.find((item: { slug?: string; key?: string }) => item.slug === board);
        if (matched?.key) {
          setBoardKey(matched.key);
        }
      }
    } catch {
      // ignore
    }
  }, [group, board, isAdminUser]);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id, fetchPost]);

  useEffect(() => {
    fetchBoardKey();
  }, [fetchBoardKey]);

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const isAuthor = session.user?.id === authorId;
  const isAdmin = session.user?.role === "ADMIN";
  if (!isAuthor && !isAdmin) {
    router.push(listHref);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const textContent = lexicalJsonToPlainText(content);
    if (!title.trim() || !textContent || !boardKey) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          contentMarkdown,
          boardKey,
          isSecret,
          isPinned,
          attachments,
        }),
      });

      if (res.ok) {
        router.push(`${listHref}/${id}`);
      } else {
        const data = await res.json();
        setError(data.error || "수정에 실패했습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("scope", "posts");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAttachments((prev) => [
            ...prev,
            { url: data.url, name: file.name, type: file.type, size: file.size },
          ]);
        } else {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || "이미지 업로드에 실패했습니다.", "error");
        }
      }
    } catch {
      showToast("이미지 업로드 중 오류가 발생했습니다.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((item) => item.url !== url));
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href={`${listHref}/${id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Link>
      </Button>

      <h1 className="font-display text-3xl mb-6">글 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>게시판</Label>
          <Input value={board} disabled />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
            />
            비밀글로 설정
          </label>
          {session?.user?.role === "ADMIN" && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              상단 고정
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label>내용</Label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            onMarkdownChange={setContentMarkdown}
            placeholder="내용을 입력하세요..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attachments">첨부 이미지</Label>
          <Input
            id="attachments"
            type="file"
            accept="image/*"
            multiple
            onChange={handleAttachmentChange}
            disabled={saving || uploading}
          />
          {uploading && <p className="text-xs text-gray-500">업로드 중...</p>}
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((file) => (
                <div key={file.url} className="relative overflow-hidden rounded-lg border">
                  <img src={file.url} alt={file.name || "첨부"} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(file.url)}
                    className="absolute top-1 right-1 rounded bg-white/80 px-2 py-0.5 text-xs"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={`${listHref}/${id}`}>취소</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
