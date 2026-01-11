import { getCommunityGroups } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { buildContentHref } from "@/lib/contents";
import { getRestrictedCategoryIdsFromMenu } from "@/lib/category-auth";

const baseUrl = process.env.SITE_URL || "http://localhost:3010";

export const revalidate = 3600;

export default async function sitemap() {
  const staticRoutes = ["/", "/community", "/search"];
  const restrictedCategoryIds = await getRestrictedCategoryIdsFromMenu();
  const [communityGroups, categories, contents] = await Promise.all([
    getCommunityGroups(),
    prisma.category.findMany({
      where: {
        isVisible: true,
        requiresAuth: false,
        ...(restrictedCategoryIds.length ? { id: { notIn: restrictedCategoryIds } } : {}),
      },
      select: { id: true, slug: true, updatedAt: true },
    }),
    prisma.content.findMany({
      where: {
        isVisible: true,
        isDeleted: false,
        categoryRef: {
          is: {
            requiresAuth: false,
            isVisible: true,
            ...(restrictedCategoryIds.length ? { id: { notIn: restrictedCategoryIds } } : {}),
          },
        },
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        categoryRef: { select: { slug: true } },
      },
    }),
  ]);

  const communityRoutes = communityGroups
    .filter((group) => !group.requiresAuth)
    .flatMap((group) =>
      group.boards.map((board) => ({
        url: `${baseUrl}/community/${group.slug}/${board.slug}`,
        lastModified: new Date(),
      }))
    );

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/contents/${category.slug}`,
    lastModified: category.updatedAt ?? new Date(),
  }));

  const contentRoutes = contents
    .filter((content) => Boolean(content.categoryRef?.slug))
    .map((content) => ({
      url: `${baseUrl}${buildContentHref(
        content.categoryRef?.slug ?? "contents",
        content.id,
        content.title
      )}`,
      lastModified: content.updatedAt ?? new Date(),
    }));

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...communityRoutes, ...categoryRoutes, ...contentRoutes];
}
