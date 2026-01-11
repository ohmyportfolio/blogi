import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_MAIN_MENU = [
  { label: "Content", href: "/contents/content", order: 1, linkType: "category" as const },
  { label: "Community", href: "/community/community", order: 2, linkType: "community" as const },
];

const DEFAULT_BOARDS = [
  { name: "General", slug: "board-1", order: 1 },
];

const extractCategorySlug = (href: string) => {
  if (!href.startsWith("/contents/")) return null;
  const slug = href.replace("/contents/", "").replace(/^\/+/, "").trim();
  return slug.length ? slug : null;
};

async function main() {
  const existingSettings = await prisma.siteSettings.findUnique({ where: { key: "default" } });
  const siteSettings =
    existingSettings ??
    (await prisma.siteSettings.create({
      data: { key: "default" },
    }));

  const mainMenu =
    (await prisma.menu.findUnique({ where: { key: "main" } })) ??
    (await prisma.menu.create({ data: { key: "main", name: "Main" } }));
  const footerMenu =
    (await prisma.menu.findUnique({ where: { key: "footer" } })) ??
    (await prisma.menu.create({ data: { key: "footer", name: "Footer" } }));

  const categoryDefaults = DEFAULT_MAIN_MENU
    .map((item) => ({
      slug: extractCategorySlug(item.href),
      name: item.label,
      order: item.order,
    }))
    .filter((item): item is { slug: string; name: string; order: number } => Boolean(item.slug));

  const existingCategories = await prisma.category.findMany({
    where: { slug: { in: categoryDefaults.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const existingCategorySlugs = new Set(existingCategories.map((item) => item.slug));
  const categoriesToCreate = categoryDefaults.filter((item) => !existingCategorySlugs.has(item.slug));
  if (categoriesToCreate.length) {
    await prisma.category.createMany({
      data: categoriesToCreate.map((item) => ({
        name: item.name,
        slug: item.slug,
        order: item.order,
        isVisible: true,
      })),
    });
  }

  const categories = await prisma.category.findMany({
    where: { slug: { in: categoryDefaults.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const existingMainItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id },
    select: { id: true, href: true, label: true, order: true, linkType: true },
  });
  const existingMainHrefs = new Set(existingMainItems.map((item) => item.href));
  const itemsToCreate = DEFAULT_MAIN_MENU.filter((item) => !existingMainHrefs.has(item.href));
  if (itemsToCreate.length) {
    await prisma.menuItem.createMany({
      data: itemsToCreate.map((item) => {
        const slug = extractCategorySlug(item.href);
        return {
          menuId: mainMenu.id,
          label: item.label,
          href: item.href,
          order: item.order,
          linkType: item.linkType,
          linkedCategoryId: slug ? categoryBySlug.get(slug) ?? null : null,
          isVisible: true,
        };
      }),
    });
  }
  const desiredItemByHref = new Map(DEFAULT_MAIN_MENU.map((item) => [item.href, item]));
  for (const item of existingMainItems) {
    if (!item.href) continue;
    const desired = desiredItemByHref.get(item.href);
    if (!desired) continue;
    if (item.label !== desired.label || item.order !== desired.order || item.linkType !== desired.linkType) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          label: desired.label,
          order: desired.order,
          linkType: desired.linkType,
        },
      });
    }
  }

  const communityItems = await prisma.menuItem.findMany({
    where: { menuId: mainMenu.id, linkType: "community" },
  });
  for (const item of communityItems) {
    const boardCount = await prisma.board.count({ where: { menuItemId: item.id } });
    if (boardCount > 0) continue;
    const groupSlug = item.href.split("/").filter(Boolean).pop() ?? "community-1";
    await prisma.board.createMany({
      data: DEFAULT_BOARDS.map((board) => ({
        menuItemId: item.id,
        name: board.name,
        slug: board.slug,
        key: `${groupSlug}__${board.slug}`,
        order: board.order,
        isVisible: true,
      })),
    });
  }

  console.log({
    siteSettings: siteSettings.key,
    mainMenu: mainMenu.key,
    footerMenu: footerMenu.key,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
