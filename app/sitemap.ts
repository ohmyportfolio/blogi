import { getCommunityGroups } from "@/lib/community";

const baseUrl = process.env.SITE_URL || "http://localhost:3000";

export default async function sitemap() {
  const staticRoutes = ["/", "/community", "/search"];
  const communityGroups = await getCommunityGroups();
  const communityRoutes = communityGroups.flatMap((group) =>
    group.boards.map((board) => `/community/${group.slug}/${board.slug}`)
  );

  return [...staticRoutes, ...communityRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
