-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "splashEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "splashBackgroundColor" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "splashLogoUrl" TEXT;
