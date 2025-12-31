"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { BoardManager } from "@/components/admin/board-manager";
import type { MenuItemData } from "@/lib/menus";
import { Plus, GripVertical, ChevronUp, ChevronDown, Trash2, Save, Eye, EyeOff, ExternalLink, Lock, ImageIcon, Upload, X } from "lucide-react";

type MenuSection = {
  key: string;
  name: string;
  items: MenuItemData[];
};

interface MenuManagerProps {
  menus: MenuSection[];
}

const blankItem: {
  label: string;
  href: string;
  slug: string;
  linkType: MenuItemData["linkType"];
  isVisible: boolean;
  isExternal: boolean;
  openInNew: boolean;
  requiresAuth: boolean;
  badgeText: string;
} = {
  label: "",
  href: "",
  slug: "",
  linkType: "category",
  isVisible: true,
  isExternal: false,
  openInNew: false,
  requiresAuth: false,
  badgeText: "",
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;

// 카테고리 썸네일/설명 편집 컴포넌트
const CategoryEditor = ({
  categoryId,
  thumbnailUrl,
  description,
  disabled,
  onUpdate,
}: {
  categoryId: string;
  thumbnailUrl: string;
  description: string;
  disabled: boolean;
  onUpdate: (data: { thumbnailUrl?: string; description?: string }) => void;
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localThumbnail, setLocalThumbnail] = useState(thumbnailUrl);
  const [localDescription, setLocalDescription] = useState(description);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 업로드할 수 있습니다.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

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
        className="w-full px-4 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 border-t border-dashed border-gray-200 flex items-center gap-2"
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
    <div className="px-4 pb-4 pt-3 bg-amber-50/50 border-t border-dashed border-gray-200 space-y-3">
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

      {/* 썸네일 */}
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
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? "업로드 중..." : "이미지 선택"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading || disabled}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400">권장: 정사각형, 최소 400x400px</p>
        </div>
      </div>

      {/* 설명 */}
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

      {/* 저장 버튼 */}
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

// 커뮤니티 메뉴 썸네일 편집 컴포넌트
const CommunityThumbnailEditor = ({
  menuItemId,
  thumbnailUrl,
  disabled,
  onUpdate,
}: {
  menuItemId: string;
  thumbnailUrl: string;
  disabled: boolean;
  onUpdate: (thumbnailUrl: string) => void;
}) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localThumbnail, setLocalThumbnail] = useState(thumbnailUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 업로드할 수 있습니다.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

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
      const res = await fetch("/api/admin/menus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateThumbnail",
          id: menuItemId,
          thumbnailUrl: localThumbnail || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "저장에 실패했습니다.", "error");
        return;
      }

      onUpdate(localThumbnail);
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
        className="w-full px-4 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 border-t border-dashed border-gray-200 flex items-center gap-2"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        썸네일 편집
        {thumbnailUrl && (
          <span className="text-green-600">• 설정됨</span>
        )}
      </button>
    );
  }

  return (
    <div className="px-4 pb-4 pt-3 bg-cyan-50/50 border-t border-dashed border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">커뮤니티 썸네일</span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 썸네일 */}
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
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? "업로드 중..." : "이미지 선택"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading || disabled}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400">권장: 정사각형, 최소 400x400px</p>
        </div>
      </div>

      {/* 저장 버튼 */}
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

