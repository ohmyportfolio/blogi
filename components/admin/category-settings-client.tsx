"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Save,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  listViewEnabled: boolean;
  listViewCount: number;
  listViewLabel: string | null;
  cardViewEnabled: boolean;
  cardViewCount: number;
  cardViewLabel: string | null;
  displayOrder: string;
  showOnHome: boolean;
  homeItemCount: number;
}

interface CategorySettingsClientProps {
  initialCategories: CategoryData[];
}

export const CategorySettingsClient = ({
  initialCategories,
}: CategorySettingsClientProps) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [bulkOpen, setBulkOpen] = useState(false);

  // 일괄 설정 상태
  const [bulkSettings, setBulkSettings] = useState({
    listViewEnabled: false,
    listViewCount: 10,
    listViewLabel: "",
    cardViewEnabled: true,
    cardViewCount: 0,
    cardViewLabel: "",
    displayOrder: "card",
    showOnHome: false,
    homeItemCount: 3,
  });

  // 일괄 적용
  const handleApplyAll = () => {
    if (!bulkSettings.listViewEnabled && !bulkSettings.cardViewEnabled) {
      showToast("리스트형 또는 카드형 중 하나는 활성화해야 합니다.", "error");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/category-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applyToAll: true,
          ...bulkSettings,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      // 모든 카테고리 상태 업데이트
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          listViewEnabled: bulkSettings.listViewEnabled,
          listViewCount: bulkSettings.listViewCount,
          listViewLabel: bulkSettings.listViewLabel || null,
          cardViewEnabled: bulkSettings.cardViewEnabled,
          cardViewCount: bulkSettings.cardViewCount,
          cardViewLabel: bulkSettings.cardViewLabel || null,
          displayOrder: bulkSettings.displayOrder,
          showOnHome: bulkSettings.showOnHome,
          homeItemCount: bulkSettings.homeItemCount,
        }))
      );

      showToast("모든 카테고리에 설정이 적용되었습니다.", "success");
    });
  };

  // 개별 카테고리 저장
  const handleSaveCategory = (categoryId: string, settings: Partial<CategoryData>) => {
    if (!settings.listViewEnabled && !settings.cardViewEnabled) {
      showToast("리스트형 또는 카드형 중 하나는 활성화해야 합니다.", "error");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/category-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: categoryId,
          ...settings,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      // 해당 카테고리 상태 업데이트
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, ...settings } : cat
        )
      );

      showToast("설정이 저장되었습니다.", "success");
    });
  };

  return (
    <div className="space-y-4">
      {/* 전체 일괄 설정 */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setBulkOpen(!bulkOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              전체 카테고리 일괄 설정
            </span>
          </div>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            {bulkOpen ? "닫기" : "펼치기"}
          </span>
        </button>

        {bulkOpen && (
          <div className="p-4 pt-0 space-y-4 border-t border-blue-200">
            <p className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
              아래 설정을 모든 카테고리에 동일하게 적용합니다.
            </p>

            <SettingsPanel
              settings={bulkSettings}
              onChange={setBulkSettings}
              isPending={isPending}
              onSave={handleApplyAll}
              saveLabel="전체 카테고리에 적용"
              bgVariant="white"
            />
          </div>
        )}
      </div>

      {/* 개별 카테고리 설정 */}
      {categories.map((category) => (
        <CategorySettingsItem
          key={category.id}
          category={category}
          isPending={isPending}
          onSave={(settings) => handleSaveCategory(category.id, settings)}
        />
      ))}
    </div>
  );
};

// 개별 카테고리 아이템
const CategorySettingsItem = ({
  category,
  isPending,
  onSave,
}: {
  category: CategoryData;
  isPending: boolean;
  onSave: (settings: Partial<CategoryData>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    listViewEnabled: category.listViewEnabled,
    listViewCount: category.listViewCount,
    listViewLabel: category.listViewLabel || "",
    cardViewEnabled: category.cardViewEnabled,
    cardViewCount: category.cardViewCount,
    cardViewLabel: category.cardViewLabel || "",
    displayOrder: category.displayOrder,
    showOnHome: category.showOnHome,
    homeItemCount: category.homeItemCount,
  });

  // 외부에서 category가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setSettings({
      listViewEnabled: category.listViewEnabled,
      listViewCount: category.listViewCount,
      listViewLabel: category.listViewLabel || "",
      cardViewEnabled: category.cardViewEnabled,
      cardViewCount: category.cardViewCount,
      cardViewLabel: category.cardViewLabel || "",
      displayOrder: category.displayOrder,
      showOnHome: category.showOnHome,
      homeItemCount: category.homeItemCount,
    });
  }, [category]);

  return (
    <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">{category.name}</span>
          <span className="text-xs text-gray-400">/{category.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          {category.listViewEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs">
              <List className="w-3 h-3" />
              리스트
            </span>
          )}
          {category.cardViewEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-600 text-xs">
              <LayoutGrid className="w-3 h-3" />
              카드
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            isPending={isPending}
            onSave={() => onSave(settings)}
            saveLabel="저장"
            bgVariant="muted"
          />
        </div>
      )}
    </div>
  );
};

