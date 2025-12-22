"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const categories = [
    { value: "CASINO", label: "카지노" },
    { value: "NIGHTLIFE", label: "다낭 유흥" },
    { value: "PROMOTION", label: "프로모션" },
    { value: "VIP_TRIP", label: "VIP 여행" },
    { value: "TIP", label: "여행 TIP" },
    { value: "HOTEL_VILLA", label: "호텔 & 풀빌라" },
    { value: "GOLF", label: "골프 & 레저" },
];

export default function NewProductPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !category || !content.replace(/<[^>]*>/g, "").trim()) {
            setError("제목, 카테고리, 내용을 모두 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, category, price, imageUrl, content }),
            });

            if (res.ok) {
                router.push("/admin/products");
            } else {
                const data = await res.json();
                setError(data.error || "상품 등록에 실패했습니다.");
            }
        } catch {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6" asChild>
                <Link href="/admin/products">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    상품 목록으로
                </Link>
            </Button>

            <div className="bg-white p-6 md:p-8 rounded-lg shadow">
                <h1 className="font-display text-3xl mb-6">새 상품 등록</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">상품명</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="상품명을 입력하세요"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">카테고리</Label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading}
                            >
                                <option value="">카테고리 선택</option>
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
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
                            <Label htmlFor="imageUrl">대표 이미지 URL (선택)</Label>
                            <Input
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>상품 설명</Label>
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="상품에 대한 상세 설명을 입력하세요..."
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/products">취소</Link>
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "등록 중..." : "상품 등록"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
