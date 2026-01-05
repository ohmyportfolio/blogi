-- AlterTable
ALTER TABLE "Content" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Content" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
