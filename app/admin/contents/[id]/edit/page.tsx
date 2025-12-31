"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { lexicalJsonToPlainText } from "@/lib/lexical";

type CategoryOption = {
    id: string;
    name: string;
    slug: string;
};

export default function EditContentPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(true);
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [content, setContent] = useState("");
    const [contentMarkdown, setContentMarkdown] = useState("");
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const fetchContent = useCallback(async () => {
        if (!id) return;
        try {
            const res = await fetch(`/api/contents/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTitle(data.title);
                setCategoryId(data.categoryId || data.categoryRef?.id || "");
                setPrice(data.price || "");
                setImageUrl(data.imageUrl || "");
                setContent(data.content || "");
                setContentMarkdown(data.contentMarkdown || "");
                setIsVisible(Boolean(data.isVisible));
            } else {
                router.push("/admin/contents");
            }
        } catch {
            router.push("/admin/contents");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/categories?all=true");
            if (res.ok) {
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            } else {
                setCategories([]);
            }
        } catch {
            setCategories([]);
        } finally {
            setCategoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchContent();
        }
    }, [id, fetchContent]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !categoryId || !lexicalJsonToPlainText(content)) {
            setError("제목, 카테고리, 내용을 모두 입력해주세요.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/contents/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    categoryId,
                    price,
                    imageUrl,
                    content,
                    contentMarkdown,
                    isVisible,
                }),
            });

            if (res.ok) {
                router.push("/admin/contents");
            } else {
                const data = await res.json();
                setError(data.error || "콘텐츠 수정에 실패했습니다.");
            }
        } catch {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("scope", "contents");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "이미지 업로드에 실패했습니다.");
            }
        } catch {
            setError("이미지 업로드 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6" asChild>
                <Link href="/admin/contents">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    콘텐츠 목록으로
                </Link>
            </Button>

            <div className="bg-white p-6 md:p-8 rounded-lg shadow">
                <h1 className="font-display text-3xl mb-6">콘텐츠 수정</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">콘텐츠명</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="콘텐츠명을 입력하세요"
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">카테고리</Label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={saving || categoryLoading || categories.length === 0}
                            >
                                <option value="">카테고리 선택</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {categories.length === 0 && !categoryLoading && (
                                <p className="text-xs text-amber-600">
                                    메뉴 관리에서 콘텐츠 카테고리를 먼저 추가해주세요.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="price">가격 (선택)</Label>
                            <Input
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="예: ₩100,000 또는 문의"
                                disabled={saving}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">대표 이미지 업로드 (선택)</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={saving || uploading}
                            />
                            {uploading && (
                                <p className="text-xs text-gray-500">업로드 중...</p>
                            )}
                        </div>
                    </div>

                    {imageUrl && (
                        <div className="space-y-2">
                            <Label>대표 이미지 미리보기</Label>
                            <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden border border-black/5 bg-gray-50">
                                <Image
                                    src={imageUrl}
                                    alt="대표 이미지"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="isVisible">노출 여부</Label>
                        <select
                            id="isVisible"
                            value={isVisible ? "true" : "false"}
                            onChange={(e) => setIsVisible(e.target.value === "true")}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={saving}
                        >
                            <option value="true">노출</option>
                            <option value="false">숨김</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>콘텐츠 설명</Label>
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            onMarkdownChange={setContentMarkdown}
                            placeholder="콘텐츠에 대한 상세 설명을 입력하세요..."
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/contents">취소</Link>
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "저장 중..." : "저장"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
