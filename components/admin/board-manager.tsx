"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";
export type BoardItem = {
  id: string;
  key: string;
  slug: string;
  menuItemId: string;
  name: string;
  description?: string | null;
  order: number;
  isVisible: boolean;
};

const blankBoard = {
  name: "",
  description: "",
  isVisible: true,
};

interface BoardManagerProps {
  boards: BoardItem[];
  menuItemId: string;
  groupSlug: string;
  disabled?: boolean;
}

export const BoardManager = ({
  boards,
  menuItemId,
  groupSlug,
  disabled = false,
}: BoardManagerProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [boardState, setBoardState] = useState<BoardItem[]>(boards.filter(Boolean));
  const [draft, setDraft] = useState<typeof blankBoard>(blankBoard);
  const [orderDirty, setOrderDirty] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    setBoardState(boards.filter(Boolean));
  }, [boards]);

  useEffect(() => {
    if (!showCreateForm) {
      setDraft(blankBoard);
    }
  }, [showCreateForm]);

  const nextBoardSlug = () => {
    const max = boardState.reduce((acc, item) => {
      const match = item.slug?.match(/^board-(\d+)$/);
      if (!match) return acc;
      return Math.max(acc, Number(match[1]));
    }, 0);
    return `board-${max + 1}`;
  };

  const updateBoardState = (updater: (items: BoardItem[]) => BoardItem[]) => {
    setBoardState((prev) => updater(prev));
  };

  const handleCreate = () => {
    if (!draft.name.trim()) {
      showToast("게시판 이름을 입력해주세요.", "error");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: { ...draft, menuItemId },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "게시판 생성에 실패했습니다.", "error");
        return;
      }
      const item = await res.json();
      updateBoardState((items) => [...items, item]);
      setDraft(blankBoard);
      setShowCreateForm(false);
      showToast("게시판이 추가되었습니다.", "success");
    });
  };

  const handleSave = (item: BoardItem) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: item.id,
          data: {
            name: item.name,
            description: item.description,
            isVisible: item.isVisible,
            menuItemId,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "게시판 저장에 실패했습니다.", "error");
        return;
      }
      const updated = await res.json();
      updateBoardState((items) =>
        items.map((target) => (target.id === updated.id ? updated : target))
      );
      showToast("게시판이 저장되었습니다.", "success");
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("이 게시판을 삭제할까요?")) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id, menuItemId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "게시판 삭제에 실패했습니다.", "error");
        return;
      }
      updateBoardState((items) => items.filter((item) => item.id !== id));
      showToast("게시판이 삭제되었습니다.", "success");
    });
  };

  const handleReorderSave = () => {
    const items = boardState.map((item, index) => ({ id: item.id, order: index + 1 }));
    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", items, menuItemId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "정렬 저장에 실패했습니다.", "error");
        return;
      }
      setOrderDirty(false);
      showToast("정렬이 저장되었습니다.", "success");
    });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    updateBoardState((items) => {
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setOrderDirty(true);
  };

  return (
    <div className="space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">게시판 목록</h2>
              <p className="text-sm text-gray-500">
                {groupSlug} 그룹의 게시판을 관리합니다. 드래그 또는 화살표로 순서를 조정하세요.
              </p>
            </div>
        <Button
          variant="secondary"
          onClick={handleReorderSave}
          disabled={disabled || isPending || !orderDirty}
        >
          정렬 저장
        </Button>
      </div>

      <div className="space-y-3">
        {boardState.filter(Boolean).map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const fromIndex = Number(event.dataTransfer.getData("text/plain"));
              if (Number.isNaN(fromIndex)) return;
              moveItem(fromIndex, index);
            }}
            className="rounded-xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={item.name}
                    onChange={(event) =>
                      updateBoardState((items) =>
                        items.map((target) =>
                          target.id === item.id ? { ...target, name: event.target.value } : target
                        )
                      )
                    }
                    placeholder="게시판 이름"
                    disabled={disabled}
                  />
                  <Input value={`${groupSlug}__${item.slug}`} disabled />
                </div>
                <Textarea
                  value={item.description ?? ""}
                  onChange={(event) =>
                    updateBoardState((items) =>
                      items.map((target) =>
                        target.id === item.id ? { ...target, description: event.target.value } : target
                      )
                    )
                  }
                  placeholder="게시판 설명 (선택)"
                  rows={2}
                  disabled={disabled}
                />
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={item.isVisible}
                    onChange={(event) =>
                      updateBoardState((items) =>
                        items.map((target) =>
                          target.id === item.id
                            ? { ...target, isVisible: event.target.checked }
                            : target
                        )
                      )
                    }
                    disabled={disabled}
                  />
                  노출
                </label>
              </div>

              <div className="flex flex-row gap-2 md:flex-col md:items-end">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => moveItem(index, Math.max(0, index - 1))}
                    disabled={disabled}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => moveItem(index, Math.min(boardState.length - 1, index + 1))}
                    disabled={disabled}
                  >
                    ↓
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => handleSave(item)} disabled={disabled || isPending}>
                    저장
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={disabled || isPending}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-4">
        {!showCreateForm ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowCreateForm(true)}
            disabled={disabled}
          >
            <Plus className="mr-2 h-4 w-4" />
            새 게시판 추가
          </Button>
        ) : (
          <>
            <h3 className="font-semibold mb-3">새 게시판 추가</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="게시판 이름"
                disabled={disabled}
              />
              <Input
                value={`${groupSlug}__${nextBoardSlug()}`}
                placeholder="URL 키 (자동 생성)"
                disabled
              />
            </div>
            <Textarea
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="게시판 설명 (선택)"
              rows={2}
              className="mt-3"
              disabled={disabled}
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={draft.isVisible}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, isVisible: event.target.checked }))
                  }
                  disabled={disabled}
                />
                노출
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(blankBoard);
                    setShowCreateForm(false);
                  }}
                  disabled={disabled || isPending}
                >
                  취소
                </Button>
                <Button type="button" onClick={handleCreate} disabled={disabled || isPending}>
                  추가
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
