"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, GripVertical, Check } from "lucide-react";

interface NoticeItem {
  id: string;
  text: string;
  link?: string;
}

type ColorPreset = "amber" | "red" | "green" | "blue" | "slate" | "dark" | "indigo" | "coral" | "teal";

const presetOptions: { key: ColorPreset; label: string; colors: string; ring: string; textColor?: string }[] = [
  { key: "amber", label: "골드", colors: "bg-amber-50 border-2 border-amber-300", ring: "ring-amber-400" },
  { key: "red", label: "레드", colors: "bg-red-50 border-2 border-red-300", ring: "ring-red-400" },
  { key: "green", label: "그린", colors: "bg-emerald-50 border-2 border-emerald-300", ring: "ring-emerald-400" },
  { key: "blue", label: "블루", colors: "bg-sky-50 border-2 border-sky-300", ring: "ring-sky-400" },
  { key: "slate", label: "그레이", colors: "bg-slate-100 border-2 border-slate-300", ring: "ring-slate-400" },
  { key: "dark", label: "다크", colors: "bg-neutral-900 border-2 border-neutral-700", ring: "ring-neutral-500", textColor: "text-neutral-300" },
  { key: "indigo", label: "인디고", colors: "bg-gradient-to-r from-indigo-600 to-violet-600 border-2 border-indigo-400", ring: "ring-indigo-400", textColor: "text-white" },
  { key: "coral", label: "코럴다크", colors: "bg-slate-900 border-2 border-orange-400/50", ring: "ring-orange-400", textColor: "text-orange-400" },
  { key: "teal", label: "틸", colors: "bg-teal-600 border-2 border-teal-400", ring: "ring-teal-400", textColor: "text-amber-100" },
];

interface NoticeSettingsFormProps {
  initialData: {
    noticeTickerEnabled: boolean;
    noticeItems: NoticeItem[];
    noticeColorPreset: string;
  };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function NoticeSettingsForm({ initialData }: NoticeSettingsFormProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialData.noticeTickerEnabled);
  const [colorPreset, setColorPreset] = useState<ColorPreset>(
    (initialData.noticeColorPreset as ColorPreset) || "amber"
  );
  const [items, setItems] = useState<NoticeItem[]>(
    initialData.noticeItems.length > 0
      ? initialData.noticeItems
      : []
  );

  const addItem = () => {
    setItems((prev) => [...prev, { id: generateId(), text: "", link: "" }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: "text" | "link", value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.text.trim().length > 0);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noticeTickerEnabled: enabled,
            noticeColorPreset: colorPreset,
            noticeItems: validItems.map((item) => ({
              id: item.id,
              text: item.text.trim(),
              ...(item.link?.trim() ? { link: item.link.trim() } : {}),
            })),
          }),
        });

        if (!res.ok) {
          showToast("저장에 실패했습니다.", "error");
          return;
        }

        showToast("공지사항 설정이 저장되었습니다.", "success");
      } catch {
        showToast("저장 중 오류가 발생했습니다.", "error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 노출 토글 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">공지사항 바 노출</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            홈 페이지 상단에 공지사항 바를 표시합니다.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* 색상 팔레트 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">색상 테마</h3>
        <div className="flex flex-wrap gap-3">
          {presetOptions.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setColorPreset(preset.key)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 w-[72px] transition-all ${
                preset.colors
              } ${
                colorPreset === preset.key
                  ? `ring-2 ${preset.ring} ring-offset-2`
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {colorPreset === preset.key && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span className={`text-[11px] font-semibold ${
                preset.textColor ?? "text-gray-700"
              }`}>
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* 공지사항 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">공지사항 문구</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">
              등록된 공지사항이 없습니다. 위 추가 버튼을 눌러 공지를 등록하세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition hover:border-gray-300"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center pt-2.5 text-gray-300">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        문구 #{index + 1}
                      </label>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateItem(item.id, "text", e.target.value)}
                        placeholder="공지사항 문구를 입력하세요"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        링크 (선택)
                      </label>
                      <input
                        type="text"
                        value={item.link ?? ""}
                        onChange={(e) => updateItem(item.id, "link", e.target.value)}
                        placeholder="/contents/casino 또는 /community/reviews"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-2.5 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 저장 */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
