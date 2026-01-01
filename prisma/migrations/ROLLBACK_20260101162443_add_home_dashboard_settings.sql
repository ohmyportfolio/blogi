-- Rollback script for migration: 20260101162443_add_home_dashboard_settings
-- This script removes the home dashboard settings columns from Category and Board tables
--
-- WARNING: This will permanently delete the showOnHome and homeItemCount data
-- Make sure to backup your database before running this rollback
--
-- To execute this rollback:
-- psql -U your_username -d your_database -f ROLLBACK_20260101162443_add_home_dashboard_settings.sql

-- AlterTable: Remove columns from Board
ALTER TABLE "Board" DROP COLUMN IF EXISTS "showOnHome";
ALTER TABLE "Board" DROP COLUMN IF EXISTS "homeItemCount";

-- AlterTable: Remove columns from Category
ALTER TABLE "Category" DROP COLUMN IF EXISTS "showOnHome";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "homeItemCount";

-- After running this rollback, you should also:
-- 1. Remove the migration directory: prisma/migrations/20260101162443_add_home_dashboard_settings
-- 2. Update your Prisma schema to remove these fields from Category and Board models
-- 3. Regenerate Prisma client: npx prisma generate
-- 4. Rebuild your application: npm run build
