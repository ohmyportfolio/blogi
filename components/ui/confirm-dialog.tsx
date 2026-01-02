"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  }, [confirmState]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirmState) {
        handleCancel();
      }
    };

    if (confirmState) {
      document.addEventListener("keydown", handleKeyDown);
      // 배경 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [confirmState, handleCancel]);

  const getIcon = (variant: ConfirmVariant = "info") => {
    switch (variant) {
      case "danger":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getConfirmButtonStyles = (variant: ConfirmVariant = "info") => {
    switch (variant) {
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "info":
        return "bg-blue-500 hover:bg-blue-600 text-white";
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* 모달 오버레이 */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 animate-fade-in"
          onClick={handleCancel}
        >
          {/* 모달 컨텐츠 */}
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center gap-3 p-4 border-b">
              {getIcon(confirmState.variant)}
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmState.title || "확인"}
              </h3>
            </div>

            {/* 메시지 */}
            <div className="p-4">
              <p className="text-gray-600 text-sm whitespace-pre-line">
                {confirmState.message}
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition min-h-[44px]"
              >
                {confirmState.cancelText || "취소"}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium rounded-lg transition min-h-[44px]",
                  getConfirmButtonStyles(confirmState.variant)
                )}
                autoFocus
              >
                {confirmState.confirmText || "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
