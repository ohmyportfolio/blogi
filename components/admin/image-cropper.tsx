"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedImage } from "@/lib/crop-image";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  outputSize?: number;
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  outputSize = 400,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleComplete = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels, outputSize);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("이미지 크롭 실패:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">이미지 크롭</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 크롭 영역 */}
        <div className="relative h-72 sm:h-80 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        {/* 줌 컨트롤 */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-center text-gray-400">
            드래그하여 위치 조정, 핀치/스크롤로 확대/축소
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing || !croppedAreaPixels}
            className="flex-1"
          >
            {isProcessing ? (
              "처리 중..."
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                완료
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