// 설정 타입 정의
interface SettingsData {
  listViewEnabled: boolean;
  listViewCount: number;
  listViewLabel: string;
  cardViewEnabled: boolean;
  cardViewCount: number;
  cardViewLabel: string;
  displayOrder: string;
  showOnHome: boolean;
  homeItemCount: number;
}

// 공통 설정 패널
const SettingsPanel = ({
  settings,
  onChange,
  isPending,
  onSave,
  saveLabel,
  bgVariant,
}: {
  settings: SettingsData;
  onChange: (settings: SettingsData) => void;
  isPending: boolean;
  onSave: () => void;
  saveLabel: string;
  bgVariant: "white" | "muted";
}) => {
  const panelClass = cn(
    "p-4 rounded-xl border border-gray-200",
    bgVariant === "white" ? "bg-white" : "bg-gray-50/50"
  );
  return (
    <>
      {/* 리스트형 설정 */}
      <div className={panelClass}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">리스트형</span>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({ ...settings, listViewEnabled: !settings.listViewEnabled })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.listViewEnabled ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.listViewEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {settings.listViewEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">표시 개수:</span>
              <Input
                type="number"
                min={0}
                value={settings.listViewCount}
                onChange={(e) =>
                  onChange({ ...settings, listViewCount: Number(e.target.value) })
                }
                className="w-20 h-8 text-sm"
              />
              <span className="text-xs text-gray-400">(0 = 전체, 페이징 적용)</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">섹션 제목:</span>
              <Input
                type="text"
                value={settings.listViewLabel}
                onChange={(e) =>
                  onChange({ ...settings, listViewLabel: e.target.value })
                }
                placeholder="비어있으면 표시 안함"
                className="flex-1 h-8 text-sm max-w-[200px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 카드형 설정 */}
      <div className={panelClass}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-green-600" />
            <span className="font-medium text-sm">카드형</span>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({ ...settings, cardViewEnabled: !settings.cardViewEnabled })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.cardViewEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.cardViewEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {settings.cardViewEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">표시 개수:</span>
              <Input
                type="number"
                min={0}
                value={settings.cardViewCount}
                onChange={(e) =>
                  onChange({ ...settings, cardViewCount: Number(e.target.value) })
                }
                className="w-20 h-8 text-sm"
              />
              <span className="text-xs text-gray-400">(0 = 전체, 페이징 적용)</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">섹션 제목:</span>
              <Input
                type="text"
                value={settings.cardViewLabel}
                onChange={(e) =>
                  onChange({ ...settings, cardViewLabel: e.target.value })
                }
                placeholder="비어있으면 표시 안함"
                className="flex-1 h-8 text-sm max-w-[200px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 표시 순서 (둘 다 활성화 시) */}
      {settings.listViewEnabled && settings.cardViewEnabled && (
        <div className={panelClass}>
          <span className="text-sm font-medium text-gray-700 block mb-2">
            표시 순서
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...settings, displayOrder: "list" })}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                settings.displayOrder === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              리스트 먼저
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...settings, displayOrder: "card" })}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                settings.displayOrder === "card"
                  ? "bg-green-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              카드 먼저
            </button>
          </div>
        </div>
      )}

      {/* 메인 페이지 노출 설정 */}
      <div className={`p-4 rounded-xl border border-purple-200 bg-purple-50/50`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm text-purple-900">메인 페이지 노출</span>
          <button
            type="button"
            onClick={() =>
              onChange({ ...settings, showOnHome: !settings.showOnHome })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.showOnHome ? "bg-purple-500" : "bg-gray-300"
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-purple-700">표시 개수:</span>
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.homeItemCount}
              onChange={(e) =>
                onChange({ ...settings, homeItemCount: Number(e.target.value) })
              }
              className="w-20 h-8 text-sm"
            />
            <span className="text-xs text-purple-600">(최신 콘텐츠)</span>
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isPending}
          className={saveLabel.includes("전체") ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          <Save className="w-4 h-4 mr-1" />
          {isPending ? "저장 중..." : saveLabel}
        </Button>
      </div>
    </>
  );
};
