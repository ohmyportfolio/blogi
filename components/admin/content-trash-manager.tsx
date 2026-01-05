"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { RotateCcw, Trash2, FileText, Eye, X } from "lucide-react";

type DeletedContent = {
  id: string;
  title: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
  contentMarkdown: string;
  price: string;
  deletedAt: string;
};

interface ContentTrashManagerProps {
  contents: DeletedContent[];
}

export const ContentTrashManager = ({ contents: initialContents }: ContentTrashManagerProps) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [contents, setContents] = useState<DeletedContent[]>(initialContents);
  const [previewContent, setPreviewContent] = useState<DeletedContent | null>(null);

  // 콘텐츠 복구
  const handleRestore = async (content: DeletedContent) => {
    const confirmed = await confirm({
      title: "콘텐츠 복구",
      message: `"${content.title}" 콘텐츠를 복구하시겠습니까?`,
      confirmText: "복구",
      variant: "info",
    });
    if (!confirmed) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", id: content.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "복구에 실패했습니다.", "error");
        return;
      }

      setContents((prev) => prev.filter((c) => c.id !== content.id));
      showToast(`"${content.title}" 콘텐츠가 복구되었습니다.`, "success");
    });
  };

  // 콘텐츠 영구 삭제
  const handlePermanentDelete = async (content: DeletedContent) => {
    const confirmed = await confirm({
      title: "영구 삭제",
      message: `"${content.title}" 콘텐츠를 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: "삭제",
      variant: "danger",
    });
    if (!confirmed) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "permanentDelete", id: content.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "삭제에 실패했습니다.", "error");
        return;
      }

      setContents((prev) => prev.filter((c) => c.id !== content.id));
      showToast(`"${content.title}" 콘텐츠가 영구 삭제되었습니다.`, "success");
    });
  };

  // 휴지통 비우기
  const handleEmptyTrash = async () => {
    if (contents.length === 0) {
      showToast("휴지통이 비어있습니다.", "info");
      return;
    }

    const firstConfirm = await confirm({
      title: "휴지통 비우기",
      message: `휴지통을 비우시겠습니까?\n\n${contents.length}개의 콘텐츠가 영구 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.`,
      confirmText: "비우기",
      variant: "danger",
    });
    if (!firstConfirm) return;

    const doubleConfirmed = await confirm({
      title: "최종 확인",
      message: "마지막 확인: 정말로 모든 콘텐츠를 영구 삭제하시겠습니까?",
      confirmText: "영구 삭제",
      variant: "danger",
    });
    if (!doubleConfirmed) return;

    startTransition(async () => {
      let deletedCount = 0;
      let failedCount = 0;

      for (const content of contents) {
        const res = await fetch("/api/admin/contents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "permanentDelete", id: content.id }),
        });

        if (res.ok) {
          deletedCount++;
        } else {
          failedCount++;
        }
      }

      if (failedCount === 0) {
        setContents([]);
        showToast(`${deletedCount}개의 콘텐츠가 영구 삭제되었습니다.`, "success");
      } else {
        showToast(`${deletedCount}개 삭제, ${failedCount}개 실패`, "error");
        window.location.reload();
      }
    });
  };

  if (contents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">휴지통이 비어있습니다.</p>
        <p className="text-sm text-gray-400 mt-1">삭제된 콘텐츠가 여기에 표시됩니다.</p>
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

      {/* 콘텐츠 목록 */}
      <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
        <div className="divide-y divide-gray-100">
          {contents.map((content) => (
            <div
              key={content.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50"
            >
              {/* 썸네일 */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {content.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={content.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{content.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>카테고리: {content.categoryName}</span>
                  <span>•</span>
                  <span>삭제: {content.deletedAt}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewContent(content)}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  미리보기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(content)}
                  disabled={isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  복구
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePermanentDelete(content)}
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

      {/* 미리보기 모달 */}
      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-lg">{previewContent.title}</h3>
                <p className="text-sm text-gray-500">{previewContent.categoryName}</p>
              </div>
              <button
                onClick={() => setPreviewContent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 대표 이미지 */}
              {previewContent.imageUrl && (
                <div className="mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewContent.imageUrl}
                    alt={previewContent.title}
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* 가격 */}
              {previewContent.price && (
                <div className="mb-4 text-lg font-semibold text-sky-600">
                  {previewContent.price}
                </div>
              )}

              {/* 본문 내용 */}
              <div className="prose prose-sm max-w-none">
                {previewContent.contentMarkdown ? (
                  <div className="whitespace-pre-wrap text-gray-700">
                    {previewContent.contentMarkdown.length > 1000
                      ? previewContent.contentMarkdown.slice(0, 1000) + "..."
                      : previewContent.contentMarkdown}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">본문 내용이 없습니다.</p>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <span className="text-sm text-gray-500">삭제일: {previewContent.deletedAt}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleRestore(previewContent);
                    setPreviewContent(null);
                  }}
                  disabled={isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  복구
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handlePermanentDelete(previewContent);
                    setPreviewContent(null);
                  }}
                  disabled={isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  영구 삭제
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
