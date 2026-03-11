-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "noticeTickerEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "noticeItems" JSONB;