export const MenuManager = ({ menus }: MenuManagerProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [dragState, setDragState] = useState<{
    menuKey: string;
    fromIndex: number;
    overIndex: number | null;
  } | null>(null);
  const normalizedMenus = useMemo(() => {
    const guessType = (item: MenuItemData): MenuItemData["linkType"] => {
      if (item.linkType === "community" || item.linkType === "category" || item.linkType === "external") {
        return item.linkType;
      }
      if (item.href?.startsWith("http")) return "external";
      if (item.href?.startsWith("/community")) return "community";
      return "category";
    };
    return menus.map((menu) => ({
      ...menu,
      items: menu.items.map((item) => ({
        ...item,
        linkType: guessType(item),
      })),
    }));
  }, [menus]);
  const [menuState, setMenuState] = useState<MenuSection[]>(normalizedMenus);
  const [drafts, setDrafts] = useState<Record<string, typeof blankItem>>(() =>
    menus.reduce((acc, menu) => ({ ...acc, [menu.key]: { ...blankItem } }), {})
  );
  const [createOpen, setCreateOpen] = useState<Record<string, boolean>>({});

  const getCategorySlug = (href: string) => {
    if (!href) return "";
    if (href.startsWith("/contents/")) {
      return href.replace("/contents/", "");
    }
    if (href.startsWith("/community")) {
      return "";
    }
    return href.replace(/^\/+/, "");
  };

  const getCommunitySlug = (href: string, fallbackLabel: string) => {
    if (href?.startsWith("/community/")) {
      return href.replace("/community/", "").trim();
    }
    if (href?.startsWith("/community")) {
      return href.replace("/community", "").replace(/^\/+/, "").trim();
    }
    return fallbackLabel;
  };

  const getNextSequentialSlug = (menuKey: string, linkType: MenuItemData["linkType"]) => {
    const menu = menuState.find((item) => item.key === menuKey);
    if (!menu) return linkType === "community" ? "community-1" : "category-1";
    const prefix = linkType === "community" ? "community" : "category";
    const basePath = linkType === "community" ? "/community/" : "/contents/";
    const max = menu.items.reduce((acc, item) => {
      if (item.linkType !== linkType) return acc;
      if (!item.href?.startsWith(basePath)) return acc;
      const slug = item.href.replace(basePath, "").replace(/^\/+/, "");
      const match = slug.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (!match) return acc;
      return Math.max(acc, Number(match[1]));
    }, 0);
    return `${prefix}-${max + 1}`;
  };

  const isSlugDuplicate = (menuKey: string, slug: string, linkType: MenuItemData["linkType"]) => {
    if (!slug) return false;
    const menu = menuState.find((m) => m.key === menuKey);
    if (!menu) return false;
    const basePath = linkType === "community" ? "/community/" : "/contents/";
    return menu.items.some((item) => item.href === `${basePath}${slug}`);
  };

  const isSlugValid = (slug: string) => {
    if (!slug) return true;
    return SLUG_PATTERN.test(slug);
  };

  const updateMenuState = (menuKey: string, updater: (items: MenuItemData[]) => MenuItemData[]) => {
    setMenuState((prev) =>
      prev.map((menu) =>
        menu.key === menuKey ? { ...menu, items: updater(menu.items) } : menu
      )
    );
  };

  const handleFieldChange = (
    menuKey: string,
    id: string,
    field: keyof MenuItemData,
    value: string | boolean | undefined
  ) => {
    updateMenuState(menuKey, (items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleCreate = (menuKey: string) => {
    const payload = drafts[menuKey];
    if (!payload.label.trim()) {
      showToast("메뉴명을 입력해주세요.", "error");
      return;
    }

    // 외부 링크 타입 처리
    if (payload.linkType === "external") {
      if (!(payload.href?.startsWith("http") || payload.href?.startsWith("/"))) {
        showToast("링크 주소는 http://, https:// 또는 / 로 시작해야 합니다.", "error");
        return;
      }
      const resolvedPayload = { ...payload, isExternal: true };
      const menu = menuState.find((item) => item.key === menuKey);
      const nextOrder = menu ? menu.items.length + 1 : 1;
      startTransition(async () => {
        const res = await fetch("/api/admin/menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            menuKey,
            data: { ...resolvedPayload, order: nextOrder },
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(data.error || "메뉴 생성에 실패했습니다.", "error");
          return;
        }
        const item = await res.json();
        updateMenuState(menuKey, (items) => [...items, item]);
        setDrafts((prev) => ({ ...prev, [menuKey]: { ...blankItem } }));
        setCreateOpen((prev) => ({ ...prev, [menuKey]: false }));
        showToast("메뉴가 추가되었습니다.", "success");
      });
      return;
    }

    const slug = payload.slug?.trim() || getNextSequentialSlug(menuKey, payload.linkType);
    if (!isSlugValid(slug)) {
      showToast("슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.", "error");
      return;
    }
    if (isSlugDuplicate(menuKey, slug, payload.linkType)) {
      showToast("이미 사용 중인 슬러그입니다.", "error");
      return;
    }
    const resolvedHref =
      payload.linkType === "community"
        ? `/community/${slug}`
        : `/contents/${slug}`;
    const resolvedPayload = { ...payload, href: resolvedHref, slug };
    const menu = menuState.find((item) => item.key === menuKey);
    const nextOrder = menu ? menu.items.length + 1 : 1;
    startTransition(async () => {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          menuKey,
          data: { ...resolvedPayload, order: nextOrder },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "메뉴 생성에 실패했습니다.", "error");
        return;
      }
      const item = await res.json();
      updateMenuState(menuKey, (items) => [...items, item]);
      setDrafts((prev) => ({ ...prev, [menuKey]: { ...blankItem } }));
      setCreateOpen((prev) => ({ ...prev, [menuKey]: false }));
      showToast("메뉴가 추가되었습니다.", "success");
    });
  };

  const handleSave = (menuKey: string, item: MenuItemData) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: item.id,
          data: {
            label: item.label,
            href: item.href,
            isVisible: item.isVisible ?? true,
            isExternal: item.isExternal ?? false,
            openInNew: item.openInNew ?? false,
            requiresAuth: item.requiresAuth ?? false,
            badgeText: item.badgeText ?? "",
            linkType: item.linkType ?? "category",
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "메뉴 저장에 실패했습니다.", "error");
        return;
      }
      const updated = await res.json().catch(() => null);
      if (updated?.id) {
        updateMenuState(menuKey, (items) =>
          items.map((current) => (current.id === updated.id ? { ...current, ...updated } : current))
        );
      }
      showToast("저장되었습니다.", "success");
    });
  };

  const handleDelete = (menuKey: string, itemId?: string) => {
    if (!itemId) return;
    if (!confirm("이 메뉴를 삭제할까요?")) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: itemId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "삭제에 실패했습니다.", "error");
        return;
      }
      updateMenuState(menuKey, (items) => items.filter((item) => item.id !== itemId));
      showToast("삭제되었습니다.", "success");
    });
  };

  const moveItem = (menuKey: string, fromIndex: number, toIndex: number) => {
    // 유효성 검사
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;

    const menu = menuState.find((m) => m.key === menuKey);
    if (!menu) return;
    if (fromIndex >= menu.items.length || toIndex >= menu.items.length) return;

    // 자동 저장용 데이터 미리 계산
    const updated = [...menu.items];
    const [moved] = updated.splice(fromIndex, 1);
    if (!moved) return;
    updated.splice(toIndex, 0, moved);
    const items = updated.map((item, idx) => ({ id: item.id, order: idx + 1 }));

    // 상태 업데이트
    setMenuState((prev) =>
      prev.map((m) => (m.key === menuKey ? { ...m, items: updated } : m))
    );

    // 자동 저장
    fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", menuKey, items }),
    }).then((res) => {
      if (res.ok) {
        showToast("순서가 저장되었습니다.", "success");
      }
    });
  };

  const renderMenuSection = (menu: MenuSection) => {
    return (
      <section key={menu.key} className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{menu.name}</h2>
        </div>

        {/* 메뉴 목록 */}
        <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
          {menu.items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              등록된 메뉴가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {menu.items.map((item, index) => {
                const isDragging = dragState?.menuKey === menu.key && dragState?.fromIndex === index;
                const fromIndex = dragState?.fromIndex ?? -1;
                const overIndex = dragState?.overIndex ?? -1;
                // 드래그 중인 아이템이 위에서 아래로 이동할 때는 아이템 아래에, 아래에서 위로 이동할 때는 아이템 위에 표시
                const showDropBefore = dragState?.menuKey === menu.key &&
                  overIndex === index &&
                  fromIndex !== index &&
                  fromIndex > index;
                const showDropAfter = dragState?.menuKey === menu.key &&
                  overIndex === index &&
                  fromIndex !== index &&
                  fromIndex < index;

                return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", String(index));
                    event.dataTransfer.effectAllowed = "move";
                    setDragState({ menuKey: menu.key, fromIndex: index, overIndex: null });
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    if (dragState?.menuKey === menu.key && dragState?.overIndex !== index) {
                      setDragState((prev) => prev ? { ...prev, overIndex: index } : null);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragState?.overIndex === index) {
                      setDragState((prev) => prev ? { ...prev, overIndex: null } : null);
                    }
                  }}
                  onDrop={(event) => {
                    const from = Number(event.dataTransfer.getData("text/plain"));
                    if (Number.isNaN(from)) return;
                    moveItem(menu.key, from, index);
                    setDragState(null);
                  }}
                  onDragEnd={() => {
                    setDragState(null);
                  }}
                  className={`group relative ${
                    isDragging ? "opacity-40" : ""
                  }`}
                >
                  {/* 드롭 위치 인디케이터 - 위 */}
                  {showDropBefore && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10">
                      <div className="absolute -top-1 left-3 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    </div>
                  )}
                  {/* 드롭 위치 인디케이터 - 아래 */}
                  {showDropAfter && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10">
                      <div className="absolute -bottom-1 left-3 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    </div>
                  )}
                  {/* 메인 행 */}
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-50/50">
                    {/* 드래그 핸들 */}
                    <div className="cursor-grab text-gray-300 hover:text-gray-500">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* 순서 번호 */}
                    <div className="w-6 text-center text-xs text-gray-400 font-medium">
                      {index + 1}
                    </div>

                    {/* 메뉴명 */}
                    <div className="w-32 min-w-0">
                      <Input
                        value={item.label}
                        onChange={(event) =>
                          handleFieldChange(menu.key, item.id ?? "", "label", event.target.value)
                        }
                        className="h-8 text-sm"
                        placeholder="메뉴명"
                      />
                    </div>

                    {/* 슬러그 */}
                    <div className="w-28 text-xs text-gray-500 truncate hidden sm:block">
                      {item.linkType === "community"
                        ? getCommunitySlug(item.href, item.label)
                        : getCategorySlug(item.href)}
                    </div>

                    {/* 유형 (읽기 전용 배지) */}
                    <div className="w-14 sm:w-16 md:w-20">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          item.linkType === "community"
                            ? "bg-blue-100 text-blue-700"
                            : item.linkType === "external"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        title="메뉴 유형은 생성 후 변경할 수 없습니다"
                      >
                        {item.linkType === "community" ? "커뮤니티" : item.linkType === "external" ? "외부" : "콘텐츠"}
                      </span>
                    </div>

                    {/* 외부 링크 URL 입력 */}
                    {item.linkType === "external" && (
                      <div className="w-36 sm:w-44">
                        <Input
                          value={item.href}
                          onChange={(event) =>
                            handleFieldChange(menu.key, item.id ?? "", "href", event.target.value)
                          }
                          className="h-8 text-xs"
                          placeholder="https://example.com 또는 /terms"
                        />
                      </div>
                    )}

                    {/* 옵션 토글들 */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(menu.key, item.id ?? "", "isVisible", !item.isVisible)
                        }
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          item.isVisible
                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {item.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {item.isVisible ? "노출" : "숨김"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(menu.key, item.id ?? "", "openInNew", !item.openInNew)
                        }
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          item.openInNew
                            ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {item.openInNew ? "새탭" : "현재탭"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleFieldChange(menu.key, item.id ?? "", "requiresAuth", !item.requiresAuth)
                        }
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          item.requiresAuth
                            ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                            : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <Lock className="h-3 w-3" />
                        {item.requiresAuth ? "로그인" : "공개"}
                      </button>
                    </div>

                    {/* 순서 버튼 */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveItem(menu.key, index, Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(menu.key, index, Math.min(menu.items.length - 1, index + 1))}
                        disabled={index === menu.items.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(menu.key, item)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs"
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        저장
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(menu.key, item.id)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>

                  {/* 커뮤니티 하위 게시판 */}
                  {item.linkType === "community" && item.id && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50/50 border-t border-dashed border-gray-200">
                      <BoardManager
                        boards={item.boards ?? []}
                        menuItemId={item.id}
                        groupSlug={getCommunitySlug(item.href, item.label)}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  {/* 커뮤니티 썸네일 편집 */}
                  {item.linkType === "community" && item.id && (
                    <CommunityThumbnailEditor
                      menuItemId={item.id}
                      thumbnailUrl={item.thumbnailUrl ?? ""}
                      disabled={isPending}
                      onUpdate={(thumbnailUrl) => {
                        updateMenuState(menu.key, (items) =>
                          items.map((i) =>
                            i.id === item.id
                              ? { ...i, thumbnailUrl }
                              : i
                          )
                        );
                      }}
                    />
                  )}

                  {/* 카테고리 썸네일/설명 편집 */}
                  {item.linkType === "category" && item.category && (
                    <CategoryEditor
                      categoryId={item.category.id}
                      thumbnailUrl={item.category.thumbnailUrl ?? ""}
                      description={item.category.description ?? ""}
                      disabled={isPending}
                      onUpdate={(data) => {
                        updateMenuState(menu.key, (items) =>
                          items.map((i) =>
                            i.id === item.id && i.category
                              ? { ...i, category: { ...i.category, ...data } }
                              : i
                          )
                        );
                      }}
                    />
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* 새 메뉴 추가 */}
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
          {!createOpen[menu.key] ? (
            <button
              type="button"
              onClick={() => setCreateOpen((prev) => ({ ...prev, [menu.key]: true }))}
              disabled={isPending}
              className="w-full p-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors rounded-xl"
            >
              <Plus className="w-4 h-4" />
              새 메뉴 추가
            </button>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  value={drafts[menu.key]?.label ?? ""}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [menu.key]: { ...prev[menu.key], label: event.target.value },
                    }))
                  }
                  placeholder="메뉴명"
                  className="w-32 h-9"
                />
                {drafts[menu.key]?.linkType === "external" ? (
                  <Input
                    value={drafts[menu.key]?.href ?? ""}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [menu.key]: { ...prev[menu.key], href: event.target.value },
                      }))
                    }
                    placeholder="https://example.com"
                    className="w-48 h-9"
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {drafts[menu.key]?.linkType === "community" ? "/community/" : "/contents/"}
                    </span>
                    <Input
                      value={drafts[menu.key]?.slug ?? ""}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [menu.key]: { ...prev[menu.key], slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") },
                        }))
                      }
                      placeholder={getNextSequentialSlug(menu.key, drafts[menu.key]?.linkType ?? "category")}
                      className={`w-36 h-9 ${
                        drafts[menu.key]?.slug && !isSlugValid(drafts[menu.key]?.slug ?? "")
                          ? "border-red-500 focus:ring-red-500"
                          : drafts[menu.key]?.slug && isSlugDuplicate(menu.key, drafts[menu.key]?.slug ?? "", drafts[menu.key]?.linkType ?? "category")
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                )}
                <select
                  value={drafts[menu.key]?.linkType ?? "category"}
                  onChange={(event) => {
                    const nextType = event.target.value as MenuItemData["linkType"];
                    setDrafts((prev) => ({
                      ...prev,
                      [menu.key]: {
                        ...prev[menu.key],
                        linkType: nextType,
                        slug: "",
                        href: nextType === "external" ? "" : prev[menu.key]?.href ?? "",
                      },
                    }));
                  }}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="category">콘텐츠</option>
                  <option value="community">커뮤니티</option>
                  <option value="external">외부 링크</option>
                </select>
                <Button
                  type="button"
                  onClick={() => handleCreate(menu.key)}
                  disabled={isPending}
                  size="sm"
                >
                  추가
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDrafts((prev) => ({ ...prev, [menu.key]: { ...blankItem } }));
                    setCreateOpen((prev) => ({ ...prev, [menu.key]: false }));
                  }}
                  disabled={isPending}
                  size="sm"
                >
                  취소
                </Button>
              </div>
              {drafts[menu.key]?.slug && isSlugDuplicate(menu.key, drafts[menu.key]?.slug ?? "", drafts[menu.key]?.linkType ?? "category") && (
                <div className="text-xs text-red-500">이미 사용 중인 슬러그입니다.</div>
              )}
              <div className="text-xs text-gray-400">
                슬러그를 비워두면 자동 생성됩니다. 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return <div className="space-y-8">{menuState.map(renderMenuSection)}</div>;
};
