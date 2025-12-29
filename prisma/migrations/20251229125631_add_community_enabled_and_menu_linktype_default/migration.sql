-- Ensure MenuItem link fields exist (legacy migrations may have skipped them)
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "linkType" TEXT NOT NULL DEFAULT 'category';
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "linkedId" TEXT;
ALTER TABLE "MenuItem" ALTER COLUMN "linkType" SET DEFAULT 'category';

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "communityEnabled" BOOLEAN NOT NULL DEFAULT true;
