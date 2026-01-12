"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Crop, ImageIcon, Save, X } from "lucide-react";
import { ImageCropper } from "@/components/admin/image-cropper";

interface CategoryThumbnailEditorProps {
  categoryId: string;
  thumbnailUrl: string;
  description: string;
  disabled: boolean;
  onUpdate: (data: { thumbnailUrl?: string; description?: string }) => void;
}

export const CategoryThumbnailEditor = ({
  categoryId,
  thumbnailUrl,
  description,
  disabled,
  onUpdate,
}: CategoryThumbnailEditorProps) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localThumbnail, setLocalThumbnail] = useState(thumbnailUrl);
  const [localDescription, setLocalDescription] = useState(description);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  useEffect(() => {
    setLocalThumbnail(thumbnailUrl);
    setLocalDescription(description);
  }, [thumbnailUrl, description]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 업로드할 수 있습니다.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperImage(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", croppedBlob, "thumbnail.jpg");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("업로드 실패");
      }

      const data = await res.json();
      setLocalThumbnail(data.url);
      showToast("이미지가 업로드되었습니다.", "success");
    } catch {
      showToast("이미지 업로드에 실패했습니다.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: categoryId,
          data: {
            thumbnailUrl: localThumbnail || null,
            description: localDescription || null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      onUpdate({ thumbnailUrl: localThumbnail, description: localDescription });
      showToast("저장되었습니다.", "success");
    } catch {
      showToast("저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = () => {
    setLocalThumbnail("");
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center gap-2"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        썸네일/설명 편집
        {(thumbnailUrl || description) && (
          <span className="text-green-600">• 설정됨</span>
        )}
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">썸네일 / 설명</span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="relative w-20 h-20 rounded-lg border border-gray-200 bg-white overflow-hidden flex-shrink-0">
          {localThumbnail ? (
            <>
              <img
                src={localThumbnail}
                alt="썸네일"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border cursor-pointer ${
              isUploading
                ? "bg-gray-100 text-gray-400 cursor-wait"
                : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            {isUploading ? "업로드 중..." : "이미지 선택 및 크롭"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={isUploading || disabled}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400">1:1 정사각형으로 크롭됩니다</p>
        </div>
      </div>

      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}

      <div>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="카테고리 설명 (선택사항)"
          disabled={disabled}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || disabled}
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
};
