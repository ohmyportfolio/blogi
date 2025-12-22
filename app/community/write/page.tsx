"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function WritePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("FREE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

        // Strip HTML tags to check if content is empty
        const textContent = content.replace(/<[^>]*>/g, "").trim();
        if (!title.trim() || !textContent) {
            setError("제목과 내용을 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, type }),
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

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            <Button variant="ghost" className="mb-6" asChild>
                <Link href="/community">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    목록으로
                </Link>
            </Button>

            <h1 className="font-display text-3xl mb-6">글쓰기</h1>

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
                        disabled={loading}
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
