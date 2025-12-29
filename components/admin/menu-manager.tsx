"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { MenuItemData } from "@/lib/menus";
import { slugify } from "@/lib/slug";

type MenuSection = {
  key: string;
  name: string;
  items: MenuItemData[];
};

interface MenuManagerProps {
  menus: MenuSection[];
}

const blankItem = {
  label: "",
  href: "",
  linkType: "category" as MenuItemData["linkType"],
  isVisible: true,
  isExternal: false,
  openInNew: false,
  requiresAuth: false,
  badgeText: "",
};

export const MenuManager = ({ menus }: MenuManagerProps) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const normalizedMenus = useMemo(() => {
    const guessType = (item: MenuItemData): MenuItemData["linkType"] => {
      if (item.linkType === "community" || item.linkType === "category") return item.linkType;
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
  const [orderDirty, setOrderDirty] = useState<Record<string, boolean>>({});

  const getCategorySlug = (href: string) => {
    if (!href) return "";
    if (href.startsWith("/products/")) {
      return href.replace("/products/", "");
    }
    return href.replace(/^\/+/, "");
  };

  const buildCategoryHref = (value: string, fallbackLabel: string) => {
    const raw = value.trim() || slugify(fallbackLabel);
    if (!raw) return "";
    return `/products/${raw}`;
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
    const resolvedHref =
      payload.linkType === "community"
        ? "/community"
        : buildCategoryHref(getCategorySlug(payload.href), payload.label);
    if (!payload.label.trim() || !resolvedHref.trim()) {
      showToast("메뉴명과 링크를 입력해주세요.", "error");
      return;
    }
    const resolvedPayload = { ...payload, href: resolvedHref };
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
            href:
              item.linkType === "community"
                ? "/community"
                : buildCategoryHref(getCategorySlug(item.href), item.label),
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
      showToast("메뉴가 저장되었습니다.", "success");
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
      showToast("메뉴가 삭제되었습니다.", "success");
    });
  };

  const handleReorderSave = (menuKey: string) => {
    const menu = menuState.find((item) => item.key === menuKey);
    if (!menu) return;
    const items = menu.items.map((item, index) => ({ id: item.id, order: index + 1 }));
    startTransition(async () => {
      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", menuKey, items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "정렬 저장에 실패했습니다.", "error");
        return;
      }
      setOrderDirty((prev) => ({ ...prev, [menuKey]: false }));
      showToast("정렬이 저장되었습니다.", "success");
    });
  };

  const moveItem = (menuKey: string, fromIndex: number, toIndex: number) => {
    updateMenuState(menuKey, (items) => {
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setOrderDirty((prev) => ({ ...prev, [menuKey]: true }));
  };

  const renderMenuSection = (menu: MenuSection) => {
    return (
      <section key={menu.key} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl">{menu.name}</h2>
            <p className="text-sm text-gray-500">드래그 또는 화살표로 순서를 조정하세요.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => handleReorderSave(menu.key)}
            disabled={isPending || !orderDirty[menu.key]}
          >
            정렬 저장
          </Button>
        </div>

        <div className="space-y-3">
          {menu.items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                if (Number.isNaN(fromIndex)) return;
                moveItem(menu.key, fromIndex, index);
              }}
              className="rounded-xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      value={item.label}
                      onChange={(event) =>
                        handleFieldChange(menu.key, item.id ?? "", "label", event.target.value)
                      }
                      placeholder="메뉴명"
                    />
                    {item.linkType === "community" ? (
                      <Input value="/community" disabled />
                    ) : (
                      <Input
                        value={getCategorySlug(item.href)}
                        onChange={(event) =>
                          handleFieldChange(
                            menu.key,
                            item.id ?? "",
                            "href",
                            buildCategoryHref(event.target.value, item.label)
                          )
                        }
                        placeholder="카테고리 슬러그 (예: casino)"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr] text-sm text-gray-600">
                    <label className="flex items-center gap-2">
                      <span className="min-w-12">유형</span>
                      <select
                        value={item.linkType ?? "category"}
                        onChange={(event) => {
                          const nextType = event.target.value as MenuItemData["linkType"];
                          handleFieldChange(menu.key, item.id ?? "", "linkType", nextType);
                          if (nextType === "community") {
                            handleFieldChange(menu.key, item.id ?? "", "href", "/community");
                            return;
                          }
                          handleFieldChange(
                            menu.key,
                            item.id ?? "",
                            "href",
                            buildCategoryHref(getCategorySlug(item.href), item.label)
                          );
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="category">상품 카테고리</option>
                        <option value="community">커뮤니티</option>
                      </select>
                    </label>
                    <span className="text-xs text-gray-400">
                      커뮤니티 유형은 /community 로 고정됩니다.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-xs text-gray-600">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isVisible ?? true}
                        onChange={(event) =>
                          handleFieldChange(menu.key, item.id ?? "", "isVisible", event.target.checked)
                        }
                      />
                      노출
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isExternal ?? false}
                        onChange={(event) =>
                          handleFieldChange(menu.key, item.id ?? "", "isExternal", event.target.checked)
                        }
                      />
                      외부 링크
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.openInNew ?? false}
                        onChange={(event) =>
                          handleFieldChange(menu.key, item.id ?? "", "openInNew", event.target.checked)
                        }
                      />
                      새 탭
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.requiresAuth ?? false}
                        onChange={(event) =>
                          handleFieldChange(menu.key, item.id ?? "", "requiresAuth", event.target.checked)
                        }
                      />
                      로그인 필요
                    </label>
                  </div>

                </div>

                <div className="flex flex-row gap-2 md:flex-col md:items-end">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => moveItem(menu.key, index, Math.max(0, index - 1))}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => moveItem(menu.key, index, Math.min(menu.items.length - 1, index + 1))}
                    >
                      ↓
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleSave(menu.key, item)}
                      disabled={isPending}
                    >
                      저장
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDelete(menu.key, item.id)}
                      disabled={isPending}
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
          <h3 className="font-semibold mb-3">새 메뉴 추가</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <Input
              value={drafts[menu.key]?.label ?? ""}
              onChange={(event) =>
                setDrafts((prev) => ({
                  ...prev,
                  [menu.key]: { ...prev[menu.key], label: event.target.value },
                }))
              }
              placeholder="메뉴명"
            />
            {drafts[menu.key]?.linkType === "community" ? (
              <Input value="/community" disabled />
            ) : (
              <Input
                value={getCategorySlug(drafts[menu.key]?.href ?? "")}
                onChange={(event) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [menu.key]: {
                      ...prev[menu.key],
                      href: buildCategoryHref(event.target.value, prev[menu.key]?.label ?? ""),
                    },
                  }))
                }
                placeholder="카테고리 슬러그 (예: casino)"
              />
            )}
            <Button type="button" onClick={() => handleCreate(menu.key)} disabled={isPending}>
              추가
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr] text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <span className="min-w-12">유형</span>
              <select
                value={drafts[menu.key]?.linkType ?? "category"}
                onChange={(event) => {
                  const nextType = event.target.value as MenuItemData["linkType"];
                  setDrafts((prev) => ({
                    ...prev,
                    [menu.key]: {
                      ...prev[menu.key],
                      linkType: nextType,
                      href:
                        nextType === "community"
                          ? "/community"
                          : buildCategoryHref(
                              getCategorySlug(prev[menu.key]?.href ?? ""),
                              prev[menu.key]?.label ?? ""
                            ),
                    },
                  }));
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="category">상품 카테고리</option>
                <option value="community">커뮤니티</option>
              </select>
            </label>
            <span className="text-xs text-gray-400">
              커뮤니티 유형은 /community 로 고정됩니다.
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 text-xs text-gray-600">
            {([
              ["isVisible", "노출"],
              ["isExternal", "외부 링크"],
              ["openInNew", "새 탭"],
              ["requiresAuth", "로그인 필요"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={drafts[menu.key]?.[key] ?? false}
                  onChange={(event) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [menu.key]: { ...prev[menu.key], [key]: event.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </section>
    );
  };

  return <div className="space-y-10">{menuState.map(renderMenuSection)}</div>;
};
