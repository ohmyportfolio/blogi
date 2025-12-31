-- Rename Product table to Content
ALTER TABLE "Product" RENAME TO "Content";

-- Rename constraints to match new table name
ALTER TABLE "Content" RENAME CONSTRAINT "Product_pkey" TO "Content_pkey";
ALTER TABLE "Content" RENAME CONSTRAINT "Product_categoryId_fkey" TO "Content_categoryId_fkey";

-- Update menu item hrefs from /products to /contents
UPDATE "MenuItem"
SET "href" = replace("href", '/products/', '/contents/')
WHERE "href" LIKE '/products/%';

UPDATE "MenuItem"
SET "href" = replace("href", 'products/', 'contents/')
WHERE "href" LIKE 'products/%';
