"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RotateCcw, Trash2, AlertTriangle } from "lucide-react";

type DeletedBoard = {
  id: string;
  name: string;
  slug: string;
  menuItemLabel: string;
  postCount: number;
  deletedAt: string;
};

interface TrashManagerProps {
  boards: DeletedBoard[];
}

export const TrashManager = ({ boards: initialBoards }: TrashManagerProps) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [boards, setBoards] = useState<DeletedBoard[]>(initialBoards);

  const handleRestore = async (board: DeletedBoard) => {
    const confirmed = await confirm({
      title: "게시판 복구",
      message: `"${board.name}" 게시판을 복구하시겠습니까?`,
      confirmText: "복구",
      variant: "info",
    });
    if (!confirmed) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", id: board.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "복구에 실패했습니다.", "error");
        return;
      }

      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      showToast(`"${board.name}" 게시판이 복구되었습니다.`, "success");
    });
  };

  const handlePermanentDelete = async (board: DeletedBoard) => {
    let confirmMessage = `"${board.name}" 게시판을 영구 삭제하시겠습니까?`;
    if (board.postCount > 0) {
      confirmMessage = `"${board.name}" 게시판에 ${board.postCount}개의 게시글이 있습니다.\n\n영구 삭제하면 모든 게시글도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.\n\n정말 삭제하시겠습니까?`;
    }

    const firstConfirm = await confirm({
      title: "영구 삭제",
      message: confirmMessage,
      confirmText: "삭제",
      variant: "danger",
    });
    if (!firstConfirm) return;

    // 게시글이 있는 경우 재확인
    if (board.postCount > 0) {
      const doubleConfirmed = await confirm({
        title: "최종 확인",
        message: `마지막 확인: ${board.postCount}개의 게시글이 영구 삭제됩니다.\n\n계속하시겠습니까?`,
        confirmText: "영구 삭제",
        variant: "danger",
      });
      if (!doubleConfirmed) return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "permanentDelete", id: board.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "삭제에 실패했습니다.", "error");
        return;
      }

      const result = await res.json();
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      if (result.deletedPosts > 0) {
        showToast(`"${board.name}" 게시판과 ${result.deletedPosts}개의 게시글이 영구 삭제되었습니다.`, "success");
      } else {
        showToast(`"${board.name}" 게시판이 영구 삭제되었습니다.`, "success");
      }
    });
  };

  const handleEmptyTrash = async () => {
    if (boards.length === 0) {
      showToast("휴지통이 비어있습니다.", "info");
      return;
    }

    const totalPosts = boards.reduce((sum, b) => sum + b.postCount, 0);
    let confirmMessage = `휴지통을 비우시겠습니까?\n\n${boards.length}개의 게시판이 영구 삭제됩니다.`;
    if (totalPosts > 0) {
      confirmMessage = `휴지통을 비우시겠습니까?\n\n${boards.length}개의 게시판과 총 ${totalPosts}개의 게시글이 영구 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.`;
    }

    const firstConfirm = await confirm({
      title: "휴지통 비우기",
      message: confirmMessage,
      confirmText: "비우기",
      variant: "danger",
    });
    if (!firstConfirm) return;

    if (totalPosts > 0) {
      const doubleConfirmed = await confirm({
        title: "최종 확인",
        message: "마지막 확인: 정말로 모든 항목을 영구 삭제하시겠습니까?",
        confirmText: "영구 삭제",
        variant: "danger",
      });
      if (!doubleConfirmed) return;
    }

    startTransition(async () => {
      let deletedCount = 0;
      let failedCount = 0;

      for (const board of boards) {
        const res = await fetch("/api/admin/boards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "permanentDelete", id: board.id }),
        });

        if (res.ok) {
          deletedCount++;
        } else {
          failedCount++;
        }
      }

      if (failedCount === 0) {
        setBoards([]);
        showToast(`${deletedCount}개의 게시판이 영구 삭제되었습니다.`, "success");
      } else {
        showToast(`${deletedCount}개 삭제, ${failedCount}개 실패`, "error");
        // 페이지 새로고침하여 상태 동기화
        window.location.reload();
      }
    });
  };

  if (boards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">휴지통이 비어있습니다.</p>
        <p className="text-sm text-gray-400 mt-1">삭제된 게시판이 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 휴지통 비우기 버튼 */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmptyTrash}
          disabled={isPending}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          휴지통 비우기
        </Button>
      </div>

      {/* 게시판 목록 */}
      <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
        <div className="divide-y divide-gray-100">
          {boards.map((board) => (
            <div
              key={board.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50"
            >
              {/* 아이콘 */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-gray-400" />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{board.name}</span>
                  <span className="text-xs text-gray-400">({board.slug})</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>그룹: {board.menuItemLabel}</span>
                  <span>•</span>
                  <span className={board.postCount > 0 ? "text-amber-600 font-medium" : ""}>
                    {board.postCount > 0 && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                    게시글 {board.postCount}개
                  </span>
                  <span>•</span>
                  <span>삭제: {board.deletedAt}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(board)}
                  disabled={isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  복구
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePermanentDelete(board)}
                  disabled={isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  영구 삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
