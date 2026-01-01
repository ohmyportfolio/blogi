"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface BoardData {
  id: string;
  name: string;
  slug: string;
  key: string;
  menuItemId: string;
  showOnHome: boolean;
  homeItemCount: number;
}

interface GroupData {
  menuItemId: string;
  label: string;
  href: string;
  slug: string;
  order: number;
  isVisible: boolean;
  boards: BoardData[];
}

interface BoardHomeSettingsClientProps {
  initialGroups: GroupData[];
}

export default function BoardHomeSettingsClient({
  initialGroups,
}: BoardHomeSettingsClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groups, setGroups] = useState(initialGroups);
  const visibleGroups = groups.filter((group) => group.boards.length > 0);

  const handleSaveBoard = (boardId: string, settings: Partial<BoardData>) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/board-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          ...settings,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      // 상태 업데이트
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          boards: group.boards.map((board) =>
            board.id === boardId ? { ...board, ...settings } : board
          ),
        }))
      );

      showToast("설정이 저장되었습니다.", "success");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {visibleGroups.map((group) => (
        <GroupSection
          key={group.menuItemId}
          group={group}
          isPending={isPending}
          onSave={handleSaveBoard}
        />
      ))}

      {visibleGroups.length === 0 && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center">
          <p className="text-gray-500">등록된 게시판이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">
            커뮤니티 메뉴에서 게시판을 먼저 추가해주세요.
          </p>
        </div>
      )}
    </div>
  );
}

// 그룹 섹션
const GroupSection = ({
  group,
  isPending,
  onSave,
}: {
  group: GroupData;
  isPending: boolean;
  onSave: (boardId: string, settings: Partial<BoardData>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (group.boards.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-lg">{group.label}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {group.boards.length}개 게시판
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-3 border-t border-gray-100">
          {group.boards.map((board) => (
            <BoardSettingsItem
              key={board.id}
              board={board}
              isPending={isPending}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 개별 게시판 아이템
const BoardSettingsItem = ({
  board,
  isPending,
  onSave,
}: {
  board: BoardData;
  isPending: boolean;
  onSave: (boardId: string, settings: Partial<BoardData>) => void;
}) => {
  const [settings, setSettings] = useState({
    showOnHome: board.showOnHome,
    homeItemCount: board.homeItemCount,
  });

  const handleSave = () => {
    onSave(board.id, settings);
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-sm">{board.name}</h3>
          <p className="text-xs text-gray-400 mt-1">/{board.slug}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setSettings({ ...settings, showOnHome: !settings.showOnHome })
          }
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            settings.showOnHome ? "bg-teal-500" : "bg-gray-300"
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
        <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border border-teal-100">
          <span className="text-sm text-teal-700">표시 개수:</span>
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
            <span className="text-xs text-teal-600">(최신 글)</span>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Save className="w-3 h-3 mr-1" />
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
};
