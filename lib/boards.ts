import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type BoardData = {
  id: string;
  key: string;
  slug: string;
  menuItemId: string;
  name: string;
  description?: string | null;
  order: number;
  isVisible: boolean;
};

export type BoardWithGroup = BoardData & {
  group: {
    menuItemId: string;
    label: string;
    href: string;
    slug: string;
  };
};

const DEFAULT_BOARDS = [
  { name: "후기", order: 1 },
  { name: "자유게시판", order: 2 },
];

export const buildBoardSlug = (value: string) => slugify(value);

export const buildBoardKey = (groupSlug: string, boardSlug: string) =>
  `${groupSlug}__${boardSlug}`;

const extractGroupSlug = (href?: string, fallbackLabel?: string) => {
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

export const getBoardsByMenuItemId = async ({
  menuItemId,
  includeHidden = false,
}: {
  menuItemId: string;
  includeHidden?: boolean;
}): Promise<BoardData[]> => {
  const boards = await prisma.board.findMany({
    where: {
      menuItemId,
      ...(includeHidden ? {} : { isVisible: true }),
    },
    orderBy: { order: "asc" },
  });
  return boards.map((board) => ({
    id: board.id,
    key: board.key,
    slug: board.slug,
    menuItemId: board.menuItemId,
    name: board.name,
    description: board.description,
    order: board.order,
    isVisible: board.isVisible,
  }));
};

export const getBoards = async ({
  includeHidden = false,
  menuItemId,
}: {
  includeHidden?: boolean;
  menuItemId?: string;
} = {}): Promise<BoardWithGroup[]> => {
  const boards = await prisma.board.findMany({
    where: {
      ...(menuItemId ? { menuItemId } : {}),
      ...(includeHidden ? {} : { isVisible: true }),
    },
    include: { menuItem: true },
    orderBy: [{ menuItem: { order: "asc" } }, { order: "asc" }],
  });

  return boards.map((board) => {
    const groupSlug = extractGroupSlug(board.menuItem?.href, board.menuItem?.label);
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
        menuItemId: board.menuItemId,
        label: board.menuItem?.label ?? "커뮤니티",
        href: board.menuItem?.href ?? `/community/${groupSlug}`,
        slug: groupSlug,
      },
    };
  });
};

export const ensureDefaultBoards = async ({
  menuItemId,
  groupSlug,
}: {
  menuItemId: string;
  groupSlug: string;
}) => {
  const count = await prisma.board.count({ where: { menuItemId } });
  if (count > 0) return;
  await prisma.board.createMany({
    data: DEFAULT_BOARDS.map((board, index) => {
      const slug = `board-${index + 1}`;
      return {
        menuItemId,
        name: board.name,
        slug,
        key: buildBoardKey(groupSlug, slug),
        order: board.order ?? index + 1,
        isVisible: true,
      };
    }),
  });
};

export const getBoardByKey = async (key: string): Promise<BoardWithGroup | null> => {
  const board = await prisma.board.findFirst({
    where: { key: { equals: key, mode: "insensitive" } },
    include: { menuItem: true },
  });
  if (!board) return null;
  const groupSlug = extractGroupSlug(board.menuItem?.href, board.menuItem?.label);
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
      menuItemId: board.menuItemId,
      label: board.menuItem?.label ?? "커뮤니티",
      href: board.menuItem?.href ?? `/community/${groupSlug}`,
      slug: groupSlug,
    },
  };
};
