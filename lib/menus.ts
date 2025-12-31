import { prisma } from "@/lib/prisma";
import type { BoardData } from "@/lib/boards";

export type CategoryData = {
  id: string;
  thumbnailUrl?: string | null;
  description?: string | null;
};

export type MenuItemData = {
  id?: string;
  label: string;
  href: string;
  order?: number;
  isVisible?: boolean;
  isExternal?: boolean;
  openInNew?: boolean;
  requiresAuth?: boolean;
  badgeText?: string | null;
  thumbnailUrl?: string | null;
  linkType?: "category" | "community" | "external";
  linkedCategoryId?: string | null;
  boards?: BoardData[];
  category?: CategoryData | null;
};

export const DEFAULT_MAIN_MENU: MenuItemData[] = [
  { label: "카지노", href: "/products/casino", order: 1, linkType: "category" },
  { label: "다낭 유흥", href: "/products/nightlife", order: 2, linkType: "category" },
  { label: "프로모션", href: "/products/promotion", order: 3, linkType: "category" },
  { label: "VIP 여행", href: "/products/vip-trip", order: 4, requiresAuth: true, linkType: "category" },
  { label: "여행 TIP", href: "/products/tip", order: 5, linkType: "category" },
  { label: "호텔 & 풀빌라", href: "/products/hotel-villa", order: 6, linkType: "category" },
  { label: "골프 & 레저", href: "/products/golf", order: 7, linkType: "category" },
  { label: "커뮤니티", href: "/community/community-1", order: 8, linkType: "community" },
];


const normalizeMenuItems = (items: MenuItemData[]) =>
  items
    .filter((item) => item.isVisible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const getMenuByKey = async (key: string) => {
  const menu = await prisma.menu.findUnique({
    where: { key },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          boards: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!menu || menu.items.length === 0) {
    const defaults = DEFAULT_MAIN_MENU;
    return {
      id: menu?.id ?? "default",
      key,
      name: key === "footer" ? "Footer" : "Main",
      items: normalizeMenuItems(defaults).map((item, index) => ({
        ...item,
        id: `default-${key}-${index}`,
      })),
    };
  }

  return {
    id: menu.id,
    key: menu.key,
    name: menu.name,
    items: menu.items.filter((item) => item.isVisible).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      order: item.order,
      isExternal: item.isExternal,
      openInNew: item.openInNew,
      requiresAuth: item.requiresAuth,
      badgeText: item.badgeText,
      isVisible: item.isVisible,
      boards: item.boards?.map((board) => ({
        id: board.id,
        key: board.key,
        slug: board.slug,
        menuItemId: board.menuItemId,
        name: board.name,
        description: board.description,
        order: board.order,
        isVisible: board.isVisible,
      })),
      linkType:
        item.linkType === "community" || item.linkType === "category" || item.linkType === "external"
          ? (item.linkType as MenuItemData["linkType"])
          : item.href?.startsWith("http")
            ? "external"
            : item.href?.startsWith("/community")
              ? "community"
              : "category",
      linkedCategoryId: item.linkedCategoryId ?? null,
      thumbnailUrl: item.thumbnailUrl ?? null,
    })),
  };
};
