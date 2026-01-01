"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  showOnHome: boolean;
  homeItemCount: number;
  requiresAuth?: boolean;
}

interface CategoryHomeSettingsClientProps {
  initialCategories: CategoryData[];
}

export default function CategoryHomeSettingsClient({
  initialCategories,
}: CategoryHomeSettingsClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);

  const handleSaveCategory = (categoryId: string, settings: Partial<CategoryData>) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/home-settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          ...settings,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId ? { ...category, ...settings } : category
        )
      );

      showToast("설정이 저장되었습니다.", "success");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <CategoryHomeSettingsItem
          key={category.id}
          category={category}
          isPending={isPending}
          onSave={handleSaveCategory}
        />
      ))}

      {categories.length === 0 && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center">
          <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
          <p className="text-sm text-gray-400 mt-2">
            메뉴 관리에서 카테고리를 먼저 추가해주세요.
          </p>
        </div>
      )}
    </div>
  );
}

const CategoryHomeSettingsItem = ({
  category,
  isPending,
  onSave,
}: {
  category: CategoryData;
  isPending: boolean;
  onSave: (categoryId: string, settings: Partial<CategoryData>) => void;
}) => {
  const [settings, setSettings] = useState({
    showOnHome: category.showOnHome,
    homeItemCount: category.homeItemCount,
  });

  useEffect(() => {
    setSettings({
      showOnHome: category.showOnHome,
      homeItemCount: category.homeItemCount,
    });
  }, [category.showOnHome, category.homeItemCount]);

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-sm">{category.name}</h3>
          <p className="text-sm text-gray-400 mt-1">/{category.slug}</p>
          {category.requiresAuth && (
            <p className="text-sm text-amber-600 mt-2">로그인 필요</p>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            setSettings({ ...settings, showOnHome: !settings.showOnHome })
          }
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            settings.showOnHome ? "bg-emerald-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.showOnHome ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {settings.showOnHome && (
        <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border border-emerald-100">
          <span className="text-sm text-emerald-700">표시 개수:</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.homeItemCount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  homeItemCount: Number(e.target.value),
                })
              }
              className="w-20 h-8 text-sm"
            />
            <span className="text-sm text-emerald-600">(최신 콘텐츠)</span>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button
          onClick={() => onSave(category.id, settings)}
          disabled={isPending}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-3 h-3 mr-1" />
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
};
