"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HomeGridLayoutClientProps {
  menuNames: string[];
  initialLayout: number[];
}

/** 메뉴 수에 맞춰 행별 열 수 배열 생성 (기본 3열) */
function buildDefaultLayout(totalItems: number): number[] {
  const rows: number[] = [];
  let remaining = totalItems;
  while (remaining > 0) {
    const cols = Math.min(3, remaining);
    rows.push(cols);
    remaining -= cols;
  }
  return rows;
}

/** layout 배열에서 총 아이템 수 계산 */
function layoutTotal(layout: number[]): number {
  return layout.reduce((sum, cols) => sum + cols, 0);
}

/** 메뉴 수에 맞춰 layout 조정: 부족하면 행 추가, 초과하면 행 제거 */
function adjustLayout(layout: number[], totalItems: number): number[] {
  const result = [...layout];
  let total = layoutTotal(result);

  // 초과: 마지막 행부터 줄이기
  while (total > totalItems && result.length > 0) {
    const diff = total - totalItems;
    const lastRow = result[result.length - 1];
    if (lastRow <= diff) {
      result.pop();
      total -= lastRow;
    } else {
      result[result.length - 1] = lastRow - diff;
      total = totalItems;
    }
  }

  // 부족: 행 추가
  while (total < totalItems) {
    const remaining = totalItems - total;
    const cols = Math.min(3, remaining);
    result.push(cols);
    total += cols;
  }

  return result;
}

export default function HomeGridLayoutClient({
  menuNames,
  initialLayout,
}: HomeGridLayoutClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const totalItems = menuNames.length;
  const defaultLayout = initialLayout.length > 0
    ? adjustLayout(initialLayout, totalItems)
    : buildDefaultLayout(totalItems);

  const [layout, setLayout] = useState<number[]>(defaultLayout);

  // 행의 열 수 변경
  const handleChangeRow = (rowIndex: number, newCols: number) => {
    const updated = [...layout];
    updated[rowIndex] = newCols;
    setLayout(adjustLayout(updated, totalItems));
  };

  // 미리보기용: 메뉴를 행별로 분배
  const rows: { cols: number; items: string[] }[] = [];
  let itemIdx = 0;
  for (const cols of layout) {
    const items = menuNames.slice(itemIdx, itemIdx + cols);
    rows.push({ cols, items });
    itemIdx += cols;
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await fetch("/api/admin/home-settings/grid-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      showToast("레이아웃이 저장되었습니다.", "success");
      router.refresh();
    });
  };

  if (totalItems === 0) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h2 className="font-display text-xl">메뉴 그리드 레이아웃</h2>
        <p className="text-sm text-gray-500 mt-2">
          모바일 홈 화면의 메뉴 배치를 행별로 설정합니다.
        </p>
      </div>

      {/* 미리보기 + 행별 설정 */}
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-3">
            {/* 그리드 미리보기 */}
            <div
              className={cn(
                "flex-1 grid gap-1.5",
                row.cols === 1 && "grid-cols-1",
                row.cols === 2 && "grid-cols-2",
                row.cols === 3 && "grid-cols-3",
              )}
            >
              {row.items.map((name, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg border border-gray-200 flex items-center justify-center h-14"
                >
                  <span className="text-[11px] text-gray-500 font-medium truncate px-1">
                    {name}
                  </span>
                </div>
              ))}
            </div>

            {/* 열 수 선택기 */}
            <div className="flex gap-1 shrink-0">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => handleChangeRow(rowIndex, cols)}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium transition-colors",
                    row.cols === cols
                      ? "bg-emerald-500 text-white"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50",
                  )}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-3 h-3 mr-1" />
          {isPending ? "저장 중..." : "레이아웃 저장"}
        </Button>
      </div>
    </div>
  );
}
