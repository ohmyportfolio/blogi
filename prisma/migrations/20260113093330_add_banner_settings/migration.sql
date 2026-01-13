-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "bannerMaxHeight" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "bannerPosition" TEXT NOT NULL DEFAULT 'center',
ADD COLUMN     "bannerWidth" TEXT NOT NULL DEFAULT 'medium',
ALTER COLUMN "logoSize" SET DEFAULT 'xsmall',
ALTER COLUMN "siteLogoSize" SET DEFAULT 'xsmall';
