-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "linkType" TEXT NOT NULL DEFAULT 'category';
ALTER TABLE "MenuItem" ADD COLUMN "linkedId" TEXT;
