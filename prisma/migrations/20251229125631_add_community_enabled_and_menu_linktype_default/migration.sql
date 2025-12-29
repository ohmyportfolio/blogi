-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "linkType" SET DEFAULT 'category';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "communityEnabled" BOOLEAN NOT NULL DEFAULT true;
