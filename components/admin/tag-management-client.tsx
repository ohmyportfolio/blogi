"use client";

import { useState } from "react";
import { X, Plus, Globe, Tag as TagIcon, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface TagData {
    id: string;
    name: string;
    slug: string;
    order: number;
    categoryId: string | null;
}

interface CategoryWithTags {
    id: string;
    name: string;
    slug: string;
    tagFilterEnabled: boolean;
    tags: TagData[];
}

interface TagManagementClientProps {
    categories: CategoryWithTags[];
    initialGlobalTags: TagData[];
}

/** Split input by comma or # and return trimmed non-empty names */
const parseTagNames = (input: string): string[] => {
    return input
        .split(/[,#]/)
        .map((s) => s.trim())
        .filter(Boolean);
};

export const TagManagementClient = ({
    categories,
    initialGlobalTags,
}: TagManagementClientProps) => {
    const { showToast } = useToast();
    const [globalTags, setGlobalTags] = useState(initialGlobalTags);
    const [categoryTags, setCategoryTags] = useState<Record<string, TagData[]>>(
        Object.fromEntries(categories.map((c) => [c.id, c.tags]))
    );
    const [filterEnabled, setFilterEnabled] = useState<Record<string, boolean>>(
        Object.fromEntries(categories.map((c) => [c.id, c.tagFilterEnabled]))
    );
    const [newGlobalTagName, setNewGlobalTagName] = useState("");
    const [newCategoryTagNames, setNewCategoryTagNames] = useState<Record<string, string>>(
        Object.fromEntries(categories.map((c) => [c.id, ""]))
    );
    const [adding, setAdding] = useState(false);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const handleAddTags = async (input: string, categoryId?: string) => {
        const names = parseTagNames(input);
        if (names.length === 0) return;

        setAdding(true);
        const addedTags: TagData[] = [];
        const errors: string[] = [];

        for (const name of names) {
            try {
                const res = await fetch("/api/admin/tags", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        categoryId: categoryId || undefined,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    errors.push(data.error || `"${name}" 추가 실패`);
                    continue;
                }

                const tag = await res.json();
                addedTags.push(tag);
            } catch {
                errors.push(`"${name}" 추가 실패`);
            }
        }

        if (addedTags.length > 0) {
            if (categoryId) {
                setCategoryTags((prev) => ({
                    ...prev,
                    [categoryId]: [...(prev[categoryId] || []), ...addedTags],
                }));
                setNewCategoryTagNames((prev) => ({ ...prev, [categoryId]: "" }));
            } else {
                setGlobalTags((prev) => [...prev, ...addedTags]);
                setNewGlobalTagName("");
            }
            const tagNames = addedTags.map((t) => t.name).join(", ");
            showToast(`태그 추가됨: ${tagNames}`, "success");
        }

        if (errors.length > 0) {
            showToast(errors.join(", "), "error");
        }

        setAdding(false);
    };

    const handleDeleteTag = async (tagId: string, categoryId: string | null) => {
        try {
            const res = await fetch(`/api/admin/tags/${tagId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                showToast(data.error || "태그 삭제에 실패했습니다.", "error");
                return;
            }

            if (categoryId) {
                setCategoryTags((prev) => ({
                    ...prev,
                    [categoryId]: (prev[categoryId] || []).filter((t) => t.id !== tagId),
                }));
            } else {
                setGlobalTags((prev) => prev.filter((t) => t.id !== tagId));
            }
            showToast("태그가 삭제되었습니다.", "success");
        } catch {
            showToast("태그 삭제에 실패했습니다.", "error");
        }
    };

    const handleToggleFilter = async (categoryId: string) => {
        const newValue = !filterEnabled[categoryId];
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return;

        try {
            const res = await fetch("/api/admin/tags/filter-toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId,
                    enabled: newValue,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                showToast(data.error || "설정 변경에 실패했습니다.", "error");
                return;
            }

            setFilterEnabled((prev) => ({ ...prev, [categoryId]: newValue }));
            showToast(
                newValue
                    ? `${category.name} 태그 필터 활성화`
                    : `${category.name} 태그 필터 비활성화`,
                "success"
            );
        } catch {
            showToast("설정 변경에 실패했습니다.", "error");
        }
    };

    const toggleCategory = (id: string) => {
        setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-4">
            {/* 글로벌 태그 */}
            <div className="rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-amber-600" />
                        <h2 className="font-medium text-lg">글로벌 태그</h2>
                        <span className="text-xs text-gray-400 ml-1">모든 카테고리에서 공통 사용</span>
                    </div>

                    {globalTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {globalTags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200"
                                >
                                    {tag.name}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTag(tag.id, null)}
                                        className="hover:text-amber-900 transition-colors"
                                        title="삭제"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 mb-4">등록된 글로벌 태그가 없습니다.</p>
                    )}

                    <div className="flex items-center gap-2">
                        <Input
                            value={newGlobalTagName}
                            onChange={(e) => setNewGlobalTagName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTags(newGlobalTagName);
                                }
                            }}
                            placeholder="태그 입력 (쉼표 또는 #으로 여러 개 등록)"
                            className="flex-1 h-9 text-sm"
                            disabled={adding}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddTags(newGlobalTagName)}
                            disabled={adding || !newGlobalTagName.trim()}
                            className="h-9 bg-amber-600 hover:bg-amber-700"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            추가
                        </Button>
                    </div>
                </div>
            </div>

            {/* 카테고리별 전용 태그 */}
            {categories.map((category) => {
                const tags = categoryTags[category.id] || [];
                const isOpen = openCategories[category.id] ?? false;
                const tagName = newCategoryTagNames[category.id] || "";
                const isFilterOn = filterEnabled[category.id] ?? false;

                return (
                    <div
                        key={category.id}
                        className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <TagIcon className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{category.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {tags.length}개
                                </span>
                                {isFilterOn && (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                        필터 ON
                                    </span>
                                )}
                            </div>
                            {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3">
                                {/* 태그 필터 토글 */}
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-700">프론트엔드 태그 필터</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFilter(category.id);
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            isFilterOn ? "bg-green-500" : "bg-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                                isFilterOn ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                            >
                                                {tag.name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTag(tag.id, category.id)}
                                                    className="hover:text-blue-900 transition-colors"
                                                    title="삭제"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">등록된 전용 태그가 없습니다.</p>
                                )}

                                <div className="flex items-center gap-2">
                                    <Input
                                        value={tagName}
                                        onChange={(e) =>
                                            setNewCategoryTagNames((prev) => ({
                                                ...prev,
                                                [category.id]: e.target.value,
                                            }))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTags(tagName, category.id);
                                            }
                                        }}
                                        placeholder="태그 입력 (쉼표 또는 #으로 여러 개 등록)"
                                        className="flex-1 h-9 text-sm"
                                        disabled={adding}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleAddTags(tagName, category.id)}
                                        disabled={adding || !tagName.trim()}
                                        className="h-9"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        추가
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {categories.length === 0 && (
                <div className="rounded-2xl border border-black/5 bg-white p-8 text-center">
                    <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
                    <p className="text-sm text-gray-400 mt-1">
                        메뉴 관리에서 카테고리를 먼저 추가해주세요.
                    </p>
                </div>
            )}
        </div>
    );
};
