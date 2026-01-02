"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import Link from "next/link";
import { ArrowLeft, Crop } from "lucide-react";
import Image from "next/image";
import { lexicalJsonToPlainText } from "@/lib/lexical";
import { ImageCropper } from "@/components/admin/image-cropper";

type CategoryOption = {
    id: string;
    name: string;
    slug: string;
};

export default function NewContentPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(true);
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [content, setContent] = useState("");
    const [contentMarkdown, setContentMarkdown] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [cropperImage, setCropperImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
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
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !categoryId || !lexicalJsonToPlainText(content)) {
            setError("제목, 카테고리, 내용을 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/contents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, categoryId, price, imageUrl, content, contentMarkdown }),
            });

            if (res.ok) {
                router.push("/admin/contents");
            } else {
                const data = await res.json();
                setError(data.error || "콘텐츠 작성에 실패했습니다.");
            }
        } catch {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("이미지 파일만 업로드할 수 있습니다.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropperImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropperImage(null);
        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", croppedBlob, "thumbnail.jpg");
        formData.append("scope", "contents");

        try {
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
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6" asChild>
                <Link href="/admin/contents">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    콘텐츠 목록으로
                </Link>
            </Button>

            <div className="bg-white p-6 md:p-8 rounded-lg shadow">
                <h1 className="font-display text-3xl mb-6">콘텐츠 작성</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">콘텐츠명</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="콘텐츠명을 입력하세요"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">카테고리</Label>
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading || categoryLoading || categories.length === 0}
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
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">대표 이미지 업로드 (선택)</Label>
                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <Crop className="w-4 h-4" />
                                    {uploading ? "업로드 중..." : "이미지 선택 및 크롭"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        disabled={loading || uploading}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">1:1 정사각형으로 크롭됩니다 (모바일 최적화)</p>
                        </div>
                    </div>

                    {imageUrl && (
                        <div className="space-y-2">
                            <Label>대표 이미지 미리보기</Label>
                            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-black/5 bg-gray-50">
                                <Image
                                    src={imageUrl}
                                    alt="대표 이미지"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                                >
                                    <span className="sr-only">삭제</span>
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 크롭 모달 */}
                    {cropperImage && (
                        <ImageCropper
                            imageSrc={cropperImage}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setCropperImage(null)}
                        />
                    )}

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
                        <Button type="submit" disabled={loading}>
                            {loading ? "작성 중..." : "콘텐츠 작성"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
