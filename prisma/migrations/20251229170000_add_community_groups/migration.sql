-- Ensure Board table exists (legacy db push)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "Board" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Board_key_key" ON "Board"("key");

-- Add group fields to Board
ALTER TABLE "Board" ADD COLUMN "slug" TEXT;
ALTER TABLE "Board" ADD COLUMN "menuItemId" TEXT;

-- Ensure main menu exists
INSERT INTO "Menu" ("id", "key", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'main', 'Main', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Menu" WHERE "key" = 'main');

-- Ensure a default community menu item exists
INSERT INTO "MenuItem" (
  "id",
  "menuId",
  "label",
  "href",
  "order",
  "isVisible",
  "isExternal",
  "openInNew",
  "requiresAuth",
  "badgeText",
  "createdAt",
  "updatedAt",
  "linkType"
)
SELECT
  gen_random_uuid()::text,
  m."id",
  '커뮤니티',
  '/community/community',
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM "MenuItem" WHERE "menuId" = m."id"),
  true,
  false,
  false,
  false,
  NULL,
  NOW(),
  NOW(),
  'community'
FROM "Menu" m
WHERE m."key" = 'main'
  AND NOT EXISTS (
    SELECT 1 FROM "MenuItem" WHERE "menuId" = m."id" AND "linkType" = 'community'
  );

-- Normalize community hrefs
UPDATE "MenuItem"
SET "href" = '/community/community'
WHERE "linkType" = 'community'
  AND ("href" IS NULL OR "href" = '' OR "href" = '/community');

-- Backfill board grouping and update post types
WITH community_item AS (
  SELECT "id" FROM "MenuItem"
  WHERE "linkType" = 'community'
  ORDER BY "order" ASC
  LIMIT 1
),
board_map AS (
  SELECT
    b."id",
    b."key" AS old_key,
    regexp_replace(regexp_replace(lower(b."key"), '\\s+', '-', 'g'), '(^-+|-+$)', '', 'g') AS slug,
    (SELECT "id" FROM community_item) AS menu_item_id
  FROM "Board" b
),
updated AS (
  UPDATE "Board" b
  SET
    "slug" = bm.slug,
    "menuItemId" = bm.menu_item_id,
    "key" = CONCAT('community__', bm.slug)
  FROM board_map bm
  WHERE b."id" = bm."id"
  RETURNING bm.old_key, b."key" AS new_key
)
UPDATE "Post" p
SET "type" = u.new_key
FROM updated u
WHERE lower(p."type") = lower(u.old_key);

-- Apply constraints
ALTER TABLE "Board" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Board" ALTER COLUMN "menuItemId" SET NOT NULL;

CREATE UNIQUE INDEX "Board_menuItemId_slug_key" ON "Board"("menuItemId", "slug");
ALTER TABLE "Board" ADD CONSTRAINT "Board_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
