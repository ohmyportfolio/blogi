-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "siteTagline" TEXT,
ADD COLUMN     "siteDescription" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "faviconUrl" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "requiresAuth" BOOLEAN NOT NULL DEFAULT false;
