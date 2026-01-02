"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Plus, GripVertical, ChevronUp, ChevronDown, Trash2, Save, Eye, EyeOff } from "lucide-react";

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
  slug: "",
  description: "",
  isVisible: true,
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;

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
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [boardState, setBoardState] = useState<BoardItem[]>(boards.filter(Boolean));
  const [draft, setDraft] = useState<typeof blankBoard>(blankBoard);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dragState, setDragState] = useState<{
    fromIndex: number;
    overIndex: number | null;
  } | null>(null);

  useEffect(() => {
    setBoardState(boards.filter(Boolean));
  }, [boards]);

  useEffect(() => {
    if (!showCreateForm) {
      setDraft(blankBoard);
    }
  }, [showCreateForm]);

  const getSuggestedBoardSlug = () => {
    const usedSlugs = new Set(boardState.map((item) => item.slug).filter(Boolean));
    let index = 1;
    while (usedSlugs.has(`board-${index}`)) {
      index += 1;
    }
    return `board-${index}`;
  };

  const isSlugDuplicate = (slug: string) => {
    if (!slug) return false;
    return boardState.some((b) => b.slug === slug);
  };

  const isSlugValid = (slug: string) => {
    if (!slug) return true;
    return SLUG_PATTERN.test(slug);
  };

  const updateBoardState = (updater: (items: BoardItem[]) => BoardItem[]) => {
    setBoardState((prev) => updater(prev));
  };

  const handleCreate = () => {
    if (!draft.name.trim()) {
      showToast("게시판 이름을 입력해주세요.", "error");
      return;
    }
    const inputSlug = draft.slug?.trim();
    if (inputSlug) {
      if (!isSlugValid(inputSlug)) {
        showToast("슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.", "error");
        return;
      }
      if (isSlugDuplicate(inputSlug)) {
        showToast("이미 사용 중인 슬러그입니다.", "error");
        return;
      }
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          data: inputSlug ? { ...draft, slug: inputSlug, menuItemId } : { ...draft, menuItemId },
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

  const handleDelete = async (id: string, boardName: string) => {
    // 1단계: 게시글 수 확인
    const countRes = await fetch(`/api/admin/boards/${id}/posts`);
    let postCount = 0;
    if (countRes.ok) {
      const data = await countRes.json();
      postCount = data.count || 0;
    }

    // 2단계: 확인 메시지 (휴지통 이동)
    let confirmMessage = `"${boardName}" 게시판을 휴지통으로 이동하시겠습니까?`;
    if (postCount > 0) {
      confirmMessage = `"${boardName}" 게시판(게시글 ${postCount}개)을 휴지통으로 이동하시겠습니까?\n\n게시글은 유지되며, 관리자 > 휴지통에서 복구하거나 영구 삭제할 수 있습니다.`;
    }

    const confirmed = await confirm({
      title: "휴지통으로 이동",
      message: confirmMessage,
      confirmText: "이동",
      variant: "warning",
    });
    if (!confirmed) return;

    // 3단계: 삭제 실행 (soft delete)
    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id, menuItemId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "게시판 이동에 실패했습니다.", "error");
        return;
      }
      const result = await res.json();
      updateBoardState((items) => items.filter((item) => item.id !== id));
      showToast(result.message || "게시판이 휴지통으로 이동되었습니다.", "success");
    });
  };

  const handleDeleteAllPosts = async (boardId: string, boardName: string) => {
    // 1단계: 게시글 수 확인
    const res = await fetch(`/api/admin/boards/${boardId}/posts`);
    if (!res.ok) {
      showToast("게시글 정보를 불러올 수 없습니다.", "error");
      return;
    }
    const { count } = await res.json();

    if (count === 0) {
      showToast("삭제할 게시글이 없습니다.", "info");
      return;
    }

    // 2단계: 경고 + 확인
    const firstConfirm = await confirm({
      title: "게시글 전체 삭제",
      message: `정말로 "${boardName}" 게시판의 모든 게시글(${count}개)을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: "삭제",
      variant: "danger",
    });
    if (!firstConfirm) return;

    // 3단계: 재확인 (게시글이 많은 경우)
    if (count > 10) {
      const doubleConfirmed = await confirm({
        title: "최종 확인",
        message: `마지막 확인: ${count}개의 게시글이 영구 삭제됩니다. 계속하시겠습니까?`,
        confirmText: "영구 삭제",
        variant: "danger",
      });
      if (!doubleConfirmed) return;
    }

    // 4단계: 삭제 실행
    startTransition(async () => {
      const deleteRes = await fetch(`/api/admin/boards/${boardId}/posts`, {
        method: "DELETE",
      });

      if (deleteRes.ok) {
        const { deleted } = await deleteRes.json();
        showToast(`${deleted}개의 게시글이 삭제되었습니다.`, "success");
      } else {
        showToast("삭제 중 오류가 발생했습니다.", "error");
      }
    });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    // 유효성 검사
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= boardState.length || toIndex >= boardState.length) return;

    // 자동 저장용 데이터 미리 계산
    const updated = [...boardState];
    const [moved] = updated.splice(fromIndex, 1);
    if (!moved) return;
    updated.splice(toIndex, 0, moved);
    const items = updated.map((item, idx) => ({ id: item.id, order: idx + 1 }));

    // 상태 업데이트
    setBoardState(updated);

    // 자동 저장
    fetch("/api/admin/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", items, menuItemId }),
    }).then((res) => {
      if (res.ok) {
        showToast("순서가 저장되었습니다.", "success");
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          게시판 ({boardState.length}개)
        </div>
      </div>

      {/* 게시판 목록 */}
      {boardState.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="divide-y divide-gray-100">
            {boardState.filter(Boolean).map((item, index) => {
              const isDragging = dragState?.fromIndex === index;
              const fromIdx = dragState?.fromIndex ?? -1;
              const overIdx = dragState?.overIndex ?? -1;
              const showDropBefore = overIdx === index && fromIdx !== index && fromIdx > index;
              const showDropAfter = overIdx === index && fromIdx !== index && fromIdx < index;

              return (
              <div
                key={item.id}
                draggable={!disabled}
                onDragStart={(event) => {
                  event.stopPropagation();
                  event.dataTransfer.setData("text/plain", String(index));
                  event.dataTransfer.effectAllowed = "move";
                  setDragState({ fromIndex: index, overIndex: null });
                }}
                onDragOver={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dragState && dragState.overIndex !== index) {
                    setDragState((prev) => prev ? { ...prev, overIndex: index } : null);
                  }
                }}
                onDragLeave={(event) => {
                  event.stopPropagation();
                  if (dragState?.overIndex === index) {
                    setDragState((prev) => prev ? { ...prev, overIndex: null } : null);
                  }
                }}
                onDrop={(event) => {
                  event.stopPropagation();
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  if (Number.isNaN(from)) return;
                  moveItem(from, index);
                  setDragState(null);
                }}
                onDragEnd={(event) => {
                  event.stopPropagation();
                  setDragState(null);
                }}
                className={`group relative ${
                  isDragging ? "opacity-40" : ""
                }`}
              >
                {/* 드롭 위치 인디케이터 - 위 */}
                {showDropBefore && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10">
                    <div className="absolute -top-1 left-2 w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                )}
                {/* 드롭 위치 인디케이터 - 아래 */}
                {showDropAfter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10">
                    <div className="absolute -bottom-1 left-2 w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50/50">
                  {/* 드래그 핸들 */}
                  <div className={`cursor-grab text-gray-300 hover:text-gray-500 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>

                  {/* 순서 번호 */}
                  <div className="w-5 text-center text-xs text-gray-400 font-medium">
                    {index + 1}
                  </div>

                  {/* 게시판명 */}
                  <div className="flex-1 min-w-0">
                    <Input
                      value={item.name}
                      onChange={(event) =>
                        updateBoardState((items) =>
                          items.map((target) =>
                            target.id === item.id ? { ...target, name: event.target.value } : target
                          )
                        )
                      }
                      className="h-7 text-xs"
                      placeholder="게시판 이름"
                      disabled={disabled}
                    />
                  </div>

                  {/* 슬러그 */}
                  <div className="w-24 text-xs text-gray-400 truncate hidden sm:block">
                    {item.slug}
                  </div>

                  {/* 노출 토글 */}
                  <button
                    type="button"
                    onClick={() =>
                      updateBoardState((items) =>
                        items.map((target) =>
                          target.id === item.id
                            ? { ...target, isVisible: !target.isVisible }
                            : target
                        )
                      )
                    }
                    disabled={disabled}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                      item.isVisible
                        ? "text-green-600 bg-green-50 hover:bg-green-100"
                        : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {item.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {item.isVisible ? "노출" : "숨김"}
                  </button>

                  {/* 순서 버튼 */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => moveItem(index, Math.max(0, index - 1))}
                      disabled={disabled || index === 0}
                      className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, Math.min(boardState.length - 1, index + 1))}
                      disabled={disabled || index === boardState.length - 1}
                      className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(item)}
                      disabled={disabled || isPending}
                      className="h-6 px-1.5 text-xs"
                    >
                      <Save className="h-3 w-3 mr-0.5" />
                      저장
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAllPosts(item.id, item.name)}
                      disabled={disabled || isPending}
                      className="h-6 px-1.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="이 게시판의 모든 게시글을 삭제합니다"
                    >
                      <Trash2 className="h-3 w-3 mr-0.5" />
                      글 삭제
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={disabled || isPending}
                      className="h-6 px-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-0.5" />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 새 게시판 추가 */}
      <div className="rounded-lg border border-dashed border-gray-300 bg-white/50">
        {!showCreateForm ? (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            disabled={disabled}
            className="w-full p-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            새 게시판
          </button>
        ) : (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="게시판 이름"
                className="w-28 h-8 text-sm"
                disabled={disabled}
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">{groupSlug}__</span>
                <Input
                  value={draft.slug}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                  placeholder={getSuggestedBoardSlug()}
                  className={`w-24 h-8 text-sm ${
                    draft.slug && !isSlugValid(draft.slug)
                      ? "border-red-500 focus:ring-red-500"
                      : draft.slug && isSlugDuplicate(draft.slug)
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, isVisible: !prev.isVisible }))
                }
                disabled={disabled}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  draft.isVisible
                    ? "text-green-600 bg-green-50"
                    : "text-gray-400 bg-gray-100"
                }`}
              >
                {draft.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {draft.isVisible ? "노출" : "숨김"}
              </button>
              <div className="flex gap-1.5 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft(blankBoard);
                    setShowCreateForm(false);
                  }}
                  disabled={disabled || isPending}
                  className="h-7 text-xs"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreate}
                  disabled={disabled || isPending}
                  className="h-7 text-xs"
                >
                  추가
                </Button>
              </div>
            </div>
            {draft.slug && isSlugDuplicate(draft.slug) && (
              <div className="text-xs text-red-500">이미 사용 중인 슬러그입니다.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
