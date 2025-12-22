"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("FREE");
    const [authorId, setAuthorId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchPost = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/posts/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTitle(data.title);
                setContent(data.content);
                setType(data.type);
                setAuthorId(data.authorId);
            } else {
                router.push("/community");
            }
        } catch {
            router.push("/community");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            fetchPost();
        }
    }, [id, fetchPost]);

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

    // Check permission
    const isAuthor = session.user?.id === authorId;
    const isAdmin = session.user?.role === "ADMIN";
    if (!isAuthor && !isAdmin) {
        router.push("/community");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Strip HTML tags to check if content is empty
        const textContent = content.replace(/<[^>]*>/g, "").trim();
        if (!title.trim() || !textContent) {
            setError("제목과 내용을 모두 입력해주세요.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, type }),
            });

            if (res.ok) {
                router.push(`/community/${params.id}`);
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

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <Button variant="ghost" className="mb-6" asChild>
                <Link href={`/community/${id}`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    돌아가기
                </Link>
            </Button>

            <h1 className="font-display text-3xl mb-6">글 수정</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="type">게시판</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FREE">자유게시판</SelectItem>
                            <SelectItem value="REVIEW">후기</SelectItem>
                        </SelectContent>
                    </Select>
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
                        placeholder="내용을 입력하세요..."
                    />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" asChild>
                        <Link href={`/community/${id}`}>취소</Link>
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "저장 중..." : "저장"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
