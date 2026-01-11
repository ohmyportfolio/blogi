-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_categoryId_fkey";

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "cardViewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cardViewEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cardViewLabel" TEXT,
ADD COLUMN     "displayOrder" TEXT NOT NULL DEFAULT 'card',
ADD COLUMN     "listViewCount" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "listViewEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listViewLabel" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "showSocialLabels" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialAlignment" TEXT NOT NULL DEFAULT 'center',
ADD COLUMN     "socialIconStyle" TEXT NOT NULL DEFAULT 'branded';

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
