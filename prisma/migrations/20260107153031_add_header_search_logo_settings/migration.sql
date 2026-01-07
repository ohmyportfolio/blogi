-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "hideSearch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "logoSize" TEXT NOT NULL DEFAULT 'medium';
