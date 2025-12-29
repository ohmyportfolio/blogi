"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { lexicalJsonToPlainText } from "@/lib/lexical";
import { useToast } from "@/components/ui/toast";

function WritePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contentMarkdown, setContentMarkdown] = useState("");
    const [boards, setBoards] = useState<{ id: string; key: string; name: string }[]>([]);
    const [boardKey, setBoardKey] = useState("");
    const [isSecret, setIsSecret] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [attachments, setAttachments] = useState<
        { url: string; name?: string | null; type?: string | null; size?: number | null }[]
    >([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { showToast } = useToast();
    const isAdmin = session?.user?.role === "ADMIN";

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const res = await fetch(`/api/boards${isAdmin ? "?all=true" : ""}`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : [];
                    setBoards(list);
                    const preferred = searchParams.get("board");
                    const matched = list.find((item) => item.key === preferred);
                    setBoardKey(matched?.key ?? list[0]?.key ?? "");
                } else {
                    const data = await res.json().catch(() => ({}));
                    setError(data.error || "게시판 목록을 불러오지 못했습니다.");
                }
            } catch {
                setError("게시판 목록을 불러오지 못했습니다.");
            }
        };
        fetchBoards();
    }, [isAdmin, searchParams]);

    if (status === "loading") {
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
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
                <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
                <p className="text-gray-500 mb-6">글을 작성하려면 로그인해주세요.</p>
                <Button asChild>
                    <Link href="/login">로그인하기</Link>
                </Button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const textContent = lexicalJsonToPlainText(content);
        if (!title.trim() || !textContent || !boardKey) {
            setError("제목, 내용, 게시판을 모두 선택해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
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
                const post = await res.json();
                router.push(`/community/${post.id}`);
            } else {
                const data = await res.json();
                setError(data.error || "글 작성에 실패했습니다.");
            }
        } catch {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
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
                <Link href={`/community${boardKey ? `?board=${boardKey}` : ""}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    목록으로
                </Link>
            </Button>

            <h1 className="font-display text-3xl mb-6">글쓰기</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="board">게시판</Label>
                    <Select value={boardKey} onValueChange={setBoardKey}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="게시판 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {boards.map((board) => (
                                <SelectItem key={board.id} value={board.key}>
                                    {board.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {boards.length === 0 && (
                        <p className="text-xs text-amber-600">
                            아직 생성된 게시판이 없습니다. 관리자에게 문의해주세요.
                        </p>
                    )}
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
                        disabled={loading}
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
                        disabled={loading || uploading}
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

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/community">취소</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "등록 중..." : "등록"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function WritePage() {
    return (
        <Suspense
            fallback={
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            }
        >
            <WritePageContent />
        </Suspense>
    );
}
