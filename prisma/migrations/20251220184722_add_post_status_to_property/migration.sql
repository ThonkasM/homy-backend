-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "postStatus" "PostStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "properties_postStatus_idx" ON "properties"("postStatus");
