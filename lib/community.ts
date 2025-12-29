import { prisma } from "@/lib/prisma";
import { buildBoardKey, type BoardData } from "@/lib/boards";
import { slugify } from "@/lib/slug";

export type CommunityGroup = {
  menuItemId: string;
  label: string;
  href: string;
  slug: string;
  order: number;
  isVisible: boolean;
  boards: BoardData[];
};

export const extractCommunitySlug = (href?: string, fallbackLabel?: string) => {
  if (href) {
    const parts = href.split("/").filter(Boolean);
    const communityIndex = parts.indexOf("community");
    if (communityIndex >= 0 && parts[communityIndex + 1]) {
      return parts[communityIndex + 1];
    }
  }
  if (fallbackLabel) {
    return slugify(fallbackLabel);
  }
  return "community";
};

export const buildCommunityHref = (slug: string) => `/community/${slug}`;

export const getCommunityGroups = async ({
  includeHiddenBoards = false,
  includeHiddenGroups = false,
}: {
  includeHiddenBoards?: boolean;
  includeHiddenGroups?: boolean;
} = {}): Promise<CommunityGroup[]> => {
  const menu = await prisma.menu.findUnique({
    where: { key: "main" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { boards: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!menu) return [];

  const groups = menu.items
    .filter((item) => item.linkType === "community")
    .filter((item) => (includeHiddenGroups ? true : item.isVisible))
    .map((item) => {
      const slug = extractCommunitySlug(item.href, item.label);
      return {
        menuItemId: item.id,
        label: item.label,
        href: item.href,
        slug,
        order: item.order,
        isVisible: item.isVisible,
        boards: item.boards
          .filter((board) => (includeHiddenBoards ? true : board.isVisible))
          .map((board) => ({
            id: board.id,
            key: board.key,
            slug: board.slug,
            menuItemId: board.menuItemId,
            name: board.name,
            description: board.description,
            order: board.order,
            isVisible: board.isVisible,
          })),
      } as CommunityGroup;
    });

  return groups;
};

export const getDefaultCommunityBoard = async ({
  includeHiddenBoards = false,
  includeHiddenGroups = false,
}: {
  includeHiddenBoards?: boolean;
  includeHiddenGroups?: boolean;
} = {}) => {
  const groups = await getCommunityGroups({ includeHiddenBoards, includeHiddenGroups });
  const group = groups.find((item) => item.boards.length > 0) ?? groups[0];
  const board = group?.boards[0];
  if (!group || !board) return null;
  return { group, board };
};

export const getCommunityGroupBySlug = async (
  slug: string,
  {
    includeHiddenBoards = false,
    includeHiddenGroups = false,
  }: {
    includeHiddenBoards?: boolean;
    includeHiddenGroups?: boolean;
  } = {}
): Promise<CommunityGroup | null> => {
  const groups = await getCommunityGroups({ includeHiddenBoards, includeHiddenGroups });
  return groups.find((group) => group.slug === slug) ?? null;
};

export const ensureDefaultCommunityGroup = async () => {
  const menu = await prisma.menu.upsert({
    where: { key: "main" },
    update: {},
    create: { key: "main", name: "Main" },
  });

  const existing = await prisma.menuItem.findFirst({
    where: { menuId: menu.id, linkType: "community" },
    orderBy: { order: "asc" },
  });
  if (existing) {
    return existing;
  }

  const groupSlug = "community-1";
  const order = (await prisma.menuItem.count({ where: { menuId: menu.id } })) + 1;
  const created = await prisma.menuItem.create({
    data: {
      menuId: menu.id,
      label: "커뮤니티",
      href: buildCommunityHref(groupSlug),
      order,
      isVisible: true,
      linkType: "community",
    },
  });
  return created;
};

export const getBoardByGroupAndSlug = async (
  groupSlug: string,
  boardSlug: string
) => {
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      linkType: "community",
      href: buildCommunityHref(groupSlug),
    },
  });
  if (!menuItem) return null;
  const board = await prisma.board.findFirst({
    where: {
      menuItemId: menuItem.id,
      slug: boardSlug,
    },
  });
  if (!board) return null;
  return {
    id: board.id,
    key: board.key,
    slug: board.slug,
    menuItemId: board.menuItemId,
    name: board.name,
    description: board.description,
    order: board.order,
    isVisible: board.isVisible,
    group: {
      menuItemId: menuItem.id,
      label: menuItem.label,
      href: menuItem.href,
      slug: groupSlug,
      order: menuItem.order,
      isVisible: menuItem.isVisible,
    },
  };
};

export const buildBoardKeyFromGroup = (groupSlug: string, boardSlug: string) =>
  buildBoardKey(groupSlug, boardSlug);

export const getBoardMapByKeys = async (keys: string[]) => {
  if (!keys.length) return new Map<string, { href: string; groupSlug: string; boardSlug: string }>();
  const boards = await prisma.board.findMany({
    where: { key: { in: keys } },
    include: { menuItem: true },
  });
  const map = new Map<string, { href: string; groupSlug: string; boardSlug: string }>();
  boards.forEach((board) => {
    const groupSlug = extractCommunitySlug(board.menuItem?.href, board.menuItem?.label);
    const href = `/community/${groupSlug}/${board.slug}`;
    map.set(board.key, { href, groupSlug, boardSlug: board.slug });
  });
  return map;
};
