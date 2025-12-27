-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "specifications" JSONB DEFAULT '{}',
ALTER COLUMN "amenities" SET DEFAULT ARRAY[]::TEXT[];
