"use client";

import { useState } from "react";
import { X, Plus, Globe, Tag as TagIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface TagData {
  id: string;
  name: string;
  slug: string;
  order: number;
  categoryId: string | null;
}

interface TagManagerProps {
  categoryId: string;
  initialCategoryTags: TagData[];
  initialGlobalTags: TagData[];
}

export const TagManager = ({
  categoryId,
  initialCategoryTags,
  initialGlobalTags,
}: TagManagerProps) => {
  const { showToast } = useToast();
  const [categoryTags, setCategoryTags] = useState(initialCategoryTags);
  const [globalTags, setGlobalTags] = useState(initialGlobalTags);
  const [newTagName, setNewTagName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddTag = async (isGlobal: boolean) => {
    const name = newTagName.trim();
    if (!name) return;

    setAdding(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId: isGlobal ? undefined : categoryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "태그 추가에 실패했습니다.", "error");
        return;
      }

      const tag = await res.json();
      if (isGlobal) {
        setGlobalTags((prev) => [...prev, tag]);
      } else {
        setCategoryTags((prev) => [...prev, tag]);
      }
      setNewTagName("");
      showToast(`태그 "${name}"이(가) 추가되었습니다.`, "success");
    } catch {
      showToast("태그 추가에 실패했습니다.", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTag = async (tagId: string, isGlobal: boolean) => {
    try {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "태그 삭제에 실패했습니다.", "error");
        return;
      }

      if (isGlobal) {
        setGlobalTags((prev) => prev.filter((t) => t.id !== tagId));
      } else {
        setCategoryTags((prev) => prev.filter((t) => t.id !== tagId));
      }
      showToast("태그가 삭제되었습니다.", "success");
    } catch {
      showToast("태그 삭제에 실패했습니다.", "error");
    }
  };

  return (
    <div className="space-y-3">
      {/* 글로벌 태그 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Globe className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-gray-500">글로벌 태그</span>
          <span className="text-[10px] text-gray-400">(모든 카테고리 공통)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {globalTags.length === 0 && (
            <span className="text-xs text-gray-400">글로벌 태그가 없습니다</span>
          )}
          {globalTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleDeleteTag(tag.id, true)}
                className="hover:text-amber-900 transition-colors"
                title="삭제"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 카테고리 전용 태그 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TagIcon className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-medium text-gray-500">카테고리 전용 태그</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categoryTags.length === 0 && (
            <span className="text-xs text-gray-400">전용 태그가 없습니다</span>
          )}
          {categoryTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleDeleteTag(tag.id, false)}
                className="hover:text-blue-900 transition-colors"
                title="삭제"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 태그 추가 입력 */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag(false);
            }
          }}
          placeholder="새 태그 이름"
          className="flex-1 h-8 text-sm"
          disabled={adding}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleAddTag(false)}
          disabled={adding || !newTagName.trim()}
          className="h-8 text-xs whitespace-nowrap"
        >
          <Plus className="w-3 h-3 mr-1" />
          전용
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleAddTag(true)}
          disabled={adding || !newTagName.trim()}
          className="h-8 text-xs whitespace-nowrap border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Plus className="w-3 h-3 mr-1" />
          글로벌
        </Button>
      </div>
    </div>
  );
};
